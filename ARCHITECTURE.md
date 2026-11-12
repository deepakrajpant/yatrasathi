# Sajilo GK architecture

Buildless ES modules, static GitHub Pages hosting, Firebase Authentication and Firestore. No Cloud Functions.

Navigation: Dashboard / Library / Study / Revision / Exam Day / Mock Tests / Results / Progress / Bookmarks / Profile / Announcements.
Admin: Overview / Questions / Import and Export / Curriculum / Test Builder / Students / Reports / Announcements / Settings / Audit.

Modules: domain.js (validation, dates, recall, scoring); store.js (IndexedDB, user-scoped local journal, Firebase repository); student.js (learning, revision, recoverable tests and analytics); admin.js (content CRUD, transactional imports and management); script.js (routing, authentication and shell).

Collections: admins/{uid} (console-provisioned, client-immutable); users/{uid} (owner profile); access/{uid} (admin-controlled disabled/premiumUntil); curriculum/{id}; questions/{id}; questionVersions/{id}; mockTests/{id}; questionReports/{id}; announcements/{id}; appSettings/public; adminAuditLogs/{id}.

Student subcollections: questionProgress/{questionId}, testAttempts/{attemptId}, studySessions/{sessionId}. No whole-bank arrays in user documents.

Firestore Rules enforce user isolation and administrator membership from admins/{uid}. Administrator writes require verified email. User-editable profile roles are never trusted.

Viewed/revealed is separate from attempted and mastered. Mastery requires three successful scheduled reviews. Lightweight recall scheduler: Again=10 minutes, Hard=1 day, Good=1/3/7/... days, Easy=4/10/... days. This is deterministic scheduling, not machine learning.

Question pages use Firestore cursors and 100-record pages cached in IndexedDB. Search explicitly covers loaded pages; Load More expands search without repeating earlier reads. Aggregate counts use server queries. No fake full-bank totals.

Question edits atomically save the previous revision and audit event. Imports validate before writing and use per-record transactions with explicit modes, failures and stable IDs. Cancel stops before the next transaction; committed records remain listed.

Assessments are self-study: client-side answer keys are inspectable and owner scores are not authoritative. Secure high-stakes scoring requires a trusted backend. Premium gating controls test definitions, not the public study bank.

Pure validation, scheduling and scoring tests run with Node. Live Firebase workflows and browser QA are separately reported. Downloading does not deploy rules or change the live project.
