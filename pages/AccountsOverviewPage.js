const { BasePage } = require('./BasePage');

class AccountsOverviewPage extends BasePage {
  constructor(page) {
    super(page);
    this.table = page.locator('#accountTable');
    this.accountLinks = this.table.locator('tbody tr td:first-child a');
  }

  async open() {
    await this.goto('overview.htm');
    await this.accountLinks.first().waitFor();
  }

  async accountIds() {
    return (await this.accountLinks.allInnerTexts()).map((t) => t.trim());
  }

  async balanceOf(accountId) {
    const row = this.table.locator('tbody tr', {
      has: this.page.getByRole('link', { name: accountId, exact: true }),
    });
    return BasePage.parseMoney(await row.locator('td').nth(1).innerText());
  }
}

module.exports = { AccountsOverviewPage };
