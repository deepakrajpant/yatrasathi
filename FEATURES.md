# Delivered scope

| Area | Implemented |
| --- | --- |
| Authentication | Email signup/login/logout/reset, verification, private user records |
| Student dashboard | Actual loaded-content progress, goal, streak, due count, recent score, recommendations |
| Content hierarchy | Exam, subject, chapter, topic; separate level and importance |
| Study | MCQ attempts, flashcard reveal, explanation, trick, source, bookmark, difficult state, copy, report, font controls, keyboard navigation |
| Revision | Important, wrong, difficult, saved, unlearned, due, recent, random, recommendations; exam-day timed sequence |
| Scheduling | Independent deterministic recall schedule and scheduled-review mastery |
| Tests | Custom and administrator sets, weights, negative marking, pass threshold, palette, flags, answers, absolute timer, refresh recovery |
| Results | Question snapshots, scoring, subgroup analysis, accuracy, elapsed time, previous attempt comparison, retry, JSON export, browser print/PDF |
| Progress | Actual activity/streak, loaded subject mastery, recent score chart, saved attempts |
| Administrator | Protected dashboard, server counts, question CRUD via archive/restore, history, duplication, bulk changes |
| Import | Multiple JSON files, drop zone, validation, duplicates, preview, explicit modes, transactional writes, cancel, summaries/error download |
| Export | All pages, status/level/subject/topic filters, selected JSON, JSON and CSV |
| Curriculum | Create, rename, reorder, merge references, archive/restore |
| Test builder | Exact IDs, random loaded-question selection, timer, marks, negative rate, pass criteria, premium flag, draft/publish/archive |
| Students | Search paginated profiles, private progress/attempt summaries, premium expiry, disabled access |
| Quality | Student reports, administrator correction workflow and resolution |
| Communications | Published in-app notices |
| Settings | Title, welcome, primary colour, mastery threshold, registration profile policy, informational maintenance notice |
| Storage/performance | Module structure, IndexedDB public bank cache, private local journals, Firestore cursor pages, aggregate totals |
| Security files | Owner/admin rules, validated writes, admin provisioning, premium test-definition restrictions and indexes |
| Verification | Pure tests and isolated browser workflows; see QA.md |

## Explicit boundaries

The delivered bank is 24 samples, not an exam syllabus. Arbitrary full-text search covers loaded pages. The editor accepts safe plain text, not WYSIWYG HTML. Exams are self-study, not trusted secure assessments. No direct image upload, paid push service, external AI, trusted leaderboard or deployed live-project rules are claimed. The web manifest is supplied; service-worker offline navigation is not.

Live Firebase signup, Rules compilation and authorization are deployment checks, not equivalent to passing isolated browser mocks. README.md includes the exact staging access matrix.
