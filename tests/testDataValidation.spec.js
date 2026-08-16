const { test, expect } = require('../fixtures/base.fixture');
const { validateAllTestData } = require('../utils/validateTestData');

test.describe('Test Data Validation', () => {
    test('all JSON test data should match their schemas', () => {
        expect(() => validateAllTestData()).not.toThrow();
    });
});
