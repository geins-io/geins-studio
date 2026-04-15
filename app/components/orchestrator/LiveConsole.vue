<script setup lang="ts">
import type { LiveConsoleLine } from '#shared/types';
import { LucideTrash2 } from '#components';

interface Props {
  streamUrl?: string | null;
  active?: boolean;
  seedLines?: LiveConsoleLine[];
  title?: string;
  liveTitle?: string;
  requestHeaders?: Record<string, string>;
}

const props = withDefaults(defineProps<Props>(), {
  streamUrl: null,
  active: false,
  seedLines: () => [],
  title: 'Console log',
  liveTitle: 'Live console',
  requestHeaders: () => ({}),
});

// Seed lines come from the parent (derived from upstream state) and may be
// replaced wholesale when the parent refetches. Stream lines are appended
// from the live fetch reader and must be preserved across seed updates.
const streamLines = ref<LiveConsoleLine[]>([]);
const consoleContainer = ref<HTMLElement | null>(null);
let streamCounter = 0;

const consoleLines = computed<LiveConsoleLine[]>(() => {
  const seed = props.seedLines.map((line, i) => ({ ...line, id: i + 1 }));
  return [...seed, ...streamLines.value];
});

const pad = (n: number, len = 2) => String(n).padStart(len, '0');
const formatTime = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
};

const scrollToBottom = () => {
  nextTick(() => {
    if (consoleContainer.value) {
      consoleContainer.value.scrollTop = consoleContainer.value.scrollHeight;
    }
  });
};

const pushStream = (line: Omit<LiveConsoleLine, 'id'>) => {
  streamLines.value.push({ ...line, id: ++streamCounter });
  scrollToBottom();
};

watch(() => props.seedLines, scrollToBottom, { immediate: true });

const detectLevel = (line: string): LiveConsoleLine['level'] => {
  const l = line.toLowerCase();
  if (l.includes('error') || l.includes('failed') || l.includes('✖')) return 'error';
  if (l.includes('warn')) return 'warn';
  if (l.includes('debug') || l.startsWith('tick')) return 'debug';
  return 'info';
};

const appendStreamLine = (raw: string) => {
  const line = raw.replace(/\r$/, '');
  if (!line) return;

  let timestamp = formatTime(new Date().toISOString());
  let level: LiveConsoleLine['level'] = detectLevel(line);
  let source = 'stream';
  let message = line;

  if (line.startsWith('{') && line.endsWith('}')) {
    try {
      const obj = JSON.parse(line) as Record<string, unknown>;
      if (typeof obj.message === 'string') message = obj.message;
      if (typeof obj.source === 'string') source = obj.source;
      else if (typeof obj.nodeId === 'string') source = obj.nodeId;
      if (typeof obj.timestamp === 'string') timestamp = formatTime(obj.timestamp);
      else if (typeof obj.time === 'string') timestamp = formatTime(obj.time);
      const lvl = String(obj.level ?? '').toLowerCase();
      if (lvl === 'info' || lvl === 'warn' || lvl === 'error' || lvl === 'debug') {
        level = lvl;
      }
    }
    catch {
      // keep raw line
    }
  }

  pushStream({ timestamp, level, source, message });
};

let streamController: AbortController | null = null;
let waitingTimer: ReturnType<typeof setTimeout> | null = null;
let streamOpened = false;

const clearWaitingTimer = () => {
  if (waitingTimer) {
    clearTimeout(waitingTimer);
    waitingTimer = null;
  }
};

const startLiveStream = async () => {
  if (streamController || !props.streamUrl) return;

  const controller = new AbortController();
  streamController = controller;
  streamOpened = false;

  waitingTimer = setTimeout(() => {
    if (!streamOpened) {
      pushStream({
        timestamp: formatTime(new Date().toISOString()),
        level: 'debug',
        source: 'stream',
        message: '… Waiting for stream (upstream has not flushed any data yet)',
      });
    }
  }, 3000);

  try {
    const res = await fetch(props.streamUrl, {
      signal: controller.signal,
      headers: props.requestHeaders,
    });

    streamOpened = true;
    clearWaitingTimer();

    if (!res.ok || !res.body) {
      pushStream({
        timestamp: formatTime(new Date().toISOString()),
        level: 'error',
        source: 'stream',
        message: `Stream unavailable: HTTP ${res.status}`,
      });
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    pushStream({
      timestamp: formatTime(new Date().toISOString()),
      level: 'info',
      source: 'stream',
      message: '● Connected to live stream',
    });

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newlineIdx;
      while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIdx);
        buffer = buffer.slice(newlineIdx + 1);
        if (line.trim()) appendStreamLine(line);
      }
    }

    if (buffer.trim()) appendStreamLine(buffer);
  }
  catch (err) {
    if ((err as Error).name !== 'AbortError') {
      appendStreamLine(`Stream error: ${(err as Error).message}`);
    }
  }
  finally {
    if (streamController === controller) streamController = null;
  }
};

const stopLiveStream = () => {
  clearWaitingTimer();
  streamOpened = false;
  if (streamController) {
    streamController.abort();
    streamController = null;
  }
};

watch(
  () => props.active,
  (running) => {
    if (running) startLiveStream();
    else stopLiveStream();
  },
  { immediate: true },
);

onBeforeUnmount(stopLiveStream);

const clearConsole = () => {
  streamLines.value = [];
  streamCounter = 0;
};
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden rounded-lg border bg-zinc-950 text-zinc-100">
    <div class="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
      <div class="flex items-center gap-2">
        <div
          class="h-2 w-2 rounded-full"
          :class="active ? 'animate-pulse bg-green-400' : 'bg-zinc-600'"
        />
        <h2 class="text-sm font-medium text-zinc-200">
          {{ active ? liveTitle : title }}
        </h2>
        <span class="text-xs text-zinc-500">
          {{ consoleLines.length }} lines
        </span>
      </div>
      <button
        class="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
        title="Clear console"
        @click="clearConsole"
      >
        <LucideTrash2 class="h-3.5 w-3.5" />
      </button>
    </div>
    <div
      ref="consoleContainer"
      class="flex-1 overflow-y-auto p-3 font-mono text-xs leading-relaxed"
    >
      <div v-if="consoleLines.length === 0" class="text-zinc-600">
        No output
      </div>
      <div v-for="line in consoleLines" :key="line.id" class="flex gap-2">
        <span class="shrink-0 text-zinc-600">{{ line.timestamp }}</span>
        <span
          class="w-10 shrink-0 uppercase"
          :class="{
            'text-zinc-500': line.level === 'debug',
            'text-blue-400': line.level === 'info',
            'text-yellow-400': line.level === 'warn',
            'text-red-400': line.level === 'error',
          }"
        >
          {{ line.level }}
        </span>
        <span class="w-32 shrink-0 truncate text-zinc-500">{{ line.source }}</span>
        <span class="flex-1 break-all text-zinc-200">{{ line.message }}</span>
      </div>
    </div>
  </div>
</template>
