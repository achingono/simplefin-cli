import * as simplefin from '../client/simplefin';
import { printSuccess, printError } from '../output';
import { ErrorCodes } from '../errors';
import { getAccessUrl } from '../config';

export async function handleAccountList(): Promise<void> {
  try {
    const accessUrl = getAccessUrl();
    if (!accessUrl) {
      printError(ErrorCodes.SETUP_REQUIRED, 'Not configured. Run: simplefin-cli setup <token>');
      return;
    }

    const accountSet = await simplefin.getAccounts(accessUrl);
    const accounts = accountSet.accounts.map((a) => ({
      id: a.id,
      name: a.name,
      currency: a.currency,
      balance: a.balance,
      'available-balance': a['available-balance'],
      'balance-date': a['balance-date'],
      org: a.org,
    }));

    printSuccess({ accounts, errors: accountSet.errors });
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    printError(e.code || ErrorCodes.API_ERROR, e.message || 'Unknown error');
  }
}
