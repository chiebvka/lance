// Simple verification script for bank type mapping
const { getBankType } = require('../validation/banks.ts');

console.log('Testing bank type mapping...\n');

// Test bank accounts by country
console.log('Bank Accounts:');
console.log('US ->', getBankType('bank', 'US')); // Should be 'bankUs'
console.log('CA ->', getBankType('bank', 'CA')); // Should be 'bankCanada'
console.log('GB ->', getBankType('bank', 'GB')); // Should be 'bankUk'
console.log('EU ->', getBankType('bank', 'EU')); // Should be 'bankEurope'
console.log('international ->', getBankType('bank', 'international')); // Should be 'bankOther'

console.log('\nOther Account Types:');
console.log('crypto ->', getBankType('crypto')); // Should be 'crypto'
console.log('stripe ->', getBankType('stripe')); // Should be 'stripe'
console.log('paypal ->', getBankType('paypal')); // Should be 'paypal'

console.log('\nVerification complete!'); 