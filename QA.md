# Verification report

Date: 12 November 2026

## Executed

- Node syntax checks: script.js and all four application modules.
- Business logic: 17 tests passing.
- Chrome headless workflow checks: 15 checks passing in the completed browser run.
- Visual inspection: desktop 1440px and mobile 390px layouts.
- Mobile width check: no horizontal overflow.

Business coverage: starter schema, unique IDs, invalid answers, duplicate options, required classifications, verified-source requirement, schema round-trip, Nepal midnight, recall intervals, premature mastery prevention, scheduled mastery, hard recall, negative marking, weighted subgroup totals, skipped/invalid answers, empty tests, priority recommendations, Unicode filters, streaks and escaping/HTTPS URL policy.

Browser coverage: offline startup, six subjects, search, bookmarks, recall progress, refresh recovery with preserved deadline and selections, result snapshots, history, guest admin rejection, expired recovered submission, mobile profile navigation, administrator question creation, import validation, confirmed import and test creation. No uncaught browser exceptions in the passing run.

Administrator browser checks used an in-memory repository. They did NOT write to the live Firebase project.

## Not executed

Live Firebase signup/login/reset email, actual admin provisioning, Firestore Rules compilation/emulator authorization, premium expiry enforcement against a deployed database, real cloud sync across devices and production deployment.

The shipped rule configuration and staging access matrix are in firebase/ and README.md. Their inclusion is not a claim that the live project is configured.

## Fixes found during testing

- Root dashboard now re-renders when asynchronously loaded sample content arrives.
- Filter-input blur no longer re-renders the clicked bookmark before its click finishes.
- Local progress loads before an expired recovered test can record its result.
- Test recovery keys are tied to the attempt owner's account context.
- Hard recall returns content to revision rather than retaining mastered state.
- Failure to connect to the SDK produces a readable local-practice message.

Screenshots were used only for visual inspection and are excluded from the deliverable archive.
