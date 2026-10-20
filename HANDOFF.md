# GooseJobs — Session Handoff

_Last updated: 2026-09-27._

## How to run

Backend (from `Goose_Job_AI/`, venv at `myenv/`):
```
myenv/Scripts/python.exe -m uvicorn api:app --reload --port 8000
```
Frontend (from `Goose_Job_UI/`):
```
npx next dev --webpack --port 3005
```

## Route map

| URL | What it is |
|-----|-----------|
| `/` | Landing page (public) |
| `/workspace` | Main workspace — requires auth (`gj_token` JWT or `gj_access` code cookie) |
| `/demo` | Request demo access form — sends email to owner, no instant access |
| `/enter` | Access-code gate → `/workspace`. Add `?mode=demo` to seed demo data on success |
| `/enter?mode=demo` | Same gate but seeds 15 pre-loaded demo jobs into localStorage on success |
| `/login` | JWT sign-in page |
| `/register` | JWT register page → `/onboarding` |
| `/onboarding` | Setup flow → `/workspace` |
| `/job-tracker/[id]` | Individual job detail |

## Auth model (current)

Two auth paths coexist:
- **Legacy** — `ACCESS_CODE` env var + `gj_access` cookie. Set in `.env.local`, currently `goose2026`.
- **JWT (Phase 3)** — register/login via `/auth/*` backend endpoints, `gj_token` + `gj_refresh` httpOnly cookies.

`proxy.ts` accepts either. If `ACCESS_CODE` is unset, everything is open (local dev).

## Demo flow

1. Visitor clicks "Request demo access" on landing → fills form at `/demo`
2. Server emails **kadriemna97@gmail.com** with their name + email (via `mourad46327@gmail.com` SMTP)
3. Owner replies manually with the access code (`goose2026`)
4. Visitor enters code at `/enter?mode=demo` → demo data seeded → workspace opens

**SMTP setup required** — open `.env.local`, replace `<paste-app-password-here>` with a Gmail App Password for `mourad46327@gmail.com` (generate at myaccount.google.com/apppasswords). Until then, requests log to server stdout only.

## What was done (this session, 2026-09-24 → 2026-09-27)

### Demo gate
- `/demo` replaced with a "Request demo access" form (name + email + optional message)
- `app/api/request-demo/route.ts` — sends notification email via nodemailer, falls back to console log
- `proxy.ts` updated — JWT + legacy access code both accepted; `middleware.ts` deleted (deprecated in Next.js 16.3, replaced by `proxy.ts`)
- `/enter?mode=demo` seeds demo localStorage on successful code entry

### Phase 0 — Cleanup ✅
- Deleted dead `job_finder/main_flow.py`
- Deleted `emoji_hits.txt`
- Confirmed no stray `node_modules` in Python repo

### Phase 3 — JWT Auth ✅ (core done)
**Backend:**
- `User` model added to `job_finder/db/models.py` (id, email, hashed_password, email_verified, plan, stripe_customer_id)
- Alembic migration `b4c5d6e7f8a9_phase3_users_table.py` — ran, `users` table is live
- `job_finder/services/auth_service.py` — bcrypt hashing, JWT creation/verification, `get_current_user` dependency
- New endpoints in `api.py`: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`
- `JWT_SECRET` added to `Goose_Job_AI/.env`
- Packages installed: `python-jose[cryptography]`, `passlib[bcrypt]`, `slowapi`

**Frontend:**
- `app/login/page.tsx` — sign-in form
- `app/register/page.tsx` — register + confirm password form
- `app/api/auth-backend/[...path]/route.ts` — proxies `/api/auth-backend/*` → FastAPI `/auth/*`, relays Set-Cookie
- Landing page nav: Sign in → `/login`, Register → `/register`

---

## TODO — remaining phases

### 🔴 SMTP setup (immediate, manual)
Replace `<paste-app-password-here>` in `.env.local` with the Gmail App Password for `mourad46327@gmail.com`.

### 🔴 Phase 3 — remaining JWT work
The JWT endpoints exist but the existing data endpoints (`/jobs/`, `/resume/`, `/generate/*`, `/find-jobs/stream/`) still use the old `x-session-id` header path. Full Phase 3 requires:
- [ ] Repoint `Resume` and `SavedJob` FK from `session_id` → `user_id` (Alembic migration)
- [ ] All data endpoints check `get_current_user` and filter by `user_id`
- [ ] Remove the `x-session-id` trust path (closes IDOR)
- [ ] Frontend proxy routes forward `gj_token` cookie to backend instead of `x-session-id`
- [ ] Rate limiting (slowapi) on auth + expensive endpoints
- [ ] CORS locked to known origins (update `ALLOWED_ORIGINS` env var in backend)
- [ ] Forgot-password flow (needs transactional email — see Phase 8)

### 🟡 Phase 4 — Stripe billing
- [ ] Stripe Products + Prices (free / pro tiers)
- [ ] `/billing/{checkout-session, portal-session, webhook}` endpoints
- [ ] Quota enforcement on `/find-jobs/` and `/generate/*`
- [ ] Pricing page + upgrade CTA in workspace settings panel

### 🟡 Phase 5 — Feature build-out
Existing generation endpoints (5A–5D) work but need Workstream L polish:
- [ ] Wrap all 5 Gemini endpoints in structured-output + retry layer (`job_finder/services/llm/`)
- [ ] "Don't invent skills" faithfulness guardrail
- [ ] Per-call token/cost logging to `generations` table
- New features (paywalled, after Phase 4):
- [ ] 5E Career Path Explorer (needs web grounding + citations)
- [ ] 5F Application Tracker + Success Predictor (needs Workstream D outcomes)
- [ ] 5G Salary & Negotiation Coach (needs salary data + citations)
- [ ] 5H Skill-Building Recommender

### 🟡 Phase 6 — Data flywheel & performance
- [ ] Background job queue (Celery/RQ + Redis) for long searches
- [ ] Result caching for repeated queries
- [ ] Per-provider circuit breakers
- [ ] Retrain bi/cross-encoders on real user outcome data

### 🟡 Phase 7 — Compliance & legal
- [ ] Account deletion cascade (all user data)
- [ ] Data export endpoint
- [ ] ToS + Privacy Policy pages
- [ ] Training data opt-in consent flow

### 🟡 Phase 8 — SaaS polish
- [ ] Transactional email (Resend/Postmark) for verify-email + password reset
- [ ] `package.json` name → "goosejobs" (currently "my-v0-project")
- [ ] OG image for social sharing
- [ ] Privacy-friendly analytics (PostHog)

---

## Key gotchas

- **Turbopack disabled** — always use `--webpack` flag.
- **Gemini quota exhausted (429)** — generation falls back gracefully (no error shown to user).
- **CORS is still `*`** — lock in Phase 3 remaining work (`ALLOWED_ORIGINS` env var).
- **JWT endpoints exist but data endpoints still use session_id** — demo + existing users unaffected; new JWT-registered users won't see their server-side data yet until Phase 3 repoint is done.
- Nothing pushed to any remote yet — all commits are local on `main`.
