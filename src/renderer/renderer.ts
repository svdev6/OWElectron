console.log('renderer script');
import { initPresenceFromGep } from "./presence-from-gep";
import { initPresencePolling } from './presence-from-gep';
import { setHeroStatsEnabled } from "./presence-from-gep";
import { getHeroStatsEnabled } from "./presence-from-gep";

const toggleHeroStatsBtn = document.querySelector('#toggleHeroStatsBtn') as HTMLButtonElement;
const LOG_MAX_LINES = 500;
const LOG_BATCH_MS = 120;
const LOG_TRUNCATE = 1000;

const terminal = document.querySelector('#TerminalTextArea') as HTMLElement;

let logBuffer: string[] = [];
let renderPending = false;

function pushLine(s: string) {
  if (s.length > LOG_TRUNCATE) s = s.slice(0, LOG_TRUNCATE) + '…';
  logBuffer.push(s);
  if (logBuffer.length > LOG_MAX_LINES) logBuffer.splice(0, logBuffer.length - LOG_MAX_LINES);
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
  try { return typeof x === 'string' ? x : JSON.stringify(x); }
  catch { return String(x); }
}

function refreshToggleHeroStatsBtn() {
  toggleHeroStatsBtn.textContent = getHeroStatsEnabled() ? 'Disable Hero Stats' : 'Enable Hero Stats';
}

refreshToggleHeroStatsBtn();

toggleHeroStatsBtn.addEventListener('click', () => {
  const next = !getHeroStatsEnabled();
  setHeroStatsEnabled( next );
  refreshToggleHeroStatsBtn();
  addMessageToTerminal(next ? 'Hero Stats Enabled' : 'Hero Stats Disabled');
});

initPresenceFromGep();
initPresencePolling(2000);

//@ts-ignore
window.gep.onMessage(function(...args) {
  console.info(...args);

  const line = args.map(safeJSON).join(' | ');
  addMessageToTerminal(line);

});


const btn = document.querySelector('#clearTerminalTextAreaBtn') as HTMLButtonElement;

btn.addEventListener('click', function(e) {
  var begin = new Date().getTime();
  const terminal = document.querySelector('#TerminalTextArea');
  logBuffer = [];
  terminal.textContent = '';
});

const setRequiredBtn = document.querySelector('#setRequiredFeaturesBtn') as HTMLButtonElement;
setRequiredBtn.addEventListener('click', async function(e) {
  try {
    // @ts-ignore
    await window.gep.setRequiredFeature();
    addMessageToTerminal('setRequiredFeatures ok');
  } catch (error) {
    addMessageToTerminal('setRequiredFeatures error');
    alert('setRequiredFeatures error' + error);
  }
});

const getInfoBtn = document.querySelector('#getInfoBtn') as HTMLButtonElement;
getInfoBtn.addEventListener('click', async function(e) {
  try {
    // @ts-ignore
    const info = await window.gep.getInfo();
    addMessageToTerminal(JSON.stringify(info));
  } catch (error) {
    addMessageToTerminal('getInfo error');
    alert('getInfo error' + error);
  }
});

const createOSRBtn = document.querySelector('#createOSR') as HTMLButtonElement;
createOSRBtn.addEventListener('click', async function(e) {
  try {
    // @ts-ignore
    const info = await window.osr.openOSR();
  } catch (error) {
    addMessageToTerminal('createOSR error');
  }
});

const visibilityOSRBtn = document.querySelector('#visibilityOSR') as HTMLButtonElement;
visibilityOSRBtn.addEventListener('click', async function(e) {
  try {
    // @ts-ignore
    const info = await window.osr.toggle();
  } catch (error) {
    console.log(error);
    addMessageToTerminal('toggle osr error');
  }
});


const updateHotkeyBtn = document.querySelector('#updateHotkey') as HTMLButtonElement;
updateHotkeyBtn.addEventListener('click', async function(e) {
  try {
    // @ts-ignore
    const info = await window.osr.updateHotkey();
  } catch (error) {
    console.log(error);
    addMessageToTerminal('toggle osr error');
  }
});


function addMessageToTerminal(message) {
  pushLine(message);
}

export function sendExclusiveOptions() {
  const color = (document.getElementById('colorPicker') as HTMLInputElement).value;

  const r = parseInt(color.substr(1,2), 16);
  const g = parseInt(color.substr(3,2), 16);
  const b = parseInt(color.substr(5,2), 16);
  const a = (document.getElementById('opacityRange') as HTMLInputElement).value;

  const options = {
     color: `rgba(${r},${g},${b},${a})`,
     animationDuration:
      parseInt((document.getElementById('animationDurationRange') as HTMLInputElement).value)
  };

  // @ts-ignore
  window.overlay.updateExclusiveOptions(options);
}



const opacityRange = document.getElementById('opacityRange') as HTMLInputElement;
opacityRange.addEventListener('change', (ev) => {
  sendExclusiveOptions();
})

const animationDurationRange = document.getElementById('animationDurationRange') as HTMLInputElement;
animationDurationRange.addEventListener('change', (ev) => {
  sendExclusiveOptions();
})

const colorPicker = document.getElementById('colorPicker') as HTMLInputElement;
colorPicker.addEventListener('change', (ev) => {
  sendExclusiveOptions();
})


document.querySelectorAll('[name="behavior"]').forEach(
  (radio)=>{radio.addEventListener('change',(a)=>{
    const radio = a.target as HTMLInputElement;
    if (radio.checked) {
      // @ts-ignore
      window.overlay.setExclusiveModeHotkeyBehavior(radio.value);
    }
  })
})

document.querySelectorAll('[name="exclusiveType"]').forEach(
  (radio)=>{radio.addEventListener('change',(a)=>{
    const radio = a.target as HTMLInputElement;
    if (radio.checked) {
      // @ts-ignore
      window.overlay.setExclusiveModeType(radio.value);
    }
  })
})
