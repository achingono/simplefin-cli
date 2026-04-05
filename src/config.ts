import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.simplefin-cli');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

interface Config {
  accessUrl?: string;
}

function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  }
}

export function loadConfig(): Config {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(raw) as Config;
    }
  } catch {
    // ignore parse errors — return empty config
  }
  return {};
}

export function saveConfig(config: Config): void {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
}

export function getAccessUrl(): string | undefined {
  return loadConfig().accessUrl;
}

export function setAccessUrl(accessUrl: string): void {
  const config = loadConfig();
  config.accessUrl = accessUrl;
  saveConfig(config);
}

export function clearConfig(): void {
  if (fs.existsSync(CONFIG_FILE)) {
    fs.unlinkSync(CONFIG_FILE);
  }
}
