import React from 'react';
import { Box, Text, useInput } from 'ink';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  placeholder?: string;
}

export function TextInput({ value, onChange, onSubmit, onCancel, placeholder }: Props) {
  useInput((input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }
    if (key.return) {
      onSubmit();
      return;
    }
    if (key.backspace || key.delete) {
      if (value.length > 0) onChange(value.slice(0, -1));
      return;
    }
    if (key.ctrl && (input === 'u' || input === 'w')) {
      onChange('');
      return;
    }
    if (input && !key.ctrl && !key.meta) {
      onChange(value + input);
    }
  });

  const display = value.length > 0 ? value : (placeholder ?? '');
  const dim = value.length === 0;
  return (
    <Box>
      <Text color={dim ? 'gray' : 'white'}>{display}</Text>
      <Text color="cyan">{'█'}</Text>
    </Box>
  );
}
