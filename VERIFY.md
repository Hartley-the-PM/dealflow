# VERIFY.md — Post-Implementation Verification Protocol

> **Purpose:** Before marking any task, feature, or fix as complete, systematically work through every section below. Do not skip sections — if a section is not applicable, explicitly state why. This protocol exists to ensure all work is accurate, complete, scalable, and does not introduce tech debt.

---

## 1. Correctness & Accuracy

- [ ] All new and modified code executes without errors or warnings
- [ ] Existing test suites pass with no regressions
- [ ] New logic has corresponding test coverage at minimum:
  - Happy path (expected input → expected output)
  - At least one failure/edge case (bad input, missing data, boundary values)
- [ ] Database migrations (if any) have been tested both **up and down** and are fully reversible
- [ ] API contracts are correct and match consumer expectations:
  - Request schemas (required fields, types, validation rules)
  - Response schemas (shape, status codes, envelope format)
  - Error responses follow the project's established error format
- [ ] Any data transformations produce correct output across representative sample inputs
- [ ] Environment-specific behavior (dev, staging, prod) has been considered and does not break in any target environment

---

## 2. Completeness

- [ ] Every acceptance criterion from the original task/issue has been addressed — not just the obvious ones
- [ ] Types are fully defined:
  - No `any` (TypeScript) or `# type: ignore` (Python) unless justified with an inline comment explaining why
  - No implicit `Any` returns or untyped function signatures
- [ ] New environment variables, feature flags, or configuration values are:
  - Documented in the project's `.env.example` or config reference
  - Given sensible defaults where appropriate
- [ ] New dependencies are recorded in the appropriate manifest (`package.json`, `pyproject.toml`, `requirements.txt`, etc.)
- [ ] Public functions, classes, endpoints, and modules have docstrings/JSDoc explaining:
  - What it does
  - Parameters and return values
  - Any side effects
- [ ] If the change is user-facing:
  - Loading states are handled
  - Empty states are handled
  - Error states are handled and display meaningful feedback
  - Responsive/accessibility considerations have been addressed
- [ ] If the change is API-facing:
  - Rate limiting implications have been considered
  - Authentication and authorization are enforced
  - Input validation is present at the boundary

---

## 3. Scalability & Performance

- [ ] New database queries:
  - Have appropriate indexes for WHERE, JOIN, and ORDER BY clauses
  - Do not introduce N+1 query patterns
  - Use SELECT with specific columns rather than SELECT *
- [ ] List/collection endpoints support pagination (limit/offset or cursor-based)
- [ ] Background jobs and async operations are idempotent (safe to retry without side effects)
- [ ] Bulk operations use batching (batch inserts, bulk updates) rather than row-by-row processing
- [ ] New data models account for multi-tenancy where the architecture requires it
- [ ] Caching strategy has been considered for frequently-read, rarely-written data
- [ ] No unbounded loops, unbounded queries, or unbounded in-memory collections that grow with data volume
- [ ] File uploads or data imports have size limits and streaming where appropriate
- [ ] Time complexity of new algorithms is acceptable for expected data volumes

---

## 4. Tech Debt Prevention

- [ ] No `TODO`, `FIXME`, or `HACK` comments without a linked issue/ticket number
- [ ] New code follows existing patterns in the codebase:
  - If the repo uses a repository/service pattern, new data access goes through it — no raw queries in route handlers
  - If the repo uses dependency injection, new services are wired through it
  - If the repo has a middleware pipeline, cross-cutting concerns use it
- [ ] No duplicated logic:
  - If similar functionality exists, it has been extended or refactored into a shared utility
  - Copy-pasted blocks have been extracted into reusable functions
- [ ] Dependencies added are justified:
  - Not pulling in a library for a single utility function that could be written in < 20 lines
  - Library is actively maintained (check last publish date, open issues, bus factor)
  - License is compatible with the project
- [ ] No hardcoded values that should be configuration (URLs, thresholds, feature flags, magic numbers)
- [ ] No commented-out code left behind — if it's not needed, delete it; version control has history
- [ ] No dead code introduced (unused imports, unreachable branches, orphaned functions)

---

## 5. Architectural Consistency

- [ ] New files are placed in the correct directory per the project's established structure
- [ ] Naming conventions are consistent with the codebase:
  - File names (kebab-case, snake_case, PascalCase — match what's there)
  - Function and variable names follow the language/project convention
  - Database columns and tables follow the existing naming scheme
  - API route naming follows the established pattern (RESTful, versioned, etc.)
- [ ] Error handling follows the project's established approach:
  - Custom exception classes where the project uses them
  - Error middleware/handlers rather than inline try-catch-swallow
  - Errors are logged with sufficient context for debugging
- [ ] Logging uses the project's configured logger — no `print()`, `console.log()`, or ad-hoc logging
- [ ] Configuration access goes through the project's config layer — no direct `os.environ` or `process.env` scattered in business logic
- [ ] New modules/packages maintain the same separation of concerns as existing code

---

## 6. Security Baseline

- [ ] No secrets, API keys, tokens, or credentials in source code — all externalized to environment/secrets management
- [ ] User input is validated and sanitized at the API boundary before processing
- [ ] New endpoints enforce appropriate authentication and authorization
- [ ] Database queries use parameterized statements — no string interpolation or concatenation in SQL
- [ ] CORS configuration has been reviewed if new routes are added
- [ ] Rate limiting is applied to new public-facing endpoints
- [ ] Sensitive data (PII, financial info) is not logged or exposed in error responses
- [ ] File uploads (if any) validate file type, size, and content — not just the extension
- [ ] No new `eval()`, `exec()`, or dynamic code execution from user-supplied input

---

## 7. Implementation Summary

> **Complete this section after all checklist items above are verified.** This summary serves as the living documentation of what was just built, how it works, and what it depends on. Write it so that a developer picking up this codebase in 6 months can understand the implementation without reading every line of code.

### 7a. User Experience

Describe the end-to-end user experience introduced or modified by this implementation:

- **What does the user see or interact with?**
  _(Screens, endpoints, commands, notifications, or background behaviors)_
- **What triggers this functionality?**
  _(User action, scheduled job, external webhook, system event)_
- **What feedback does the user receive?**
  _(Success confirmation, error messages, loading indicators, status updates)_
- **What edge cases might a user encounter?**
  _(Empty states, permission denials, rate limits, timeouts, partial failures)_

### 7b. Data Flow

Describe the complete path data takes through the system for this implementation:

- **Entry point:** Where does data enter the system?
  _(API endpoint, form submission, webhook, message queue, cron trigger)_
- **Validation & transformation:** What happens to the data before processing?
  _(Schema validation, sanitization, normalization, enrichment)_
- **Processing:** What business logic is applied?
  _(Calculations, state transitions, external service calls, AI/ML operations)_
- **Persistence:** Where and how is data stored?
  _(Database tables, cache layers, file storage, external services)_
- **Output:** How does processed data leave the system?
  _(API response, event emission, notification, report generation, UI update)_

### 7c. Dependencies

List every dependency this implementation relies on — internal and external:

- **Internal services:** Other modules, packages, or microservices this code calls
- **External services:** Third-party APIs, SaaS platforms, or infrastructure services (with failure behavior noted)
- **Database objects:** Tables, indexes, views, functions, or migrations introduced or modified
- **Environment/config:** New environment variables, feature flags, or configuration values required
- **Libraries:** New packages added, with version and purpose
- **Infrastructure:** Any new infrastructure requirements (queues, caches, workers, storage buckets)

---

> **Final gate:** If any checklist item above is unchecked without a documented justification, the task is **not complete**. Return to the failing section and resolve it before proceeding.
