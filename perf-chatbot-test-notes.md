# Chatbot test notes

## Live page
- URL: https://ai-blush-phi.vercel.app/assistant
- Browser session: authenticated user `operix006` / `operix006@gmail.com`

## Test 1
Question: What are the exact Router Name, Site ID, country, city, and operational hours for router PDUS1189? Use OneDrive only and cite the exact file, sheet, and cell for every value.

Observed answer:
- Router Name: PDUS1189 — file IMCAN-Reference-Sheet---2024 (1).xlsm, sheet Inventory, cell C3.
- Site ID: DUS (v-RIG site) — file IMCAN-Reference-Sheet---2024 (1).xlsm, sheet Inventory, cell G3.
- Country: GERMANY — file IMCAN-Reference-Sheet---2024 (1).xlsm, sheet Inventory, cell A3.
- City: DUSSELDORF — file IMCAN-Reference-Sheet---2024 (1).xlsm, sheet Inventory, cell B3.
- Operational Hours: 24 hrs — file IMCAN-Reference-Sheet---2024 (1).xlsm, sheet Inventory, cell N3.
- Source links were present and clickable.

## Defect observed
The response displayed literal escaped sequences such as `\\n` instead of real line breaks in the rendered answer, making the Arabic/English mixed layout difficult to read. Data and citations were correct for this test.

## Next tests
- Canada/Montreal exact lookup.
- SITA aggregation by country/city.
- Missing/nonexistent router behavior.
- Arabic question with exact citation requirements.
- Follow-up question in same conversation.

## Test 2
Question: What are the Router Name and Site ID for Canada Montreal? Use OneDrive only and cite exact file, sheet, and cells.
Observed answer: RouterName `PYUL502` at `Inventory!C2`; Site ID `YULXSSV` at `Inventory!G2`; source file was the IMCAN reference workbook and a clickable OneDrive source was present.
Result: Correct for the visible row.

## Test 3
Question: Arabic SITA aggregation without naming a file.
Observed answer: The system found 125 matching rows in the Inventory sheet and grouped them by country/city. It correctly identified examples including Canada: Montreal (1), Germany: Frankfurt (1), Munich (1), Dusseldorf (2), and many other groups; it also returned row-level references such as `Inventory!A3:N3`, `Inventory!A5:N5`, and clickable OneDrive source links.
Defect: The response currently renders literal `\\n` escape sequences inside the SITA aggregation answer, so the content is accurate but not well formatted. This is a presentation defect, not a retrieval mismatch.
