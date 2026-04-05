import { validateTransactionList, parseUnixTimestamp } from '../src/commands/transaction';
import { ErrorCodes } from '../src/errors';

// Mock dependencies before importing handlers
jest.mock('../src/client/simplefin', () => ({
  getAccounts: jest.fn(),
}));

jest.mock('../src/config', () => ({
  getAccessUrl: jest.fn(),
}));

jest.mock('../src/output', () => ({
  printSuccess: jest.fn(),
  printError: jest.fn(),
  _exit: jest.fn(),
}));

import * as simplefin from '../src/client/simplefin';
import * as config from '../src/config';
import * as output from '../src/output';
import { handleTransactionList } from '../src/commands/transaction';

const mockSimplefin = simplefin as jest.Mocked<typeof simplefin>;
const mockConfig = config as jest.Mocked<typeof config>;
const mockOutput = output as jest.Mocked<typeof output>;

const ACCOUNT_ID = 'account-abc';
const ACCESS_URL = 'https://user:pass@bridge.example.com/simplefin';

const sampleAccountSet = {
  errors: [],
  accounts: [
    {
      id: ACCOUNT_ID,
      name: 'Checking',
      currency: 'USD',
      balance: '1000.00',
      'balance-date': 1700000000,
      org: { domain: 'example.com', name: 'Example Bank' },
      transactions: [
        { id: 'txn-1', posted: 1699900000, amount: '-25.00', description: 'Coffee' },
        { id: 'txn-2', posted: 1699950000, amount: '500.00', description: 'Paycheck' },
      ],
    },
    {
      id: 'account-xyz',
      name: 'Savings',
      currency: 'USD',
      balance: '5000.00',
      'balance-date': 1700000000,
      org: { domain: 'example.com', name: 'Example Bank' },
      transactions: [
        { id: 'txn-3', posted: 1699980000, amount: '100.00', description: 'Transfer' },
      ],
    },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('parseUnixTimestamp', () => {
  test('parses valid ISO date string', () => {
    const ts = parseUnixTimestamp('2024-01-15T00:00:00Z');
    expect(typeof ts).toBe('number');
    expect(ts).toBeGreaterThan(0);
  });

  test('returns null for invalid date string', () => {
    expect(parseUnixTimestamp('not-a-date')).toBeNull();
  });

  test('parses date-only string', () => {
    const ts = parseUnixTimestamp('2024-06-01');
    expect(ts).not.toBeNull();
  });
});

describe('validateTransactionList', () => {
  test('returns null for empty options', () => {
    expect(validateTransactionList({})).toBeNull();
  });

  test('returns null for valid dates', () => {
    expect(validateTransactionList({ startDate: '2024-01-01', endDate: '2024-12-31' })).toBeNull();
  });

  test('returns error for invalid start-date', () => {
    expect(validateTransactionList({ startDate: 'bad-date' })).toBe('start-date must be a valid ISO 8601 date');
  });

  test('returns error for invalid end-date', () => {
    expect(validateTransactionList({ endDate: 'bad-date' })).toBe('end-date must be a valid ISO 8601 date');
  });
});

describe('handleTransactionList', () => {
  test('returns error when not configured', async () => {
    mockConfig.getAccessUrl.mockReturnValue(undefined);
    await handleTransactionList({});
    expect(mockOutput.printError).toHaveBeenCalledWith(
      ErrorCodes.SETUP_REQUIRED,
      expect.stringContaining('simpleton-cli setup'),
    );
  });

  test('returns error for invalid start-date', async () => {
    mockConfig.getAccessUrl.mockReturnValue(ACCESS_URL);
    await handleTransactionList({ startDate: 'not-a-date' });
    expect(mockOutput.printError).toHaveBeenCalledWith(
      ErrorCodes.VALIDATION_ERROR,
      'start-date must be a valid ISO 8601 date',
    );
  });

  test('returns all transactions across accounts', async () => {
    mockConfig.getAccessUrl.mockReturnValue(ACCESS_URL);
    mockSimplefin.getAccounts.mockResolvedValue(sampleAccountSet);
    await handleTransactionList({});
    expect(mockOutput.printSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        transactions: expect.arrayContaining([
          expect.objectContaining({ id: 'txn-1', accountId: ACCOUNT_ID }),
          expect.objectContaining({ id: 'txn-2', accountId: ACCOUNT_ID }),
          expect.objectContaining({ id: 'txn-3', accountId: 'account-xyz' }),
        ]),
        errors: [],
      }),
    );
  });

  test('filters transactions by account ID', async () => {
    mockConfig.getAccessUrl.mockReturnValue(ACCESS_URL);
    mockSimplefin.getAccounts.mockResolvedValue(sampleAccountSet);
    await handleTransactionList({ accountId: ACCOUNT_ID });
    const call = mockOutput.printSuccess.mock.calls[0][0] as { transactions: { id: string; accountId?: string }[] };
    expect(call.transactions).toHaveLength(2);
    expect(call.transactions.every((t) => t.accountId === ACCOUNT_ID)).toBe(true);
  });

  test('returns error when filtering by non-existent account', async () => {
    mockConfig.getAccessUrl.mockReturnValue(ACCESS_URL);
    mockSimplefin.getAccounts.mockResolvedValue(sampleAccountSet);
    await handleTransactionList({ accountId: 'nonexistent' });
    expect(mockOutput.printError).toHaveBeenCalledWith(
      ErrorCodes.ACCOUNT_NOT_FOUND,
      expect.stringContaining('nonexistent'),
    );
  });

  test('passes date filters to getAccounts', async () => {
    mockConfig.getAccessUrl.mockReturnValue(ACCESS_URL);
    mockSimplefin.getAccounts.mockResolvedValue({ errors: [], accounts: [] });
    await handleTransactionList({ startDate: '2024-01-01T00:00:00Z', endDate: '2024-12-31T23:59:59Z' });
    expect(mockSimplefin.getAccounts).toHaveBeenCalledWith(
      ACCESS_URL,
      expect.objectContaining({
        startDate: expect.any(Number),
        endDate: expect.any(Number),
      }),
    );
  });
});
