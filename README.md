# Sajilo GK

A buildless learning platform for Nepal competitive-examination preparation. HTML, CSS and JavaScript modules with Firebase Authentication and Firestore. No mandatory Cloud Functions or paid backend.

## Start locally

1. Keep this entire folder together. Do not copy only index.html.
2. With Node installed, run: node scripts/serve.mjs
3. Open http://127.0.0.1:4173
4. Alternatively, open this folder in VS Code and use Live Server on index.html.
5. Do not double-click the HTML through file://; module imports and data fetches require HTTP.

No npm installation is required to run the website. The supplied package scripts are conveniences.

## First Firebase setup

The configuration for project loksewa-2083 is already in modules/store.js, using the exact SDK version provided by the project owner.

1. Open Firebase Console and select loksewa-2083.
2. In Authentication > Sign-in method, enable Email/Password.
3. In Authentication > Settings > Authorized domains, add your deployed hostname and localhost for development as needed.
4. Create the default Cloud Firestore database.
5. Publish firebase/firestore.rules in the Firestore Rules tab.
6. Deploy the index definitions using Firebase CLI if available:

   firebase deploy --only firestore:rules,firestore:indexes --project loksewa-2083

   The index for mockTests uses status + premium. Create that composite index in Console if you do not use the CLI. Other paginated queries use single-field indexes and document ID ordering.

Do not mix these rules with unrelated existing application rules without reviewing their overlapping paths. Publishing replaces that project's rules.

## Provision the administrator securely

1. Create an account through this website.
2. Open Profile and send an email verification link.
3. Verify the email, then use "I verified my email".
4. In Firebase Authentication, copy this user's UID.
5. In Firestore Console, create collection admins and a document whose ID is that exact UID. Give it any simple field, for example enabled: true.
6. Sign out and sign in again.
7. The Admin control navigation item appears. Direct address: #admin/overview.

Important: presence of admins/{uid} authorizes the verified account. The enabled field above is informational; REMOVE the document to revoke administration. No client can create or edit admins documents under the supplied rules. Do not put a role in a user-editable profile and rely on it for authorization.

## Add your question bank

Admin > Import / export > choose data/sample-questions.json > Validate & preview > Confirm import.

The bundled bank has 24 illustrative practice questions, including Nepali Unicode text and six subjects. It is sample data, not a complete Loksewa syllabus, verified past papers, or a claimed prediction set.

The editor supports:

- Examination, subject, chapter, topic, levels 1-3 and separate importance 1-3.
- Two to four distinct options, zero-based correct index, marks.
- Plain-text question and explanation, memory trick, tags, source and verification.
- Optional HTTPS image URLs.
- Draft, published and archived status.
- Version history, duplication, bulk edits and restoration.

The editor uses safe multiline plain text rather than unsanitized rich HTML. Nepali Unicode is preserved. Publish only content you have checked.

## JSON schema

Use { "schemaVersion": 1, "questions": [...] } or a raw question array.
Every record needs:

id, exam, subject, chapter, topic, level, importance, question, options, correct, marks, status, verification.

Supported optional text/array fields:

explanation, trick, source, tags, image.

correct is zero-based: 0=A, 1=B, 2=C, 3=D.
status is draft/published/archived.
verification is practice/verified/past-paper; verified and past-paper require a source.

Import modes:

- Add new: existing IDs and stored text fingerprints are skipped.
- Update: only existing IDs are changed.
- Add or update: replaces the record identified by a stable ID.

Preview reports invalid rows and duplicates within the selected files. It shows the first 20 records while committing all valid records. Each commit is a transaction; it does not silently overwrite an existing ID in add-new mode. Cancelling a running import stops before the next record; committed records remain committed and appear in the downloaded summary. Retrying with add-new skips previously committed IDs.

Duplicate-text checks apply to fingerprints created by this application. A question inserted manually through Console without a fingerprint is still protected against an identical ID, but requires manual review for duplicate text.

CSV export is available. CSV import is not included. JSON exports round-trip with the importer.

## Student workflows

- Dashboard: real local/user activity, learning goal, streak, due reviews, recommendations and preparation counts.
- Library: examination/subject/chapter/topic/level/importance/status filters; loaded-page Unicode search; 30-row display increments and Firestore 100-record cursor pages.
- Study: answer reveal, option attempts, source, memory trick, font controls, bookmark, difficult flag, reset learning state, copy and reports.
- Revision: due, important, wrong, difficult, bookmarked, new, recent, random and recommended sequences.
- Exam day: subject/level/exam/time-focused revision.
- Recall: Again/Hard/Good/Easy update independent question schedules. Three successful scheduled reviews normally establish mastery; administrator can adjust this criterion.
- Tests: custom practice and published administrator sets, weighted question marks, optional negative marking, pass criteria, review marks, answer clearing and navigation palette.
- Recovery: question snapshots, selections and an absolute deadline persist in sessionStorage. Refresh or navigation does not restart the clock. Closing the tab may clear this storage.
- Results: marks, correct/wrong/skipped, accuracy, time, subject/topic/level analysis, comparison with a previous same-title attempt, full answer review, retry and print/save as PDF through the browser.
- Progress: activity chart, mastery by loaded subject, score trend and attempt history.
- Profile: examination target, daily goal, verification and a local progress JSON backup.
- Announcements: published in-app notices.

Guest records stay on the device. Signing in opens that account's separate progress store; guest activity is not automatically merged into an account.

Progress is written to individual documents, with a local pending journal for retries. Last completed cloud write wins for simultaneous changes to the same question on two devices; this is not a real-time collaborative merge.

## Administrator workflows

Question management, curriculum parent nodes, question-reference migration on rename/merge, mock-test creation/editing/archive, students/private progress, premium expiry and disabled access, quality-report resolution, announcements, site settings and an audit view.

Content removal is archival with restoration. There is deliberately no irreversible content delete button. Curriculum archival removes editor suggestions; it does not implicitly unpublish questions.

Premium access protects premium test definitions with Firestore Rules. The published study question bank remains public. This does not create a secret paid answer bank.

## Performance, counts and offline behaviour

- Initial shell does not wait for Firebase. Sample/cached study is usable after the local JSON load.
- Only published public questions are cached in IndexedDB. Administrator drafts are not put into the public cache.
- Question loading uses cursor pages. Search clearly covers loaded pages; use Load More to expand its scope. Firestore does not provide arbitrary full-text search in this implementation.
- Student progress/mastery denominators cover currently loaded published questions. The dashboard separately labels aggregate cloud counts.
- Administrator top-level totals are server count queries. Some detailed distributions cover loaded records and are labelled accordingly.
- User subcollections are read in cursor pages at sign-in; very large account histories need a future date-based retention/window policy.
- Local sample fallback is labelled. It does not pretend sample records are cloud database content.
- There is a web app manifest. Service-worker offline navigation and guaranteed PWA installation across all platforms are not included.

## Security and practical limits

- This is self-study software. All frontend answer keys are inspectable. Client-submitted scores and recall ratings are owner-controlled and not authoritative.
- Do not use these scores for prizes, admission or a trusted ranking. Strong integrity requires a trusted scoring service outside this frontend-only architecture.
- The supplied Rules enforce owner isolation, immutable admin provisioning, published-content visibility and validated writes. Run the manual access matrix below against a staging Firebase project before public launch.
- Admin audit entries and question history are append-only for clients. A project owner using Firebase Console still controls the database.
- No paid push notifications, external AI model, public leaderboard, rich HTML editor, direct binary-image upload or automated fact verification is claimed.
- Imports and migrations are bounded sequential operations. Large jobs consume document reads/writes; review the Firebase usage dashboard and your current plan's limits.
- Changing registration blocks new Firestore profile creation. To disable Firebase Auth signup itself, use the appropriate Firebase/project policy.
- A maintenance notice is an informational banner, not a security barrier.
- Browser storage can be cleared by the user/device. Back up important content and use signed-in syncing for progress.

## Deploy to GitHub Pages

Upload the CONTENTS of this folder to your repository root: index.html, style.css, script.js, modules/, assets/, data/ and manifest.webmanifest. Keep their relative paths unchanged. Enable GitHub Pages for your chosen branch/folder. Add the GitHub Pages hostname to Firebase Authentication's authorized domains.

The source archive also contains tests, docs and security configuration. Do not upload private credentials or service-account keys. The Firebase web configuration already in this app is client configuration, not a service-account key.

## Verification

Pure business tests:

node --test tests/domain.test.js

Syntax:

node --check script.js
node --check modules/domain.js
node --check modules/store.js
node --check modules/student.js
node --check modules/admin.js

Browser workflow checks:

Run the local server, install Playwright in a development environment, then run node scripts/browser-check.mjs. Set CHROME_EXECUTABLE if using an installed Chrome. PLAYWRIGHT_MODULE optionally points to Playwright's index.mjs. Admin browser checks use an in-memory repository; they never write to the live Firebase project.

Manual staging access matrix:

1. Guest: published questions readable; drafts and private profiles denied.
2. Student A: own profile/progress writable; Student B's profile/progress denied.
3. Student A: cannot create admins, modify access, publish questions or append audit logs.
4. Unverified console-provisioned admin: admin writes denied.
5. Verified console-provisioned admin: CRUD, imports, versions and audit writes allowed.
6. Non-premium student: premium test definitions denied.
7. Expired premium student: premium definitions denied; free tests available.
8. Disabled account: application private reads/writes denied.
9. Invalid schema, altered UID or extra fields: writes denied.
10. Completed attempt: owner cannot update or delete the stored attempt.

See qa/browser-results.json and QA.md for verification actually executed in this delivery. Live signup, rule compilation and cloud permission enforcement require access to the configured Firebase project and are not represented as tested merely because browser mocks passed.

## References

- https://firebase.google.com/docs/auth/web/password-auth
- https://firebase.google.com/docs/firestore/security/rules-conditions
- https://firebase.google.com/docs/firestore/query-data/aggregation-queries
- https://firebase.google.com/docs/reference/rules/rules.Timestamp
