## Quality checklist

- [ ] `npm run build`
- [ ] `npm run test`
- [ ] `npm run test:e2e`
- [ ] `npm run test:visual`

## Visual baseline changes

- [ ] No visual baseline changed, or the changed PNGs were generated with `npm run test:visual:update`.
- [ ] Every changed baseline and generated diff was visually inspected.
- [ ] `npm run test:visual` was run again without update mode and `visual-report/report.json` was reviewed.

Never accept baseline changes solely to make a failing test green; explain the intentional UI change below.
