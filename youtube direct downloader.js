// ==UserScript==
// @name                YouTube Direct Downloader
// @version             2.5.0
// @description         Video/short download button hidden in three dots combo menu below video or next to subscribe button. Downloads MP4, WEBM, MP3 or subtitles from youtube + option to redirect shorts to normal videos. Choose your preferred quality from 8k to audio only, codec (h264, vp9 or av1) or service provider (cobalt, y2mate, yt1s, u2convert) in settings.
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
 ydd-item {
  cursor: pointer;
  margin-top: 8px;
  font-size: 1.4rem;
  line-height: 2rem;
  font-weight: 400;
  position: relative;
  color: var(--yt-spec-text-primary);
  font-family: "Roboto","Arial",sans-serif;
  white-space: nowrap;
  display: flex;
  margin-bottom: -10px;
  padding: 10px 0 10px 21px;
  gap: 23px;
  align-items: center;
  text-transform: capitalize;
}

ydd-item:hover {
  background-color: var(--yt-spec-10-percent-layer);
}

ydd-item-icon {
  content: '⇩';
  font-size: 2.1rem;
}

ydd-item-text {
  position: relative;
}

ydd-item-button {
  position: absolute;
  left: 0;
  top: 0;
  width: 90%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 9999;
}

ydd-item-sidebar {
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  padding: 1px;
  color: var(--yt-spec-text-primary);
  z-index: 9999;
  right: 0;
  top: 0;
  width: 10%;
  height: 90%;
}

#ydd-button-sub {
  cursor: pointer;
  font-size: 2rem;
  padding: 8px 12px;
  border: none;
  border-radius: 15px;
  margin-left: 8px;
  line-height: 2rem;
  font-weight: 500;
  color: #0f0f0f;
  background-color: #f1f1f1;
  font-family: "Roboto","Arial",sans-serif;
  align-items: center;
  text-transform: capitalize;
}

#ydd-button-sub:hover {
  filter: brightness(90%);
}

ytd-menu-popup-renderer {
  min-height: 100px !important;
  min-width: 133px !important;
}
`;

GM_registerMenuCommand('Settings', opencfg);

const defaults = {
  downloadService: 'auto',
  quality: 'max',
  vCodec: 'vp9',
  aFormat: 'mp3',
  filenamePattern: 'pretty',
  buttonDownloadInfo: 'onchange',
  isAudioMuted: false,
  disableMetadata: false,
  redirectShorts: false,
  backupService: 'y2mate',
  subscribeButton: true,
  subsDownload: true,
};

let frame = document.createElement('div');
document.body.appendChild(frame);

let gmc = new GM_config({
  id: 'YDD_config',
  title: 'YouTube Direct Downloader (YDD) - Settings',
  css: gmcCSS,
  frame: frame,
  fields: {
    subscribeButton: {
      section: ['Position of download button'],
      label: 'Show download button next to subscribe button:',
      labelPos: 'left',
      type: 'checkbox',
      default: defaults.subscribeButton,
    },
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
    buttonDownloadInfo: {
      label: 'Show quality info below button:',
      type: 'select',
      default: defaults.buttonDownloadInfo,
      options: ['always', 'onchange', 'never'],
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
    subsDownload: {
      label: 'Right click on audio button downloads subtitles:',
      labelPos: 'left',
      type: 'checkbox',
      default: defaults.subsDownload,
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
      deleteButton();
      createButton();
      deleteSubscribeButton();
      createSubscribeButton();
    },
    init: onInit,
  },
});

function opencfg() {
  gmc.open();
}

let menuOuter;
let menuParent;
let nextSibling;
let oldHref = document.location.href;
let yddAdded = false;
let dError;
let dTimeout;
let yddItem;

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
  hideMenu();
}

function addButtonDownloadInfo(serviceName, div) {
  if (serviceName === 'cobalt') {
    const option = gmc.get('buttonDownloadInfo');
    if (option === 'never') return;
    const quality = gmc.get('quality') || defaults.quality;
    const vCodec = gmc.get('vCodec') || defaults.vCodec;
    if (option === 'onchange' && quality === defaults.quality && vCodec === defaults.vCodec) return;
    const qualityText = `${quality}, ${vCodec}`;
    const downloadInfo = document.createElement('ydd-item-button-info');
    downloadInfo.style.cssText = `
                position: absolute;
                left: 0;
                bottom: -10px;
                font-size: 0.8rem;
                color: var(--yt-spec-text-primary);
                opacity: 0.6;`;
    downloadInfo.innerText = qualityText;
    div.appendChild(downloadInfo);
  }
}

function deleteButton() {
  const buttons = document.getElementsByTagName('ydd-item');
  if (buttons.length === 0) return;
  const button = buttons[0];
  button.remove();
}

function hideMenu() {
  const menu = document.getElementsByTagName('ytd-menu-popup-renderer')[0];
  if (!menu) return;
  menuOuter = menu.parentElement.parentElement;
  if (!menuOuter) return;
  menuParent = menuOuter.parentNode;
  nextSibling = menuOuter.nextSibling;
  menuOuter.remove();
}

function addMenu() {
  if (menuOuter && menuParent) {
    if (nextSibling) {
      menuParent.insertBefore(menuOuter, nextSibling);
    } else {
      menuParent.appendChild(menuOuter);
    }
    menuOuter.style.display = 'none';
  }
}

const addStyles = () => {
  const style = document.createElement('style');
  style.type = 'text/css';
  style.innerHTML = yddCSS;
  document.head.appendChild(style);
};

function removeButton(e) {
  const menus = document.getElementsByTagName('tp-yt-iron-dropdown');
  const menu = Array.from(menus).find((el) => !el.matches('#dropdown'));
  if (menu && menu.style.display !== 'none' && !menu.contains(e.target) && yddItem) {
    yddItem.remove();
    yddItem = null;
    window.removeEventListener('click', removeButton);
  }
}

function createButton() {
  addMenu();
  if (yddItem) return;
  const serviceName = gmc.get('downloadService') || defaults.downloadService;
  const menu = document.getElementsByTagName('ytd-menu-popup-renderer')[0];
  yddItem = document.createElement('ydd-item');
  const icon = document.createElement('ydd-item-icon');
  const text = document.createElement('ydd-item-text');
  const button = document.createElement('ydd-item-button');
  const sidebar = document.createElement('ydd-item-sidebar');
  const settings = document.createElement('ydd-item-settings');
  const audioButton = document.createElement('ydd-item-audio-download');
  text.innerText = serviceName === 'auto' ? 'YDD' : serviceName;
  icon.innerText = '⇩';
  settings.innerText = '☰';
  audioButton.innerText = '▶';
  addButtonDownloadInfo(serviceName, text);
  audioButton.title = `Download audio only`;
  settings.title = 'Settings';
  yddItem.appendChild(icon);
  yddItem.appendChild(text);
  yddItem.appendChild(button);
  yddItem.appendChild(sidebar);
  sidebar.appendChild(settings);
  sidebar.appendChild(audioButton);

  button.addEventListener('click', () => {
    download();
  });

  audioButton.addEventListener('click', () => {
    download(true);
  });

  if (gmc.get('subsDownload'))
    audioButton.addEventListener('contextmenu', () => {
      window.open(`https://downsub.com/?url=${document.location.href}`);
    });

  settings.addEventListener('click', opencfg);
  menu.insertBefore(yddItem, menu.firstChild);
  if (!checkShort(false)) window.addEventListener('click', removeButton);
}

function deleteSubscribeButton() {
  const button = document.getElementById('ydd-button-sub');
  if (!button) return;
  button.remove();
}

function createSubscribeButton() {
  if (!gmc.get('subscribeButton')) return;
  const ownerBar = document.getElementById('owner');
  if (!ownerBar || document.getElementById('ydd-button-sub')) return;
  const button = document.createElement('button');
  button.id = 'ydd-button-sub';
  ownerBar.appendChild(button);
  let downloadService = gmc.get('downloadService') || defaults.downloadService;
  if (downloadService === 'auto') {
    button.title = 'Download with YDD';
  } else button.title = 'Download via ' + downloadService;
  button.innerText = '⇩';
  button.addEventListener('click', () => {
    download();
  });
}

function checkShort(replace = true) {
  if (document.location.href.indexOf('youtube.com/shorts') > -1) {
    if (gmc.get('redirectShorts') && replace) window.location.replace(window.location.toString().replace('/shorts/', '/watch?v='));
    return true;
  } else return false;
}

function modifyMenu() {
  const short = checkShort();
  if (yddItem && !short) {
    yddItem.remove();
    yddItem = null;
  }
  if (document.location.href.indexOf('youtube.com/watch') === -1 && !short) {
    yddAdded = true;
    return;
  }
  addMenu();
  menuOuter = null;
  menuParent = null;
  nextSibling = null;
  if (short) {
    const menuBtn = document.getElementById('menu-button');
    if (!menuBtn) return;
    yddAdded = true;
    menuBtn.addEventListener('click', createButton);
    return;
  }

  const topRow = document.getElementById('top-row');
  const menuBtn = topRow.querySelector('#button-shape');
  createSubscribeButton();
  if (!topRow || !menuBtn) return;
  yddAdded = true;
  menuBtn.addEventListener('click', createButton);
}

function onInit() {
  addStyles();
  const observer = new MutationObserver(function () {
    if (!yddAdded) return modifyMenu();
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
