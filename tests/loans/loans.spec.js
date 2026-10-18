const { test, expect } = require('../../lib/fixtures');

// Only collected for banks whose bank.json lists the "loans" feature.
test.describe('Loans', () => {
  test('loan request returns a decision', { tag: ['@sit'] }, async ({ loanPage, bank, session }) => {
    const { amount, downPayment } = bank.data.loan;
    await loanPage.open();
    await loanPage.apply(amount, downPayment, session.accountIds[0]);

    await expect(loanPage.status).toHaveText(/Approved|Denied/);
  });
});
