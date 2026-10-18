const base = require('@playwright/test');
const { loadBank, readRunState } = require('./bank-context');
const { LoginPage } = require('../pages/LoginPage');
const { AccountsOverviewPage } = require('../pages/AccountsOverviewPage');
const { OpenAccountPage } = require('../pages/OpenAccountPage');
const { TransferPage } = require('../pages/TransferPage');
const { BillPayPage } = require('../pages/BillPayPage');
const { FindTransactionsPage } = require('../pages/FindTransactionsPage');
const { LoanPage } = require('../pages/LoanPage');

/**
 * Specs only ask for what they need: `bank` (config/env/data of the selected FI),
 * `session` (provisioned user + account ids) and page objects.
 */
const test = base.test.extend({
  bank: [async ({}, use) => use(loadBank()), { scope: 'worker' }],
  session: [async ({ bank }, use) => use(readRunState(bank.name)), { scope: 'worker' }],

  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  overviewPage: async ({ page }, use) => use(new AccountsOverviewPage(page)),
  openAccountPage: async ({ page }, use) => use(new OpenAccountPage(page)),
  transferPage: async ({ page }, use) => use(new TransferPage(page)),
  billPayPage: async ({ page }, use) => use(new BillPayPage(page)),
  findTransactionsPage: async ({ page }, use) => use(new FindTransactionsPage(page)),
  loanPage: async ({ page }, use) => use(new LoanPage(page)),
});

module.exports = { test, expect: base.expect };
