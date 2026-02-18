# FC26 Career Tracker Backend

This document covers what has been implemented in `backend/` so far.

## 1) Implemented Stack

- Runtime: Node.js (CommonJS)
- Framework: Express 4
- ORM: Prisma 5 + PostgreSQL
- Auth: JWT access/refresh with DB-backed refresh token hashing
- Validation: Zod
- Logging: pino + pino-pretty (dev)
- Security: helmet, CORS, cookie-parser, express-rate-limit
- API Docs: swagger-jsdoc + swagger-ui-express

## 2) Implemented Folder Structure

```txt
backend/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   │   ├── env.js
│   │   ├── logger.js
│   │   ├── database.js
│   │   └── swagger.js
│   ├── middlewares/
│   │   ├── auth.js
│   │   ├── error.js
│   │   ├── rateLimit.js
│   │   └── validate.js
│   ├── utils/
│   │   ├── jwt.js
│   │   ├── response.js
│   │   ├── pagination.js
│   │   └── helpers.js
│   └── modules/
│       ├── auth/
│       ├── users/
│       ├── careers/
│       ├── matches/
│       ├── seasons/
│       ├── skills/
│       ├── transfers/
│       ├── profile/
│       └── sync/
├── .env
├── .env.example
└── package.json
```

## 3) Environment + Scripts

Configured in:

- `backend/.env`
- `backend/.env.example`
- `backend/src/config/env.js`

NPM scripts in `backend/package.json`:

- `npm run dev`
- `npm start`
- `npm test`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:studio`

## 4) Prisma Schema Coverage

Implemented in `backend/prisma/schema.prisma`.

### Enums implemented

- `Position`
- `PreferredFoot`
- `Competition`
- `Stage` (`NA`, `RoundOf16`, etc. for frontend compatibility mapping)
- `ManagerTrust`
- `SkillCategory` (`WeakFoot`, `SkillMoves` mapped from frontend labels)
- `SuspensionType`
- `PressTag`
- `OfferStatus`
- `RoleType`
- `TrainingGrade`

### Models implemented

- `User`, `Token`
- `Career`
- `Match`
- `Trophy`, `SeasonChallenge`, `NarrativeTag`
- `SkillSpend`, `AttributeTarget`, `ArchetypeStage`, `TrainingLog`
- `TransferOffer`, `Contract`, `AgentNote`
- `InjuryLog`, `Suspension`, `PressNote`, `Achievement`

Cascade delete relationships are configured from `User -> Career -> child resources`.

## 5) Auth + Session Implementation

Implemented in `backend/src/modules/auth/*` plus shared utils.

- Access token: signed JWT (`sub`, `type=access`)
- Refresh token: signed JWT (`sub`, `type=refresh`)
- Refresh token hash stored in DB (`Token.tokenHash`) using SHA-256
- Refresh rotation implemented
- Refresh reuse handling implemented (token missing/invalid in DB causes user token cleanup and 401)
- Refresh token delivered via HttpOnly cookie (`/api/auth/refresh` path)

## 6) Route Wiring Implemented

Mounted in `backend/src/app.js`.

### Core

- `GET /api/health`
- `GET /api/docs`

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

### Users

- `GET /api/users/me`
- `PATCH /api/users/me`
- `DELETE /api/users/me`

### Careers

- `GET /api/careers`
- `POST /api/careers`
- `GET /api/careers/:id`
- `PATCH /api/careers/:id`
- `DELETE /api/careers/:id`
- `POST /api/careers/:id/activate`

### Matches

- `GET /api/careers/:careerId/matches`
- `POST /api/careers/:careerId/matches`
- `GET /api/careers/:careerId/matches/:id`
- `PATCH /api/careers/:careerId/matches/:id`
- `DELETE /api/careers/:careerId/matches/:id`
- `POST /api/careers/:careerId/matches/:id/pin`

### Seasons

- `GET/POST /api/careers/:careerId/trophies`
- `DELETE /api/careers/:careerId/trophies/:id`
- `GET/POST /api/careers/:careerId/challenges`
- `PATCH/DELETE /api/careers/:careerId/challenges/:id`
- `GET/POST /api/careers/:careerId/narrative-tags`
- `DELETE /api/careers/:careerId/narrative-tags/:id`

### Skills

- `GET/POST /api/careers/:careerId/skill-spends`
- `DELETE /api/careers/:careerId/skill-spends/:id`
- `GET/POST /api/careers/:careerId/attribute-targets`
- `PATCH/DELETE /api/careers/:careerId/attribute-targets/:id`
- `GET /api/careers/:careerId/archetype-stage`
- `PUT /api/careers/:careerId/archetype-stage`
- `GET/POST /api/careers/:careerId/training-logs`
- `DELETE /api/careers/:careerId/training-logs/:id`

### Transfers

- `GET/POST /api/careers/:careerId/offers`
- `PATCH/DELETE /api/careers/:careerId/offers/:id`
- `GET/POST /api/careers/:careerId/contracts`
- `DELETE /api/careers/:careerId/contracts/:id`
- `GET/POST /api/careers/:careerId/agent-notes`
- `DELETE /api/careers/:careerId/agent-notes/:id`

### Profile

- `GET/POST /api/careers/:careerId/injuries`
- `PATCH/DELETE /api/careers/:careerId/injuries/:id`
- `GET/POST /api/careers/:careerId/suspensions`
- `DELETE /api/careers/:careerId/suspensions/:id`
- `GET/POST /api/careers/:careerId/press-notes`
- `DELETE /api/careers/:careerId/press-notes/:id`
- `GET /api/careers/:careerId/achievements`
- `POST /api/careers/:careerId/achievements`
- `PATCH /api/careers/:careerId/achievements/:id`

### Sync

- `POST /api/sync/import`
- `GET /api/sync/export/:careerId`

## 7) Sync Compatibility Work Implemented

Implemented in `backend/src/modules/sync/*`.

- Import accepts frontend-compatible payload structure plus `saveName`
- Import maps:
  - stage strings (`"N/A"`, `"Round of 16"`, etc.) -> Prisma enum values
  - skill category labels (`"Weak Foot"`, `"Skill Moves"`) -> Prisma enum values
  - `ovrAfter/spAfter` empty string -> `null`
- Export maps back to frontend labels and empty-string compatibility for nullable fields
- Export includes `exportedAt` and `version`

## 8) Security + Error Handling

Implemented in middleware layer:

- `helmet` headers
- CORS with credentials
- Rate limiters (general + auth-specific)
- Bearer auth middleware
- Zod validation middleware
- Centralized error handler with:
  - custom `AppError`
  - Prisma error handling (`P2002`, `P2025`)
  - Zod validation handling

## 9) Current Status / Remaining Work

What is already done:

- Backend scaffold
- Prisma schema
- Main modules and route handlers
- Sync module
- App/server wiring

What is not yet done:

- Automated test suite files under `backend/tests/`
- Swagger endpoint-level operation docs (routes are mounted; operation docs can be expanded)
- Runtime verification steps (`npm install`, migrations, dev run, API smoke tests) still need to be executed locally

## 10) Quick Start

From project root:

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Then verify:

- `GET http://localhost:8080/api/health`
- `GET http://localhost:8080/api/docs`
