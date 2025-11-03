// src/renderer/presence-from-gep.ts
const FORCE_DEBUG = false; // <- set to true to show presence even in menus

type GameType = 'UNRANKED' | 'COMPETITIVE' | 'ARCADE' | 'CUSTOM' | string;

const GAME_MODE_MAP: Record<string, string> = {
  // Fill as you discover IDs. Examples you can tweak:
  '320': 'Quick Play',
  '500': 'Competitive',
  '410': 'Arcade',
  '900': 'Custom Game',
};

function prettifyQueue(q?: string) {
  const queue = q ? q.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';
  return toTitle(queue);
}

function toTitle(s?: string) {
  if (!s) return '';
  return String(s)
    .toLowerCase()
    .split(/[_\s]+/)
    .map(w => w ? w[0].toUpperCase() + w.slice(1) : '')
    .join(' ')
}


function resolveModeLabel(gameType?: string, queueType?: string, gameModeId?: string) {
  // Prefer textual gameType when available
  if (gameType) {
    const gt = gameType.toUpperCase();
    if (gt === 'COMPETITIVE') {
      return queueType ? `Competitive : ${prettifyQueue(queueType)}` : 'Competitive';
    }
    if (gt === 'UNRANKED') {
      return queueType ? `Quick Play : ${prettifyQueue(queueType)}` : 'Quick Play';
    }
    if (gt === 'PRACTICE') {
      return queueType ? `Practice Range` : 'Practice Range';
    }
    if (gt === 'CUSTOM_GAME') {
      return queueType ? `Custom Game : ${prettifyQueue(queueType)}` : 'Custom Game';
    }
  }
  // Fall back to numeric game_mode
  if (gameModeId && GAME_MODE_MAP[gameModeId]) return GAME_MODE_MAP[gameModeId];
  return 'Unknown mode';
}

type PresenceState = {
  inMatch: boolean;
  startedAt: number | null;
  gameType: GameType | '';
  queueType: string | '';
  map: string | '';
  rank: string | '';
};

const state: PresenceState = {
  inMatch: false,
  startedAt: null,
  gameType: '',
  queueType: '',
  map: '',
  rank: ''
};

const MAP_NAMES: Record<string, string> = {
  '91': 'Temple of Anubis',
  '212': 'King\'s Row',
  '475': 'Volskaya Industries',
  '1207': 'Nepal',
  '1467': 'Route 66',
  '1634': 'Lijiang Tower',
  '1672': 'Practice Range',
  '1677': 'Eichenwalde',
  '2018': 'Busan',
  '2161': 'Rialto',
  '2193': 'Paris',
  '3390': 'Suravasa',
  '3893': 'Aatlis',
};

const MAP_ICONS: Record<string, string> = {
  '91': 'anubis',
  '212': 'kings_row',
  '475': 'volskaya',
  '1207': 'nepal',
  '1467': 'route_66',
  '1634': 'lijiang',
  '1672': 'practice_range',
  '1677': 'eichenwalde',
  '2018': 'busan',
  '2161': 'rialto',
  '2193': 'paris',
  '3390': 'suravasa',
  '3893': 'aatlis',
};

function mapName(v: string | undefined | null) {
  return v ? (MAP_NAMES[String(v)] ?? String(v)) : undefined;
}

function mapIcon(v: string | undefined | null) {
  return v ? (MAP_ICONS[String(v)] ?? 'ow2') : 'ow2';
}

function modeLabel(gt?: string, qt?: string) {
  if (!gt) return 'Unknown mode';
  const g = gt.toUpperCase();
  if (g === 'COMPETITIVE' && qt) return `Competitive : ${qt.replace(/_/g, ' ')}`;
  if (g === 'UNRANKED'    && qt) return `Quick Play : ${qt.replace(/_/g, ' ')}`;
  return g.charAt(0) + g.slice(1).toLowerCase();
}
function rankKey(rank?: string) {
  if (!rank) return undefined;
  const base = rank.toLowerCase().split(' ')[0];
  return ['bronze','silver','gold','platinum','diamond','master','grandmaster','champion'].includes(base) ? base : undefined;
}

let lastJSON = '';
let scheduled = false;
function scheduleUpdate() {
  if (scheduled) return;
  scheduled = true;
  setTimeout(() => { scheduled = false; pushPresence(); }, 150);
}

function pushPresence() {
  const active = state.inMatch || FORCE_DEBUG;
  if (!active) return;

  const mode = resolveModeLabel(state.gameType, state.queueType, (state as any).gameModeId);

  const activity: any = {
    details: mapName(state.map) ? `On ${mapName(state.map)}` : `On ${state.map || 'Unknown map'}`,
    state: mode,
    startTimestamp: state.startedAt ?? Math.floor(Date.now() / 1000),
    largeImageKey: mapIcon(state.map),
    largeImageText: 'Overwatch 2',
    instance: true
  };

  // rank icon logic stays the same...
  const json = JSON.stringify(activity);
  if (json === lastJSON) return;
  lastJSON = json;
  console.log('[Presence] setActivity', activity);
  // @ts-ignore
  window.discord?.setActivity?.(activity);
}

function clearPresence() {
  lastJSON = '';
  console.log('[Presence] clearActivity');
  // @ts-ignore
  window.discord?.clearActivity?.();
}

// ------- message parsing -------
function tryParseJSON(x: any) {
  try { return typeof x === 'string' ? JSON.parse(x) : x; } catch { return x; }
}

function handleNewEventsPayload(payload: any) {
  const events = payload?.events ?? payload;
  if (!Array.isArray(events)) return;

  console.log('[Presence] onNewEvents', events);

  for (const e of events) {
    const name = e?.name || e?.event || e?.type;
    if (!name) continue;

    if (name === 'match_start') {
      state.inMatch = true;
      if (!state.startedAt) state.startedAt = Math.floor(Date.now() / 1000);
      scheduleUpdate();
    } else if (name === 'match_end') {
      state.inMatch = false;
      state.startedAt = null;
      clearPresence();
    }
  }
}

function readAny(obj: any, keys: string[]): any {
  if (!obj) return undefined;
  // case-insensitive & underscore/camel variants
  const norm = (s: string) => String(s).toLowerCase().replace(/[\s_-]/g, '');
  const table: Record<string,string> = {};
  Object.keys(obj).forEach(k => table[norm(k)] = k);
  for (const k of keys) {
    const hit = table[norm(k)];
    if (hit in obj) return obj[hit];
  }
  return undefined;
}

// NEW: normalize a getInfo() result into the same handler paths
function ingestGetInfo(res: any) {
  const gi = res?.res?.game_info ?? res?.game_info ?? {};
  const mi = res?.res?.match_info ?? res?.match_info ?? {};

  console.log('[Presence] poll getInfo ->', { gi, mi });

  // Try both sections & multiple spellings
  const gameType   = readAny(gi, ['game_type', 'gametype', 'game type']) ?? readAny(mi, ['game_type','gametype']);
  const queueType  = readAny(gi, ['game_queue_type','queue_type','queueType']) ?? readAny(mi, ['game_queue_type']);
  const gameModeId = String(
    readAny(gi, ['game_mode','gamemode','mode_id']) ??
    readAny(mi, ['game_mode','mode','mode_id']) ?? ''
  ) || undefined;

  const rank       = readAny(gi, ['rank','competitive_tier','competitiveTier']) ?? readAny(mi, ['rank','competitive_tier']);
  const mapVal     = readAny(mi, ['map','map_id','mapId']) ?? readAny(gi, ['map']);

  const gameState  = readAny(mi, ['game_state','gamestate','state']) ?? readAny(gi, ['game_state']);

  if (gameType)  state.gameType = String(gameType);
  if (queueType) state.queueType = String(queueType);
  if (rank)      state.rank = String(rank);
  if (gameModeId) (state as any).gameModeId = gameModeId;
  if (mapVal)    state.map = String(mapVal);

  if (gameState) {
    const inProgress = String(gameState).toLowerCase() === 'match_in_progress';
    if (inProgress && !state.inMatch) {
      state.inMatch = true;
      if (!state.startedAt) state.startedAt = Math.floor(Date.now() / 1000);
    } else if (!inProgress && state.inMatch) {
      state.inMatch = false;
      state.startedAt = null;
      clearPresence();
    }
  }

  scheduleUpdate();
}

export function initPresencePolling(intervalMs = 2000) {
  console.log('[Presence] polling init');
  let timer: any = null;

  const tick = async () => {
    try {
      // @ts-ignore
      const res = await window.gep?.getInfo?.();
      if (res) ingestGetInfo(res);
    } catch (e) {
      console.warn('[Presence] polling getInfo failed', e);
    } finally {
      timer = setTimeout(tick, intervalMs);
    }
  };

  tick();

  return () => { if (timer) clearTimeout(timer); };
}

function handleInfoUpdates2Payload(payload: any) {
  const info = payload?.info ?? payload;
  const { category, key, value } = info || {};
  if (!category || !key) return;

  console.log('[Presence] onInfoUpdates2', { category, key, value });

  if (category === 'game_info') {
    if (key === 'game_type')        state.gameType = String(value ?? '');
    if (key === 'game_queue_type')  state.queueType = String(value ?? '');
    if (key === 'rank' || key === 'competitive_tier') state.rank = String(value ?? '');
  } else if (category === 'match_info') {
    if (key === 'map') state.map = String(value ?? '');
    if (key === 'game_state') {
      const inProgress = String(value ?? '').toLowerCase() === 'match_in_progress';
      if (inProgress && !state.inMatch) {
        // treat this as a soft match_start if OW didn’t emit the event
        state.inMatch = true;
        if (!state.startedAt) state.startedAt = Math.floor(Date.now() / 1000);
      } else if (!inProgress && state.inMatch) {
        state.inMatch = false;
        state.startedAt = null;
        clearPresence();
      }
    }
  }
  scheduleUpdate();
}

// Optional seeding
async function seedFromGetInfo() {
  try {
    // @ts-ignore
    const res = await window.gep?.getInfo?.();
    const gi = res?.res?.game_info ?? res?.game_info ?? {};
    const mi = res?.res?.match_info ?? res?.match_info ?? {};

    console.log('[Presence] seed getInfo', { gi, mi });

    if (gi?.game_type)        state.gameType = String(gi.game_type);
    if (gi?.game_queue_type)  state.queueType = String(gi.game_queue_type);
    if (gi?.rank || gi?.competitive_tier) state.rank = String(gi.rank ?? gi.competitive_tier);

    if (mi?.map) state.map = String(mi.map);
    if (mi?.game_state) {
      const inProgress = String(mi.game_state).toLowerCase() === 'match_in_progress';
      state.inMatch = inProgress;
      state.startedAt = inProgress ? Math.floor(Date.now() / 1000) : null;
    }

    scheduleUpdate();
  } catch (e) {
    console.warn('[Presence] seed getInfo failed', e);
  }
}

export function initPresenceFromGep() {
  console.log('[Presence] init');

  // Subscribe to the same bus you already log to:
  // @ts-ignore
  const bus = window.gep;
  if (!bus?.onMessage) {
    console.warn('[Presence] window.gep.onMessage not available');
    return;
  }

  bus.onMessage((...args: any[]) => {
    for (const raw of args) {
      const obj = tryParseJSON(raw);

      // Recognize payloads:
      if (obj?.events) {
        handleNewEventsPayload(obj);
      } else if (obj?.info && obj?.info?.category && obj?.info?.key) {
        handleInfoUpdates2Payload(obj);
      } else {
        // Some preload wrappers tag messages with { type, data }
        const type = obj?.type || obj?.event || obj?.name || obj?.data?.type;
        if (type === 'onNewEvents' || type === 'new_events') {
          handleNewEventsPayload(obj?.data ?? obj);
        } else if (type === 'onInfoUpdates2' || type === 'info_updates2') {
          handleInfoUpdates2Payload(obj?.data ?? obj);
        }
      }
    }
  });

  // Seed once (safe if it returns nothing)
  seedFromGetInfo();
}
