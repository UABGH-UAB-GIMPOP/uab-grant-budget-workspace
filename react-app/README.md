# UAB Grant Budget Workspace — React migration

Local work in progress using synthetic data only. React 19 and checked-in shadcn/ui components preserve the seven original views. This is not an official ledger or approved environment for real data.

## Development

- `npm ci`
- `npm run dev`
- `npm test` — calculations, workflows, imports/exports and workspace/award rendering, with four concurrent test files to bound JSDOM/esbuild resource use.
- `npm run build` — tests, TypeScript check and Vite production bundle.

The implementation checklist and detailed QA records are maintained separately from this public source package. Passing the build is not release acceptance.

## Deployment

Vite base is `/uab-grant-budget-workspace/`. Deploy the generated `dist` contents through the existing repository's coordinated GitHub Pages workflow. Do not overwrite that repository's history or publish private research/source materials. No production backend, authentication or shared persistence has been deployed.

## Isolated browser acceptance fixture

`tests/fixtures/acceptance-portfolio.json` is a validated synthetic portfolio backup with an overspending award, a separate proposal, example document links and a deadline. In an isolated browser profile, open **Backup & recovery**, then use **Restore backup** to review and replace that profile's portfolio. This replaces browser-local projects; it does not merge them. The fixture supports checking all eight workspace destinations, shared highlighting, exports and document-draft recovery. Do not use real data on the public demo.

For Documents pagination, `tests/fixtures/document-pagination-portfolio.json` provides 52 example document links and 27 milestone-evidence links. Restore it only in the isolated test profile; each list pages independently in groups of 25. Select a project before editing links when multiple projects are displayed.

`tests/fixtures/budget-limits-portfolio.json` provides entered direct/total limits and a shortened scenario whose limit falls outside the forecast. In Setup, verify source/date/amount details and explicit Apply → Save changes. Review shows mathematical over-limit and scope warnings. These generic limits include full subawards; no sponsor-specific exclusions or approval are inferred.

Appointment FTE is a fraction of full time, separate from research effort. Base salary is compensation for the actual appointment; it is not multiplied by FTE again. A full-time annual salary cap is prorated by FTE. Missing legacy FTE is modeled as 100% and identified as assumed. Dated FTE changes override the base; salary changes are explicit and separate. Forecast costs are rounded monthly, so annual multiplication can differ by a few cents. These model conventions are not institutional approval.

`tests/fixtures/appointment-fte-portfolio.json` exercises explicit half-time appointment data and a sourced future FTE change. Review Personnel, Effort, Setup rates, unchanged recorded payroll, and the Monthly appointment FTE workbook sheet. Its salary-cap amount is a historical test value, not a current-rate default.

Dated salary changes are available in Personnel while Edit budget is active. Enter an actual-appointment salary or a percentage change and its source. Apply updates the draft; Save changes persists it, and Cancel edits restores the saved version. Changes apply chronologically. When months match, the one-time raise applies first, followed by explicit changes in their recorded order. Changing appointment FTE does not change salary automatically. Recorded payroll remains unchanged. The Salary changes workbook sheet retains the timeline, source, original ordering key and optional change ID.

`tests/fixtures/salary-timeline-portfolio.json` pairs an explicit appointment FTE schedule with salary changes recorded out of chronological order. In an isolated profile, restore it through Backup & recovery and check the March replacement, July one-time raise, September 0% change, source metadata and workbook ordering. Restore replaces that profile’s portfolio; it does not merge it.

Recurring raises are opt-in percentage changes. Enter an integer interval in months and an explicit last effective month; the schedule is limited to 120 months from its first occurrence. Each occurrence compounds on the then-current salary, including any earlier replacement. The legacy one-time raise runs first when months match, followed by explicit changes in their recorded order. Histories and exports retain out-of-project occurrences and label them; only in-period modeled costs enter project totals. These are planning assumptions, not authorization for a pay change.

Split commitment payments: in Ledger, choose Edit budget, then Allocate payment on an eligible transaction. Enter same-category allocations and a reason. Apply changes the draft; Save changes persists it. The transaction remains counted once. Partial allocations are allowed; credits use negative allocations. Linked reversals offset the entire allocation set and retain its history. Allocated commitments cannot be deleted; cancel their remaining balance instead. The Settlement allocations workbook sheet preserves transaction identity, signed amounts and reasons.

`tests/fixtures/split-settlement-portfolio.json` is a synthetic review backup: one $150 expense allocated $60/$90 to two obligations. Restore it in an isolated profile; check exact actual totals, draft Cancel, failed Save recovery, reversal summaries and workbook rows. Restore replaces that profile’s portfolio. This does not implement authorized commitment amendments or duplicate subaward-invoice review.

Cross-project effort is under Reports → Personnel effort. Enter the same explicit Cross-project personnel key in each source award’s Personnel view; names and local person IDs are never used to infer identity. The report uses source awards, excludes proposals/archived projects, and checks the selected calendar year. It compares modeled research FTE with a consistent, explicitly entered appointment FTE. Assumed or conflicting bases remain unresolved. It does not certify actual effort or assess work outside this portfolio.

Open personnel targets the exact source record. If a scenario is active, this opens a read-only source view and leaves the saved scenario unchanged; Open saved scenario returns to that working version. Report filters and expanded details survive the return. Identity keys are edited in the source budget through normal Save/Cancel, and are retained in JSON and Personnel workbook metadata. Download effort workbook records fractional units, coverage, source dates and filtered contributions.

`tests/fixtures/cross-project-effort-portfolio.json` includes two source awards, an excluded proposal/archive, a linked investigator and unresolved coordinator, plus unlinked staff. January investigator research FTE is 0.55 against 0.5 capacity; April’s zero override gives 0.25; July’s dated bases give 1.1 against 1.0. Restore only in an isolated profile: it replaces that profile’s portfolio.

Financial input validation checks supported integer-cent precision and a private numerical pass before accepting budget changes. Unsafe cash inputs, statement calculations, entered-limit differences and default active-portfolio totals reject without replacing saved data. Recovery retains the original stored archive. Decimal intermediate arithmetic and annual residual allocation remain open acceptance items; this checkpoint is not approved for real UAB data.


### Worksheet transaction imports

The file importer accepts values-only `.xlsx` transactions in addition to CSV and project JSON. Choose the worksheet, header row, source system, distinct columns and date interpretation; no column or date guessing is applied. Review every row and provide reasons for exclusions before Apply. Unknown categories, numeric reference IDs, formulas, spreadsheet errors, invalid dates, unsupported OOXML parts and amounts that would lose cents reject. Limits:10MiB upload,32sheets,10,000rows,100columns,250,000populatedcells,50MiB total expansion. Worker reading times out after15seconds.

Project JSON retains the original workbook SHA-256, filename,size,mapping and selected-sheet typed cells; the original binary upload is not retained. The derived CSV has a separate hash. Source records and row decisions survive JSON backup. This is local provenance consistency, not authentication. Save conflicts/quota errors leave the import preview unapplied for retry/cancel. Test only synthetic data on the public demo.

The test command runs application/workflow tests in parallel, then the original parity/performance suite serially. The original two-second large-budget assertion remains unchanged; isolating it avoids measuring simultaneous DOM-test contention as budget-engine time. `build` also checks the actual emitted workbook worker using a Node message bridge; browser-worker and visual acceptance are separate.
