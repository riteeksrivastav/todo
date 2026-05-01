import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import kleur from 'kleur';
import {
  configExists,
  DEFAULT_CONFIG,
  ensureDataDir,
  loadConfig,
  saveConfig,
  todayISO,
  monthKey,
} from '@todo/core';

interface Opts {
  dataDir?: string;
  port?: number;
  force?: boolean;
}

export function initCommand(opts: Opts): void {
  if (configExists() && !opts.force) {
    const existing = loadConfig();
    console.log(kleur.yellow('config already exists at ~/.todo/config.json'));
    console.log(`  dataDir:    ${existing.dataDir}`);
    console.log(`  serverPort: ${existing.serverPort}`);
    console.log('use --force to overwrite');
    return;
  }
  const config = {
    dataDir: opts.dataDir ?? DEFAULT_CONFIG.dataDir,
    serverPort: opts.port ?? DEFAULT_CONFIG.serverPort,
  };
  saveConfig(config);
  ensureDataDir(config);
  const month = monthKey(todayISO());
  const monthFile = join(config.dataDir, `${month}.jsonl`);
  if (!existsSync(monthFile)) {
    mkdirSync(config.dataDir, { recursive: true });
    writeFileSync(monthFile, '', 'utf8');
  }
  console.log(kleur.green('initialized.'));
  console.log(`  config:  ~/.todo/config.json`);
  console.log(`  dataDir: ${config.dataDir}`);
  console.log(`  port:    ${config.serverPort}`);
  console.log(`  month:   ${monthFile}`);
}
