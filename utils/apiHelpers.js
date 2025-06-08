const config = require('../config/config');
const { expect } = require('@playwright/test');

class ApiHelpers {
    static async login(page, credentials) {
        await page.goto(config.baseUrl + config.endpoints.login);
        await page.waitForLoadState('networkidle');
        await page.locator('input[name="username"]').fill(credentials.username);
        await page.locator('input[name="password"]').fill(credentials.password);
        await page.locator('input[value="Log In"]').click();
        await page.waitForLoadState('networkidle');
    }

    static async getSessionId(context) {
        const cookies = await context.cookies();
        const jsessionCookie = cookies.find(cookie => cookie.name === 'JSESSIONID');
        return jsessionCookie ? jsessionCookie.value : null;
    }

    static async searchTransactions(request, sessionId, accountNumber, amount) {
        const headers = {
            ...config.headers,
            'Cookie': `JSESSIONID=${sessionId}`
        };

        return await request.get(
            `${config.baseUrl}${config.endpoints.transactions}/${accountNumber}/transactions/amount/${amount}?timeout=30000`,
            { headers }
        );
    }

    static validateTransaction(transaction, accountNumber, expectedAmount, expectedType, expectedDescription) {
        expect(transaction).toHaveProperty('id');
        expect(transaction).toHaveProperty('date');
        expect(transaction).toHaveProperty('amount', expectedAmount);
        expect(transaction).toHaveProperty('type', expectedType);
        expect(transaction).toHaveProperty('accountId', parseInt(accountNumber));
        if (expectedDescription) {
            expect(transaction).toHaveProperty('description', expectedDescription);
        }
        expect(new Date(transaction.date).toString()).not.toBe('Invalid Date');
    }
}

module.exports = ApiHelpers; 