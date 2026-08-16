const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');

const ajv = new Ajv({ allErrors: true });

/**
 * Validates a JSON data file against a JSON schema.
 * Throws an error if validation fails.
 */
function validateData(dataPath, schemaPath) {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

    const validate = ajv.compile(schema);
    const valid = validate(data);

    if (!valid) {
        const errors = validate.errors.map(err => `${err.instancePath || 'root'}: ${err.message}`).join('\n');
        throw new Error(`Test data validation failed for ${dataPath}:\n${errors}`);
    }

    return data;
}

function validateAllTestData() {
    const testDataDir = path.join(__dirname, '..', 'TestData');

    validateData(
        path.join(testDataDir, 'LoginData.json'),
        path.join(testDataDir, 'schemas', 'loginData.schema.json')
    );

    validateData(
        path.join(testDataDir, 'CheckoutData.json'),
        path.join(testDataDir, 'schemas', 'checkoutData.schema.json')
    );
}

module.exports = {
    validateData,
    validateAllTestData,
};
