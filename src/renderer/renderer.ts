console.log('renderer script');

import { initPresenceFromGep } from "./presence-from-gep";
import { initPresencePolling } from "./presence-from-gep";
import { setHeroStatsEnabled } from "./presence-from-gep";
import { getHeroStatsEnabled } from "./presence-from-gep";

const toggleHeroStatsBtn = document.querySelector('#toggleHeroStatsBtn') as HTMLButtonElement;
const clearTerminalTextAreaBtn = document.querySelector('#clearTerminalTextAreaBtn') as HTMLButtonElement;
const setRequiredBtn = document.querySelector('#setRequiredFeaturesBtn') as HTMLButtonElement;
const getInfoBtn = document.querySelector('#getInfoBtn') as HTMLButtonElement;
const createOSRBtn = document.querySelector('#createOSR') as HTMLButtonElement;
const visibilityOSRBtn = document.querySelector('#visibilityOSR') as HTMLButtonElement;
const updateHotkeyBtn = document.querySelector('#updateHotkey') as HTMLButtonElement;
const toggleThemeBtn = document.querySelector('#toggleThemeBtn') as HTMLButtonElement;

const terminal = document.querySelector('#TerminalTextArea') as HTMLElement;
const heroStatsStatusPill = document.querySelector('#heroStatsStatusPill') as HTMLElement;
const presencePreviewTitle = document.querySelector('#presencePreviewTitle') as HTMLElement;
const presencePreviewState = document.querySelector('#presencePreviewState') as HTMLElement;

const LOG_MAX_LINES = 500;
const LOG_BATCH_MS = 120;
const LOG_TRUNCATE = 1000;

let logBuffer: string[] = [];
let renderPending = false;

function pushLine(s: string) {
  if (s.length > LOG_TRUNCATE) s = s.slice(0, LOG_TRUNCATE) + '…';
  logBuffer.push(s);
  if (logBuffer.length > LOG_MAX_LINES) {
    logBuffer.splice(0, logBuffer.length - LOG_MAX_LINES);
  }
  scheduleRender();
}

function scheduleRender() {
  if (renderPending) return;
  renderPending = true;
  setTimeout(() => {
    renderPending = false;
    terminal.textContent = logBuffer.join('\n');
    terminal.scrollTop = terminal.scrollHeight;
  }, LOG_BATCH_MS);
}

function safeJSON(x: any) {
  try {
    return typeof x === 'string' ? x : JSON.stringify(x);
  } catch {
    return String(x);
  }
}

function addMessageToTerminal(message: string) {
  pushLine(message);
  updatePreviewFromLog(message);
}

function getCurrentTheme(): 'orange' | 'purple' {
  const saved = localStorage.getItem('theme');
  return saved === 'purple' ? 'purple' : 'orange';
}

function applyTheme(theme: 'orange' | 'purple') {
  if (theme === 'purple') {
    document.body.setAttribute('data-theme', 'purple');
  } else {
    document.body.removeAttribute('data-theme');
  }

  localStorage.setItem('theme', theme);
}

function refreshThemeButton(theme: 'orange' | 'purple') {
  toggleThemeBtn.textContent = theme === 'purple' ? 'Switch to Orange Theme' : 'Switch to Purple Theme';
}

function updatePreviewFromLog(message: string) {
  if (message.includes('"map"') || message.includes('game_state') || message.includes('game_type')) {
    presencePreviewTitle.textContent = 'Live Activity';
    presencePreviewState.textContent = 'Receiving match and presence data...';
  }

  if (message.toLowerCase().includes('hero stats enabled')) {
    heroStatsStatusPill.textContent = 'Hero Stats Enabled';
  }

  if (message.toLowerCase().includes('hero stats disabled')) {
    heroStatsStatusPill.textContent = 'Hero Stats Disabled';
  }
}

function refreshToggleHeroStatsBtn() {
  const enabled = getHeroStatsEnabled();
  toggleHeroStatsBtn.textContent = enabled ? 'Disable Hero Stats' : 'Enable Hero Stats';
  heroStatsStatusPill.textContent = enabled ? 'Hero Stats Enabled' : 'Hero Stats Disabled';
}

refreshToggleHeroStatsBtn();

toggleHeroStatsBtn.addEventListener('click', () => {
  const next = !getHeroStatsEnabled();
  setHeroStatsEnabled(next);
  refreshToggleHeroStatsBtn();
  addMessageToTerminal(next ? 'Hero Stats Enabled' : 'Hero Stats Disabled');
});

initPresenceFromGep();
initPresencePolling(2000);
applyTheme(getCurrentTheme());

toggleThemeBtn.addEventListener('click', () => {
  const current = getCurrentTheme();
  const next = current === 'orange' ? 'purple' : 'orange';
  applyTheme(next);
  addMessageToTerminal(`Theme switched to ${next}`);
});

// @ts-ignore
window.gep.onMessage(function (...args) {
  console.info(...args);
  const line = args.map(safeJSON).join(' | ');
  addMessageToTerminal(line);
});

clearTerminalTextAreaBtn.addEventListener('click', () => {
  logBuffer = [];
  terminal.textContent = '';
});

setRequiredBtn.addEventListener('click', async () => {
  try {
    // @ts-ignore
    await window.gep.setRequiredFeature();
    addMessageToTerminal('setRequiredFeatures ok');
  } catch (error) {
    addMessageToTerminal('setRequiredFeatures error');
    alert('setRequiredFeatures error ' + error);
  }
});

getInfoBtn.addEventListener('click', async () => {
  try {
    // @ts-ignore
    const info = await window.gep.getInfo();
    addMessageToTerminal(JSON.stringify(info));
  } catch (error) {
    addMessageToTerminal('getInfo error');
    alert('getInfo error ' + error);
  }
});

createOSRBtn.addEventListener('click', async () => {
  try {
    // @ts-ignore
    await window.osr.openOSR();
    addMessageToTerminal('OSR created');
  } catch (error) {
    addMessageToTerminal('createOSR error');
  }
});

visibilityOSRBtn.addEventListener('click', async () => {
  try {
    // @ts-ignore
    await window.osr.toggle();
    addMessageToTerminal('OSR visibility toggled');
  } catch (error) {
    console.log(error);
    addMessageToTerminal('toggle osr error');
  }
});

updateHotkeyBtn.addEventListener('click', async () => {
  try {
    // @ts-ignore
    await window.osr.updateHotkey();
    addMessageToTerminal('Hotkey updated');
  } catch (error) {
    console.log(error);
    addMessageToTerminal('update hotkey error');
  }
});

export function sendExclusiveOptions() {
  const color = (document.getElementById('colorPicker') as HTMLInputElement).value;

  const r = parseInt(color.substr(1, 2), 16);
  const g = parseInt(color.substr(3, 2), 16);
  const b = parseInt(color.substr(5, 2), 16);
  const a = (document.getElementById('opacityRange') as HTMLInputElement).value;

  const options = {
    color: `rgba(${r},${g},${b},${a})`,
    animationDuration: parseInt(
      (document.getElementById('animationDurationRange') as HTMLInputElement).value
    )
  };

  // @ts-ignore
  window.overlay.updateExclusiveOptions(options);
}

const opacityRange = document.getElementById('opacityRange') as HTMLInputElement;
opacityRange.addEventListener('change', () => {
  sendExclusiveOptions();
});

const animationDurationRange = document.getElementById('animationDurationRange') as HTMLInputElement;
animationDurationRange.addEventListener('change', () => {
  sendExclusiveOptions();
});

const colorPicker = document.getElementById('colorPicker') as HTMLInputElement;
colorPicker.addEventListener('change', () => {
  sendExclusiveOptions();
});

document.querySelectorAll('[name="behavior"]').forEach((radio) => {
  radio.addEventListener('change', (a) => {
    const radio = a.target as HTMLInputElement;
    if (radio.checked) {
      // @ts-ignore
      window.overlay.setExclusiveModeHotkeyBehavior(radio.value);
    }
  });
});

document.querySelectorAll('[name="exclusiveType"]').forEach((radio) => {
  radio.addEventListener('change', (a) => {
    const radio = a.target as HTMLInputElement;
    if (radio.checked) {
      // @ts-ignore
      window.overlay.setExclusiveModeType(radio.value);
    }
  });
});