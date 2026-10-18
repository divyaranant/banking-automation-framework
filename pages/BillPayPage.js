const { BasePage } = require('./BasePage');

class BillPayPage extends BasePage {
  constructor(page) {
    super(page);
    const named = (name) => page.locator(`input[name="${name}"]`);
    this.payee = {
      name: named('payee.name'),
      street: named('payee.address.street'),
      city: named('payee.address.city'),
      state: named('payee.address.state'),
      zipCode: named('payee.address.zipCode'),
      phone: named('payee.phoneNumber'),
      account: named('payee.accountNumber'),
      verify: named('verifyAccount'),
    };
    this.amount = named('amount');
    this.from = page.locator('select[name="fromAccountId"]');
    this.submit = page.getByRole('button', { name: 'Send Payment' });
    this.successTitle = page.locator('#billpayResult h1.title');
    this.successText = page.locator('#billpayResult');
    this.error = page.locator('[id^="validationModel"]').first();
  }

  async open() {
    await this.goto('billpay.htm');
  }

  async pay(payee, amount, fromId) {
    const { payee: f } = this;
    await f.name.fill(payee.name);
    await f.street.fill(payee.street);
    await f.city.fill(payee.city);
    await f.state.fill(payee.state);
    await f.zipCode.fill(payee.zipCode);
    await f.phone.fill(payee.phone);
    await f.account.fill(payee.account);
    await f.verify.fill(payee.account);
    await this.amount.fill(amount);
    await this.from.selectOption(fromId);
    await this.submit.click();
  }
}

module.exports = { BillPayPage };
