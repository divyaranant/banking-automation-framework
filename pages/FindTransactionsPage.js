const { BasePage } = require('./BasePage');

class FindTransactionsPage extends BasePage {
  constructor(page) {
    super(page);
    this.account = page.locator('#accountId');
    this.amount = page.locator('#amount');
    this.findByAmount = page.locator('#findByAmount');
    this.resultRows = page.locator('#transactionTable tbody tr');
  }

  async open() {
    await this.goto('findtrans.htm');
  }

  async findByAmountFor(accountId, amount) {
    await this.account.selectOption(accountId);
    await this.amount.fill(amount);
    await this.findByAmount.click();
  }
}

module.exports = { FindTransactionsPage };
