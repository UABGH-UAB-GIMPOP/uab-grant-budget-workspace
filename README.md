# UAB grant budget workspace — mock-data prototype

Seven familiar views: Summary, Ledger, Personnel, Effort, Supplies, Subawards and Setup.

This public demonstration is for fictional data only. It is not an official ledger or an approved system for institutional financial or personnel data. Browser-local storage is not shared, authenticated or backed up. Do not import real data.

## Test
Run `node tests.cjs`, `node workflow-tests.cjs`, and `node qa-tests.cjs` from this directory. Serve these static files with the approved hosting environment.

## Deployment
The supplied workflow deploys static files to GitHub Pages after repository access and Pages are configured. Only the public app assets are uploaded. Private research, conversations, PRD working notes, and original downloaded source are excluded.

## Internal production transition
Use an institutionally approved host, UAB-approved identity/SSO, server-side project authorization, encrypted persistent storage, retention controls, immutable change history, tested backups/restores, and monitored operations. Implement decimal monetary arithmetic and approved award-specific rate profiles; validate sponsor rules and personnel calculations with research administration. Validate accessibility, import/export, concurrency and security before moving real data. Scores on this prototype do not satisfy these gates.

## Current limitations
Monthly calculation prototype; academic/summer and daily proration are not production-certified. No accounting integration, authenticated collaboration, authoritative ledger, automatic rule approval or durable server audit history. Independent full browser regression and final visual acceptance remain outstanding. Public deployment is a synthetic-data demonstration only.
