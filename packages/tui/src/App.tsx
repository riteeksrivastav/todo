import React, { useEffect, useMemo, useState } from 'react';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Box, Text, useApp, useInput, useStdout } from 'ink';
import {
  addDays,
  addTodo,
  deleteTodo,
  groupByDate,
  listTodos,
  loadConfig,
  markDone,
  restoreTodo,
  sortForDate,
  todayISO,
  updateTodo,
  isValidDate,
  type Config,
  type Priority,
  type SortMode,
  type Todo,
} from '@todo/core';
import { TodoRow } from './components/TodoRow.js';
import { TextInput } from './components/TextInput.js';
import { HelpBar } from './components/HelpBar.js';
import { HelpScreen } from './components/HelpScreen.js';
import { dateLabel, fullDateLabel } from './lib/dates.js';
import { parseAdd } from './lib/parseAdd.js';

type Pane = 'today' | 'side';
type Mode = 'normal' | 'add' | 'editContent' | 'editFull' | 'help';
type EditStep = 'content' | 'date' | 'tags' | 'priority';

interface FlatItem {
  kind: 'header' | 'todo';
  date: string;
  todo?: Todo;
}

const SORT_KEY = 'sortMode';

export function App() {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [cols, setCols] = useState(stdout.columns ?? 100);
  const [rows, setRows] = useState(stdout.rows ?? 30);

  useEffect(() => {
    const handler = () => {
      setCols(stdout.columns ?? 100);
      setRows(stdout.rows ?? 30);
    };
    stdout.on('resize', handler);
    return () => { stdout.off('resize', handler); };
  }, [stdout]);

  const [config] = useState<Config>(() => loadConfig());
  const [today] = useState<string>(() => todayISO());
  const [windowDays, setWindowDays] = useState<number>(7);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [sortMode, setSortMode] = useState<SortMode>(() => readSort(config));
  const [pane, setPane] = useState<Pane>('today');
  const [zoomed, setZoomed] = useState(false);
  const [mode, setMode] = useState<Mode>('normal');
  const [todaySel, setTodaySel] = useState(0);
  const [sideSel, setSideSel] = useState(0);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStep, setEditStep] = useState<EditStep>('content');
  const [editDraft, setEditDraft] = useState('');
  const [editPatch, setEditPatch] = useState<{
    content: string;
    date: string;
    tags: string[];
    priority: Priority | null;
  }>({ content: '', date: '', tags: [], priority: null });
  const [pendingDelete, setPendingDelete] = useState<Todo | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  async function reload() {
    try {
      const from = addDays(today, -windowDays);
      const to = addDays(today, windowDays);
      const list = await listTodos(config, { from, to });
      setTodos(list);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => { void reload(); }, [windowDays]);

  // auto-clear flash and pendingDelete after 5s
  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(null), 2500);
    return () => clearTimeout(id);
  }, [flash]);
  useEffect(() => {
    if (!pendingDelete) return;
    const id = setTimeout(() => setPendingDelete(null), 5000);
    return () => clearTimeout(id);
  }, [pendingDelete]);

  // ---- derived ----
  const todayList = useMemo(
    () => sortForDate(todos.filter((t) => t.date === today), sortMode),
    [todos, today, sortMode],
  );

  const sideFlat = useMemo<FlatItem[]>(() => {
    const future = todos.filter((t) => t.date > today);
    const past = todos.filter((t) => t.date < today);
    const futureGroups = [...groupByDate(future, sortMode).entries()].sort(
      (a, b) => a[0].localeCompare(b[0]),
    );
    const pastGroups = [...groupByDate(past, sortMode).entries()].sort(
      (a, b) => b[0].localeCompare(a[0]),
    );

    const out: FlatItem[] = [];
    if (futureGroups.length) {
      out.push({ kind: 'header', date: '__upcoming__' });
      for (const [d, items] of futureGroups) {
        out.push({ kind: 'header', date: d });
        for (const t of items) out.push({ kind: 'todo', date: d, todo: t });
      }
    }
    if (pastGroups.length) {
      out.push({ kind: 'header', date: '__past__' });
      for (const [d, items] of pastGroups) {
        out.push({ kind: 'header', date: d });
        for (const t of items) out.push({ kind: 'todo', date: d, todo: t });
      }
    }
    return out;
  }, [todos, today, sortMode]);

  const sideTodoIndices = useMemo(
    () => sideFlat.map((item, i) => (item.kind === 'todo' ? i : -1)).filter((i) => i >= 0),
    [sideFlat],
  );

  // clamp selection
  useEffect(() => {
    if (todaySel >= todayList.length) setTodaySel(Math.max(0, todayList.length - 1));
  }, [todayList.length, todaySel]);
  useEffect(() => {
    if (sideSel >= sideTodoIndices.length) setSideSel(Math.max(0, sideTodoIndices.length - 1));
  }, [sideTodoIndices.length, sideSel]);

  function selectedTodo(): Todo | null {
    if (pane === 'today') return todayList[todaySel] ?? null;
    const flatIdx = sideTodoIndices[sideSel];
    if (flatIdx === undefined) return null;
    const item = sideFlat[flatIdx];
    return item?.todo ?? null;
  }

  function moveSel(delta: number) {
    if (pane === 'today') {
      if (todayList.length === 0) return;
      setTodaySel((s) => clamp(s + delta, 0, todayList.length - 1));
    } else {
      if (sideTodoIndices.length === 0) return;
      setSideSel((s) => clamp(s + delta, 0, sideTodoIndices.length - 1));
    }
  }

  function cycleSort() {
    const next: SortMode = sortMode === 'created' ? 'priority' : 'created';
    setSortMode(next);
    writeSort(config, next);
    setFlash(`sort: ${next}`);
  }

  // ---- key handling ----
  useInput((input, key) => {
    // priority step in the structured editor handles its own keys here
    if (mode === 'editFull' && editStep === 'priority') {
      if (key.escape) { cancelInput(); return; }
      const ch = (input ?? '').toLowerCase();
      if (ch === 'h') { void commitEditFull('high'); return; }
      if (ch === 'm') { void commitEditFull('medium'); return; }
      if (ch === 'l') { void commitEditFull('low'); return; }
      if (ch === 'n' || key.return) { void commitEditFull(null); return; }
      return;
    }
    if (mode !== 'normal') return; // input components own their keys

    // special keys (only meaningful when no plain chars accompanied them)
    if (!input) {
      if (key.escape) { exit(); return; }
      if (key.tab) {
        setPane((p) => (p === 'today' ? 'side' : 'today'));
        setZoomed(false);
        return;
      }
      if (key.upArrow) return moveSel(-1);
      if (key.downArrow) return moveSel(1);
      return;
    }

    // process character-by-character — input may be a multi-char chunk
    for (let i = 0; i < input.length; i++) {
      const ch = input[i]!;
      const result = handleChar(ch);
      if (result === 'exit') return;
      if (result === 'add' || result === 'edit') {
        // remaining chars become the initial draft for the new input mode,
        // so paste/fast-type doesn't fall through to other commands
        let rest = input.slice(i + 1);
        // newline / CR ends the draft and auto-submits, matching the user's
        // expectation when they paste "text\n" or type quickly
        const nl = rest.search(/[\r\n]/);
        const submit = nl >= 0;
        if (submit) rest = rest.slice(0, nl);
        if (rest.length > 0) {
          if (result === 'add') setDraft(rest);
          else setDraft((d) => d + rest);
        }
        if (submit) {
          if (result === 'add') {
            void commitAdd(rest);
          } else {
            const t = selectedTodo();
            void commitEdit(rest, t?.id);
          }
        }
        return;
      }
    }
  });

  function handleChar(ch: string): 'exit' | 'add' | 'edit' | null {
    if (ch === 'q') { exit(); return 'exit'; }
    if (ch === '?' || ch === 'h') { setMode('help'); return null; }
    if (ch === 'k') { moveSel(-1); return null; }
    if (ch === 'j') { moveSel(1); return null; }
    if (ch === 'a') { setDraft(''); setMode('add'); return 'add'; }
    if (ch === 'e') {
      const t = selectedTodo();
      if (t) {
        setEditingId(t.id);
        setDraft(t.content);
        setMode('editContent');
        return 'edit';
      }
      return null;
    }
    if (ch === 'E') {
      const t = selectedTodo();
      if (t) {
        setEditingId(t.id);
        setEditPatch({ content: t.content, date: t.date, tags: [...t.tags], priority: t.priority ?? null });
        setEditDraft(t.content);
        setEditStep('content');
        setMode('editFull');
      }
      return null;
    }
    if (ch === ' ' || ch === 'x') {
      const t = selectedTodo();
      if (t) void markDone(config, t.id, !t.done).then(reload);
      return null;
    }
    if (ch === 'd') {
      const t = selectedTodo();
      if (t) {
        void deleteTodo(config, t.id).then((removed) => {
          setPendingDelete(removed);
          setFlash(`deleted "${truncate(removed.content, 30)}" — u to undo`);
          return reload();
        });
      }
      return null;
    }
    if (ch === 'u') {
      if (pendingDelete) {
        const todo = pendingDelete;
        setPendingDelete(null);
        void restoreTodo(config, todo).then(reload);
      }
      return null;
    }
    if (ch === 's') { cycleSort(); return null; }
    if (ch === 'z') { setZoomed((z) => !z); return null; }
    if (ch === '+') { setWindowDays((w) => (w === 7 ? 30 : w)); setFlash('window: ±30 days'); return null; }
    if (ch === '-') { setWindowDays((w) => (w === 30 ? 7 : w)); setFlash('window: ±7 days'); return null; }
    if (ch === 'r') { setFlash('reloaded'); void reload(); return null; }
    return null;
  }

  // sub-mode handlers (their inputs run via TextInput's useInput)
  async function commitAdd(textOverride?: string) {
    const fallback = pane === 'today'
      ? today
      : selectedTodo()?.date ?? today;
    const text = textOverride ?? draft;
    const parsed = parseAdd(text, fallback);
    if (!parsed) {
      setMode('normal');
      return;
    }
    await addTodo(config, parsed);
    setDraft('');
    setMode('normal');
    await reload();
  }

  async function commitEdit(textOverride?: string, idOverride?: string) {
    const id = idOverride ?? editingId;
    if (!id) {
      setMode('normal');
      return;
    }
    const content = (textOverride ?? draft).trim();
    if (content) {
      await updateTodo(config, id, { content });
    }
    setEditingId(null);
    setDraft('');
    setMode('normal');
    await reload();
  }

  function cancelInput() {
    setDraft('');
    setEditDraft('');
    setEditingId(null);
    setMode('normal');
  }

  function advanceEditStep() {
    const value = editDraft;
    if (editStep === 'content') {
      const content = value.trim();
      if (!content) { setFlash('content cannot be empty'); return; }
      setEditPatch((p) => ({ ...p, content }));
      setEditDraft(editPatch.date);
      setEditStep('date');
      return;
    }
    if (editStep === 'date') {
      const d = value.trim();
      if (!isValidDate(d)) { setFlash(`invalid date: ${d}`); return; }
      setEditPatch((p) => ({ ...p, date: d }));
      setEditDraft(editPatch.tags.map((t) => `#${t}`).join(' '));
      setEditStep('tags');
      return;
    }
    if (editStep === 'tags') {
      const tags = value
        .split(/\s+/)
        .map((t) => t.replace(/^#/, '').trim())
        .filter(Boolean);
      setEditPatch((p) => ({ ...p, tags }));
      setEditDraft('');
      setEditStep('priority');
      return;
    }
  }

  async function commitEditFull(priority: Priority | null) {
    const id = editingId;
    if (!id) { setMode('normal'); return; }
    await updateTodo(config, id, {
      content: editPatch.content,
      date: editPatch.date,
      tags: editPatch.tags,
      priority,
    });
    setEditingId(null);
    setEditDraft('');
    setEditStep('content');
    setMode('normal');
    await reload();
  }

  // ---- layout ----
  const stacked = cols < 100;
  const showToday = !zoomed || pane === 'today';
  const showSide = !zoomed || pane === 'side';
  const sideWidth = zoomed ? cols : (stacked ? cols : Math.floor(cols / 2));
  const todayWidth = zoomed ? cols : (stacked ? cols : cols - sideWidth);
  const bodyHeight = Math.max(8, rows - 6);

  return (
    <Box flexDirection="column" width={cols} height={rows}>
      {/* header */}
      <Box paddingX={1} justifyContent="space-between">
        <Box>
          <Text bold color="white">todo </Text>
          <Text color="gray">— {fullDateLabel(today)}</Text>
        </Box>
        <Box>
          {zoomed && <Text color="cyan">[zoomed] </Text>}
          <Text color="gray">sort: </Text>
          <Text color="cyan">{sortMode}</Text>
          <Text color="gray">  window: ±{windowDays}d</Text>
        </Box>
      </Box>

      {error && (
        <Box paddingX={1}><Text color="red">error: {error}</Text></Box>
      )}

      {mode === 'help' ? (
        <Box flexGrow={1}><HelpScreen /></Box>
      ) : (
        <Box flexDirection={stacked ? 'column' : 'row'} flexGrow={1} paddingX={1}>
          {/* today pane */}
          {showToday && (
          <Box
            flexDirection="column"
            width={todayWidth - 2}
            borderStyle={pane === 'today' ? 'round' : 'single'}
            borderColor={pane === 'today' ? 'cyan' : 'gray'}
            paddingX={1}
            height={bodyHeight}
          >
            <Box>
              <Text bold>Today</Text>
              <Text color="gray">  ({todayList.filter((t) => !t.done).length} open)</Text>
            </Box>
            <Box flexDirection="column" marginTop={1} flexGrow={1}>
              {todayList.length === 0 ? (
                <Text color="gray">nothing for today.</Text>
              ) : (
                todayList.map((t, i) => (
                  <TodoRow
                    key={t.id}
                    todo={t}
                    selected={pane === 'today' && i === todaySel}
                  />
                ))
              )}
            </Box>
          </Box>
          )}

          {/* side pane */}
          {showSide && (
          <Box
            flexDirection="column"
            width={sideWidth - 2}
            borderStyle={pane === 'side' ? 'round' : 'single'}
            borderColor={pane === 'side' ? 'cyan' : 'gray'}
            paddingX={1}
            height={bodyHeight}
          >
            <Box>
              <Text bold>Upcoming & Past</Text>
              <Text color="gray">  (±{windowDays}d)</Text>
            </Box>
            <Box flexDirection="column" marginTop={1} flexGrow={1}>
              {sideFlat.length === 0 ? (
                <Text color="gray">no other todos in window.</Text>
              ) : (
                sideFlat.map((item, i) => {
                  if (item.kind === 'header') {
                    if (item.date === '__upcoming__') {
                      return <Text key={`h-up-${i}`} color="yellow" bold>Upcoming</Text>;
                    }
                    if (item.date === '__past__') {
                      return <Text key={`h-past-${i}`} color="yellow" bold>Past</Text>;
                    }
                    return (
                      <Text key={`h-${item.date}`} color="cyan">
                        {dateLabel(item.date, today)} {`(${item.date})`}
                      </Text>
                    );
                  }
                  const flatIdx = sideTodoIndices.indexOf(i);
                  const sel = pane === 'side' && flatIdx === sideSel;
                  return <TodoRow key={item.todo!.id} todo={item.todo!} selected={sel} />;
                })
              )}
            </Box>
          </Box>
          )}
        </Box>
      )}

      {/* footer area */}
      <Box paddingX={1} flexDirection="column">
        {mode === 'add' && (
          <Box>
            <Text color="cyan">add  </Text>
            <TextInput
              value={draft}
              onChange={setDraft}
              onSubmit={commitAdd}
              onCancel={cancelInput}
              placeholder="buy milk #grocery !high ^tomorrow"
            />
          </Box>
        )}
        {mode === 'editContent' && (
          <Box>
            <Text color="cyan">edit </Text>
            <TextInput
              value={draft}
              onChange={setDraft}
              onSubmit={commitEdit}
              onCancel={cancelInput}
            />
          </Box>
        )}
        {mode === 'editFull' && editStep !== 'priority' && (
          <Box>
            <Text color="cyan">{editStepLabel(editStep)} </Text>
            <TextInput
              value={editDraft}
              onChange={setEditDraft}
              onSubmit={advanceEditStep}
              onCancel={cancelInput}
              placeholder={editStepPlaceholder(editStep)}
            />
          </Box>
        )}
        {mode === 'editFull' && editStep === 'priority' && (
          <Box>
            <Text color="cyan">priority </Text>
            <Text color="gray">
              <Text color="red">h</Text>igh / <Text color="yellow">m</Text>ed / <Text color="blue">l</Text>ow / <Text color="white">n</Text>one
            </Text>
          </Box>
        )}
        {mode === 'normal' && flash && (
          <Box>
            <Text color="green">{flash}</Text>
          </Box>
        )}
        <HelpBar mode={helpBarMode(mode)} />
      </Box>
    </Box>
  );
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function editStepLabel(step: EditStep): string {
  if (step === 'content') return 'content ';
  if (step === 'date') return 'date    ';
  if (step === 'tags') return 'tags    ';
  return 'priority';
}

function editStepPlaceholder(step: EditStep): string {
  if (step === 'date') return 'YYYY-MM-DD';
  if (step === 'tags') return '#work #urgent (space separated)';
  return '';
}

function helpBarMode(m: Mode): 'normal' | 'add' | 'edit' | 'help' {
  if (m === 'editContent' || m === 'editFull') return 'edit';
  if (m === 'add') return 'add';
  if (m === 'help') return 'help';
  return 'normal';
}


function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + '…';
}

function stateFile(config: Config): string {
  return join(config.dataDir, '.tui-state.json');
}

function readSort(config: Config): SortMode {
  try {
    const file = stateFile(config);
    if (existsSync(file)) {
      const raw = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
      if (raw[SORT_KEY] === 'priority' || raw[SORT_KEY] === 'created') return raw[SORT_KEY];
    }
  } catch {}
  return 'created';
}

function writeSort(config: Config, mode: SortMode): void {
  try {
    const file = stateFile(config);
    let data: Record<string, unknown> = {};
    if (existsSync(file)) {
      try { data = JSON.parse(readFileSync(file, 'utf8')); } catch {}
    }
    data[SORT_KEY] = mode;
    writeFileSync(file, JSON.stringify(data, null, 2));
  } catch {}
}
