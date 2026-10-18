const fs = require('fs');
const crypto = require('crypto');
const { chromium } = require('@playwright/test');
const { loadBank, statePaths } = require('./bank-context');
const { getCredentials } = require('./vault');
const { LoginPage } = require('../pages/LoginPage');
const { RegisterPage } = require('../pages/RegisterPage');
const { AccountsOverviewPage } = require('../pages/AccountsOverviewPage');
const { OpenAccountPage } = require('../pages/OpenAccountPage');

/**
 * Runs once per execution, before any test:
 *   1. resolve credentials (Vault -> env -> provision a throw-away user on the demo site)
 *   2. log in once and persist the session (storageState) so specs skip the login UI
 *   3. make sure the user has two accounts and record their ids for the specs
 */
module.exports = async function globalSetup(config) {
  const bank = loadBank();
  const { dir, storageState, run } = statePaths(bank.name);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });

  const baseURL = bank.env.baseUrl;
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  let creds = await getCredentials(bank.name);
  if (creds) {
    const login = new LoginPage(page);
    await login.open();
    await login.login(creds.username, creds.password);
    await login.logoutLink.waitFor();
  } else {
    // Demo site only: real FIs always supply credentials from Vault.
    // The shared public demo site occasionally rejects a name, so retry with a fresh one.
    const register = new RegisterPage(page);
    const success = page.getByText('Your account was created successfully');
    for (let attempt = 1; !creds; attempt++) {
      const username = `qa${crypto.randomBytes(5).toString('hex')}`;
      const password = `Pw${crypto.randomBytes(6).toString('hex')}`;
      await register.open();
      await register.register(bank.data.registration, username, password);
      if (await success.isVisible({ timeout: 10_000 }).catch(() => false)) {
        creds = { username, password, source: 'provisioned' };
      } else if (attempt === 3) {
        throw new Error('Could not provision a demo user after 3 attempts');
      }
    }
  }

  const overview = new AccountsOverviewPage(page);
  await overview.open();
  let accountIds = await overview.accountIds();

  if (accountIds.length < 2) {
    const openAccount = new OpenAccountPage(page);
    await openAccount.open();
    await openAccount.openAccount(bank.data.openAccount.type, accountIds[0]);
    await overview.open();
    accountIds = await overview.accountIds();
  }

  await context.storageState({ path: storageState });
  fs.writeFileSync(
    run,
    JSON.stringify({ username: creds.username, password: creds.password, source: creds.source, accountIds }, null, 2)
  );
  await browser.close();
  console.log(`[setup] ${bank.name}: user=${creds.username} (${creds.source}) accounts=${accountIds.join(',')}`);
};
