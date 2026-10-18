class BasePage {
  constructor(page) {
    this.page = page;
    // Some pages also carry a hidden "Error!" heading, so only match the visible one.
    this.heading = page.locator('#rightPanel h1.title:visible');
  }

  async goto(path) {
    await this.page.goto(path);
  }

  async openFromMenu(linkName) {
    await this.page.locator('#leftPanel').getByRole('link', { name: linkName, exact: true }).click();
  }

  async logout() {
    await this.openFromMenu('Log Out');
  }

  /** "$1,234.50" -> 1234.5 */
  static parseMoney(text) {
    return Number(text.replace(/[^0-9.-]/g, ''));
  }
}

module.exports = { BasePage };
