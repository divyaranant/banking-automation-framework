const { BasePage } = require('./BasePage');

class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.username = page.locator('input[name="username"]');
    this.password = page.locator('input[name="password"]');
    this.submit = page.getByRole('button', { name: 'Log In' });
    this.error = page.locator('#rightPanel .error');
    this.logoutLink = page.locator('#leftPanel').getByRole('link', { name: 'Log Out' });
  }

  async open() {
    await this.goto('index.htm');
  }

  async login(username, password) {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.submit.click();
  }
}

module.exports = { LoginPage };
