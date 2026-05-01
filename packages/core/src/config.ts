import { homedir } from 'node:os';
import { join } from 'node:path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import type { Config } from './types.js';

const DEFAULT_DIR = join(homedir(), '.todo');
const CONFIG_FILENAME = 'config.json';

export const DEFAULT_CONFIG: Config = {
  dataDir: DEFAULT_DIR,
  serverPort: 4567,
};

function defaultConfigPath(): string {
  return join(DEFAULT_DIR, CONFIG_FILENAME);
}

export function loadConfig(): Config {
  const path = defaultConfigPath();
  if (!existsSync(path)) return DEFAULT_CONFIG;
  try {
    const raw = readFileSync(path, 'utf8');
    const parsed = JSON.parse(raw) as Partial<Config>;
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: Config): void {
  if (!existsSync(DEFAULT_DIR)) mkdirSync(DEFAULT_DIR, { recursive: true });
  writeFileSync(defaultConfigPath(), JSON.stringify(config, null, 2) + '\n', 'utf8');
}

export function configExists(): boolean {
  return existsSync(defaultConfigPath());
}

export function ensureDataDir(config: Config): void {
  if (!existsSync(config.dataDir)) mkdirSync(config.dataDir, { recursive: true });
}
