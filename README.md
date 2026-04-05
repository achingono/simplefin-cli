# simplefin-cli

CLI client for the SimpleFin Bridge Protocol

## Installation

```bash
npm install -g simplefin-cli
```

## Usage

### Setup

Exchange a SimpleFin setup token for a persistent access URL:

```bash
simplefin-cli setup <base64-token>
```

### Status

Check current configuration:

```bash
simplefin-cli status
```

### Accounts

List all financial accounts:

```bash
simplefin-cli account list
# or shorthand:
simplefin-cli accounts
```

### Transactions

List all transactions across all accounts:

```bash
simplefin-cli transaction list
# or shorthand:
simplefin-cli transactions
```

Filter by account:

```bash
simplefin-cli transactions --account-id <id>
```

Filter by date range (ISO 8601):

```bash
simplefin-cli transactions --start-date 2024-01-01 --end-date 2024-12-31
```

### Reset

Remove stored access URL and configuration:

```bash
simplefin-cli reset
```

## Output

All commands output JSON to stdout:

```json
{ "ok": true, "accounts": [...] }
{ "ok": false, "error": { "code": "SETUP_REQUIRED", "message": "..." } }
```

Exit code `0` on success, `1` on error.

## License

MIT
