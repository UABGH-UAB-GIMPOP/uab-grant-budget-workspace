# Isolated canonical CSV review contract

Based on a854283. This is an opt-in pure module, not a deployed UI or production claim. Existing import behavior is unchanged until integration.

## Contract
- `prepareImport(project, text, {projectId, sourceSystem, batchId})` returns each parsed logical record, proposed values, add/skip/conflict disposition and reason, counts, repeated-file warning, exact SHA-256 file digest, and base-project digest. Row numbers count logical records, not physical multiline CSV lines.
- Canonical column mapping is versioned `canonical-csv-v1`; arbitrary source-column mapping is NOT implemented.
- Identity is explicit project + source system + reference. Same-batch identical records skip. Conflicts block the whole batch. Legacy references without provenance require resolution; source is never guessed.
- `applyReviewedImport` recomputes and compares the complete review, rejecting stale projects or changed reviews/text/scope. It requires the existing project validator. It returns a copied project, with source metadata on added rows and original CSV in a batch record. No storage, clock, network or user identity is supplied by this module.
- Limits: 2 MB encoded UTF-8 and 10,000 logical records. Web Crypto requires a supported secure-context browser (localhost qualifies).

## Integration work
1. Give the working project a persisted stable ID and obtain explicit source and unique batch ID from the user. Never infer legacy provenance from filenames or note text.
2. Render ALL preview rows with accessible review/disposition/error UI, not only counts. Preserve cancel without mutation and disable Apply on conflicts. Render source content as text, never HTML.
3. Pass existing validateProject to apply, then use existing archive/history/stale-tab save path. Do not assign returned state before save succeeds. Module digest checks are not a database transaction or concurrency lock.
4. Add batch/provenance validation to archive import, expose history/export details, define retention/size handling for original CSV, and verify JSON restore. Existing schema tolerating extra fields is not this validation.
5. Resolve conflicts through a new preview; no silent overwrite or arbitrary row selection. Original records remain unchanged.
6. Browser acceptance: new/duplicate/conflicting files, same reference from distinct sources, legacy references, preview cancel, stale tab, validator failure, reload/undo, keyboard/mobile. Do not duplicate the current worker's browser session.

## Evidence
Six new pure synthetic tests pass. Full existing suite plus these: 58/58 groups pass using existing dependencies via a local clone-only symlink. No install, browser interaction, real data, publication or shared-checkout modification. Initial isolated runs lacked dependency resolution; clone-only symlink resolved that environment issue.

## Boundaries
No authenticated provenance, tamper-proof audit, institutional approval, arbitrary spreadsheet migration, field mapping, application UI or backend is claimed. Public demo remains fake-data only. Do not import real salary data.

## Isolated UI integration checkpoint — November 17
The isolated React UI now asks for source system, assigns a stable project ID on successful first import, previews every logical CSV row with all source fields available, blocks conflicting batches, and supports cancellation. Apply rechecks the snapshot then uses existing replacement history, validation, undo and revision-aware storage. Source/batch validation and scoped duplicate identity are integrated; cross-source equal references now pass the actual validator. Reversal records link the original without claiming they were directly imported. Workbook Entries includes provenance and an Import batches sheet is added when present. JSON archives retain original CSV batches.

Explicit-period archives are blocked at the UI import boundary until a period editor is built. Existing period-capable engine remains isolated. No browser session was used or publication made.

Verification: 67/67 synthetic regression groups, TypeScript and Vite production build pass. Tests include actual project validator + archive/history round trip, distinct source references, malformed provenance, imported-record reversal and failed stale save preservation. Browser interaction, keyboard/mobile visual QA, file-selection approval and native spreadsheet opening remain unverified. Source labels are user assertions, not authenticated institutional provenance. The source record and original CSV are preserved but not cryptographically revalidated on JSON archive load; this is editable local history, not tamper-proof audit. Limits are per CSV; cumulative archive storage still depends on browser quota, with existing failed-save handling.
