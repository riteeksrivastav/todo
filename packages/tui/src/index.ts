import React from 'react';
import { render } from 'ink';
import { App } from './App.js';

export function startTUI(): Promise<void> {
  if (!process.stdout.isTTY) {
    console.error('todo tui requires an interactive terminal.');
    process.exit(1);
  }
  const instance = render(React.createElement(App), {
    exitOnCtrlC: true,
  });
  return instance.waitUntilExit();
}
