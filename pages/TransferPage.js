const { BasePage } = require('./BasePage');

class TransferPage extends BasePage {
  constructor(page) {
    super(page);
    this.amount = page.locator('#amount');
    this.from = page.locator('#fromAccountId');
    this.to = page.locator('#toAccountId');
    this.submit = page.getByRole('button', { name: 'Transfer' });
    this.successTitle = page.locator('#showResult h1.title');
    this.error = page.locator('#showError');
  }

  async open() {
    await this.goto('transfer.htm');
  }

  async transfer(amount, fromId, toId) {
    await this.amount.fill(amount);
    await this.from.selectOption(fromId);
    await this.to.selectOption(toId);
    await this.submit.click();
  }
}

module.exports = { TransferPage };
