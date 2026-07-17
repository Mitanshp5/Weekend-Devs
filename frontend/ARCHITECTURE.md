# Frontend skeleton

## Routes

| Route | Shell | Responsibility |
|---|---|---|
| `/` | viewport-locked start page | introduce PRISM and enter diagnostic |
| `/diagnostic` | viewport-locked start page | five-question diagnostic flow |
| `/learn` | learner dashboard | recommended path and next lesson |
| `/lesson/:lessonId` | learner dashboard | micro-lesson and practice |
| `/tutor` | learner dashboard | grounded doubt tutor |
| `/progress` | learner dashboard | mastery and concept evidence |
| `/teacher` | teacher dashboard | intervention-ready learner insights |

## Extension points

- `pages/`: route-level screens
- `components/`: reusable application shell/components
- `app/navigation.ts`: shared navigation definition
- Future: `features/`, `api/`, `stores/`, `types/`, and `content/` as behavior and curriculum are added

The landing/diagnostic shell never scrolls. Dashboard navigation never scrolls; only `dashboard-main` may scroll.
