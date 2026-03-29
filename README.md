# HealthLearn Mini

HealthLearn is a platform for delivering engaging, mobile-optimised online learning to health workers.

Health workers use the frontend (`front/`) to complete *courses*. Each course contains *modules*, and each module is a sequence of *cards*. Every card presents content and an *interaction* — either a multiple-choice question or a simple next button. Completing an interaction generates an *event*, recorded by the backend (`haven/`). Administrators use pages under `/admin` to manage courses, modules, and cards.

Note: This is a stripped-down version of the real HealthLearn application, with many shortcuts and hacks for the purpose of this exercise.

## Stack

- Front: Frontend built with Next.js 15, React 19, Tailwind CSS, TypeScript
- Haven: API built with NestJS 11, TypeScript
- Database: PostgreSQL 14 via Prisma ORM
- Shared types: `haven/src/hl-common/` — symlinked into `front/hl-common`

## Getting started

**Prerequisites:** Docker, Node 20+.

**1. Install dependencies** — the Yarn release is checked in, so no Corepack setup is needed:

```bash
yarn install
```

**2. Hosts** — add these entries to `/etc/hosts` so the local domains resolve:

```
127.0.0.1 front.hl.local haven.hl.local
```

**3. Start the stack:**

```bash
cp .env.example .env
yarn start -d        # builds and starts haven + front + postgres in detached mode
```

The containers run `yarn install` on first boot. Wait for haven before seeding:

```bash
yarn logs:haven     # follow haven logs — wait until you see "application successfully started"
yarn seed           # runs prisma migrate deploy + seeds the database
```

**4. Generate the Prisma client for the frontend:**

```bash
bash scripts/prisma-generate.sh
```

Re-run this script any time the Prisma schema changes.

**5. Access the application:**

- Frontend: http://front.hl.local:3000
- API: http://haven.hl.local:2337/api

## Seeded accounts

| Phone | Role | Name |
|-------|------|------|
| `+2349876543210` | Learner | Amara Nwosu |
| `+2341234567890` | Admin | Admin User |

OTP codes are printed to the haven container logs — no SMS is sent:

```bash
yarn logs:haven
```

## Key commands

```bash
yarn haven test <glob>     # run haven unit tests
yarn front test <glob>     # run front unit tests
yarn haven tsc             # type-check haven
yarn front tsc             # type-check front
yarn logs:haven            # follow haven logs
yarn logs:front            # follow front logs
yarn format                # format all code with Biome
yarn migrate dev --name x  # create a new Prisma migration
yarn prisma-generate       # re-generate the Prisma client
yarn psql                  # open a psql shell in the postgres container
```

## Project structure

```
├── docker-compose.yaml
├── .env.example
├── package.json            # root scripts
├── haven/                  # NestJS 11 backend
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   └── src/
│       ├── hl-common/      # shared types & API definitions (symlinked into front/)
│       ├── authentication/
│       ├── courses/
│       ├── modules/
│       ├── cards/
│       └── events/
└── front/                  # Next.js 15 frontend
    ├── hl-common -> ../haven/src/hl-common
    ├── app/
    │   ├── (auth)/         # login / otp / register
    │   └── (with_user)/
    │       ├── courses/    # learner-facing pages
    │       └── admin/      # admin CRUD pages
    ├── components/
    └── utils/
```

## Your assignment

[Task](./TASK.md)

