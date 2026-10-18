const { test, expect } = require('../../lib/fixtures');

test.describe('Transfers', () => {
  // Same-customer transfers move money between the two accounts, so run serially
  // to keep the balance-delta assertions deterministic.
  test.describe.configure({ mode: 'serial' });

  test('transfer between own accounts updates both balances', { tag: ['@build', '@sit', '@smoke'] }, async ({ transferPage, overviewPage, bank, session }) => {
    const [from, to] = session.accountIds;
    const amount = bank.data.transfer.amount; // penny-sized by design

    await overviewPage.open();
    const fromBefore = await overviewPage.balanceOf(from);
    const toBefore = await overviewPage.balanceOf(to);

    await transferPage.open();
    await transferPage.transfer(amount, from, to);
    await expect(transferPage.successTitle).toHaveText('Transfer Complete!');

    await overviewPage.open();
    expect(await overviewPage.balanceOf(from)).toBeCloseTo(fromBefore - Number(amount), 2);
    expect(await overviewPage.balanceOf(to)).toBeCloseTo(toBefore + Number(amount), 2);
  });

  test('transfer without an amount shows a validation error', { tag: ['@sit'] }, async ({ transferPage, session }) => {
    const [from, to] = session.accountIds;
    await transferPage.open();
    await transferPage.transfer('', from, to);
    await expect(transferPage.error).toBeVisible();
    await expect(transferPage.successTitle).toBeHidden();
  });
});
