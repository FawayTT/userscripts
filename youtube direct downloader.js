// ==UserScript==
// @name                YouTube Direct Downloader
// @version             3.0.0
// @description         Video/short download button next to subscribe button. Downloads MP4, WEBM, MP3 or subtitles from youtube + option to redirect shorts to normal videos. Choose your preferred quality from 8k to audio only, codec (h264, vp9 or av1) or service provider (cobalt, y2mate, yt1s, u2convert) in settings.
// @author              FawayTT
// @namespace           FawayTT
// @supportURL          https://github.com/FawayTT/userscripts/issues
// @icon                https://github.com/FawayTT/userscripts/blob/main/ydd-icon.png?raw=true
// @match               https://www.youtube.com/*
// @connect             api.cobalt.tools
// @require             https://openuserjs.org/src/libs/sizzle/GM_config.js
// @grant               GM_getValue
// @grant               GM_setValue
// @grant               GM_registerMenuCommand
// @grant               GM_openInTab
// @grant               GM_xmlhttpRequest
// @license             MIT
// ==/UserScript==

const gmcCSS = `
 #YDD_config {
  background-color: rgba(0, 0, 0, 0.8) !important;
  backdrop-filter: blur(10px);
  color: #fff !important;
  border-radius: 30px !important;
  padding: 20px !important;
  height: fit-content !important;
  max-width: 700px !important;
  font-family: Arial, sans-serif !important;
  z-index: 9999999 !important;
  padding-bottom: 0px !important;
  width: 100% !important;
}

#YDD_config_header {
  background-color: #ff000052 !important;
  border-radius: 10px;
  padding: 10px !important;
  text-align: center !important;
  font-size: 24px !important;
  color: blob !important;
  font-weight: 600 !important;
}

.section_header_holder {
  font-weight: 600;
  margin-top: 10px !important;
}

#YDD_config_buttons_holder {
  text-align: center;
  margin-top: 20px;
}

#YDD_config_resetLink {
  color: #fff !important;
}

.config_var {
  margin: 0px !important;
  line-height: 3;
}

#YDD_config_buttons_holder button {
  background-color: #ff000052 !important;
  color: #fff;
  border: none;
  font-weight: 600;
  padding: 10px 20px !important;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.1s ease-in;
}

#YDD_config_buttons_holder button:hover {
  background-color: #ff0000 !important;
}

#YDD_config_fieldset {
  border: 1px solid #444;
  padding: 10px;
  border-radius: 5px;
  margin-top: 10px;
}

#YDD_config_fieldset legend {
  color: #ff0000;
}

.section_header {
  background: none !important;
  width: fit-content;
  margin: 5px 0px !important;
  border: none !important;
  font-size: 18px !important;
  color: #ff0000 !important;
}

input, select, textarea {
  cursor: pointer;
  background-color: #333;
  color: #fff;
  border: 1px solid #555;
  border-radius: 10px;
  padding: 5px;
  margin: 5px 0 !important;
}

::selection {
  color: white;
  background: #ff0000;
}

input, select, textarea {
  transition: all 0.1s ease-in;
}

input:focus, select:focus, textarea:focus {
  border-color: #ff0000;
}

input:hover, select:hover, textarea:hover {
  opacity: 0.8;
}

label {
  color: #fff;
}

#YDD_config_buttons_holder {
  position: relative;
  margin-top: 0px !important;
  display: flex;
  justify-content: center;
  align-items: baseline;
}

.reset_holder {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  right: 0;
  padding: 10px;
}

input[type='checkbox'] {
  appearance: none;
  position: absolute;
  width: 20px;
  transform: translateY(3px);
  height: 20px;
  border: 1px solid #555;
  border-radius: 10px;
  background-color: #333;
  cursor: pointer;
}

input[type='checkbox']:before {
  content: " ";
}

input[type='checkbox']:checked {
  background-color: #d50707;
}

input[type='checkbox']:checked::after {
  content: "";
  position: absolute;
  top: 3px;
  left: 2px;
  width: 12px;
  height: 6px;
  border-bottom: 2px solid #ffffff;
  border-left: 2px solid #ffffff;
  transform: rotate(-45deg);
}

#YDD_config_downloadService_var:after {
  content: "▲ Use cobalt for best quality.";
  display: block;
  font-family: arial, tahoma, myriad pro, sans-serif;
  font-size: 10px;
  font-weight: bold;
  margin-right: 6px;
  opacity: 0.7;
}

#YDD_config_vCodec_var:after {
  content: "▲ H264 [MP4] = best compatibility. VP9 [WEBM] = better quality. AV1 = best quality but is used only by few videos.";
  display: block;
  font-family: arial, tahoma, myriad pro, sans-serif;
  font-size: 10px;
  font-weight: bold;
  margin-right: 6px;
  opacity: 0.7;
}

#YDD_config_backupService_var:after {
  content: "▲ In case Cobalt isn't working, automatically use this download service.";
  display: block;
  font-family: arial, tahoma, myriad pro, sans-serif;
  font-size: 10px;
  font-weight: bold;
  margin-right: 6px;
  opacity: 0.7;
}
`;

const yddCSS = `
#ydd-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  margin-left: 8px;
  box-shadow: 1px 0px 7px -4px rgba(0, 0, 0, 0.8);
}

#ydd-download {
  position: relative;
  z-index: 10;
  cursor: pointer;
  font-size: 2rem;
  padding: 8px 12px;
  border: none;
  border-radius: 15px;
  line-height: 2rem;
  font-weight: 500;
  color: #0f0f0f;
  background-color: #f1f1f1;
  font-family: "Roboto","Arial",sans-serif;
  align-items: center;
  text-transform: capitalize;
}

#ydd-download:hover {
  filter: brightness(90%);
}

#ydd-options {
  line-height: 2rem;
  font-weight: 500;
  color: var(--yt-spec-text-primary);
  margin: 0px 5px;
  cursor: pointer;
  font-family: "Roboto","Arial",sans-serif;
  transition: all 0.1s ease-in;
}

#ydd-options:hover {
  scale: 1.4;
}

#ydd-options-div {
  transition: transform 0.3s ease, opacity 0.1s ease;
  position: absolute;
  top: 0px;
  transform: translateY(-70%);
  right: -18px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
  border-radius: 15px;
  margin-right: 8px;
  margin-top: 6px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  z-index: 100;
  font-family: "Roboto","Arial",sans-serif;
  font-weight: 500;
  font-size: 1.2rem;
  line-height: 2rem;
  color: black;
  align-items: start;
  white-space: nowrap;
}

#ydd-options-div > * {
  margin: 6px;
  cursor: pointer;
  transition: all 0.1s ease-in;
}

#ydd-options-div > *:hover {
  scale: 1.1;
}

@keyframes scaleIn {
  0% {
    transform: scale(0.8) translateY(-60%);
    opacity: 0;            /* Start transparent */
  }
  100% {
    transform: scale(1) translateY(-70%);
    opacity: 1;
  }
}

@keyframes scaleOut {
  0% {
    transform: scale(1) translateY(-70%);
    opacity: 1;
  }
  100% {
    transform: scale(0.8) translateY(-60%);
    opacity: 0;
  }
}

.ydd-scale-up {
  animation: scaleIn 0.3s forwards;
}

.ydd-scale-down {
  animation: scaleOut 0.3s forwards;
}
`;

GM_registerMenuCommand('Settings', opencfg);

const defaults = {
  downloadService: 'auto',
  quality: 'max',
  vCodec: 'vp9',
  aFormat: 'mp3',
  filenamePattern: 'pretty',
  isAudioMuted: false,
  disableMetadata: false,
  redirectShorts: false,
  backupService: 'y2mate',
};

let frame = document.createElement('div');
document.body.appendChild(frame);

let gmc = new GM_config({
  id: 'YDD_config',
  title: 'YouTube Direct Downloader (YDD) - Settings',
  css: gmcCSS,
  frame: frame,
  fields: {
    downloadService: {
      section: ['Download method'],
      label: 'Service:',
      labelPos: 'left',
      type: 'select',
      default: defaults.downloadService,
      options: ['auto', 'cobalt', 'y2mate', 'yt1s', 'u2convert'],
    },
    quality: {
      section: ['Cobalt-only settings'],
      label: 'Quality:',
      labelPos: 'left',
      type: 'select',
      default: defaults.quality,
      options: ['max', '2160', '1440', '1080', '720', '480', '360', '240', '144'],
    },
    vCodec: {
      label: 'Video codec:',
      labelPos: 'left',
      type: 'select',
      default: defaults.vCodec,
      options: ['h264', 'vp9', 'av1'],
    },
    aFormat: {
      label: 'Audio format:',
      type: 'select',
      default: defaults.aFormat,
      options: ['best', 'mp3', 'ogg', 'wav', 'opus'],
    },
    isAudioMuted: {
      label: 'Download videos without audio:',
      type: 'checkbox',
      default: defaults.isAudioMuted,
    },
    disableMetadata: {
      label: 'Download videos without metadata:',
      type: 'checkbox',
      default: defaults.disableMetadata,
    },
    filenamePattern: {
      label: 'Filename pattern:',
      type: 'select',
      default: defaults.filenamePattern,
      options: ['classic', 'pretty', 'basic', 'nerdy'],
    },
    backupService: {
      label: 'Backup service:',
      type: 'select',
      default: defaults.backupService,
      options: ['y2mate', 'yt1s', 'u2convert', 'none'],
    },
    redirectShorts: {
      section: ['Extra features'],
      label: 'Redirect shorts:',
      labelPos: 'left',
      type: 'checkbox',
      default: defaults.redirectShorts,
    },
    url: {
      section: ['Links'],
      label: 'All my userscripts - FawayTT',
      type: 'button',
      click: () => {
        GM_openInTab('https://github.com/FawayTT/userscripts');
      },
    },
    cobaltUrl: {
      label: 'Cobalt github page',
      type: 'button',
      click: () => {
        GM_openInTab('https://github.com/imputnet/cobalt');
      },
    },
  },
  events: {
    save: function () {
      gmc.close();
      deleteButtons();
      const bar = document.getElementById('owner');
      if (!bar) return;
      createButton(bar, checkShort(false));
    },
    init: onInit,
  },
});

function opencfg() {
  gmc.open();
}

let oldHref = document.location.href;
let yddAdded = false;
let dError;
let dTimeout;

function getHeaders() {
  const userAgent = navigator.userAgent;
  const refererHeader = window.location.href;
  const originHeader = window.location.origin;
  const languages = navigator.languages;
  return {
    'User-Agent': userAgent,
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'Accept-Language': languages,
    Referer: refererHeader,
    Origin: originHeader,
  };
}

function getYouTubeVideoID(url) {
  if (url.includes('shorts')) {
    const regex = /\/shorts\/([^/?]+)/;
    const match = url.match(regex);
    const id = match ? match[1] : null;
    return id;
  }
  const urlParams = new URLSearchParams(new URL(url).search);
  return urlParams.get('v');
}

function handleCobaltError(errorMessage, isAudioOnly) {
  const backupService = gmc.get('backupService') || 'y2mate';
  if (gmc.get('downloadService') === 'auto') {
    download(isAudioOnly, backupService);
    return;
  }
  let alertText = 'Cobalt error: ' + (errorMessage || 'Something went wrong! Try again later.');
  if (backupService !== 'none') {
    alertText += '\n\nYou will be redirected to backup provider ' + backupService + '.';
    alert(alertText);
    download(isAudioOnly, backupService);
  } else alert(alertText);
}

function download(isAudioOnly, downloadService) {
  if (!downloadService) downloadService = gmc.get('downloadService');
  switch (downloadService) {
    case 'y2mate':
      if (isAudioOnly) window.open(`https://www.y2mate.com/youtube-mp3/${getYouTubeVideoID(document.location.href)}`);
      else window.open(`https://www.y2mate.com/download-youtube/${getYouTubeVideoID(document.location.href)}`);
      break;
    case 'yt1s':
      if (isAudioOnly) window.open(`https://www.yt1s.com/en/youtube-to-mp3?q=${getYouTubeVideoID(document.location.href)}`);
      else window.open(`https://www.yt1s.com/en/youtube-to-mp4?q=${getYouTubeVideoID(document.location.href)}`);
      break;
    case 'u2convert':
      if (isAudioOnly) window.open(`https://u2convert.com/mp3-download/${getYouTubeVideoID(document.location.href)}`);
      else window.open(`https://u2convert.com/download/${getYouTubeVideoID(document.location.href)}`);
      break;
    default:
      if (dError) return handleCobaltError(dError, isAudioOnly);
      GM_xmlhttpRequest({
        method: 'POST',
        url: 'https://api.cobalt.tools/api/json',
        headers: getHeaders(),
        data: JSON.stringify({
          url: encodeURI(document.location.href),
          vQuality: gmc.get('quality'),
          vCodec: gmc.get('vCodec'),
          aFormat: gmc.get('aFormat'),
          filenamePattern: gmc.get('filenamePattern'),
          isAudioMuted: gmc.get('isAudioMuted'),
          disableMetadata: gmc.get('disableMetadata'),
          isAudioOnly: isAudioOnly,
        }),
        onload: (response) => {
          try {
            const data = JSON.parse(response.responseText);
            if (data.url) window.open(data.url);
            else handleCobaltError(data.text, isAudioOnly);
          } catch (error) {
            handleCobaltError(null, isAudioOnly);
            if (downloadService !== 'auto') console.error(error);
          }
        },
        onerror: function (error) {
          const errorMessage = error.message || error;
          handleCobaltError(errorMessage, isAudioOnly);
        },
        ontimeout: function () {
          const alertText = 'Cobalt is not responding. Please try again later.';
          handleCobaltError(alertText, isAudioOnly);
        },
      });
      clearTimeout(dTimeout);
      dError = 'Slow down.';
      dTimeout = setTimeout(() => {
        dError = null;
      }, 5000);
      break;
  }
}

function addStyles() {
  const style = document.createElement('style');
  style.innerHTML = yddCSS;
  document.head.appendChild(style);
}

function deleteButtons() {
  const buttons = document.querySelectorAll('#ydd-button');
  if (buttons.length === 0) return;
  buttons.forEach((button) => {
    button.remove();
  });
}

function closeOptions(optionsDiv) {
  optionsDiv.classList.remove('ydd-scale-up');
  optionsDiv.classList.add('ydd-scale-down');
  setTimeout(() => {
    optionsDiv.remove();
  }, 400);
}

function showOptions(div) {
  let optionsDiv = document.getElementById('ydd-options-div');
  if (optionsDiv) {
    closeOptions(optionsDiv);
    return;
  }
  optionsDiv = document.createElement('div');
  const audio = document.createElement('div');
  const subtitles = document.createElement('div');
  const settings = document.createElement('div');
  audio.innerText = '🔊 Audio';
  subtitles.innerText = '🖹 Subtitles';
  settings.innerText = '⛭ Settings';
  optionsDiv.id = 'ydd-options-div';
  optionsDiv.appendChild(audio);
  optionsDiv.appendChild(subtitles);
  optionsDiv.appendChild(settings);
  div.appendChild(optionsDiv);
  optionsDiv.style.opacity = undefined;
  optionsDiv.classList.add('ydd-scale-up');
  settings.addEventListener('click', () => {
    opencfg();
    closeOptions(optionsDiv);
  });
  audio.addEventListener('click', () => {
    download(true);
    closeOptions(optionsDiv);
  });
  subtitles.addEventListener('click', () => {
    window.open(`https://downsub.com/?url=${document.location.href}`);
    closeOptions(optionsDiv);
  });
  window.addEventListener('click', (e) => {
    if (!div.contains(e.target)) {
      closeOptions(optionsDiv);
    }
  });
}

function createButton(bar, short) {
  if (!bar) return;
  const div = document.createElement('div');
  const button = document.createElement('button');
  const options = document.createElement('div');
  div.id = 'ydd-button';
  button.id = 'ydd-download';
  options.id = 'ydd-options';
  div.appendChild(button);
  div.appendChild(options);
  if (short) {
    div.style.marginTop = '10px';
    div.style.marginLeft = '0px';
    bar.insertBefore(div, bar.firstChild);
  } else bar.appendChild(div);

  let downloadService = gmc.get('downloadService') || defaults.downloadService;
  switch (downloadService) {
    case 'y2mate':
      button.title = 'Y2Mate';
      break;
    case 'u2convert':
      button.title = 'U2Convert';
      break;
    case 'yt1s':
      button.title = 'YT1S';
      break;
    case 'cobalt':
      const quality = gmc.get('quality') || defaults.quality;
      const vCodec = gmc.get('vCodec') || defaults.vCodec;
      const info = `${quality}, ${vCodec}`;
      button.title = 'Cobalt: ' + info.toUpperCase();
      break;
    default:
      button.title = 'YDD';
      break;
  }
  button.innerText = '⇩';
  options.innerText = '☰';
  button.addEventListener('click', () => {
    download();
  });
  options.addEventListener('click', () => {
    showOptions(div);
  });
}

function checkShort(replace = true) {
  if (document.location.href.indexOf('youtube.com/shorts') > -1) {
    if (gmc.get('redirectShorts') && replace) window.location.replace(window.location.toString().replace('/shorts/', '/watch?v='));
    return true;
  } else return false;
}

function modify() {
  const short = checkShort();
  if (document.location.href.indexOf('youtube.com/watch') === -1 && !short) {
    yddAdded = true;
    return;
  }
  if (short) {
    const bars = document.querySelectorAll('#actions');
    if (bars.length <= 1) {
      yddAdded = false;
      return;
    }
    deleteButtons();
    bars.forEach((bar) => {
      createButton(bar, true);
    });
    yddAdded = true;
  } else {
    const bar = document.getElementById('owner');
    if (!bar) {
      yddAdded = false;
      return;
    }
    deleteButtons();
    createButton(bar, false);
    yddAdded = true;
  }
}

function onInit() {
  addStyles();
  const observer = new MutationObserver(function () {
    if (!yddAdded) return modify();
    if (oldHref != document.location.href) {
      oldHref = document.location.href;
      yddAdded = false;
    }
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
