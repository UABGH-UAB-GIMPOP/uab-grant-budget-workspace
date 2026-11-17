# Explicit budget periods: isolated engine increment

This branch adds opt-in **month-grain** periods. It does not provide daily proration, amendment approval, a budget-period editor or deployment readiness.

## Schema and behavior
`budgetPeriods` is an ordered list of `{id, start, end, allocations}`. Dates are YYYY-MM. Stable unique IDs and explicit numeric nonnegative allocations for every supported direct-cost category (including zero) are required. Intervals cover the project exactly, without gaps or overlaps. F&A continues to be calculated by the existing rate/base engine; it is not a separately entered period award.

When absent, existing relative 12-month allocation behavior and result shape remain unchanged. When present, these explicit allocations are authoritative, spread over actual period months with deterministic residual cents. Existing `planned` arrays are retained but are no longer the calculation authority. Personnel year switches, effort views and `nY` continue to mean grant years, not arbitrary budget periods.

`previewLegacyPeriods` gives a no-mutation mapping preview; `applyLegacyPeriods` requires an unchanged preview and returns a copy, retaining all original arrays and transactions. Surplus legacy allocation entries require manual resolution, even if zero. Date changes incompatible with the explicit periods fail validation/calculation rather than silently shifting periods. Full date-amendment preview and manual mapping remain outstanding.

## Required integration gate
**Do not expose explicit-period archives to the current UI yet.** Current annual Setup controls would edit inactive legacy arrays, while the engine uses explicit periods. Build period-aware editing/display and export first, or explicitly reject `budgetPeriods` at the existing UI import boundary until that work is complete. This module is an isolated engine capability, not a completed end-to-end feature.

1. Add a reviewed period editor and category allocations; label grant-year personnel controls separately.
2. Add budget-period export sheet and metadata. Keep annual views as calculated reporting views, not competing editable allocation sources.
3. Integrate migration preview, cancel/confirm, save/undo/history, and archive schema validation. Preserve source arrays and dates.
4. Add change-date impact preview and explicitly mapped amendments; no automatic movement of actuals, overrides, rates or periods.
5. Perform browser acceptance after integration. No current worker browser was used.

## Verification
Five new synthetic tests cover legacy migration parity/input preservation, unequal periods and residual cents, invalid intervals/allocations/IDs, stale date mapping, and surplus legacy rows. Full regression suite: **63/63 groups pass**. Existing numerical and result-shape parity preserved.

## Prior import contract integration note
The source-aware CSV module remains opt-in. Existing engine validation still rejects duplicate reference strings globally. Cross-source equal references therefore fail closed when the real validator is supplied until scoped-identity validation is integrated. No production-ready import claim is made.

## Canonical UI integration update
The period editor and Budget periods workbook sheet now exist in the canonical React app. The former explicit-period JSON import block is removed; validated archives use the period-aware editor. Annual legacy allocation controls are hidden when explicit periods exist. Browser split/review/apply/reload passed. The earlier integration prohibition is superseded for these implemented controls, but daily proration, date-amendment workflow, mobile editing and workbook acceptance remain unfinished.
