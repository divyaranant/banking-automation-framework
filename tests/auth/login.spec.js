const { test, expect } = require('../../lib/fixtures');

// Login specs exercise the real login UI, so they start without the saved session.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Authentication', () => {
  test('valid customer can log in and see accounts overview', { tag: ['@build', '@sit', '@smoke'] }, async ({ loginPage, session, page }) => {
    await loginPage.open();
    await loginPage.login(session.username, session.password);
    await expect(loginPage.logoutLink).toBeVisible();
    await expect(page).toHaveURL(/overview\.htm/);
    await expect(loginPage.heading).toHaveText('Accounts Overview');
  });

  test('invalid password is rejected with an error', { tag: ['@build', '@sit'] }, async ({ loginPage, session }) => {
    await loginPage.open();
    await loginPage.login(session.username, 'definitely-wrong');
    await expect(loginPage.error).toContainText('could not be verified');
    await expect(loginPage.logoutLink).toBeHidden();
  });

  test('customer can log out', { tag: ['@smoke', '@sit'] }, async ({ loginPage, session, page }) => {
    await loginPage.open();
    await loginPage.login(session.username, session.password);
    await loginPage.logout();
    await expect(loginPage.username).toBeVisible();
    await expect(page).toHaveURL(/index\.htm/);
  });
});
