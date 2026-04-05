import axios from 'axios';
import { AppError, ErrorCodes } from '../errors';

export interface SFOrganization {
  domain: string;
  name?: string;
  url?: string;
  sfin_url?: string;
}

export interface SFAccount {
  org: SFOrganization;
  id: string;
  name: string;
  currency: string;
  balance: string;
  'available-balance'?: string;
  'balance-date': number;
  transactions: SFTransaction[];
  extra?: Record<string, unknown>;
}

export interface SFTransaction {
  id: string;
  posted: number;
  amount: string;
  description: string;
  payee?: string;
  memo?: string;
  extra?: Record<string, unknown>;
}

export interface SFAccountSet {
  errors: string[];
  accounts: SFAccount[];
}

/**
 * Exchange a setup token for an access URL.
 * The setup token is a base64-encoded claim URL. POST to that URL to receive
 * the permanent access URL which includes embedded credentials.
 */
export async function claimAccessUrl(setupToken: string): Promise<string> {
  let claimUrl: string;
  try {
    claimUrl = Buffer.from(setupToken.trim(), 'base64').toString('utf-8').trim();
  } catch {
    throw new AppError(ErrorCodes.SETUP_INVALID, 'Failed to decode setup token — must be a valid base64 string');
  }

  if (!claimUrl.startsWith('http')) {
    throw new AppError(ErrorCodes.SETUP_INVALID, `Decoded setup token is not a valid URL: ${claimUrl}`);
  }

  try {
    const response = await axios.post<string>(claimUrl, null, {
      responseType: 'text',
      maxRedirects: 5,
    });
    const accessUrl = typeof response.data === 'string' ? response.data.trim() : String(response.data).trim();
    if (!accessUrl.startsWith('http')) {
      throw new AppError(ErrorCodes.SETUP_INVALID, `Unexpected response from claim URL: ${accessUrl}`);
    }
    return accessUrl;
  } catch (err) {
    if (err instanceof AppError) throw err;
    const e = err as { message?: string; response?: { status?: number } };
    if (e.response?.status === 429) {
      throw new AppError(ErrorCodes.RATE_LIMITED, 'Rate limited by SimpleFin Bridge — try again later');
    }
    throw new AppError(ErrorCodes.NETWORK_ERROR, `Failed to claim access URL: ${e.message || String(err)}`);
  }
}

/**
 * Fetch account data from SimpleFin Bridge.
 * Optionally filter transactions by start/end date (Unix timestamps or ISO 8601).
 */
export async function getAccounts(
  accessUrl: string,
  options: { startDate?: number; endDate?: number } = {},
): Promise<SFAccountSet> {
  const url = new URL(`${accessUrl}/accounts`);
  if (options.startDate !== undefined) {
    url.searchParams.set('start-date', String(options.startDate));
  }
  if (options.endDate !== undefined) {
    url.searchParams.set('end-date', String(options.endDate));
  }

  try {
    const response = await axios.get<SFAccountSet>(url.toString(), {
      responseType: 'json',
    });
    return response.data;
  } catch (err) {
    const e = err as { message?: string; response?: { status?: number } };
    if (e.response?.status === 401 || e.response?.status === 403) {
      throw new AppError(ErrorCodes.SETUP_REQUIRED, 'Access URL credentials are invalid — run: simplefin-cli setup <token>');
    }
    if (e.response?.status === 429) {
      throw new AppError(ErrorCodes.RATE_LIMITED, 'Rate limited by SimpleFin Bridge — try again later');
    }
    throw new AppError(ErrorCodes.NETWORK_ERROR, `Failed to fetch accounts: ${e.message || String(err)}`);
  }
}
