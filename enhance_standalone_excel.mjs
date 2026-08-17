import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const out = join(process.cwd(), "standalone-html");
const appJs = `const STORAGE_KEY = 'imkan.inventoryRows';
const SOURCE_KEY = 'imkan.inventorySource';

function cell(row, keys) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return '';
}

function normalizeExcelRows(rows, sourceType) {
  return rows.map((row) => ({
    source: sourceType,
    country: cell(row, ['Country']),
    city: cell(row, ['City']),
    router: cell(row, ['Router Name', 'Host Name', 'Versa Router Name']),
    site: cell(row, ['Site ID', 'SITE ID']),
    status: sourceType === 'NewInventory' ? 'Migrated' : 'Not Migrated',
    circuit: cell(row, ['Circuit Type', 'Summary']),
    raw: row
  })).filter((row) => row.router);
}

async function readExcelFile(file, sourceType) {
  if (!file) throw new Error('Please select an Excel file first.');
  if (!/\\.(xlsx|xlsm)$/i.test(file.name)) throw new Error('Only .xlsx and .xlsm files are supported.');
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
  const preferredSheet = sourceType === 'NewInventory' ? 'Inventory' : 'Major Router Info';
  const sheetName = workbook.SheetNames.includes(preferredSheet) ? preferredSheet : workbook.SheetNames[0];
  if (!sheetName) throw new Error('The workbook has no worksheets.');
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
  const normalized = normalizeExcelRows(rows, sourceType);
  if (!normalized.length) throw new Error('No rows with Router Name were found in this workbook.');
  const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  existing[sourceType] = normalized;
  const newNames = new Set((existing.NewInventory || []).map((row) => row.router.toLowerCase()));
  (existing.Reference || []).forEach((row) => { row.status = newNames.has(row.router.toLowerCase()) ? 'Migrated' : 'Not Migrated'; });
  (existing.NewInventory || []).forEach((row) => { row.status = 'Migrated'; });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  localStorage.setItem(SOURCE_KEY, file.name);
  window.dispatchEvent(new CustomEvent('imkan-data-updated'));
  return { count: normalized.length, fileName: file.name, sourceType };
}

function getInventoryRows() {
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  const rows = [...(stored.NewInventory || []), ...(stored.Reference || [])];
  return rows.length ? rows : [];
}

function filterInventoryRows(query = '', status = '') {
  const term = query.trim().toLowerCase();
  return getInventoryRows().filter((row) => (!term || [row.router, row.country, row.city, row.site, row.status, row.circuit].join(' ').toLowerCase().includes(term)) && (!status || row.status === status));
}

function exportInventoryExcel(rows, fileName = 'imkan-inventory-export.xlsx') {
  if (!rows.length) return false;
  const exportRows = rows.map((row) => ({
    'Router Name': row.router,
    Country: row.country,
    City: row.city,
    'Site ID': row.site,
    'Migration Status': row.status,
    'Circuit Type': row.circuit,
    Source: row.source,
  }));
  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory Export');
  XLSX.writeFile(workbook, fileName);
  return true;
}

function renderInventoryTable(targetId) {
  const target = document.getElementById(targetId);
  if (!target) return;
  const rows = getInventoryRows();
  if (!rows.length) return;
  target.innerHTML = rows.map((row) => '<tr><td><strong>' + row.router + '</strong></td><td>' + (row.country || '—') + ' / ' + (row.city || '—') + '</td><td>' + (row.site || '—') + '</td><td><span class="pill ' + (row.status === 'Not Migrated' ? 'gold' : '') + '">' + row.status + '</span></td><td>' + (row.circuit || '—') + '</td></tr>').join('');
}

function renderAnalytics() {
  const rows = getInventoryRows();
  if (!rows.length) return;
  const migrated = rows.filter((row) => row.status === 'Migrated').length;
  const total = rows.length;
  const notMigrated = total - migrated;
  const totalEl = document.querySelector('[data-metric="total"]');
  const migratedEl = document.querySelector('[data-metric="migrated"]');
  const notMigratedEl = document.querySelector('[data-metric="notMigrated"]');
  const rateEl = document.querySelector('[data-metric="rate"]');
  if (totalEl) totalEl.textContent = total;
  if (migratedEl) migratedEl.textContent = migrated;
  if (notMigratedEl) notMigratedEl.textContent = notMigrated;
  if (rateEl) rateEl.textContent = total ? Math.round((migrated / total) * 100) + '%' : '0%';
  const breakdown = (key, targetId) => { const target = document.getElementById(targetId); if (!target) return; const counts = rows.reduce((acc, row) => { const value = row[key] || 'Unknown'; acc[value] = (acc[value] || 0) + 1; return acc; }, {}); const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]); target.innerHTML = entries.length ? entries.map(([value, count]) => '<p>' + value + ' <b style="float:right">' + count + '</b></p><div class="progress"><i style="width:' + Math.max(8, Math.round((count / total) * 100)) + '%"></i></div>').join('') : '<p class="muted">No imported rows available.</p>'; };
  breakdown('circuit', 'circuitBreakdown');
  breakdown('status', 'statusBreakdown');
  const countryTarget = document.getElementById('countryDistribution');
  if (countryTarget) {
    const counts = rows.reduce((acc, row) => { const country = row.country || 'Unknown'; acc[country] = (acc[country] || 0) + 1; return acc; }, {});
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    countryTarget.innerHTML = top.length ? top.map(([country, count]) => '<p>' + country + ' <b style="float:right">' + count + '</b></p><div class="progress"><i style="width:' + Math.max(8, Math.round((count / total) * 100)) + '%"></i></div>').join('') : '<p class="muted">Import an Excel file to see country distribution.</p>';
  }
}

window.imkanExcel = { readExcelFile, getInventoryRows, filterInventoryRows, exportInventoryExcel, renderInventoryTable, renderAnalytics };
`;
await writeFile(join(out, 'app.js'), appJs);

for (const file of ['index.html', 'router-search.html', 'migration-analytics.html', 'import-center.html', 'ai-assistant.html', 'admin-users.html']) {
  const path = join(out, file);
  let html = await readFile(path, 'utf8');
  html = html.replace('</head>', '<script src="xlsx.full.min.js"></script><script src="app.js"></script></head>');
  if (file === 'import-center.html') {
    html = html.replace('id="notice" class="notice"', 'id="notice" class="notice"');
    html = html.replace('id="notice" class="notice"></div>', 'id="notice" class="notice"></div>');
    html = html.replace('<input type="file" accept=".xlsx,.xlsm">', '<input id="newInventoryFile" type="file" accept=".xlsx,.xlsm">');
    html = html.replace('<input type="file" accept=".xlsx,.xlsm">', '<input id="referenceFile" type="file" accept=".xlsx,.xlsm">');
    html = html.replace("onclick=\"show('NewInventory')\"", "onclick=\"importLocalExcel('NewInventory', 'newInventoryFile')\"");
    html = html.replace("onclick=\"show('Reference')\"", "onclick=\"importLocalExcel('Reference', 'referenceFile')\"");
    html = html.replace('</body>', `<script>async function importLocalExcel(sourceType, inputId){const notice=document.getElementById('notice');try{const result=await window.imkanExcel.readExcelFile(document.getElementById(inputId).files[0],sourceType);notice.style.display='block';notice.innerText='تم تحميل '+result.count+' سجل من '+result.fileName+' بنجاح. ستظهر البيانات في صفحات البحث والتحليلات.';notice.style.background='#e7f7ed';notice.style.color='#14804a';}catch(error){notice.style.display='block';notice.innerText=error.message;notice.style.background='#fff1f1';notice.style.color='#a33';}}</script></body>`);
  }
  if (file === 'router-search.html') {
    html = html.replace('<button class="button" onclick="document.getElementById(\'q\').value=\'\';document.getElementById(\'status\').value=\'\';filterRows()">Clear</button></div>', '<button class="button" onclick="document.getElementById(\'q\').value=\'\';document.getElementById(\'status\').value=\'\';filterRows()">Clear</button><button class="button primary" onclick="exportRows(false)">Export all Excel</button><button class="button" onclick="exportRows(true)">Export filtered Excel</button></div><div id="exportNotice" class="notice"></div>');
    html = html.replace('<script>function filterRows(){const q=document.getElementById(\'q\').value.toLowerCase(),s=document.getElementById(\'status\').value;document.querySelectorAll(\'#results tr\').forEach(r=>{const ok=(!q||r.innerText.toLowerCase().includes(q))&&(!s||r.innerText.includes(s));r.style.display=ok?\'\':\'none\'})}</script>', '<script>function filterRows(){const q=document.getElementById(\'q\').value.toLowerCase(),s=document.getElementById(\'status\').value;document.querySelectorAll(\'#results tr\').forEach(r=>{const ok=(!q||r.innerText.toLowerCase().includes(q))&&(!s||r.innerText.includes(s));r.style.display=ok?\'\':\'none\'})}function exportRows(filtered){const q=document.getElementById(\'q\').value,s=document.getElementById(\'status\').value;const rows=filtered?window.imkanExcel.filterInventoryRows(q,s):window.imkanExcel.getInventoryRows();const notice=document.getElementById(\'exportNotice\');if(!rows.length){notice.style.display=\'block\';notice.style.background=\'#fff1f1\';notice.style.color=\'#a33\';notice.innerText=filtered?\'No filtered rows are available to export.\':\'Import an Excel file before exporting.\';return}const ok=window.imkanExcel.exportInventoryExcel(rows,filtered?\'imkan-filtered-inventory.xlsx\':\'imkan-inventory.xlsx\');notice.style.display=\'block\';notice.style.background=\'#e7f7ed\';notice.style.color=\'#14804a\';notice.innerText=ok?rows.length+\' rows exported to Excel successfully.\':\'Export failed.\'}</script>');
    html = html.replace('</body>', `<script>window.addEventListener('DOMContentLoaded',()=>window.imkanExcel.renderInventoryTable('results'));window.addEventListener('imkan-data-updated',()=>window.imkanExcel.renderInventoryTable('results'));</script></body>`);
  }
  if (file === 'migration-analytics.html') {
    html = html.replace('<div class="num">83</div><strong>Total</strong>', '<div class="num" data-metric="total">83</div><strong>Total</strong>');
    html = html.replace('<div class="num">70</div><strong>Migrated</strong>', '<div class="num" data-metric="migrated">70</div><strong>Migrated</strong>');
    html = html.replace('<div class="num">13</div><strong>Not Migrated</strong>', '<div class="num" data-metric="notMigrated">13</div><strong>Not Migrated</strong>');
    html = html.replace('<div class="num">84%</div><strong>Migration Rate</strong>', '<div class="num" data-metric="rate">84%</div><strong>Migration Rate</strong>');
    html = html.replace('<h2>Country Distribution</h2><p>Jordan <b style="float:right">18</b></p><div class="progress"><i style="width:72%"></i></div><p>India <b style="float:right">14</b></p><div class="progress"><i style="width:56%"></i></div><p>UAE <b style="float:right">11</b></p><div class="progress"><i style="width:44%"></i></div>', '<h2>Country Distribution</h2><div id="countryDistribution"><p class="muted">Import an Excel file to see country distribution.</p></div>');
    html = html.replace('</section><div class="footer-note">', '</section><section class="grid three" style="margin-top:20px"><div class="card"><h2>Circuit Type</h2><div id="circuitBreakdown"><p class="muted">Import an Excel file to see circuit distribution.</p></div></div><div class="card"><h2>Migration Status</h2><div id="statusBreakdown"><p class="muted">Import an Excel file to see status distribution.</p></div></div><div class="card"><h2>Local Data</h2><p class="muted">All displayed rows and breakdowns are generated from the workbook stored in this browser.</p></div></section><div class="footer-note">');
    html = html.replace('</body>', `<script>window.addEventListener('DOMContentLoaded',()=>window.imkanExcel.renderAnalytics());window.addEventListener('imkan-data-updated',()=>window.imkanExcel.renderAnalytics());</script></body>`);
  }
  await writeFile(path, html);
}
console.log('SheetJS integration added to standalone HTML pages.');
