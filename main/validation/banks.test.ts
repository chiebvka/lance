import { getBankType } from './banks';

describe('getBankType', () => {
  test('should return correct type for bank accounts based on country', () => {
    expect(getBankType('bank', 'US')).toBe('bankUs');
    expect(getBankType('bank', 'CA')).toBe('bankCanada');
    expect(getBankType('bank', 'GB')).toBe('bankUk');
    expect(getBankType('bank', 'EU')).toBe('bankEurope');
    expect(getBankType('bank', 'international')).toBe('bankOther');
    expect(getBankType('bank', 'unknown')).toBe('bankOther');
  });

  test('should return correct type for crypto wallets', () => {
    expect(getBankType('crypto')).toBe('crypto');
    expect(getBankType('crypto', 'US')).toBe('crypto');
  });

  test('should return correct type for stripe payments', () => {
    expect(getBankType('stripe')).toBe('stripe');
    expect(getBankType('stripe', 'US')).toBe('stripe');
  });

  test('should return correct type for paypal payments', () => {
    expect(getBankType('paypal')).toBe('paypal');
    expect(getBankType('paypal', 'US')).toBe('paypal');
  });

  test('should return bankOther for unknown account types', () => {
    expect(getBankType('unknown')).toBe('bankOther');
    expect(getBankType('unknown', 'US')).toBe('bankOther');
  });
}); 