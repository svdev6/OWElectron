// src/renderer/presence-from-gep.ts
const FORCE_DEBUG = false; // <- set to true to show presence even in menus

type GameType = 'UNRANKED' | 'COMPETITIVE' | 'ARCADE' | 'CUSTOM' | string;

const GAME_MODE_MAP: Record<string, string> = {
  '16': 'Skirmish',
  '20': 'Assault',
  '21': 'Escort',
  '22': 'Hybrid',
  '23': 'Control',
  '64': 'Push',
  '109': 'Flashpoint',
  '224': 'Clash',
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
    if (gt === 'RANKED') {
      return queueType ? `Competitive: In Match` : 'Competitive';
    }
    if (gt === 'UNRANKED') {
      return queueType ? `Quick Play: In Match` : 'Quick Play';
    }
    if (gt === 'PRACTICE') {
      return queueType ? 'Training' : 'Practice Range';
    }
    if (gt === 'CUSTOM_GAME') {
      return queueType ? `Custom Game: In Match` : 'Custom Game';
    }
    if (gt === 'STADIUM_UNRANKED') {
      return queueType ? `Stadium Quick Play: In Match` : 'Stadium Quick Play';
    }
    if (gt === 'STADIUM_RANKED') {
      return queueType ? `Stadium Competitive: In Match` : 'Stadium Competitive';
    }
  }
  // Fall back to numeric game_mode
  if (gameModeId && GAME_MODE_MAP[gameModeId]) return GAME_MODE_MAP[gameModeId];
  return 'Unknown mode';
}

type PresenceState = {
  inMatch: boolean;
  startedAt: number | null;
  menuStartedAt: number | null;
  lastInProgressAt: number | null;
  lastPseudoMatchId: string | null;
  gameType: GameType | '';
  queueType: string | '';
  map: string | '';
  gameModeId: string | '';
  rank: string | '';
};

const state: PresenceState = {
  inMatch: false,
  startedAt: null,
  menuStartedAt: Math.floor(Date.now() / 1000),
  lastInProgressAt: null,
  lastPseudoMatchId: null,
  gameType: '',
  queueType: '',
  map: '',
  gameModeId: '',
  rank: ''
};

const MAP_NAMES: Record<string, string> = {
  '91': 'Temple of Anubis',
  '212': 'King\'s Row',
  '388': 'Watchpoint: Gibraltar',
  '468': 'Numbani',
  '475': 'Volskaya Industries',
  '687': 'Hollywood',
  '707': 'Dorado',
  '1207': 'Nepal',
  '1467': 'Route 66',
  '1634': 'Lijiang Tower',
  '1645': 'Ilios',
  '1672': 'Practice Range',
  '1677': 'Eichenwalde',
  '1694': 'Oasis',
  '1878': 'Junkertown',
  '1886': 'Blizzard World',
  '2018': 'Busan',
  '2087': 'Circuit Royale',
  '2161': 'Rialto',
  '2193': 'Paris',
  '2360': 'Paraiso',
  '2628': 'Havana',
  '2795': 'New Queen Street',
  '2868': 'Colosseo',
  '2892': 'Midtown',
  '3205': 'Shambali Monastery',
  '3314': 'Antarctic Peninsula',
  '3390': 'Suravasa',
  '3376': 'Samoa',
  '3411': 'Esperanca',
  '3603': 'New Junk City',
  '3762': 'Runasapi',
  '3893': 'Aatlis',
  '4439': 'Hanaoka',
  '4448': 'Throne of Anubis'
};

const MAP_ICONS: Record<string, string> = {
  '91': 'anubis',
  '212': '1_kings-row',
  '388': '1_watchpoint-gibraltar',
  '468': '1_numbani',
  '475': '1_volskaya',
  '687': '1_hollywood',
  '707': '1_dorado',
  '1207': '1_nepal',
  '1467': '1_route-66',
  '1634': '1_lijiang-tower',
  '1645': '1_ilios',
  '1672': '1_practice-range',
  '1677': '1_eichenwalde',
  '1694': '1_oasis',
  '1878': '1_junkertown',
  '1886': '1_blizzard-world',
  '2018': '1_busan',
  '2087': '1_circuit-royale',
  '2161': '1_rialto',
  '2193': 'paris',
  '2360': '1_paraiso',
  '2628': '1_havana',
  '2795': '1_new-queen-street',
  '2868': '1_colosseo',
  '2892': '1_midtown',
  '3205': '1_shambali-monastery',
  '3314': '1_antarctic-peninsula',
  '3390': '1_suravasa',
  '3376': '1_samoa',
  '3411': '1_esperanca',
  '3603': '1_new-junk-city',
  '3762': '1_runasapi',
  '3893': '1_aatlis',
  '4439': '1_hanaoka',
  '4448': '1_throne-of-anubis'
};

const HERO_ICONS: Record<string, string> = {
  'ANA': '0_ana',
  'ASHE': '0_ashe',
  'BAPTISTE': '0_baptiste',
  'BASTION': '0_bastion',
  'BRIGITTE': '0_brigitte',
  'CASSIDY': '0_cassidy',
  'DOOMFIST': '0_doomfist',
  'DVA': '0_dva',
  'ECHO': '0_echo',
  'FREJA': '0_freja',
  'GENJI': '0_genji',
  'HANZO': '0_hanzo',
  'HAZARD': '0_hazard',
  'ILLARI' : '0_illari',
  'JUNKERQUEEN': '0_junker-queen',
  'JUNKRAT': '0_junkrat',
  'JUNO': '0_juno',
  'KIRIKO': '0_kiriko',
  'LUCIO': '0_lucio',
  'MAUGA': '0_mauga',
  'MEI': '0_mei',
  'MERCY': '0_mercy',
  'MOIRA': '0_moira',
  'ORISA': '0_orisa',
  'PHARAH': '0_pharah',
  'RAMATTRA': '0_ramattra',
  'REAPER': '0_reaper',
  'REINHARDT': '0_reinhardt',
  'ROADHOG': '0_roadhog',
  'SIGMA': '0_sigma',
  'SOJOURN': '0_sojourn',
  'SOLDIER76': '0_soldier76',
  'SOMBRA': '0_sombra',
  'SYMMETRA': '0_symmetra',
  'TORBJORN': '0_torbjorn',
  'TRACER': '0_tracer',
  'VENTURE': '0_venture',
  'WIDOWMAKER': '0_widowmaker',
  'WINSTON': '0_winston',
  'WRECKINGBALL': '0_wrecking-ball',
  'WUYANG': '0_wuyang',
  'ZARYA': '0_zarya',
  'ZENYATTA': '0_zenyatta'
};

const HERO_NAMES: Record<string, string> = {
  'ANA': 'Ana',
  'ASHE': 'Ashe',
  'BASTION': 'Bastion',
  'BAPTISTE': 'Baptiste',
  'BRIGITTE': 'Brigitte',
  'CASSIDY': 'Cassidy',
  'DOOMFIST': 'Doomfist',
  'DVA': 'D.Va',
  'ECHO': 'Echo',
  'FREJA': 'Freja',
  'GENJI': 'Genji',
  'HANZO': 'Hanzo',
  'HAZARD': 'Hazard',
  'ILLARI' : 'Illari',
  'JUNKERQUEEN': 'Junker Queen',
  'JUNKRAT': 'Junkrat',
  'JUNO': 'Juno',
  'KIRIKO': 'Kiriko',
  'LUCIO': 'Lúcio',
  'MAUGA': 'Mauga',
  'MEI': 'Mei',
  'MERCY': 'Mercy',
  'MOIRA': 'Moira',
  'ORISA': 'Orisa',
  'PHARAH': 'Pharah',
  'RAMATTRA': 'Ramattra',
  'REAPER': 'Reaper',
  'REINHARDT': 'Reinhardt',
  'ROADHOG': 'Roadhog',
  'SIGMA': 'Sigma',
  'SOJOURN': 'Sojourn',
  'SOLDIER76': 'Soldier: 76',
  'SOMBRA': 'Sombra',
  'SYMMETRA': 'Symmetra', 
  'TORBJORN': 'Torbjörn',
  'TRACER': 'Tracer',
  'VENTURE': 'Venture',
  'WIDOWMAKER': 'Widowmaker',
  'WINSTON': 'Winston',
  'WRECKINGBALL': 'Wrecking Ball',
  'WUYANG': 'Wuyang',
  'ZARYA': 'Zarya',
  'ZENYATTA': 'Zenyatta'
};

const INPROGRESS_STALE_SEC = 8;

function nowSec() { return Math.floor(Date.now() / 1000); }

let heroStatsEnabled = (() => {
  try { return JSON.parse(localStorage.getItem('heroStatsEnabled') ?? 'true'); }
  catch { return true; }
})();

export function setHeroStatsEnabled(v: boolean) {
  heroStatsEnabled = !!v;
  try { localStorage.setItem('heroStatsEnabled', JSON.stringify(heroStatsEnabled)); } catch {}
  scheduleUpdate(); // re-render presence with/without hero stats
}

export function getHeroStatsEnabled(): boolean {
  return !!heroStatsEnabled;
}

type HeroSnapshot = {
  hero?: string;
  role?: 'TANK'|'DAMAGE'|'SUPPORT'|string;
  kills?: number;
  deaths?: number;
  assists?: number;
  healed?: number;
};

let hero: HeroSnapshot = {};

function mapName(v: string | undefined | null) {
  return v ? (MAP_NAMES[String(v)] ?? String(v)) : undefined;
}

function mapMode(v: string | undefined | null) {
  return v ? (GAME_MODE_MAP[String(v)] ?? String(v)) : undefined;
}

function heroName(v: string | undefined | null) {
  return v ? (HERO_NAMES[String(v)] ?? String(v)) : undefined;
}

function mapIcon(v: string | undefined | null) {
  return v ? (MAP_ICONS[String(v)] ?? 'ow2') : 'ow2';
}

let lastJSON = '';
let scheduled = false;
function scheduleUpdate() {
  if (scheduled) return;
  scheduled = true;
  setTimeout(() => { scheduled = false; pushPresence(); }, 1000);
}

function pushPresence() {
  const activity = state.inMatch ? matchPresence() : menuPresence();

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

function menuPresence() {
  return {
    details: 'In Menus',
    state: 'Browsing/In Queue',
    startTimestamp: state.menuStartedAt ?? nowSec(),
    largeImageKey: mapIcon(state.map),
    largeImageText: mapName(state.map),
    instance: true
  }
}

function formatHeroFragment(): { smallKey?: string; smallText?: string; tail?: string } {
  if (!heroStatsEnabled || !hero.hero) return {};
  const key = HERO_ICONS[(hero.hero || '').toUpperCase()];
  const smallKey = key || undefined;
  const hero_name = heroName(hero.hero);
  const smallText = hero_name ? `${hero_name}${hero.role ? ` - ${toTitle(hero.role)}` : ''}` : undefined;

  const k = isFinite(hero.kills as any) ? hero.kills : 0;
  const d = isFinite(hero.deaths as any) ? hero.deaths : 0;
  const a = isFinite(hero.assists as any) ? hero.assists : 0;
  const base = ` E:${k}/A:${a}/D:${d}`;

  // Only add healing metric if likely a support hero OR healed > 0
  const tail = (hero.role === 'SUPPORT' || (hero.healed ?? 0) > 0)
    ? `${base} H:${Math.round(hero.healed || 0)}`
    : base;

  return { smallKey, smallText, tail };
}

function matchPresence() {
  const mode = resolveModeLabel(state.gameType, state.queueType, (state as any).gameModeId);
  const map_name = mapName(state.map);
  const map_mode = mapMode(state.gameModeId);
  const hf = formatHeroFragment();
  if (mode == 'Training') {
    return {
      details: mapName(state.map) ? `${mapName(state.map)}` : `${state.map || 'Unknown map'}`,
      state: mode,
      startTimestamp: state.startedAt ?? nowSec(),
      largeImageKey: mapIcon(state.map),
      largeImageText: mapName(state.map) ? `${mapName(state.map)}` : 'Overwatch 2',
      instance: true
    }
  }
  else if (heroStatsEnabled && hf.tail) {
    return {
      details: mode,
      state: `${hf.tail}`,
      startTimestamp: state.startedAt ?? nowSec(),
      largeImageKey: mapIcon(state.map),
      largeImageText: map_name ?  `${map_name}${map_mode ? ` - ${map_mode}` : ''}` : undefined,
      smallImageKey: hf.smallKey,
      smallImageText: hf.smallText,
      instance: true
    }
  }

  return {
    details: mode,
    state: map_mode ? `${map_mode}` : `${state.gameModeId || 'Unknown mode'}`,
    startTimestamp: state.startedAt ?? nowSec(),
    largeImageKey: mapIcon(state.map),
    largeImageText: map_name ? `${map_name}` : 'Overwatch 2',
    instance: true
  }
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

function endMatchAndGoMenus() {
  state.map = 'ow2';
  state.inMatch = false;
  state.startedAt = null;
  state.menuStartedAt = nowSec();
  hero = {};
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
  const pseudoId = readAny(mi, ['pseudo_match_id']);

  if (gameType)  state.gameType = String(gameType);
  if (queueType) state.queueType = String(queueType);
  if (rank)      state.rank = String(rank);
  if (gameModeId) state.gameModeId = String(gameModeId);
  if (mapVal)    state.map = String(mapVal);

  const inProgress = String(gameState ?? '').toLowerCase() === 'match_in_progress';
  if (inProgress) {
    if (!state.inMatch) {
      state.inMatch = true;
      state.startedAt = nowSec();
    }
    state.lastInProgressAt = nowSec();
    state.lastPseudoMatchId = pseudoId ? String(pseudoId) : null;
  } else {
    if (state.inMatch) {
      endMatchAndGoMenus();
    }
  }

  if (state.inMatch) {
    const heartbeatStale = state.inMatch && state.lastInProgressAt && (nowSec() - state.lastInProgressAt > INPROGRESS_STALE_SEC);
    const pseudoChanged = state.inMatch && state.lastPseudoMatchId && pseudoId && (state.lastPseudoMatchId !== String(pseudoId));

    const explicitEnd = !inProgress;
    if (explicitEnd || heartbeatStale || pseudoChanged) {
      endMatchAndGoMenus();
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

  state.menuStartedAt = nowSec();
  pushPresence();

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

function parseRosterValue(raw: any): any {
  // value may be a JSON string; sometimes double-encoded
  let v = raw;
  if (typeof v === 'string') {
    try { v = JSON.parse(v); } catch { /* ignore */ }
  }
  if (typeof v === 'string') {    // try once more
    try { v = JSON.parse(v); } catch { /* ignore */ }
  }
  return v;
}

function handleRosterUpdate(payload: any) {
  const info = payload?.info ?? payload;
  const { category, key, value } = info || {};
  if (category !== 'roster') return;

  const rec = parseRosterValue(value);
  if (!rec || !rec.is_local) return; // only track the local player

  hero.hero    = rec.hero_name;
  hero.role    = rec.hero_role;
  hero.kills   = Number(rec.kills ?? 0);
  hero.deaths  = Number(rec.deaths ?? 0);
  hero.assists = Number(rec.assists ?? 0);
  hero.healed  = Number(rec.healed ?? 0);

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
      } else if (obj?.info?.category === 'roster' || obj?.category === 'roster'){
        handleRosterUpdate(obj);
        continue;
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
