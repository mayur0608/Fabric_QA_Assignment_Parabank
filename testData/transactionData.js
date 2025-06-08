const transactionTestCases = [
    {
        testName: 'Bill Payment Transaction',
        amount: 50.00,
        expectedType: 'Debit',
        expectedDescription: 'Bill Payment to Test Payee'
    },
    {
        testName: 'Transfer Transaction',
        amount: 100.00,
        expectedType: 'Credit',
        expectedDescription: 'Funds Transfer Received'
    }
];

module.exports = transactionTestCases; 