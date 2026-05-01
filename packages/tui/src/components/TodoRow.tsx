import React from 'react';
import { Box, Text } from 'ink';
import type { Todo } from '@todo/core';

interface Props {
  todo: Todo;
  selected: boolean;
  width?: number;
}

const PRIORITY_COLORS = {
  high: 'red',
  medium: 'yellow',
  low: 'blue',
} as const;

export function TodoRow({ todo, selected, width }: Props) {
  const checkbox = todo.done ? '✓' : '◯';
  const color = todo.done ? 'gray' : 'white';

  return (
    <Box>
      <Text color={selected ? 'cyan' : 'gray'}>{selected ? '▶ ' : '  '}</Text>
      <Text color={todo.done ? 'green' : 'gray'}>{checkbox} </Text>
      <Box flexGrow={1} flexShrink={1} overflow="hidden">
        <Text color={color} strikethrough={todo.done} wrap="truncate-end">
          {todo.content}
        </Text>
        {todo.priority && (
          <Text color={PRIORITY_COLORS[todo.priority]}>{` !${shortPrio(todo.priority)}`}</Text>
        )}
        {todo.tags.length > 0 && (
          <Text color="magenta">{` ${todo.tags.map((t) => `#${t}`).join(' ')}`}</Text>
        )}
        {todo.originalDate && todo.originalDate !== todo.date && (
          <Text color="yellow">{` (${todo.originalDate})`}</Text>
        )}
      </Box>
    </Box>
  );
}

function shortPrio(p: 'high' | 'medium' | 'low'): string {
  return p === 'medium' ? 'med' : p;
}
