IMCAN Inventory Hub - Standalone HTML

Open index.html to start. All pages use the local styles.css, app.js, and xlsx.full.min.js files and link to one another.

Excel support:
1. Open import-center.html.
2. Choose a NewInventory .xlsx/.xlsm file or a Reference .xlsx/.xlsm file.
3. Click Validate and import.
4. The workbook is parsed locally by SheetJS and normalized rows are stored in browser localStorage.
5. Open router-search.html or migration-analytics.html to see the updated rows and metrics.

NewInventory files prefer the Inventory worksheet. Reference files prefer Major Router Info. If those worksheets are unavailable, the first worksheet is used.

The standalone pages do not send workbook contents to a server. They are local previews; live authentication, database persistence, server-side imports, and live AI remain available in the full web application.
