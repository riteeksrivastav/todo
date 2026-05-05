import React from 'react';
import { Box, Text } from 'ink';

interface Props {
  mode: 'normal' | 'add' | 'edit' | 'help';
}

export function HelpBar({ mode }: Props) {
  if (mode === 'add') {
    return (
      <Box>
        <Text color="gray">
          <Text color="cyan">enter</Text> save  <Text color="cyan">esc</Text> cancel
          <Text dimColor> use #tag !high ^tomorrow inline</Text>
        </Text>
      </Box>
    );
  }
  if (mode === 'edit') {
    return (
      <Box>
        <Text color="gray">
          <Text color="cyan">enter</Text> next/save  <Text color="cyan">esc</Text> cancel
        </Text>
      </Box>
    );
  }
  if (mode === 'help') {
    return (
      <Box>
        <Text color="gray">
          <Text color="cyan">?</Text> close help
        </Text>
      </Box>
    );
  }
  return (
    <Box>
      <Text color="gray">
        <Text color="cyan">↑↓/jk</Text> move  <Text color="cyan">tab</Text> pane  <Text color="cyan">z</Text> zoom
        <Text color="cyan"> a</Text> add  <Text color="cyan">e</Text> edit
        <Text color="cyan"> space</Text> done  <Text color="cyan">d</Text> del
        <Text color="cyan"> u</Text> undo  <Text color="cyan">s</Text> sort
        <Text color="cyan"> r</Text> refresh  <Text color="cyan">?</Text> help  <Text color="cyan">q</Text> quit
      </Text>
    </Box>
  );
}
