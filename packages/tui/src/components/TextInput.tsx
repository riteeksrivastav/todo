import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  placeholder?: string;
}

export function TextInput({ value, onChange, onSubmit, onCancel, placeholder }: Props) {
  const [cursor, setCursor] = useState(value.length);

  // keep cursor in range when value changes from outside (e.g. starting an edit)
  useEffect(() => {
    setCursor((c) => Math.min(c, value.length));
  }, [value.length]);

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }
    if (key.return) {
      onSubmit();
      return;
    }
    if (key.leftArrow) {
      setCursor((c) => Math.max(0, c - 1));
      return;
    }
    if (key.rightArrow) {
      setCursor((c) => Math.min(value.length, c + 1));
      return;
    }
    if (key.ctrl && input === 'a') { setCursor(0); return; }
    if (key.ctrl && input === 'e') { setCursor(value.length); return; }
    // On macOS terminals, the Backspace key sends DEL (0x7f) which Ink
    // reports as key.delete, so treat both as "delete char before cursor".
    if (key.backspace || key.delete) {
      if (cursor > 0) {
        onChange(value.slice(0, cursor - 1) + value.slice(cursor));
        setCursor((c) => c - 1);
      }
      return;
    }
    if (key.ctrl && (input === 'u' || input === 'w')) {
      onChange('');
      setCursor(0);
      return;
    }
    if (key.ctrl && input === 'k') {
      onChange(value.slice(0, cursor));
      return;
    }
    if (input && !key.ctrl && !key.meta) {
      onChange(value.slice(0, cursor) + input + value.slice(cursor));
      setCursor((c) => c + input.length);
    }
  });

  if (value.length === 0 && placeholder) {
    // cursor sits on the first placeholder char; rest of placeholder is dim
    const head = placeholder[0] ?? ' ';
    const tail = placeholder.slice(1);
    return (
      <Box>
        <Text backgroundColor="cyan" color="black">{head}</Text>
        <Text color="gray">{tail}</Text>
      </Box>
    );
  }

  const display = value.length === cursor ? value + ' ' : value;
  const colors = colorize(display);

  return (
    <Box>
      {Array.from(display).map((ch, i) => {
        const isCursor = i === cursor;
        return (
          <Text
            key={i}
            color={isCursor ? 'black' : colors[i]}
            backgroundColor={isCursor ? 'cyan' : undefined}
          >
            {ch}
          </Text>
        );
      })}
    </Box>
  );
}

function colorize(value: string): string[] {
  const colors: string[] = new Array(value.length).fill('white');
  const tokenRe = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = tokenRe.exec(value)) !== null) {
    const tok = m[0];
    const start = m.index;
    const color = tokenColor(tok);
    if (color) {
      for (let i = 0; i < tok.length; i++) colors[start + i] = color;
    }
  }
  return colors;
}

function tokenColor(tok: string): string | null {
  if (tok.length < 2) return null;
  if (tok.startsWith('#')) return 'magenta';
  if (tok.startsWith('^')) return 'yellow';
  if (tok.startsWith('!')) {
    const k = tok.slice(1).toLowerCase();
    if (k === 'high' || k === 'hi') return 'red';
    if (k === 'med' || k === 'medium') return 'yellow';
    if (k === 'low') return 'blue';
  }
  return null;
}
