# PRD acceptance evidence

Source: PRD-v10.md, acceptance suite T01–T28. Updated November 17, 2026. Local React checkpoint; public demo must contain synthetic data only. A passing calculation is not full workflow acceptance. No functional or visual score of 95 is asserted.

Status: **Numerical pass** means the named expected calculation is tested; **Partial** means implementation/evidence covers only part; **Open** means the requirement is not implemented or not verified. All rows still require the applicable end-to-end workflow review.

| ID | Status | Evidence | Remaining work |
|---|---|---|---|
| T01 | Numerical pass | prd-acceptance.test.cjs: $2,600 monthly salary/fringe | Browser personnel-entry walkthrough |
| T02 | Numerical pass | prd-acceptance: zero override, missing override fallback, disabled year | Keyboard override/reset workflow |
| T03 | Numerical pass | prd-acceptance: $2,678 raise, no annual repetition | Browser raise entry |
| T04 | Open | Appointment denominator exists | Explicit academic/summer employment, complete nine-month scenario |
| T05 | Partial | prd-acceptance: $45,600 charged, $14,400 differential, IBS preserved | Verify all export fields and UI cap explanation |
| T06 | Numerical pass | prd-acceptance: six-month $60k; budget-periods.test.cjs residual cents | Broader date amendment review |
| T07 | Partial | Original calculation regression; known-through filtering | Explicit PRD fixture and browser historical-average check |
| T08 | Partial | Date validation rejects invalid imports | Quarantine and review/remapping workflow |
| T09 | Partial | Original calculation regression and payments tests | Exact multi-year acceptance fixture and browser invoice workflow |
| T10 | Partial | Credit/cumulative cap regression | Amendment semantics and full independent-award fixture |
| T11 | Partial | MTDC/TDC exclusions tested | Effective sponsor-specific equipment classification profiles |
| T12 | Partial | Exact PRD calculation, exported estimates/differences, mobile displayed values and zero/blank entry verified | Complete desktop/export-file acceptance |
| T13 | Partial | Commitment settlement/reversal tests and browser checks | Multi-commitment allocation and scheduled payments |
| T14 | Partial | Coverage and pre-start calculation regression | Complete unknown-month workflow and browser evidence |
| T15 | Numerical pass | prd-acceptance: $1,320 compound scenario, $1,000 reset | Slider/keyboard/reset browser acceptance |
| T16 | Partial | Stable personnel IDs, payroll summary tests | Rename and duplicate-name browser walkthrough |
| T17 | Partial | Source-aware import tests; browser apply/duplicate cancellation | Full duplicate/conflict/cancel/reimport deployed walkthrough |
| T18 | Partial | Archive and real React quota/corrupt/stale/cancel tests | Browser full recovery/backup walkthrough |
| T19 | Open | Local stale-write detection only | Atomic shared persistence, roles, authenticated API authorization |
| T20 | Open | No complete sponsor eligibility module | NIH modular and mechanism-specific eligibility |
| T21 | Partial | Source-attributed effective rates, validation | Versioned rule profiles, expiry/conflict approval workflow |
| T22 | Partial | Common engine, export tests, cent conservation | Every sheet/chart combination and whole-dollar export reconciliation |
| T23 | Partial | Isolated scenarios, baseline/source and historical safeguards | Hire-delay walkthrough, NCE, promotion and authorized amendments |
| T24 | Partial | CSV/import/archive malformed input and unsafe-link tests | Full injection/foreign-ID security acceptance across every surface |
| T25 | Partial | Actual browser download parsed by openpyxl: 17 sheets, reconciled totals, valid ZIP, no formulas/external links; scripts/verify-workbook.py | Visual formatting and native spreadsheet-app inspection |
| T26 | Partial | Focus/input fixes; selected desktop/390px visual checks | Complete keyboard, 200% zoom, screen reader and reduced-motion review |
| T27 | Partial | Manual entry/reconciliation and public non-ledger warning | Complete disconnected workflow acceptance |
| T28 | Partial | Archive restore, source snapshots and historical scenario checks | Frozen rule/engine versions, production backup and restore drill |

## Required walkthroughs not yet signed off

NIH R01 proposal; three-year award with late hire; legacy base profile; NSF cross-project personnel; foundation total-cost ceiling; partial reconciliation/duplicate import; reduced continuation funding; closeout with unpaid subaward and proposed NCE. Each needs inputs, independent expected values, observed UI/export results and policy assumptions.

## Additional implemented increments

Recurring milestones preserve linked completion history, evidence URLs and stable IDs; automated tests cover date clamping, cycles, duplicate prevention, failed save and adjacent edits. Browser completion/date/reload and 390px layout passed. External notifications are not implemented.

## Production boundary

Public synthetic demo acceptance is separate from internal UAB production. Authentication, backend roles, salary access, immutable audit, atomic concurrency, institutional hosting authorization, backups, operational owners and monitoring remain unverified or unimplemented. Local browser storage is not a substitute.
