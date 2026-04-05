import * as simplefin from '../client/simplefin';
import { printSuccess, printError } from '../output';
import { ErrorCodes } from '../errors';
import { getAccessUrl } from '../config';

interface TransactionListOptions {
  accountId?: string;
  startDate?: string;
  endDate?: string;
}

export function parseUnixTimestamp(dateStr: string): number | null {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return Math.floor(d.getTime() / 1000);
}

export function validateTransactionList(opts: TransactionListOptions): string | null {
  if (opts.startDate && parseUnixTimestamp(opts.startDate) === null) {
    return 'start-date must be a valid ISO 8601 date';
  }
  if (opts.endDate && parseUnixTimestamp(opts.endDate) === null) {
    return 'end-date must be a valid ISO 8601 date';
  }
  return null;
}

export async function handleTransactionList(options: TransactionListOptions): Promise<void> {
  try {
    const accessUrl = getAccessUrl();
    if (!accessUrl) {
      printError(ErrorCodes.SETUP_REQUIRED, 'Not configured. Run: simpleton-cli setup <token>');
      return;
    }

    const validationError = validateTransactionList(options);
    if (validationError) {
      printError(ErrorCodes.VALIDATION_ERROR, validationError);
      return;
    }

    const fetchOptions: { startDate?: number; endDate?: number } = {};
    if (options.startDate) {
      fetchOptions.startDate = parseUnixTimestamp(options.startDate) as number;
    }
    if (options.endDate) {
      fetchOptions.endDate = parseUnixTimestamp(options.endDate) as number;
    }

    const accountSet = await simplefin.getAccounts(accessUrl, fetchOptions);

    let transactions = accountSet.accounts.flatMap((account) =>
      account.transactions.map((txn) => ({
        ...txn,
        accountId: account.id,
        accountName: account.name,
        currency: account.currency,
      })),
    );

    if (options.accountId) {
      const targetId = options.accountId;
      const accountExists = accountSet.accounts.some((a) => a.id === targetId);
      if (!accountExists) {
        printError(ErrorCodes.ACCOUNT_NOT_FOUND, `Account not found: ${targetId}`);
        return;
      }
      transactions = transactions.filter((t) => t.accountId === targetId);
    }

    printSuccess({ transactions, errors: accountSet.errors });
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    printError(e.code || ErrorCodes.API_ERROR, e.message || 'Unknown error');
  }
}
