const { test, expect } = require('@playwright/test');
const fs = require('fs');
const config = require('../config/config');
const ApiHelpers = require('../utils/apiHelpers');
const transactionTestCases = require('../testData/transactionData');

test.describe('Para Bank API Tests', () => {
    let sessionId;
    let accountNumber;
    let credentials;

    test.beforeAll(async ({ browser }) => {
        try {
            credentials = JSON.parse(fs.readFileSync('credentials.json', 'utf8'));
            console.log('Read credentials from file:', {
                username: credentials.username,
                accountNumber: credentials.accountNumber
            });
        } catch (error) {
            console.error('Failed to read credentials from file:', error);
            return;
        }

        const context = await browser.newContext();
        const page = await context.newPage();
        
        await ApiHelpers.login(page, credentials);
        sessionId = await ApiHelpers.getSessionId(context);
        
        if (sessionId) {
            process.env.PARABANK_SESSION_ID = sessionId;
            console.log('Got session ID:', sessionId);
        } else {
            console.log('No JSESSIONID found in cookies');
        }
        
        await context.close();
    });

    test.beforeEach(async ({ request }) => {
        sessionId = process.env.PARABANK_SESSION_ID;
        accountNumber = credentials.accountNumber;
        
        if (!sessionId || !accountNumber) {
            test.skip(true, 'Session ID or account number not available');
            return;
        }
    });

    for (const testCase of transactionTestCases) {
        test(`Search and Validate ${testCase.testName}`, async ({ request }) => {
            if (!sessionId || !accountNumber) {
                test.skip(true, 'Session ID or account number not available');
                return;
            }

            const searchResponse = await ApiHelpers.searchTransactions(
                request,
                sessionId,
                accountNumber,
                testCase.amount
            );
            
            expect(searchResponse.ok()).toBeTruthy();
            const transactions = await searchResponse.json();
            
            expect(transactions).toBeDefined();
            expect(Array.isArray(transactions)).toBeTruthy();
            
            if (transactions.length > 0) {
                const transaction = transactions[0];
                ApiHelpers.validateTransaction(
                    transaction,
                    accountNumber,
                    testCase.amount,
                    testCase.expectedType,
                    testCase.expectedDescription
                );
                
                console.log(`Found ${testCase.testName}:`, {
                    id: transaction.id,
                    date: transaction.date,
                    amount: transaction.amount,
                    type: transaction.type,
                    accountId: transaction.accountId,
                    description: transaction.description
                });
            }
        });
    }
});
