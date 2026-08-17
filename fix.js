const fs = require('fs');

let content = fs.readFileSync('server/ai.ts', 'utf-8');

// Replace normalizeText
const oldNormalize = `const normalizeText = (text: string) => {
           if (!text) return "";
           return text.normalize("NFC")
             .replace(/[\\u064B-\\u065F\\u0670]/g, '') // Remove Arabic diacritics
             .replace(/[إأآا]/g, 'ا')
             .replace(/[يى]/g, 'ي')
             .replace(/ة/g, 'ه')
             .replace(/[^\\w\\u0600-\\u06FF\\s@.-]/g, ' ') // Keep only letters, numbers, spaces, and basic symbols
             .replace(/\\s+/g, ' ')
             .toLowerCase()
             .trim();
         };`;

const newNormalize = `const normalizeText = (value: any) => {
           return String(value ?? '')
             .normalize('NFC')
             .toLowerCase()
             .replace(/[أإآ]/g, 'ا')
             .replace(/[ًٌٍَُِّْـ]/g, '')
             .replace(/\\s+/g, ' ')
             .trim();
         };`;
content = content.replace(oldNormalize, newNormalize);

// Replace query logic
const oldQueryLogic = `         const stopWords = ["ما", "هو", "هي", "في", "على", "من", "ورقة", "عنوان", "الظاهر", "خدمة", "ال", "جميع", "اسماء", "قيمة", "ماذا", "هل", "الى", "لخدمة", "البريد", "الإلكتروني", "اي", "توجد", "ملاحظة", "تفيد", "بأن", "بعض", "وما", "الإجراء", "المطلوب", "لا", "نعم"];
         const queryWords = normQuestion.split(' ').filter(w => !stopWords.includes(w) && w.length >= 2);
         
         // Identify if the user mentioned a specific sheet name
         const commonSheets = ["asset verification", "dashboard", "inventory", "ceased sites", "resolver per product", "asp fe"];
         const targetedSheets = commonSheets.filter(sheet => rawQuestion.toLowerCase().includes(sheet) || normQuestion.includes(normalizeText(sheet)));
         
         const searchRepresentations = [
           normQuestion,
           ...queryWords,
           "imcan", "support", "supported", "esp" // technical fallbacks based on common inventory domains
         ].filter(Boolean);`;

const newQueryLogic = `         const stopWords = ["ما", "هو", "هي", "في", "على", "من", "ورقة", "عنوان", "الظاهر", "خدمة", "ال", "جميع", "اسماء", "قيمة", "ماذا", "هل", "الى", "لخدمة", "البريد", "الإلكتروني", "اي", "توجد", "ملاحظة", "تفيد", "بأن", "بعض", "وما", "الإجراء", "المطلوب", "لا", "نعم"];
         const rawWords = rawQuestion.split(' ');
         const queryWords = normQuestion.split(' ').filter(w => !stopWords.includes(w) && w.length >= 2);
         
         const searchRepresentations = [
           normQuestion,
           ...queryWords
         ].filter(Boolean);`;
content = content.replace(oldQueryLogic, newQueryLogic);

// Replace loop logic
const oldLoop = `                    const normContent = normalizeText(row.content);
                    const rawContent = row.content.toLowerCase();
                    
                    let score = 0;
                    
                    // Prioritize targeted sheets if any
                    if (targetedSheets.length > 0) {
                      const isTargeted = targetedSheets.some(ts => row.sheetName.toLowerCase().includes(ts) || normalizeText(row.sheetName).includes(normalizeText(ts)));
                      if (isTargeted) score += 2;
                    }
                    
                    // Match full phrase
                    if (normContent.includes(normQuestion)) score += 5;
                    
                    // Match technical keywords
                    const techWords = ["imcan", "support", "esp", "esp.aero", "servicedesk", "fe", "asp"];
                    techWords.forEach(tech => {
                      if (rawContent.includes(tech) && normQuestion.includes(tech)) score += 3;
                    });
                    
                    // Match individual query words
                    let wordMatches = 0;
                    for (const w of queryWords) {
                      if (normContent.includes(w) || rawContent.includes(w)) {
                        wordMatches++;
                      }
                    }
                    if (wordMatches > 0) {
                      score += wordMatches;
                    }
                    
                    if (score >= 2 || (wordMatches >= 1 && queryWords.length <= 2)) {
                      fileDebug.total_matches++;
                      fileDebug.matches_per_sheet[row.sheetName]++;
                      
                      extractedLines.push({ text: \`=== WORKSHEET: \${row.sheetName} ===\\n\${row.content}\`, score });
                    }`;

const newLoop = `                    const normContent = normalizeText(row.content);
                    const rawContent = String(row.content).toLowerCase();
                    
                    let score = 0;
                    
                    // Direct phrase match
                    if (normContent.includes(normQuestion)) score += 5;
                    
                    // Match individual meaningful words
                    let wordMatches = 0;
                    for (const w of queryWords) {
                      if (normContent.includes(w) || rawContent.includes(w)) {
                        wordMatches++;
                      }
                    }
                    if (wordMatches > 0) score += wordMatches;
                    
                    // Special case: Single keyword search
                    if (queryWords.length === 1 && wordMatches === 1) score += 3;
                    
                    if (score >= 2) {
                      fileDebug.total_matches++;
                      fileDebug.matches_per_sheet[row.sheetName]++;
                      
                      extractedLines.push({ text: \`=== WORKSHEET: \${row.sheetName} ===\\n\${row.content}\`, score });
                    }`;
content = content.replace(oldLoop, newLoop);

// Replace debug object
content = content.replace(
`                matches_per_sheet: {} as Record<string, number>,
                search_words: searchRepresentations,
                targeted_sheets: targetedSheets.length > 0 ? targetedSheets : "all"`,
`                matches_per_sheet: {} as Record<string, number>,
                search_words: searchRepresentations`
);

fs.writeFileSync('server/ai.ts', content);
console.log('Done');
