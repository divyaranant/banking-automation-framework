const { BasePage } = require('./BasePage');

class LoanPage extends BasePage {
  constructor(page) {
    super(page);
    this.amount = page.locator('#amount');
    this.downPayment = page.locator('#downPayment');
    this.from = page.locator('#fromAccountId');
    this.submit = page.getByRole('button', { name: 'Apply Now' });
    this.status = page.locator('#loanStatus');
  }

  async open() {
    await this.goto('requestloan.htm');
  }

  async apply(amount, downPayment, fromId) {
    await this.amount.fill(amount);
    await this.downPayment.fill(downPayment);
    await this.from.selectOption(fromId);
    await this.submit.click();
  }
}

module.exports = { LoanPage };
