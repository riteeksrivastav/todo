import React from 'react';
import { Box, Text } from 'ink';

const KEYS: Array<[string, string]> = [
  ['↑ ↓ j k', 'move selection up/down'],
  ['tab',     'switch between Today and Side panes'],
  ['z',       'zoom focused pane to fullscreen (toggle)'],
  ['a',       'add new todo (inline at bottom)'],
  ['e',       'edit content inline'],
  ['E',       'edit full (content / date / tags / priority)'],
  ['space x', 'toggle done'],
  ['d',       'delete (press u to undo within 5s)'],
  ['u',       'undo last delete'],
  ['s',       'cycle sort: created → priority'],
  ['+',       'expand window (today + 30 days each side)'],
  ['-',       'shrink window (today + 7 days each side)'],
  ['r',       'reload from disk'],
  ['? h',     'toggle this help'],
  ['q esc',   'quit'],
];

export function HelpScreen() {
  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">Keyboard shortcuts</Text>
      </Box>
      {KEYS.map(([k, desc]) => (
        <Box key={k}>
          <Box width={12}><Text color="cyan">{k}</Text></Box>
          <Text color="gray">{desc}</Text>
        </Box>
      ))}
      <Box marginTop={1}>
        <Text dimColor>add bar tokens: </Text>
        <Text color="magenta">#tag</Text>
        <Text dimColor> </Text>
        <Text color="red">!high</Text>
        <Text dimColor>/!med/!low </Text>
        <Text color="yellow">^tomorrow</Text>
        <Text dimColor>/^YYYY-MM-DD</Text>
      </Box>
    </Box>
  );
}
