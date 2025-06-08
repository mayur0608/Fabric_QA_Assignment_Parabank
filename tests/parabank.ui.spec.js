const { test, expect } = require('@playwright/test');
const fs = require('fs');
const config = require('../config/config');
const UiHelpers = require('../utils/uiHelpers');

// Create test fixtures for account numbers
const testAccounts = {
    firstAccount: null,
    secondAccount: null
};

test.describe('Para Bank E2E Tests', () => {
    let credentials;

    test.beforeAll(async ({ browser }) => {
        const context = await browser.newContext();
        const page = await context.newPage();
        
        // Register new user
        const userCredentials = await UiHelpers.registerUser(page);
        
        // Save credentials to file
        credentials = {
            username: userCredentials.username,
            password: userCredentials.password
        };
        fs.writeFileSync('credentials.json', JSON.stringify(credentials, null, 2));
        console.log('Created user with credentials:', {
            username: credentials.username,
            password: credentials.password
        });
        
        await context.close();
    });

    test('Global Navigation Menu Verification', async ({ page, context }) => {
        // Read credentials from file
        const credentials = JSON.parse(fs.readFileSync('credentials.json', 'utf8'));
        
        // Login with the created user
        await UiHelpers.login(page, credentials);

        // Get session ID
        const cookies = await context.cookies();
        const jsessionCookie = cookies.find(cookie => cookie.name === 'JSESSIONID');
        if (jsessionCookie) {
            process.env.PARABANK_SESSION_ID = jsessionCookie.value;
            console.log('Updated JSESSIONID:', jsessionCookie.value);
        }

        // Define menu items and their expected headers
        const menuItems = [
            { link: 'Open New Account', header: 'Open New Account' },
            { link: 'Accounts Overview', header: 'Accounts Overview' },
            { link: 'Transfer Funds', header: 'Transfer Funds' },
            { link: 'Bill Pay', header: 'Bill Payment Service' },
            { link: 'Find Transactions', header: 'Find Transactions' },
            { link: 'Update Contact Info', header: 'Update Profile' },
            { link: 'Request Loan', header: 'Apply for a Loan' }
        ];

        for (const item of menuItems) {
            await UiHelpers.navigateToMenu(page, item);
        }
    });

    test('Create Savings Account and Verify Balance', async ({ page }) => {
        // Read credentials from file
        const credentials = JSON.parse(fs.readFileSync('credentials.json', 'utf8'));
        
        // Login with the created user
        await UiHelpers.login(page, credentials);

        // Create savings account
        testAccounts.firstAccount = await UiHelpers.createAccount(page, 'SAVINGS');
        
        // Update credentials file with account number
        credentials.accountNumber = testAccounts.firstAccount;
        fs.writeFileSync('credentials.json', JSON.stringify(credentials, null, 2));
        console.log('New Account Number:', testAccounts.firstAccount);
        console.log('Updated credentials file with account number');

        // Navigate to Accounts Overview and verify account
        await page.locator('a:has-text("Accounts Overview")').click();
        await UiHelpers.verifyAccountInOverview(page, testAccounts.firstAccount);
    });

    test('Transfer Funds and Pay Bill', async ({ page }) => {
        // Skip if first account is not created
        test.skip(!testAccounts.firstAccount, 'First account not created');

        // Read credentials from file
        const credentials = JSON.parse(fs.readFileSync('credentials.json', 'utf8'));
        
        // Login with the created user
        await UiHelpers.login(page, credentials);

        // Create checking account
        testAccounts.secondAccount = await UiHelpers.createAccount(page, 'CHECKING');
        console.log('Second Account Number:', testAccounts.secondAccount);

        // Navigate to Accounts Overview to ensure accounts are available
        await page.locator('a:has-text("Accounts Overview")').click();
        await UiHelpers.verifyAccountInOverview(page, testAccounts.secondAccount);

        // Transfer funds from first account to second account
        await UiHelpers.transferFunds(page, testAccounts.firstAccount, testAccounts.secondAccount, 100.00);

        // Pay bill from first account
        await UiHelpers.payBill(page, testAccounts.firstAccount, 50.00);
    });
});