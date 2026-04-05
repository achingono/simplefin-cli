#!/usr/bin/env node
import { Command } from 'commander';
import { claimAccessUrl } from './client/simplefin';
import { handleAccountList } from './commands/account';
import { handleTransactionList } from './commands/transaction';
import { printSuccess, printError } from './output';
import { setAccessUrl, clearConfig, getAccessUrl } from './config';
import { ErrorCodes } from './errors';

const program = new Command();

// Override Commander output to always emit JSON — suppress both stdout and stderr
program.exitOverride();
program.configureOutput({
  writeOut: () => { /* suppress Commander's default stdout (help/version text) */ },
  writeErr: () => { /* suppress Commander's default stderr */ },
});

program
  .name('simpleton-cli')
  .description('CLI client for the SimpleFin Bridge Protocol')
  .version('0.1.0');

// Setup command: exchange a setup token for a persistent access URL
program
  .command('setup <token>')
  .description('Exchange a SimpleFin setup token for an access URL and save it')
  .action(async (token: string) => {
    try {
      const accessUrl = await claimAccessUrl(token);
      setAccessUrl(accessUrl);
      printSuccess({ message: 'Setup complete. Access URL saved.' });
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      printError(e.code || ErrorCodes.SETUP_INVALID, e.message || 'Unknown error');
    }
  });

// Status command: show current configuration status
program
  .command('status')
  .description('Show current configuration status')
  .action(() => {
    const accessUrl = getAccessUrl();
    if (accessUrl) {
      // Mask credentials in the displayed URL for security
      let displayUrl = accessUrl;
      try {
        const parsed = new URL(accessUrl);
        if (parsed.username || parsed.password) {
          parsed.username = '***';
          parsed.password = '***';
          displayUrl = parsed.toString();
        }
      } catch {
        // ignore URL parse errors
      }
      printSuccess({ configured: true, accessUrl: displayUrl });
    } else {
      printSuccess({ configured: false });
    }
  });

// Reset command: remove stored configuration
program
  .command('reset')
  .description('Remove stored access URL and configuration')
  .action(() => {
    clearConfig();
    printSuccess({ message: 'Configuration cleared.' });
  });

// Account commands
const accountCmd = program.command('account').description('Account commands');
accountCmd.command('list').description('List all accounts').action(handleAccountList);

// Transaction commands
const transactionCmd = program.command('transaction').description('Transaction commands');
transactionCmd
  .command('list')
  .description('List transactions')
  .option('--account-id <id>', 'Filter by account ID')
  .option('--start-date <date>', 'Start date (ISO 8601) — only transactions on or after this date')
  .option('--end-date <date>', 'End date (ISO 8601) — only transactions before this date')
  .action((opts) =>
    handleTransactionList({
      accountId: opts.accountId,
      startDate: opts.startDate,
      endDate: opts.endDate,
    }),
  );

// Short-form aliases
program
  .command('accounts')
  .description('List all accounts (alias for account list)')
  .action(handleAccountList);

program
  .command('transactions')
  .description('List transactions (alias for transaction list)')
  .option('--account-id <id>', 'Filter by account ID')
  .option('--start-date <date>', 'Start date (ISO 8601)')
  .option('--end-date <date>', 'End date (ISO 8601)')
  .action((opts) =>
    handleTransactionList({
      accountId: opts.accountId,
      startDate: opts.startDate,
      endDate: opts.endDate,
    }),
  );

try {
  program.parse(process.argv);
} catch (err: unknown) {
  if (err && typeof err === 'object' && 'code' in err) {
    const ce = err as { code: string; message: string };
    if (ce.code === 'commander.missingMandatoryOptionValue' || ce.code === 'commander.optionMissingArgument') {
      printError(ErrorCodes.VALIDATION_ERROR, ce.message);
    } else if (ce.code === 'commander.helpDisplayed' || ce.code === 'commander.version') {
      process.exit(0);
    } else {
      printError(ErrorCodes.VALIDATION_ERROR, ce.message);
    }
  } else {
    printError(ErrorCodes.VALIDATION_ERROR, String(err));
  }
}
