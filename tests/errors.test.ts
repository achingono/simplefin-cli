import { ErrorCodes, AppError } from '../src/errors';

describe('ErrorCodes', () => {
  test('SETUP_REQUIRED is defined', () => {
    expect(ErrorCodes.SETUP_REQUIRED).toBe('SETUP_REQUIRED');
  });
  test('SETUP_INVALID is defined', () => {
    expect(ErrorCodes.SETUP_INVALID).toBe('SETUP_INVALID');
  });
  test('NETWORK_ERROR is defined', () => {
    expect(ErrorCodes.NETWORK_ERROR).toBe('NETWORK_ERROR');
  });
  test('ACCOUNT_NOT_FOUND is defined', () => {
    expect(ErrorCodes.ACCOUNT_NOT_FOUND).toBe('ACCOUNT_NOT_FOUND');
  });
  test('VALIDATION_ERROR is defined', () => {
    expect(ErrorCodes.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
  });
  test('API_ERROR is defined', () => {
    expect(ErrorCodes.API_ERROR).toBe('API_ERROR');
  });
  test('RATE_LIMITED is defined', () => {
    expect(ErrorCodes.RATE_LIMITED).toBe('RATE_LIMITED');
  });
});

describe('AppError', () => {
  test('creates error with code and message', () => {
    const err = new AppError(ErrorCodes.SETUP_REQUIRED, 'test error');
    expect(err.code).toBe('SETUP_REQUIRED');
    expect(err.message).toBe('test error');
    expect(err.name).toBe('AppError');
  });
});
