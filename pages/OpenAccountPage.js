const { BasePage } = require('./BasePage');

class OpenAccountPage extends BasePage {
  constructor(page) {
    super(page);
    this.type = page.locator('#type');
    this.fundingAccount = page.locator('#fromAccountId');
    this.submit = page.getByRole('button', { name: 'Open New Account' });
    this.result = page.locator('#openAccountResult');
    this.newAccountId = page.locator('#newAccountId');
  }

  async open() {
    await this.goto('openaccount.htm');
  }

  /** @returns {Promise<string>} id of the newly opened account */
  async openAccount(type, fundingAccountId) {
    await this.type.selectOption({ value: OpenAccountPage.TYPE_VALUES[type.toUpperCase()] });
    // options are populated by an async call; selectOption waits for the option to exist
    await this.fundingAccount.selectOption(fundingAccountId);
    await this.submit.click();
    await this.newAccountId.waitFor();
    return (await this.newAccountId.innerText()).trim();
  }
}

OpenAccountPage.TYPE_VALUES = { CHECKING: '0', SAVINGS: '1' };

module.exports = { OpenAccountPage };
