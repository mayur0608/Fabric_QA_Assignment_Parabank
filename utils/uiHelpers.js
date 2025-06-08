const config = require('../config/config');
const { expect } = require('@playwright/test');

class UiHelpers {
    static async login(page, credentials) {
        await page.goto(config.baseUrl + config.endpoints.login);
        await page.waitForLoadState('networkidle');
        await page.locator('input[name="username"]').fill(credentials.username);
        await page.locator('input[name="password"]').fill(credentials.password);
        await page.locator('input[value="Log In"]').click();
        await page.waitForLoadState('networkidle');
    }

    static async registerUser(page) {
        const username = `user_${Math.random().toString(36).substring(2, 10)}`;
        const password = 'Test@123';
        
        await page.goto(config.baseUrl);
        await page.waitForLoadState('networkidle');
        
        const registerLink = page.locator('a:has-text("Register")');
        await registerLink.waitFor({ state: 'visible', timeout: 10000 });
        await registerLink.click();
        
        // Fill registration form
        await page.locator('#customer\\.firstName').fill('Test');
        await page.locator('#customer\\.lastName').fill('User');
        await page.locator('#customer\\.address\\.street').fill('123 Test St');
        await page.locator('#customer\\.address\\.city').fill('Test City');
        await page.locator('#customer\\.address\\.state').fill('Test State');
        await page.locator('#customer\\.address\\.zipCode').fill('12345');
        await page.locator('#customer\\.phoneNumber').fill('1234567890');
        await page.locator('#customer\\.ssn').fill('123-45-6789');
        await page.locator('#customer\\.username').fill(username);
        await page.locator('#customer\\.password').fill(password);
        await page.locator('#repeatedPassword').fill(password);
        
        await page.locator('input[value="Register"]').click();
        await page.waitForLoadState('networkidle');

        return { username, password };
    }

    static async createAccount(page, accountType) {
        await page.locator('a:has-text("Open New Account")').click();
        await page.waitForLoadState('networkidle');
        
        await page.locator('#type').selectOption(accountType);
        await page.locator('input[value="Open New Account"]').click();
        
        await page.waitForLoadState('networkidle');
        await expect(page.locator('h1.title:has-text("Account Opened!")'), {
            timeout: 10000
        }).toBeVisible();

        return await this.getNewAccountNumber(page);
    }

    static async getNewAccountNumber(page) {
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
            try {
                const accountNumber = await page.locator('#newAccountId').textContent();
                if (accountNumber) {
                    return accountNumber;
                }
            } catch (error) {
                console.log(`Attempt ${retryCount + 1} failed to get account number:`, error.message);
                retryCount++;
                if (retryCount < maxRetries) {
                    await page.waitForTimeout(2000);
                }
            }
        }
        throw new Error('Failed to get account number after multiple attempts');
    }

    static async verifyAccountInOverview(page, accountNumber) {
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
            try {
                await expect(page.locator(`text=${accountNumber}`), {
                    timeout: 10000
                }).toBeVisible();
                return true;
            } catch (error) {
                console.log(`Attempt ${retryCount + 1} failed to verify account:`, error.message);
                retryCount++;
                if (retryCount < maxRetries) {
                    await page.reload();
                    await page.waitForLoadState('networkidle');
                    await page.waitForTimeout(2000);
                }
            }
        }
        throw new Error('Failed to verify account after multiple attempts');
    }

    static async navigateToMenu(page, menuItem) {
        await page.locator(`a:has-text("${menuItem.link}")`).click();
        await expect(page.locator(`h1.title:has-text("${menuItem.header}")`)).toBeVisible();
        await page.waitForLoadState('networkidle');
    }

    static async transferFunds(page, fromAccount, toAccount, amount) {
        await page.locator('a:has-text("Transfer Funds")').click();
        await page.waitForLoadState('networkidle');

        await page.locator('#amount').fill(amount.toString());
        await page.locator('#fromAccountId').selectOption(fromAccount);
        await page.locator('#toAccountId').selectOption(toAccount);
        await page.locator('input[value="Transfer"]').click();

        await page.waitForLoadState('networkidle');
        await expect(page.locator('h1.title:has-text("Transfer Complete!")')).toBeVisible();
    }

    static async payBill(page, accountNumber, amount) {
        await page.locator('a:has-text("Bill Pay")').click();
        await page.waitForLoadState('networkidle');

        // Fill bill payment form
        await page.locator('input[name="payee.name"]').fill('Test Payee');
        await page.locator('input[name="payee.address.street"]').fill('123 Test St');
        await page.locator('input[name="payee.address.city"]').fill('Test City');
        await page.locator('input[name="payee.address.state"]').fill('Test State');
        await page.locator('input[name="payee.address.zipCode"]').fill('12345');
        await page.locator('input[name="payee.phoneNumber"]').fill('1234567890');
        await page.locator('input[name="payee.accountNumber"]').fill('123456789');
        await page.locator('input[name="verifyAccount"]').fill('123456789');
        await page.locator('input[name="amount"]').fill(amount.toString());
        
        await page.waitForSelector('select[name="fromAccountId"]');
        await page.locator('select[name="fromAccountId"]').selectOption(accountNumber);
        
        await page.locator('input[value="Send Payment"]').click();

        await page.waitForLoadState('networkidle');
        await expect(page.locator('h1.title:has-text("Bill Payment Complete")')).toBeVisible();
    }
}

module.exports = UiHelpers; 