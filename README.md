# Banking Automation Framework

Multi-bank (multi-FI) test automation built with **Playwright + JavaScript**, **Page Object Model**,
per-bank config/data, **Vault-style secrets**, and **Jenkins / GitHub Actions** execution.
Demo target: [ParaBank](https://parabank.parasoft.com/parabank/) (public demo bank).

It mirrors the implementation-team model: many banks, same core product, each bank different in
URLs, data and enabled features.

## Quick start

```bash
npm ci
npx playwright install chromium
BANK=demo-retail-bank npx playwright test               # everything this bank supports
BANK=demo-retail-bank SUITE=smoke npx playwright test   # tagged subset
npm run report                                          # open HTML report
```
Windows PowerShell: `$env:BANK='demo-retail-bank'; npx playwright test`
(or copy `.env.example` to `.env`).

## Architecture

```
banks/<bank>/            everything that differs per FI
   bank.json             segment + enabled features  -> decides which test folders run
   env.json              URLs, production flag
   data.json             test data (penny amounts, payee, profile ...)
pages/                   one Page Object per digital-banking page
tests/<feature>/         specs grouped by banking feature (auth, accounts, transfers, billpay, loans)
lib/
   bank-context.js       loads the selected bank, production approval guard
   vault.js              Vault KV v2 -> env vars -> (demo) provisioning
   global-setup.js       resolve creds, log in once, save session + account ids
   fixtures.js           `bank`, `session` and page-object fixtures
scripts/new-bank.js      scaffold a new FI folder
Jenkinsfile / .github/workflows/ci.yml / browserstack.yml
```

**One run = one bank.** `BANK` picks the folder; `playwright.config.js` builds `testMatch` from
that bank's `features`, so a commercial bank without loans never even collects the loan specs.
`SUITE` (`build | sit | smoke`) filters by tag (`@build`, `@sit`, `@smoke`):

| Suite | Used for |
|-------|----------|
| `build` | verify a freshly built FI environment |
| `sit`   | full system test before go-live |
| `smoke` | quick check after a DB / digital banking upgrade |

### Execution flow
1. Config loads the bank (`env.json`, `data.json`, `bank.json`).
2. **Global setup** gets credentials (Vault -> env -> provision demo user), logs in once and writes
   `.auth/<bank>/state.json` (session) and `run.json` (user + account ids).
3. Specs reuse the saved session (login specs opt out) and use fixtures instead of globals.
4. Reports: HTML, JUnit XML, traces / screenshots / video on failure -> `reports/<bank>/`.

### Safety model (real FIs ran against production)
- `env.json` `"production": true` makes the framework **refuse to run** without `APPROVED_BY`.
  Jenkins sets it from an `input` step restricted to approvers.
- Transfers and payments use **penny amounts** from `data.json`.
- Credentials never live in the repo.
- No scheduled production runs: production runs are manual and require an approver. Only demo banks run automatically in GitHub Actions.

## Adding a bank
```bash
npm run new-bank -- acme-cu retail https://acme.example.com/online/
# edit banks/acme-cu/env.json + data.json, put creds in Vault at secret/banks/acme-cu
BANK=acme-cu SUITE=build npx playwright test
```

## CI/CD
- **Jenkinsfile**: parameters `BANK`, `SUITE`, `BROWSERSTACK`, `PRODUCTION`; approval gate, Playwright
  Docker agent, Vault token via Jenkins credentials, JUnit + HTML report publishing.
- **GitHub Actions** (`.github/workflows/ci.yml`): config validation and automatic smoke matrix for demo banks on pushes, pull requests, and a weekly schedule. Use **Actions → Banking automation → Run workflow** for a manual bank/suite run; provide `approved_by` for production banks. Configure repository secrets `VAULT_ADDR` and `VAULT_TOKEN` (plus optional `VAULT_MOUNT` / `VAULT_NAMESPACE`) or `BANK_USERNAME` / `BANK_PASSWORD` for real-bank credentials. Reports are uploaded as workflow artifacts.
- **BrowserStack**: `BROWSERSTACK=true` in Jenkins runs `browserstack-node-sdk playwright test`
  with `browserstack.yml`.

## Verified vs not verified
- Verified locally: both demo banks run green (retail 10/10, commercial smoke 4/4), bank-driven
  feature selection, tag filtering, new-bank scaffolding, production approval guard.
- Not executed here (no server/credentials): Jenkinsfile, GitHub Actions workflow, BrowserStack run, real Vault
  lookup. Docker image tag `v1.64.1-noble` should be confirmed against the Playwright release.
- The demo site is shared and public: it can be slow or reject a registration (setup retries 3x).

## Interview talking points

**Design decisions**
- *Why per-bank config instead of per-bank test copies?* In production we copied tests into each bank
  folder/branch; that drifts across 20-30 FIs. Here tests are shared and only config differs.
- *Why storageState in global setup?* Logging in via UI before every test is slow and noisy; login is
  still covered by dedicated specs that opt out of the saved session.
- *Why tags + feature folders?* Two independent axes: **what the bank has** (features) and
  **why we are running** (build / SIT / smoke).
- *Why POM?* UI changes (nav, verbiage, locators) are fixed in one page file for all banks.

**Handling flakiness**: web-first assertions (auto-wait), locators by role/id, serial mode only where
state is shared (transfers), 1 retry in CI with trace/video retained for triage.

**What stays manual**: Okta-protected bank-office flows (MFA) and highly bank-specific configuration
checks, where maintenance cost exceeds automation value.

**Improvements to mention**: contract/API checks alongside UI, visual checks for config-app
changes (logos/nav/verbiage), centralized cross-bank dashboard, locator health checks.
