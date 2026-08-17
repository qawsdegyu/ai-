const STORAGE_KEY = 'imkan.inventoryRows';
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
  if (!/\.(xlsx|xlsm)$/i.test(file.name)) throw new Error('Only .xlsx and .xlsm files are supported.');
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
