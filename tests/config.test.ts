import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Point config module at a temp directory so tests don't touch the real home dir
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'simpleton-cli-test-'));
const configDir = path.join(tmpDir, '.simpleton-cli');
const configFile = path.join(configDir, 'config.json');

jest.mock('os', () => ({
  ...jest.requireActual('os'),
  homedir: () => tmpDir,
}));

// Re-import AFTER mocking os so the module picks up the mocked homedir
import { loadConfig, saveConfig, getAccessUrl, setAccessUrl, clearConfig } from '../src/config';

afterAll(() => {
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // ignore cleanup errors
  }
});

beforeEach(() => {
  // Remove config file before each test for isolation
  if (fs.existsSync(configFile)) {
    fs.unlinkSync(configFile);
  }
});

describe('loadConfig', () => {
  test('returns empty object when no config file exists', () => {
    expect(loadConfig()).toEqual({});
  });

  test('returns parsed config when file exists', () => {
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(configFile, JSON.stringify({ accessUrl: 'https://test.example.com' }));
    expect(loadConfig()).toEqual({ accessUrl: 'https://test.example.com' });
  });
});

describe('getAccessUrl / setAccessUrl', () => {
  test('returns undefined when not set', () => {
    expect(getAccessUrl()).toBeUndefined();
  });

  test('returns access URL after setAccessUrl', () => {
    setAccessUrl('https://user:pass@bridge.example.com/simplefin');
    expect(getAccessUrl()).toBe('https://user:pass@bridge.example.com/simplefin');
  });
});

describe('clearConfig', () => {
  test('removes the config file', () => {
    setAccessUrl('https://test.example.com');
    expect(getAccessUrl()).toBeDefined();
    clearConfig();
    expect(getAccessUrl()).toBeUndefined();
  });

  test('does not throw if no config file exists', () => {
    expect(() => clearConfig()).not.toThrow();
  });
});

describe('saveConfig / loadConfig roundtrip', () => {
  test('saves and reloads config correctly', () => {
    saveConfig({ accessUrl: 'https://example.com/api' });
    expect(loadConfig()).toEqual({ accessUrl: 'https://example.com/api' });
  });
});


describe('getAccessUrl / setAccessUrl', () => {
  test('returns undefined when not set', () => {
    expect(getAccessUrl()).toBeUndefined();
  });

  test('returns access URL after setAccessUrl', () => {
    setAccessUrl('https://user:pass@bridge.example.com/simplefin');
    expect(getAccessUrl()).toBe('https://user:pass@bridge.example.com/simplefin');
  });
});

describe('clearConfig', () => {
  test('removes the config file', () => {
    setAccessUrl('https://test.example.com');
    expect(getAccessUrl()).toBeDefined();
    clearConfig();
    expect(getAccessUrl()).toBeUndefined();
  });

  test('does not throw if no config file exists', () => {
    expect(() => clearConfig()).not.toThrow();
  });
});

describe('saveConfig / loadConfig roundtrip', () => {
  test('saves and reloads config correctly', () => {
    saveConfig({ accessUrl: 'https://example.com/api' });
    expect(loadConfig()).toEqual({ accessUrl: 'https://example.com/api' });
  });
});
