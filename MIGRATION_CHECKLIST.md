# 🏗️ Seashell Monorepo Migration Checklist

> **Started:** 2026-01-20  
> **Branch:** `refactor/monorepo-setup`  
> **Status:** 🟡 In Progress

This document tracks the progress of migrating Seashell from a flat repository structure to a clean, professional monorepo setup.

---

## 📋 Migration Progress

### 🪜 Stage 1: Prep & Safety ✅

> Goal: Clean up the repository without breaking anything

- [x] **1.1** Create branch `refactor/monorepo-setup`
- [x] **1.2** Update `.gitignore` (add `.next/`, `*.zip`)
- [x] **1.3** Delete `menu-app-update.zip`
- [x] **1.4** Delete `menu-app-update/` folder (entire directory)
- [x] **1.5** Organize documentation files into `docs/` folder
- [x] **1.6** Commit: `chore: cleanup redundant files and organize docs`

### 🪜 Stage 2: Organize Repo Structure ✅

> Goal: Move apps into a consistent structure

- [x] **2.1** Create `apps/` directory
- [x] **2.2** Move `Seashell-Menu-App/` → `apps/menu-app/`
- [x] **2.3** Move `Seashell-Management-App/` → `apps/management-app/`
- [x] **2.4** Move `Seashell-Housekeeping-App/` → `apps/housekeeping-app/`
- [x] **2.5** Move `Seashell-Housekeeping-Management-App/` → `apps/housekeeping-management-app/`
- [x] **2.6** Test each app individually:
  - [x] `apps/menu-app`: `npm run dev` ✓
  - [x] `apps/management-app`: `npm run dev` ✓
  - [x] `apps/housekeeping-app`: `npm run dev` ✓
  - [x] `apps/housekeeping-management-app`: `npm run dev` ✓
- [x] **2.7** Delete old app folders (Seashell-\*) ✓
- [x] **2.8** Commit: `refactor: move apps to apps/ directory`

### 🪜 Stage 3: Introduce Monorepo Tooling ✅

> Goal: Set up Turborepo for unified builds and shared packages

- [x] **3.1** Create root `package.json` with npm workspaces
- [x] **3.2** Create `packages/` directory structure:
  - [x] `packages/ui/` → Shared UI components
  - [x] `packages/utils/` → Helper functions
  - [x] `packages/config/` → Firebase & env configs
- [x] **3.3** Install and configure Turborepo (`turbo.json`)
- [x] **3.4** Create shared `tsconfig.base.json`
- [x] **3.5** Extract shared Firebase config to `packages/config`
- [x] **3.6** Test all apps with `npx turbo run dev`
- [x] **3.7** Commit: `feat: add turborepo monorepo configuration`

### 🪜 Stage 4: CI/CD & Documentation

> Goal: Add automation and documentation

- [ ] **4.1** Add `.github/workflows/ci.yml` (lint, test, build)
- [ ] **4.2** Add `.github/workflows/deploy.yml` (Firebase deploy)
- [ ] **4.3** Create root `README.md` with:
  - [ ] Project overview
  - [ ] Repository structure diagram
  - [ ] Setup instructions
  - [ ] Links to app READMEs
- [ ] **4.4** Add screenshots/GIFs to `docs/assets/`
- [ ] **4.5** Commit: `docs: add ci/cd workflows and documentation`

### 🪜 Stage 5: Polish & Release

> Goal: Final touches for a client-ready repo

- [ ] **5.1** Set up GitHub Releases workflow
- [ ] **5.2** Add `CHANGELOG.md` with semantic versioning
- [ ] **5.3** Add `CONTRIBUTING.md` with contribution guidelines
- [ ] **5.4** Final review and cleanup
- [ ] **5.5** Merge to `main`

---

## 📁 Target Repository Structure

```
Seashell/
├── apps/
│   ├── menu-app/              # Customer-facing menu (Vite + React)
│   ├── management-app/        # Admin dashboard (Vite + React)
│   ├── housekeeping-app/      # Housekeeping requests (Vite + React)
│   └── housekeeping-management-app/  # Housekeeping admin
│
├── packages/
│   ├── ui/                    # Shared UI components
│   ├── utils/                 # Shared utilities
│   └── config/                # Firebase & env configuration
│
├── scripts/                   # Database seeding & maintenance scripts
│   └── seeds/
│
├── docs/                      # Documentation & guides
│   ├── assets/                # Screenshots, GIFs
│   ├── BREAKFAST_INTEGRATION.md
│   ├── DEPLOYMENT.md
│   ├── HESABE_INTEGRATION.md
│   └── ...
│
├── .github/
│   └── workflows/             # CI/CD pipelines
│
├── turbo.json                 # Turborepo configuration
├── package.json               # Root workspace config
├── tsconfig.base.json         # Shared TypeScript config
├── firebase.json              # Firebase hosting config
├── firestore.rules            # Firestore security rules
├── README.md                  # Main project documentation
├── CHANGELOG.md               # Version history
└── MIGRATION_CHECKLIST.md     # This file
```

---

## 📝 Notes & Decisions

### Documentation Files to Organize

The following files at the root will be moved to `docs/`:

- `BREAKFAST_INTEGRATION_SUMMARY.md` → `docs/BREAKFAST_INTEGRATION.md`
- `BREAKFAST_SEEDING_INSTRUCTIONS.md` → `docs/BREAKFAST_SEEDING.md`
- `DEPLOYMENT.md` → `docs/DEPLOYMENT.md`
- `HESABE_INTEGRATION_PLAN.md` → `docs/HESABE_INTEGRATION.md`
- `MULTI_MENU_IMPLEMENTATION.md` → `docs/MULTI_MENU_IMPLEMENTATION.md`
- `NOTIFICATION_SYSTEM_UPDATE.md` → `docs/NOTIFICATION_SYSTEM.md`

### Key Dependencies (Shared Across Apps)

| Package      | Version  | Used By                                               |
| ------------ | -------- | ----------------------------------------------------- |
| firebase     | ^12.6.0  | menu-app, management-app, housekeeping-management-app |
| react        | ^19.x    | All apps                                              |
| lucide-react | ^0.554.0 | All apps                                              |
| vite         | ^6.2.0   | All apps                                              |

### Tooling Choice: Turborepo

- Lightweight and fast
- Native Vite support
- Simple configuration
- Perfect for our 4-app setup

---

## 🔄 Resume Instructions

If the migration is interrupted, follow these steps to resume:

1. Check which items are marked as `[x]` (completed)
2. Run `git status` to see uncommitted changes
3. Continue from the first unchecked item
4. Test affected apps before committing

---

_Last Updated: 2026-01-20 21:18 EAT_
