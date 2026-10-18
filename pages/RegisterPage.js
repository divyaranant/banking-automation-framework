const { BasePage } = require('./BasePage');

class RegisterPage extends BasePage {
  constructor(page) {
    super(page);
    const field = (id) => page.locator(`[id="${id}"]`);
    this.fields = {
      firstName: field('customer.firstName'),
      lastName: field('customer.lastName'),
      street: field('customer.address.street'),
      city: field('customer.address.city'),
      state: field('customer.address.state'),
      zipCode: field('customer.address.zipCode'),
      phone: field('customer.phoneNumber'),
      ssn: field('customer.ssn'),
      username: field('customer.username'),
      password: field('customer.password'),
      confirm: field('repeatedPassword'),
    };
    this.submit = page.getByRole('button', { name: 'Register' });
  }

  async open() {
    await this.goto('register.htm');
  }

  async register(profile, username, password) {
    const { fields } = this;
    await fields.firstName.fill(profile.firstName);
    await fields.lastName.fill(profile.lastName);
    await fields.street.fill(profile.street);
    await fields.city.fill(profile.city);
    await fields.state.fill(profile.state);
    await fields.zipCode.fill(profile.zipCode);
    await fields.phone.fill(profile.phone);
    await fields.ssn.fill(profile.ssn);
    await fields.username.fill(username);
    await fields.password.fill(password);
    await fields.confirm.fill(password);
    await this.submit.click();
  }
}

module.exports = { RegisterPage };
