const { test, expect } = require('../../lib/fixtures');

test.describe('Accounts', () => {
  test('overview lists the customer accounts with balances', { tag: ['@build', '@sit', '@smoke'] }, async ({ overviewPage, session }) => {
    await overviewPage.open();
    await expect(overviewPage.heading).toHaveText('Accounts Overview');
    const ids = await overviewPage.accountIds();
    for (const id of session.accountIds) expect(ids).toContain(id);
    expect(await overviewPage.balanceOf(session.accountIds[0])).not.toBeNaN();
  });

  test('customer can open a new account', { tag: ['@sit'] }, async ({ openAccountPage, overviewPage, bank, session }) => {
    await openAccountPage.open();
    const newId = await openAccountPage.openAccount(bank.data.openAccount.type, session.accountIds[0]);
    await expect(openAccountPage.result).toContainText('Account Opened!');

    await overviewPage.open();
    expect(await overviewPage.accountIds()).toContain(newId);
  });
});
