# PRISM Web

Subject-agnostic learner interface for the PRISM one-week prototype.

## Local development

```bash
npm install
npm test
npm run build
npm run dev
```

## Layout contract

- Landing/login/start pages that are not dashboards are viewport-locked and never scroll.
- Future dashboard navigation remains fixed and non-scrollable; only the dashboard content region may scroll.

## Current slice

- Explainable diagnostic landing screen
- Learner transition into Question 1 of 5
- No subject or curriculum data is hardcoded; question rendering stays blocked until the team selects the first learning domain

Next: connect this shell to the curriculum-backed diagnostic API after the first subject and learning unit are confirmed.
