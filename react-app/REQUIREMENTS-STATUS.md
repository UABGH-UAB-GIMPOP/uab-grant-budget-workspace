# React requirements status — November 17, 2026

Current PRD acceptance ledger: [ACCEPTANCE-MATRIX.md](ACCEPTANCE-MATRIX.md). Earlier dated increments below retain history and may be superseded by later evidence.

Canonical scope: ../grant-budget-v10/PRD-v10.md and REQUIREMENTS-AUDIT.md. This document updates the migration status; it does not narrow the agreed scope. Public demo remains synthetic-only. No acceptance score assigned.

| Requirement | Current evidence | Remaining acceptance work |
|---|---|---|
| React + actual shadcn | React 19, checked-in registry components; production bundle | Full component accessibility review |
| Seven familiar views | All seven browser-opened and server-rendered | Every interaction/error/empty state |
| Personnel/effort | Restored totals, monthly costs, yearly summaries, team FTE; calculation tests | Browser year switches, overrides, addition/removal, cap display |
| Ledger/subawards | CSV validation, filtered chronological payments, running balances, funding breakdown, budget/forecast totals | Browser CRUD, reversals, duplicate handling, exports opened in spreadsheet application |
| Supplies | Base/scenario totals, original slider ranges | Browser compound scenarios and reset |
| Local save/recovery | Archive helper tests; salary persists across reload; invalid input restored | Storage quota, corrupt backup, import/undo/reset through browser |
| Scenario comparison | Named working scenario plus baseline; full archive restore | Multiple immutable scenarios/revisions and promotion remain unimplemented |
| Milestones | Owner/date/completion, monthly/quarterly/annual recurrence, evidence links, linked history and export | Browser/mobile acceptance in progress; external reminders not implemented |
| Export | Testable workbook sheet generation; identity/reference and TDC regression | Actual download/open, all sheets and permission scope |
| Visual/mobile | Summary 390px and Personnel desktop inspected | All screens, dialogs, 200% zoom, reduced motion, screen reader and 95+ rubric |
| Production | Public fake-data warning; no real data included | UAB auth/backend, permissions, concurrency, database, backup/restore, monitoring and institutional authorization not implemented/verified |

## Substantive PRD gaps still open
Statement reconciliation batches/control totals and completeness; general commitments and settlements; immutable correction journal/snapshots; effective rate/fringe/cap schedules; explicit budget periods; award amendments/NCE/closeout/period locking; sponsor rule profiles and NIH modular/NSF validations; cost share; workbook migration; shared authenticated storage and roles; full operational/security/accessibility validation. These cannot be represented as complete based on the current UI or unit tests.

## Delivery state
React changes are local and have not replaced the published vanilla demo. Coordinate publication with parent after sanitized package and browser regression review. Do not publish research notes or private source materials.

### Reconciliation increment
Ledger now records source, category, start/end months, statement total and completeness, with live actual/difference/status comparison. Edits to underlying records recompute matching status. Scope/date/category validation and match/mismatch/partial tests pass. This does not yet implement overlapping-batch resolution, all-category completeness, statement attachments, F&A reconciliation or approved sign-off; broad reconciliation requirement remains partial.

### Named scenario increment
Saved scenario catalog now captures separate project/baseline copies, name and timestamp. Opening a saved scenario replaces the working archive with confirmation and retains the catalog; Undo can recover the prior working archive. Isolation/nonrecursive snapshots are tested. Browser save/open/reload verification remains pending. This is local snapshot history, not tamper-proof audit, policy-version freezing, actuals refresh or approved promotion.

### Change-history increment
Normal edits/deletions now record stable-record before/after values, timestamp, scenario and an explicit local-browser actor label. Review expands details and Excel includes them. Regression verifies record identity, deletion capture and independent copied values. This remains mutable local history, not authenticated/tamper-proof institutional audit; replacement/import history and server-side audit remain open.

### Transaction corrections increment
Ledger supports linked negative reversals with a required reason and selected posting month, preserving original identity/person/category. Duplicate reversals are rejected; linked records cannot be deleted through UI. Workbook carries reversal linkage. Unit regression passes; browser form and export validation remain pending. This does not yet provide institutionally immutable journals or authenticated correction approval.

### Coverage increment
Statement coverage now checks all direct-cost categories and subawards through the known-through month, rejects overlap as matched coverage, and identifies missing/mismatched months. Unit regression covers zero totals, overlap, partial statements, changed totals and no actual period. F&A, attachments, batch supersession and sign-off remain open. Summary table/trend pairing implemented and visually inspected on desktop and narrow viewport.

### Commitment increment
Direct non-personnel commitments now have authorized/cancelled amounts, source, expected month, explicit modeled supply/planned-cost links, and linked ledger settlements. Forecast replaces linked modeled lines; payments reduce open commitments, credits restore them, overdue balances move to the next forecast month with a warning. Overpayments and unpaid balances beyond project end are flagged. Workbook includes commitments and transaction links. Tests cover partial settlement forecast conservation, credits/cancellation, duplicate links/category mismatch and export values. This is not full PRD completion: split settlement allocation, multiple payment schedules, revision/approval, personnel commitments and duplicate-invoice review remain open. Unlinked commitments intentionally add to modeled costs; automatic Travel/Other assumptions need explicit review for overlap. Browser workflow verification remains pending.

### Effective personnel rates increment
Setup supports source-attributed, effective-month fringe changes per person and annual salary-cap changes for all personnel. Forecast applies the latest applicable value; posted actual payroll is unchanged. Duplicate scope/month, invalid values and missing source/person reject before save/import. JSON and workbook retain the schedules. Tests verify boundaries, explicit zero cap, historical actual preservation and invalid schedules. Daily proration, effective F&A/base profiles, sponsor approval/versioning and browser controls remain open; these are user-entered assumptions, not automatically verified institutional rates.

### Partial settlement update — November 17
Single-commitment partial allocation is implemented across entry, engine, reversal, CSV and Excel; targeted regression coverage in commitments.test.cjs and import-ledger.test.cjs. Browser verification pending. Multi-commitment splits, scheduled payments and revision approvals remain partial/not implemented.

## Current evidence reconciliation — supersedes stale pending statements above
- Named scenario save/open/reload and copied period/source history have passed tests and earlier browser verification. Future-assumptions-only restrictions, promotion, actuals refresh and authenticated immutable history remain open.
- Explicit month-based periods now have reviewable split/merge/boundary/allocation editing, engine allocation authority and a Budget periods export sheet. Fractional-cent conservation is tested. Real React tests confirm rejected saves preserve both working state and baseline. Desktop and 390px review layouts were inspected and fixed. Amendment/NCE workflows and daily proration remain open.
- Source-scoped CSV identity, hashes, original CSV batches and per-row add/skip/conflict review are implemented. A new synthetic row was applied and reload-verified in browser. Actual React cancellation at read/review/apply and stale-storage rejection are tested. Browser duplicate/conflict/cancel coverage and workbook migration remain open.
- Commitment partial allocations, cancellation and reversals were browser-tested; source-aware export preserves allocations. Multi-commitment splits and scheduled authorizations remain open.
- Effective fringe/cap/F&A rate schedules and local before/after change history exist with tests; full rule profiles/base/threshold intervals and immutable audit are still incomplete.
- Reconciliation coverage detects incomplete/mismatched/overlapping direct-category statements. F&A coverage, attachments and sign-off remain open.
- Latest full build: 80 passing tests (including nested real React DOM handler cases), typecheck and production bundle. This is not a score of 95 or a production acceptance claim.

### Scenario safeguards update
Active named scenarios now reject actual-transaction/source history changes and comparison-baseline changes, retain posted F&A and historical date scope, and preserve the original return-to-source target across revised saves. Actual React workflow and pure/archive regressions pass (83 total tests). Future-only enforcement across all effective financial assumptions, explicit actuals refresh, promotion, rule freezing and production immutability remain open. This increment does not close the full scenario requirement.

### Historical scenario totals
Historical monthly category/F&A calculations must now match the saved source after a scenario edit. Tests reject retrospective repricing and permit future-effective rate changes. Full calculation is used for comparison; measure large-project editing latency before final acceptance. Explicit actuals-refresh/rebase and approved promotion are still unimplemented.

### Large-project storage
Large local archives use versioned deduplicated/compressed storage with plain-JSON compatibility, corruption recovery and exact revision checking. 20k-row synthetic save/restore and independent snapshots are tested. A 60-month/100-staff/50-subaward scenario uses ~155KB instead of ~9.2MB JSON; local save/load still exceed the one-second performance target. Shared transactional storage, atomic concurrent writes and production backups remain separate requirements.

### Incomplete forecast disclosure
Unscheduled obligations now have a named line-item total in Summary and a separate export sheet. This makes amounts omitted after project end visible without inventing timing/F&A. Payment scheduling, amendments and closeout remain open; forecast completeness is not asserted merely because obligations are displayed.

### F&A reconciliation update
Posted F&A now has monthly editing, complete/partial statement comparisons, missing-versus-zero handling, coverage checks and workbook export. Browser save/reload and blank restoration passed. Non-numeric imported posted amounts are rejected, including blank strings and booleans. 94 automated tests pass. This closes the basic F&A comparison gap; attachments, supersession, authorized sign-off and immutable evidence remain open.

### Recurring milestone acceptance
Monthly/quarterly/annual recurrence, evidence links, completion history, stable linked IDs and workbook fields implemented. Independent review issues resolved. Pure and real React tests pass, including failed storage/retry and adjacent saves; browser date/completion/reload and 390px layout verified. External reminders and broader full-screen accessibility acceptance remain open. Current full suite: 101 passing tests.
