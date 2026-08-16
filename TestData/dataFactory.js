const { faker } = require('@faker-js/faker');

/**
 * Generates dynamic checkout information using Faker.js.
 */
function generateCheckoutData(count = 1) {
    const data = [];
    for (let i = 0; i < count; i++) {
        data.push({
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            postalCode: faker.location.zipCode(),
        });
    }
    return count === 1 ? data[0] : data;
}

/**
 * Generates edge-case checkout profiles for negative testing.
 */
function generateEdgeCaseCheckoutData() {
    return [
        { firstName: '', lastName: faker.person.lastName(), postalCode: faker.location.zipCode(), description: 'empty first name' },
        { firstName: faker.person.firstName(), lastName: '', postalCode: faker.location.zipCode(), description: 'empty last name' },
        { firstName: faker.person.firstName(), lastName: faker.person.lastName(), postalCode: '', description: 'empty postal code' },
        { firstName: faker.string.alpha(50), lastName: faker.person.lastName(), postalCode: faker.location.zipCode(), description: 'very long first name' },
        { firstName: faker.person.firstName(), lastName: faker.person.lastName(), postalCode: faker.string.alphanumeric(20), description: 'alphanumeric postal code' },
    ];
}

module.exports = {
    generateCheckoutData,
    generateEdgeCaseCheckoutData,
};
