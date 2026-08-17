# Project TODO

- [x] Define the normalized inventory data model for Reference Sheet and NewInventory.
- [x] Preserve the required English field labels: Country, City, Router Name, Old Router Name, Site ID, Subnet IP, Contact Details, Location, Operational Hours, Migration Status.
- [x] Import the attached IMCAN-Reference-Sheet-2024 and NewInventory data into the application data layer.
- [x] Implement router-name comparison as the single source of truth for Migrated and Not Migrated statuses.
- [x] Add internal dashboard navigation using DashboardLayout with Imkan Team and SITA aviation styling.
- [x] Build instant keyword search across router names and all available inventory fields.
- [x] Add Country, City, Migration Status, and Circuit Type filters.
- [x] Add record details modal with Contact Details, Address, Operational Hours, Proactive Email Contacts, Switch Name, Subnet IP, and MCS Status.
- [x] Add statistics cards for total sites, Migrated sites, Not Migrated sites, and country distribution.
- [x] Add responsive states, loading states, empty states, and accessible interaction feedback.
- [x] Add Vitest coverage for migration matching and search/filter behavior.
- [x] Run type checks, tests, and visual preview verification.
- [x] Save a final checkpoint after all completed items are marked.
- [x] Preserve exact English field labels in the app contract and UI through a label mapping layer.
- [x] Implement real sidebar section navigation for Overview, Router Search, Migration Analytics, and Import Center.
- [x] Add explicit error states and retry feedback for inventory list, stats, and filter option queries.
- [x] Save a final webdev checkpoint after completing and validating the finished state.
- [x] Wire FIELD_LABELS into the app response and use exact required labels in relevant UI fields, including Location.
- [x] Add route-aware section content for Overview, Router Search, Migration Analytics, and Import Center.

- [x] Diagnose the reported website errors from browser, network, and dev-server logs.
- [x] Fix the identified website errors without regressing search, filters, migration matching, or details modal.
- [x] Re-run type checks, Vitest, and visual verification after the fixes.
- [x] Save an updated checkpoint after the bug fixes are validated.

- [x] Build Import Center upload flow for IMCAN-Reference-Sheet and NewInventory Excel files.
- [x] Persist imported inventory records and migration matching results in the database.
- [x] Add role-based permissions for administrators and regular users.
- [x] Add an audit log showing who changed what and when.
- [x] Add smart search suggestions while typing across router, site, country, and city values.
- [x] Add smooth loading skeletons and transition feedback for search and filters.
- [x] Add Vitest coverage for import validation, permissions, and audit logging.
- [x] Run type checks, tests, visual verification, and save an updated checkpoint.

- [x] Protect internal inventory reads with authenticated procedures.
- [x] Expand audit coverage and add a test that verifies audit entries are created.
- [x] Include Router Name and Site ID values in live search suggestions.
- [x] Add skeleton loading states and transition feedback for search and filters.
- [x] Add database-backed import and audit validation coverage where the database is available.
- [x] Save a fresh checkpoint after validating this feature batch.

- [x] Add an integration test for database-backed import and audit persistence when the database is available.
- [x] Expand audit logging to cover administrative import replacement and permission-sensitive actions explicitly.
- [x] Save a new checkpoint after the latest feature batch is validated.

- [x] Add an admin-only Users & Permissions page for changing user roles.
- [x] Add server-side role update procedure with audit logging.
- [x] Add Excel and CSV export for current filtered inventory results.
- [x] Add import-column validation with clear missing-column and upload-failure alerts.
- [x] Create and validate a reusable inventory-management skill using the skill-creator workflow.
- [x] Add Vitest coverage for role updates, exports, and import validation.
- [x] Run type checks, tests, visual verification, and save a new checkpoint.

- [x] Add a unit test for the admin.updateRole contract and role-change audit payload.
- [x] Add a unit test for the Excel export workbook shape.
- [x] Save a fresh checkpoint after the current feature batch.

- [x] Cover the admin.updateRole caller contract with a forbidden-user test.
- [x] Extract and test the actual Excel export helper used by the UI.
- [x] Save the final checkpoint for this feature batch.

- [x] Diagnose why Sidebar navigation items do not respond to clicks.
- [x] Fix Sidebar navigation so each item changes to its correct route.
- [x] Verify all Sidebar routes and save an updated checkpoint.

- [x] Diagnose why all Sidebar routes render the same Overview content.
- [x] Render distinct content for Overview, Router Search, Migration Analytics, Import Center, and Admin Users.
- [x] Verify route-specific content and save an updated checkpoint.

- [x] Create a dedicated Overview content block separate from Router Search.
- [x] Save a fresh checkpoint after validating the final route-specific content fix.

- [x] Diagnose why the router details dialog background is transparent.
- [x] Make the router details dialog fully opaque with clear contrast and overlay styling.
- [x] Verify the dialog visually and save an updated checkpoint.

- [x] Add an authenticated server-side AI assistant procedure grounded only in inventory and reference records.
- [x] Make the assistant answer employee questions in Arabic or English and cite matched Router Name/Site ID records.
- [x] Add an AI search and assistance panel inside the dashboard using the existing chat UI pattern.
- [x] Add safe fallback behavior when no matching records exist or the AI service fails.
- [x] Add Vitest coverage for context retrieval, permissions, no-result behavior, and answer formatting.
- [x] Run type checks, tests, visual verification, and save an updated checkpoint.

- [x] Add database tables and procedures for employee-scoped AI conversation history.
- [x] Add a conversation history panel to reopen previous AI sessions.
- [x] Add simplified migration analysis report generation grounded in current inventory data.
- [x] Add CSV and Excel export for generated migration reports.
- [x] Add animated loading states while AI responses and reports are being generated.
- [x] Update and validate the reusable imcan-inventory-management skill with the new AI workflow.
- [x] Add Vitest coverage for conversation ownership, report calculations, exports, and loading-safe states.
- [x] Run type checks, tests, visual verification, skill validation, and save a new checkpoint.

- [x] Export the full migration report structure including summary, totals, country, and circuit breakdowns.
- [x] Add tests for migration report export payload and loading-safe UI behavior.
- [x] Save a fresh checkpoint after validating the complete feature batch.

- [x] Add archive and delete actions for employee-owned AI conversations.
- [x] Add confirmation dialog before deleting a conversation.
- [x] Preserve archived conversations separately and allow restoring them.
- [x] Add PDF export for migration reports.
- [x] Add a print-friendly formal report view with print CSS.
- [x] Add Arabic/English language selection for AI answers and migration reports.
- [x] Update and validate imcan-inventory-management skill with archive, PDF, print, and bilingual AI workflows.
- [x] Add Vitest coverage for conversation lifecycle, PDF/report payloads, language selection, and confirmation-safe behavior.
- [x] Run checks, visual verification, skill validation, and save a new checkpoint.

- [x] Make the Archived view show only archived conversations, while Active shows only active conversations.
- [x] Localize report titles, column labels, and PDF/print content for Arabic and English.
- [x] Add tests for archive, restore, delete lifecycle and confirmation-safe behavior.
- [x] Add validation coverage for PDF/print report payload generation and bilingual report output.
- [x] Run final checks and save a fresh checkpoint after all latest fixes.

- [x] Add a clear success notification after CSV, Excel, PDF, and print report downloads/actions.
- [x] Add date-range filtering controls and server/client report filtering for migration reports.
- [x] Add activity-log filters for actor/user and action type with empty and loading states.
- [x] Add Vitest coverage for download notifications, date-range report filtering, and activity-log filters.
- [x] Run final checks, visual verification, skill validation, and save a new checkpoint for this feature batch.

- [x] Add success notifications specifically to migration report CSV and Excel actions.
- [x] Test actual date-range behavior in getMigrationReport with mocked stored inventory rows.
- [x] Run skill validation again and save a fresh checkpoint after closing these gaps.

- [x] Create standalone HTML files for Overview, Router Search, Migration Analytics, Import Center, AI Assistant, and Admin Users.
- [x] Add shared local styling and navigation between the standalone HTML pages.
- [x] Verify the standalone files open locally and package them for delivery.

- [x] Add SheetJS to the standalone HTML pages for local `.xlsx` and `.xlsm` parsing.
- [x] Store imported workbook rows locally and refresh search, analytics, and report tables automatically.
- [x] Add validation and user feedback for unsupported or empty Excel files.
- [x] Test local Excel parsing, package the updated HTML bundle, and save a new checkpoint.

- [x] Regenerate country distribution and report breakdowns from imported localStorage rows.
- [x] Open migration analytics after Excel import and verify metrics and breakdowns update automatically.

- [x] Add dynamic circuit-type and migration-status breakdowns to the standalone analytics report.
- [x] Verify the new breakdowns after local Excel import and save the final SheetJS checkpoint.

- [x] Add Excel export for all current local inventory rows.
- [x] Add Excel export for the currently filtered Router Search results.
- [x] Add clear success and empty-state feedback for export actions, then test and package the update.

- [ ] Replace the Supabase URL with the corrected REST project URL and revalidate the anon connection.
- [ ] Discover the accessible public tables and columns through Supabase REST before mapping the dashboard.
- [ ] Connect the application and standalone HTML pages only to tables permitted by anon/RLS policies.
- [ ] Test live Supabase reads, exports, and empty/error states, then save a checkpoint.

- [x] Draft Supabase initialization SQL for inventory, users, audit, AI conversations, messages, indexes, view, and RLS policies.
- [x] Add Arabic Supabase setup instructions and clarify the Manus OAuth versus Supabase Auth boundary.
- [ ] Run the SQL in the user's Supabase SQL Editor and confirm the actual table names and RLS behavior.

- [ ] Build a complete portable project archive for printing or uploading to Versa.
- [ ] Include source code, tests, SQL, standalone HTML, documentation, and dependency manifests.
- [ ] Exclude secrets, environment files, uploads, logs, build artifacts, and local database credentials.
- [ ] Verify archive contents and provide setup instructions for the recipient.
