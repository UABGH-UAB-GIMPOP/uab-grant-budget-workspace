# UAB Grant Budget Workspace — React migration

Local work in progress using synthetic data only. React 19 and checked-in shadcn/ui components preserve the seven original views. This is not an official ledger or approved environment for real data.

## Development

- `npm ci`
- `npm run dev`
- `npm test` — targeted calculations, archive handling, exports and seven-screen server rendering.
- `npm run build` — tests, TypeScript check and Vite production bundle.

The implementation checklist and detailed QA records are maintained separately from this public source package. Passing the build is not release acceptance.

## Deployment

Vite base is `/uab-grant-budget-workspace/`. Deploy the generated `dist` contents through the existing repository's coordinated GitHub Pages workflow. Do not overwrite that repository's history or publish private research/source materials. No production backend, authentication or shared persistence has been deployed.
