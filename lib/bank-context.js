const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BANKS_DIR = path.join(ROOT, 'banks');

function listBanks() {
  return fs
    .readdirSync(BANKS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(BANKS_DIR, d.name, 'bank.json')))
    .map((d) => d.name);
}

/**
 * Loads everything that makes one FI different from another:
 *   bank.json  - segment + enabled features (drives which suites run)
 *   env.json   - URLs for that FI
 *   data.json  - test data (amounts, payee, registration profile ...)
 */
function loadBank(name = process.env.BANK) {
  if (!name) {
    throw new Error(`BANK env var not set. Available banks: ${listBanks().join(', ')}`);
  }
  const dir = path.join(BANKS_DIR, name);
  if (!fs.existsSync(dir)) {
    throw new Error(`Unknown bank "${name}". Available banks: ${listBanks().join(', ')}`);
  }
  const read = (file) => JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  const bank = { name, dir, config: read('bank.json'), env: read('env.json'), data: read('data.json') };
  assertSafeToRun(bank);
  return bank;
}

/**
 * Real FIs ran against production with real accounts, so a run needs an explicit
 * approval (bank + PM). CI passes APPROVED_BY after the approval gate.
 */
function assertSafeToRun(bank) {
  if (bank.env.production && !process.env.APPROVED_BY) {
    throw new Error(
      `"${bank.name}" is flagged production. Set APPROVED_BY=<approver> after bank/PM sign-off. ` +
        `Test data must be penny-only (see data.json).`
    );
  }
}

/** Runtime state written by global setup (provisioned user, account ids, session). */
function statePaths(bankName) {
  const dir = path.join(ROOT, '.auth', bankName);
  return { dir, storageState: path.join(dir, 'state.json'), run: path.join(dir, 'run.json') };
}

function readRunState(bankName) {
  return JSON.parse(fs.readFileSync(statePaths(bankName).run, 'utf8'));
}

module.exports = { ROOT, listBanks, loadBank, statePaths, readRunState };
