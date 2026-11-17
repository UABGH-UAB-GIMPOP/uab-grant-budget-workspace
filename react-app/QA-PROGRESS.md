# React migration verification

## Verified November 17, 2026
- React/Vite production bundle builds successfully.
- TypeScript check passes after correcting optional Section props and removing an undefined export notification call.
- Canonical deterministic engine and XLSX writer retained as JavaScript modules, rather than mislabeling untyped legacy code as TypeScript.
- Build now requires the type check before bundling.
- Existing canonical suite: 25 calculation tests, 10 legacy workflow tests, 6 extended tests pass (41 total). These are not evidence that React UI interactions pass.

## Still required
React-specific interaction, persistence/recovery, import/export and keyboard regressions; browser and visual desktop/mobile verification; closure of requirements matrix gaps; independent review and coordinated deployment. No 95/100 acceptance score assigned.

## React runtime and archive follow-up
- Direct browser startup exposed a mixed CommonJS/ESM export failure that Vite bundling did not catch. Converted browser engine and workbook writer to explicit ESM; Summary renders and agrees with canonical totals ($1,035,100 planned; $81,835.65 projected balance).
- Seven React-support regressions now pass: archive scenario/baseline preservation; invalid baseline/name rejection; unreadable raw-data preservation; denied storage recovery; browser-engine equivalence; replacement without stale optional properties; failed-storage atomicity.
- Undo now captures the entire project archive (including baseline and scenario). Imports, resets and comparison changes use validated full replacement rather than partial Object.assign merges. Browser interaction verification of these controls remains pending.

## Personnel parity restoration
Restored per-person modeled, actual and forecast totals, salary above cap, monthly cost grid, yearly average effort, person-months and forecast cost. Added regression coverage for historical payroll/credits versus future modeled costs, proposal mode, and explicit zero monthly effort. Nine React-support tests pass. Rendered visual QA of these additions is pending.

## Additional parity fixes
Restored supplies base/scenario totals and original slider limits (quantity −50..50%, unit cost −30..50%); monthly team effort/FTE/cost; subaward payment filtering and chronological order; percent paid and F&A eligibility/exclusion breakdown. Corrected remaining payment display string-ID lookup. These controls compile but still require direct interaction/visual verification. Cumulative payments, full ledger totals/variance, and broader PRD gaps remain open.

## Direct browser QA — latest React build
All seven tabs open and display their expected sections. Personnel salary edit 160000→160001 commits on Tab, retains keyboard focus in effort, and survives reload. Invalid salary −1 displays validation and restores saved 160001. Restored original 160000 afterward. Desktop Personnel screenshot at 1165px shows main table fitting viewport, readable fields and consistent rows. This is a targeted pass, not full workflow or responsive acceptance.

## Saved-scenario browser verification
Saved synthetic QA baseline at salary 160000, changed working salary to 170000, reopened saved scenario through confirmation: salary restored to 160000. Reload preserved both restored salary and scenario catalog. Native confirmation caused an automation click timeout; checked existing dialog and accepted once, without repeating the action. No real data used.

## Dialog validation
Corrected errors rendering behind modal overlays. Direct browser test: whitespace-only scenario name shows "Enter a scenario name" inside the dialog, without saving or throwing. Dismiss/Close remain usable. Production build and 21 targeted tests pass.

## Summary and reconciliation coverage — November 17
- Summary category comparison and trend now share a desktop row; 390px layout stacks them. Visually inspected both rendered layouts. No acceptance score assigned.
- Statement coverage detects missing months, overlapping complete statements and mismatched totals across all direct categories and subawards. Explicitly does not imply F&A sign-off.
- 24 targeted tests pass, TypeScript and production build pass. Coverage UI still needs browser interaction QA.

## Commitments — November 17
26 targeted tests, TypeScript and production build pass. Existing fixture calculations remain identical to the canonical engine (new commitment result metadata excluded from parity comparison). Linked $5,000 supply commitment stays $5,000 total after a $2,000 settlement and $3,000 outstanding forecast; credit/cancellation and workbook checks pass. UI implemented but not browser-verified yet. No 95+ acceptance claim.

## Commitment edge cases — November 17
- Fixed orphan settlement validation when imports omit the commitment list.
- CSV imports now preserve commitment IDs instead of silently dropping settlement links.
- Added 75 cent-level scenarios checking partial/full payments and overpayments; forecast conservation passes. Expected values use integer cents.
- 28 tests pass, TypeScript and production build pass. Browser interaction acceptance remains pending.

## Restricted browser storage — November 17
Handled the localStorage property getter throwing before loadArchive can execute. Recovery now catches reset failures and distinguishes inaccessible storage from recoverable corrupt JSON, avoiding an empty recovery download. 29 tests, TypeScript and production build pass. Restricted-storage browser simulation remains pending.

## Import and replacement history — November 17
Malformed scenario IDs/timestamps and change-history records reject before import. Archive replacements now preserve/deduplicate both local and incoming history and record the action, project differences, baseline differences and scenario change. Tests verify immutability of input archives and before/after metadata. 31 tests, TypeScript and production build pass. This remains editable local history, not an authenticated audit trail; browser round-trip QA remains open.

## Effective personnel rates — November 17
33 targeted tests, TypeScript and production build pass. Fringe/cap boundary changes and unchanged posted actuals verified in calculation regressions. Setup form and workbook schedule added; browser form QA and opening the workbook remain pending.

## Independent review fixes — November 17
- Reviewer reproduced idless supply links suppressing unrelated supplies. Stable collision-safe IDs now migrate on archive load; new supplies get UUIDs; missing link IDs reject. Regression added.
- Project-end unpaid commitments/subawards now set forecastIncomplete, suppress the favorable headline balance and disclose excluded obligations in the table/export. Full outside-period EAC allocation remains open.
- Removed the CSV-specific 2 MB limit from JSON project backup imports; large browser round-trip still pending.
- Monetary cents now use decimal-representation half-away-from-zero rounding, including negative ties and scientific notation. 1,000 positive/negative pairs cancel exactly. This is not yet end-to-end fixed-decimal arithmetic.
- 38 tests, TypeScript and production build pass. No acceptance score assigned.

## Browser workflow verification — November 17
Actual React app in Chrome:
- Added 40% fringe change effective Jan 2027 with a synthetic source. Row appeared; duplicate submission showed validation error; reload retained the original row; removal succeeded.
- Added $14,910 commitment linked to the original Digital scales supply. Summary remained $953,264.35 forecast / $81,835.65 balance; supplies forecast remained $45,943, confirming no double count in the actual UI. Reload retained commitment; removal succeeded.
- Test-only rows removed after verification. History retained. Browser label-based select locator timed out once; role-based combobox locator worked. No app defect inferred from that tool timeout.
- Not yet verified: payment-entry settlement interaction, cancellation, reverse form, export download/open, mobile dialogs, full accessibility and all PRD workflows.

## CSV parsing — November 17
Extracted and tested strict CSV parser. Supports BOM, CRLF, quoted multiline notes, escaped quotes and explicit zero; trims identifiers while preserving note content. Rejects duplicate/blank headers, empty imports, mismatched column counts and malformed quoting before preview. 40 tests, TypeScript and build pass. Actual file chooser import and duplicate-reference resolution workflow remain pending.

## Duplicate-aware CSV — November 17
CSV preview now reports new rows and identical skipped references. Conflicting references across existing or same-batch rows reject atomically; source project remains untouched. Exact matching includes month/category/amount/note/person/commitment. 42 tests, TypeScript and build pass. UI file chooser/preview still needs direct browser QA; field mapping and manual conflict resolution remain open.

## Effective F&A — November 17
Added source-attributed effective F&A percentage changes to Setup. Engine resets cumulative rounding at rate changes, preserves posted F&A overrides, and does not reprice earlier months. Regression checks 10% then20% on $100/month => $10/$20/$20, and posted $12 => $52 total. Constant-profile fixture parity remains intact. Static per-subaward F&A estimates are withheld when dated rates exist; dated project totals remain in Summary/ledger. 43 tests, TypeScript and build pass. Per-subaward dated attribution, effective base/threshold profiles and browser QA remain open.

## Original-engine parity suite — November 17
The original 25 calculation tests and four validation/conservation tests now execute against the current React ESM engine in every build. This includes 250 randomized project conservation cases and the 60-month/100-person/20,000-entry performance case. Both regression groups pass, alongside 43 targeted tests (45 reported test groups total). TypeScript and production build pass. These are calculation/validation checks, not a substitute for original UI workflow or usability acceptance.

## Required numeric edits — November 17
Required numeric fields reject blank/nonfinite input with associated inline alert and restore the saved value. Optional blank fields still return null; explicit zero remains valid. Browser verified clearing Alex Rivera salary shows the alert, restores 160000 and retains 160000 after reload. 46 test groups, TypeScript and build pass. Other numeric fields and mobile error layout remain to be inspected.

## Actual browser Excel download — November 17
Clicked Excel in the running React UI and inspected the downloaded XLSX package. ZIP integrity and every XML document parsed successfully. Fourteen expected sheets present, including Commitments and Rate changes. Summary values match browser: budget1035100, actual631852, forecast953264.35, balance81835.65. This verifies the actual download path/package and numeric values, not Excel desktop rendering or usability. Native spreadsheet visual/open validation remains pending.

## Stale-tab save protection — November 17
Edits and archive replacements compare the loaded storage revision with the current saved archive before writing. A stale tab rejects with reload/download guidance instead of overwriting newer data. Removed the unguarded baseline/scenario autosave effect. Regression confirms newer saved bytes remain untouched and the current revision can save again. 47 test groups, TypeScript and build pass. Browser two-tab test passed: both tabs loaded salary160000; tab A saved160001; tab B attempted160002, received the stale-tab alert and retained its prior160000 UI value; reloading B showed160001. Restored160000 in B, then reloaded A and verified160000. Newer saved data was not overwritten. This is optimistic local stale-state detection, not a cross-process atomic lock or server concurrency guarantee; simultaneous racing writes still require transactional persistence for production.

## Import numeric and size edge cases — November 17
CSV amounts now require decimal notation, rejecting hexadecimal, binary, scientific notation and nonfinite values rather than silently interpreting JavaScript numeric syntax. Signed decimal credits and explicit zero remain valid. Existing-ledger ID allocation uses reduction rather than argument spreading; a 150,000-row regression passes without stack failure. All 49 reported test groups, TypeScript and production build pass. These are targeted automated checks; actual file chooser and large archive browser recovery remain pending.

## Partial commitment allocations — November 17
Added optional allocation amount to expenditure entry, CSV and Excel output. Blank preserves full-transaction settlement; explicit zero is supported. Only the assigned portion reduces the open commitment; the full transaction remains an actual expense. Validation rejects orphan amounts, over-allocation and opposite-sign allocation. Reversals negate both amounts and validate their correspondence. Automated checks pass for $500 expense/$200 allocation, exact reversal, replay/conflict detection and malformed CSV amounts. 52 reported test groups and build pass before the entry-table display refinement. Browser verification remains pending. Multiple commitments per transaction and payment schedules are still open requirements.

## Browser allocation, reversal and cancellation — November 17
Created synthetic $1,000 equipment commitment, entered a $500 expense allocating $200. UI showed paid$200/open$800 and the explicit allocation in Entries. Reversal retained the original and showed -$500 expense/-$200 allocation, restoring open$1,000. Reload preserved these values; cancelling $1,000 reduced open to zero. Test records remain as an offsetting pair and cancelled commitment for audit evidence. Removed generic dialog filler found during QA. Entry-form ID generation now also avoids spreading large ledgers. Full mobile interaction and multi-commitment split acceptance remain pending.

## Seven-screen visual review and hierarchy refinement — November 17
Inspected the rendered top sections of Summary, Ledger, Personnel, Effort, Supplies, Subawards and Setup at desktop width, plus 390px iframe Summary. Findings: ledger forms obscured records; Setup led with rate amendments rather than grant identity; long names clipped; mobile tabs hid three views; effort inputs consumed unnecessary width. Implemented expandable Add expenditure, records before commitment/reconciliation forms, 25-row pagination, grant-first Setup with full-width title, wider subaward names, narrower effort numeric cells, and wrapped mobile tabs. Browser verified page2 shows26–50 of162, search resets to1–1, disclosure reveals the entry form, Setup order and title, and all seven mobile tabs visible. All12 effort months now appear in the desktop viewport, though minor horizontal overflow remains. 52 test groups, typecheck and build pass. This is a bounded layout improvement, not full visual/accessibility acceptance; lower sections, 200% zoom, mobile editing and screen-reader checks remain open.

## CSV browser upload recovery and integration — November 17
The file-chooser call timed out while an approval card was pending. After reconnecting, the existing tab showed Import preview with one new row and zero skips: the upload had completed, so it was not repeated. Applied synthetic-new.csv once and verified QA-CSV-ROUNDTRIP / $12.50 in Entries before and after reload. This verifies the previous count-only import UI, not the new source-aware preview. No duplicate/conflict browser pass is claimed.
Reviewed the isolated import and explicit-period integration documents, then fast-forwarded the canonical checkout to12e18d1. All67 test groups, TypeScript and Vite build pass. New source-aware row review still requires browser QA. Explicit budget-period archives remain blocked in the UI until period-aware editing/export is complete. No public deployment occurred.

## Source-aware import browser acceptance — November 17
Uploaded a new synthetic source-aware CSV, supplied source label Synthetic QA ledger, inspected row decision/amount/reference and expanded original fields. Apply succeeded and the $7.25 QA-SOURCE-NEW entry survived reload. Previous QA-CSV-ROUNDTRIP was not replayed. Conflict, duplicate, cancellation and narrow-screen preview still need browser verification. Local preview was confirmed stopped after restoration and restarted; no public service was restarted or deployed.

## Explicit period editor — November 17
Added period split, merge, shared-boundary editing, allocation editing, review-before-apply and budget-period workbook sheet. Saves use existing archive validation/history/undo/stale-tab protection. Legacy arrays remain retained; their editable annual grid disappears once explicit periods become authoritative. Surplus legacy arrays block migration. Browser split the first year into two six-month periods, verified zero category-total changes in review, applied, reloaded and confirmed four periods persisted and the inactive annual editor was absent. 68 test groups, TypeScript and build pass; tests cover cent conservation, input preservation, invalid boundaries and split/merge identity. Mobile editor, exported workbook period-sheet acceptance, amended project dates and daily proration remain open. Month-level editing is not full amendment workflow completion.

## Decimal period allocation correction
Independent review reproduced a one-cent loss when splitting an accepted imported allocation of 1.005. Split, merge and editor comparison totals now use the engine's shared decimal-to-cents conversion. Added regressions for 1.005, 2.675 and 100.015, asserting engine totals and review totals remain identical through splitting and merging. Scenario isolation and explicit-period export regressions are also included. All 71 test groups, TypeScript and production build pass. This does not establish complete browser acceptance or a 95 score. Remaining independent-review gaps: simultaneous localStorage writers, asynchronous import UI races, rejected period persistence, and future-only scenario editing.

## Period review responsive browser acceptance
Browser inspection at 390px found the intrinsic comparison table expanded its containing dialog grid, clipping the title and values. Corrected dialog grid min-width containment and added mobile per-category comparison rows. Fresh browser screenshots confirm readable Current/Proposed/Change values within the phone dialog; desktop retains aligned tabular comparisons. Both reviews canceled without changing project values. Full build and 71 test groups passed again. These are local synthetic-data checks, not a public deployment or full-app visual sign-off.

## Actual React asynchronous workflow regressions
Added an isolated jsdom harness that mounts the real bundled App and dispatches DOM events. It verifies: cancellation during file read; cancellation during CSV digest/review; cancellation during apply digest; stale external storage rejecting CSV apply; and period review rejecting a quota failure, then applying on retry while preserving the independent baseline. The import-session guard covers project, baseline, scenario and storage revision; stale tasks cannot clear another task's busy state. Cancel stays usable while validation runs. Fresh unsaved sample now correctly reports Not saved. Full suite: 80 passing tests including nested handler cases; TypeScript and production bundle pass. jsdom is not browser/visual evidence and does not resolve atomic simultaneous-writer protection or production persistence.

## Browser duplicate import review
On refreshed local React build, selected the previously applied synthetic source-aware CSV and entered its existing source, Synthetic QA ledger. Browser reported 0 new / 1 identical / 0 conflicts; row QA-SOURCE-NEW ($7.25) was marked skip and the exact-file warning appeared. Canceled without applying. Reload retained spend-to-date $631,877.68 and projected end balance $81,801.43. No duplicate transaction was added. Independent reviewer also reran 19 targeted tests at 8e250a1 with no newly reproduced import/archive defect. Remaining UX refinement: all-identical files should offer a clear no-changes completion rather than a prominent Apply import action.

## Scenario actuals protection increment
Named save/open now establishes an explicit active scenario tied to copied source data. Validation blocks ledger/payments/import batches/statements, cutoff/source/mode/start and posted F&A changes; comparison baseline replacement also rejects. End dates cannot exclude the source's recorded-actual period. Forecast edits remain available. Return to source restores the original source project and preserves saved alternatives, including after saving a revised scenario. Independent review found and prompted fixes for lost original return target, unprotected posted F&A, and shortened historical scope. Regressions now cover all three plus actual React baseline rejection and return-to-source behavior. All 83 tests, typecheck and production build pass.
Browser saved QA protected scenario and reload retained locked status and the original cutoff/totals. Month-field interaction did not establish visible blur/error restoration, so do not count that behavior as passed. Scenario model remains local, user-editable snapshot data; it is not authenticated immutable history or a completed actuals-refresh/promotion workflow. Effective rules that can affect estimated historical F&A still need a future-only review.

## Historical scenario amounts and duplicate-only import completion
Scenario validation now compares historical monthly category amounts and F&A with the source calculation. Changes to rates, eligibility or subaward subject amounts that reprice history reject; future-effective rate assumptions remain valid and change the forecast without changing actual totals. Regression fixtures explicitly include historical equipment so MTDC/TDC tests exercise different bases. Duplicate-only CSV review now disables Apply and offers Done with No changes to apply; actual React test verifies no extra batch/write. All 85 tests, TypeScript and production build pass. Browser acceptance of these latest UI changes and large-scenario performance remain pending. No production or 95+ claim.

## Large archive storage correction
Measured 60 months / 100 staff / 20,000 ledger rows / 50 subawards with a saved scenario. Repeated snapshots produced 9,239,114 JSON characters, risking browser quota failures. Local storage now uses a versioned packed-array/UTF16 compression format for large archives; small/legacy JSON remains readable and downloaded project JSON remains unchanged. Exact persisted revision strings continue guarding stale writes. Independent snapshot arrays are restored, malformed paths/expansion reject, and corrupted saves remain available in recovery without replacement.
Observed revised synthetic benchmark: 155,230 UTF16 storage bytes, save 1,597ms, load 1,845ms, all 20,000 rows restored. Earlier compression without array dedup took 5,363ms. These are local diagnostic timings, not browser interaction acceptance or a sub-second pass. Full suite: 88 tests, TypeScript and build pass. Browser reload/migration acceptance and continued performance work remain open.

## Storage writer/reader boundary correction
Independent review reproduced a valid archive with more packed references than the decoder permits: save succeeded but reload failed. Encoder now enforces reference count, expanded/packed/encoded lengths and safe packed paths before writing. The exact 10,000-reference boundary reloads; an extra pair of references rejects while the previous saved string remains untouched. Scenario cutoff/start/source controls and actual-record delete controls are also disabled while locked. Full suite: 89 tests, typecheck and production build pass.
GitHub permissions rechecked: UABGH-UAB-GIMPOP/uab-grant-budget-workspace reports pull=true, push=false, admin=false for the connected account. No publication attempted; use the previously authorized Mac Mini publishing session through the coordinator or obtain a write-capable connection. Independent implementation and QA can continue.

## End-of-project obligation disclosure
Summary now itemizes unpaid direct commitments and subawards that cannot be placed in a future project month. A separate total and workbook sheet explicitly identify these amounts as excluded from the forecast; related F&A is not invented. Existing incomplete-forecast warning remains. Tests verify partial allocation/cancellation conservation, subaward unpaid balance, no duplicate listing when a future month exists, and workbook disclosure. Full suite: 91 tests, typecheck and production build pass. Rendered browser acceptance remains pending; this disclosure does not implement payment schedules, date amendments or full closeout.

## Browser scenario return/reload acceptance
Latest local build showed start/cutoff controls disabled in QA protected scenario. Return to source budget confirmation restored Working budget and enabled controls. Reload retained spend-to-date $631,877.68 and projected balance $81,801.43. Mobile Summary inspected at 390px with readable values and all seven navigation tabs. This does not establish every mobile screen or final visual score. Coordinator confirmed the existing Mac Mini publication route; no new connection or permission request is needed for that coordinated route.

## Posted F&A reconciliation — November 17
- Added posted-month editing and F&A statement comparisons. Missing amounts cannot reconcile against estimates; numeric zero is explicit. Coverage identifies missing posted F&A separately from mismatched totals. Workbook preserves blank versus zero with a Posted F&A sheet.
- Browser: synthetic July 2024 zero-dollar statement showed Missing posted F&A; entering 0 changed it to Matched; reload retained Matched; clearing the amount restored Missing posted F&A. Existing working-budget data preserved. Test statement remains in the browser fixture.
- Independent review caught coercion of imported empty strings/booleans to zero. Canonical validation now rejects nonnumeric posted values; targeted archive regression checks the actual validation message. Numeric zero and omitted months remain valid.
- Full build: 94 tests pass, typecheck and production bundle pass. Corrected archive assertion independently rerun (5 reconciliation tests pass). Desktop control spacing inspected; full mobile/keyboard/statement-import acceptance remains open.
- No 95-point score or finished-app claim. Attachments, supersession, sign-off and internal deployment remain unfinished.

## Recurring milestones and sequential save safety — November 17
- Added monthly, quarterly and annual cadence, explicit evidence links, completion timestamps, stable occurrence/series IDs and Excel fields. Completed occurrences remain; one successor is created per occurrence. Month-end/leap-year clamping preserves the original day. No external notifications are claimed.
- Independent review found import cycles and missing own-ID export; both fixed. Imported predecessor chronology/series links are validated; referenced history cannot be removed while successors remain. Original milestone validation regression retained.
- Actual React tests cover storage failure/retry, batched cadence+completion and native date blur without a React change event. Shared commit uses the latest successful archive synchronously so adjacent changes do not overwrite each other. Field blur reads the actual native value.
- Browser initially exposed date entry not persisted; fixed and retested: pending QA occurrence changed to 2027-01-31, completion produced 2027-02-28, reload preserved both. Existing completed 2026-11-17 occurrence preserved. 390px milestone layout visually inspected: controls readable, no horizontal scroll in the milestone section. Duplicate title controls now have dated article/completion names.
- Full build: 101 tests pass, typecheck and bundle pass. Full app acceptance remains incomplete; this is not a 95 score.

## PRD T12 estimate comparison — November 17
Engine retains calculated F&A separately before posted overrides. Ledger and workbook show posted, estimate and signed difference; missing posted months show no difference. Exact fixture: $1,000 direct + $400 posted F&A = $1,400 total despite $490 estimate; difference −$90. Zero and omitted overrides tested. Mobile browser verified July 2024 estimate $2,338.50 and zero-posted difference −$2,338.50; clearing restores missing. Visual review found insufficient edge padding, corrected.
Full suite 108 tests, typecheck and build passed; four export tests rerun after adding comparison assertions. Existing totals/curves retain posted overrides without double counting. No full acceptance/95 score claimed.

## Actual browser workbook download — November 17
Clicked Excel in the React app and parsed the downloaded OOXML using openpyxl 3.1.5 (read-only use; no rewrite). All 17 worksheets opened; ZIP CRC valid; no formulas or live hyperlinks/external-link package parts. Summary matches displayed fixture: budget 1,035,100; actual 631,877.68; forecast 953,298.57; balance 81,801.43. Direct plus indirect totals reconcile. Milestone IDs, recurrence history, and blank posted F&A versus numeric estimates survived export.
Reproducible check: scripts/verify-workbook.py PATH. Requires optional openpyxl for QA; not a runtime dependency. This validates package/data, not visual formatting or native Excel interaction.
