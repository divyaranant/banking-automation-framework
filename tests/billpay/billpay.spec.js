const { test, expect } = require('../../lib/fixtures');

test.describe('Bill Pay', () => {
  test('bill payment to a new payee completes', { tag: ['@build', '@sit'] }, async ({ billPayPage, bank, session }) => {
    const { payee, amount } = bank.data.billPay;
    await billPayPage.open();
    await billPayPage.pay(payee, amount, session.accountIds[0]);

    await expect(billPayPage.successTitle).toHaveText('Bill Payment Complete');
    await expect(billPayPage.successText).toContainText(payee.name);
    await expect(billPayPage.successText).toContainText(session.accountIds[0]);
  });

  test('bill payment appears in transaction history', { tag: ['@sit'] }, async ({ billPayPage, findTransactionsPage, bank, session }) => {
    const { payee, amount } = bank.data.billPay;
    const from = session.accountIds[0];

    await billPayPage.open();
    await billPayPage.pay(payee, amount, from);
    await expect(billPayPage.successTitle).toHaveText('Bill Payment Complete');

    await findTransactionsPage.open();
    await findTransactionsPage.findByAmountFor(from, amount);
    await expect(findTransactionsPage.resultRows.filter({ hasText: payee.name }).first()).toBeVisible();
  });
});
