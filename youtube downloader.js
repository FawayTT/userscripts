// ==UserScript==
// @name                Youtube Direct Downloader
// @version             2.1.5
// @description         Video/short download button hidden in three dots combo menu below video. Downloads MP4, WEBM or MP3 from youtube + option to redirect shorts to normal videos. Choose your preferred quality from 8k to audio only, codec (h264, vp9 or av1) or service provider (cobalt, y2mate, yt1s) in settings.
// @author              FawayTT
// @namespace           FawayTT
// @supportURL          https://github.com/FawayTT/userscripts/issues
// @icon                https://github.com/FawayTT/userscripts/blob/main/youtube-downloader-icon.png?raw=true
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

GM_registerMenuCommand('Settings', opencfg);

const defaults = {
  downloadService: 'Cobalt',
  quality: 'max',
  vCodec: 'vp9',
  aFormat: 'mp3',
  filenamePattern: 'pretty',
  buttonDownloadInfo: 'onchange',
  isAudioMuted: false,
  disableMetadata: false,
  redirectShorts: false,
  backupProvider: 'y2mate',
};

const providers = ['cobalt', 'y2mate', 'yt1s'];

let gmc = new GM_config({
  id: 'config',
  title: 'Youtube direct downloader settings',
  fields: {
    downloadService: {
      section: ['Download method (use cobalt for best quality):'],
      label: 'Service',
      labelPos: 'left',
      type: 'select',
      default: defaults.downloadService,
      options: ['cobalt', 'y2mate', 'yt1s'],
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
      label: 'Video codec (h264 [MP4] for best compatibility, vp9 [WEBM] for better quality. AV1 = best quality but is used only by few videos):',
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
      options: ['classic', 'pretty', 'basic', 'nerdy', 'opus'],
    },
    buttonDownloadInfo: {
      label: 'Show quality info below button:',
      type: 'select',
      default: defaults.buttonDownloadInfo,
      options: ['always', 'onchange', 'never'],
    },
    backupProvider: {
      label: 'Pick backup provider in case Cobalt is not responding:',
      type: 'select',
      default: defaults.backupProvider,
      options: ['y2mate', 'yt1s', 'none'],
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
      label: 'My other userscripts',
      type: 'button',
      click: () => {
        GM_openInTab('https://github.com/FawayTT/userscripts');
      },
    },
    cobaltUrl: {
      label: 'Cobalt',
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
    },
    init: onInit,
  },
});

function opencfg() {
  gmc.open();
  config.style = `
  width: 100%;
  height: 100%;
  max-height: 40rem;
  max-width: 80rem;
  border-radius: 10px;
  z-index: 9999999;
  position: fixed;
  `;
}

let timeout;
let menuOuter;
let menuParent;
let nextSibling;
let oldHref = document.location.href;
let menuIndex = 1;
const menuMaxTries = 10;

function getYouTubeVideoID(url) {
  const urlParams = new URLSearchParams(new URL(url).search);
  return urlParams.get('v');
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
    case 'cobalt':
      GM_xmlhttpRequest({
        method: 'POST',
        url: 'https://api.cobalt.tools/api/json',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
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
          const data = JSON.parse(response.responseText);
          if (data.url) window.open(data.url);
          else {
            let alertText = 'Cobalt error: ' + data.text || 'Something went wrong! Try again later.';
            const backupProvider = gmc.get('backupProvider');
            if (backupProvider !== 'none') {
              alertText += '\n\nYou will be redirected to backup provider ' + backupProvider + '.';
              alert(alertText);
              download(isAudioOnly, backupProvider);
            } else alert(alertText);
          }
        },
        onerror: function (error) {
          const errorMessage = error.message || error;
          let alertText = 'Cobalt error occurred: ' + errorMessage;
          const backupProvider = gmc.get('backupProvider');
          if (backupProvider !== 'none') {
            alertText += '\n\nYou will be redirected to backup provider ' + backupProvider + '.';
            alert(alertText);
            download(isAudioOnly, backupProvider);
          } else alert(alertText);
        },
        ontimeout: function () {
          let alertText = 'Cobalt is not responding. Please try again later.';
          const backupProvider = gmc.get('backupProvider');
          if (backupProvider !== 'none') {
            alertText += '\n\nYou will be redirected to backup provider ' + backupProvider + '.';
            alert(alertText);
            download(isAudioOnly, backupProvider);
          } else alert(alertText);
        },
      });
      break;
    default:
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
    const downloadInfo = document.createElement('custom-dwn-button-download-info');
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
  if (document.getElementsByTagName('custom-dwn-button').length === 0) return;
  const button = document.getElementsByTagName('custom-dwn-button')[0];
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

function addMenu(hidden) {
  if (menuOuter && menuParent) {
    if (nextSibling) {
      menuParent.insertBefore(menuOuter, nextSibling); // Re-insert before the next sibling if it exists
    } else {
      menuParent.appendChild(menuOuter); // Append if it's the last child
    }
    if (hidden) menuOuter.style.display = 'none';
    menuOuter = null;
    menuParent = null;
    nextSibling = null;
  }
}

function createButton() {
  addMenu();
  if (document.getElementsByTagName('custom-dwn-button').length !== 0) return;
  const serviceName = gmc.get('downloadService') || defaults.downloadService;
  const menu = document.getElementsByTagName('ytd-menu-popup-renderer')[0];
  const downButtonOuter = document.createElement('custom-dwn-button');
  const icon = document.createElement('div');
  const text = document.createElement('custom-dwn-button-text');
  const downButton = document.createElement('button');
  const extra = document.createElement('div');
  const settings = document.createElement('div');
  const downAudioOnly = document.createElement('div');
  menu.style.minHeight = '100px';
  menu.style.minWidth = '133px';
  text.style.position = 'relative';
  downButtonOuter.style.cssText = `
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
          text-transform: capitalize`;
  downButton.style.cssText = `
            position: absolute;
            left: 0;
            top: 0;
            width: 90%;
            height: 100%;
            opacity: 0;
            cursor: pointer;
            z-index: 9999;`;
  extra.style.cssText = `
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
            height: 90%;`;
  icon.style.cssText = `
            font-size: 2.1rem;`;
  icon.innerText = '⇩';
  text.innerText = serviceName;
  settings.innerText = '☰';
  downAudioOnly.innerText = '▶';
  addButtonDownloadInfo(serviceName, text);
  downAudioOnly.title = `Download audio only`;
  settings.title = 'Settings';
  downButtonOuter.appendChild(icon);
  downButtonOuter.appendChild(text);
  downButtonOuter.appendChild(extra);
  downButtonOuter.appendChild(downButton);
  extra.appendChild(settings);
  extra.appendChild(downAudioOnly);
  downButton.addEventListener('click', () => {
    download();
    downButtonOuter.style.backgroundColor = '';
  });

  downAudioOnly.addEventListener('click', () => {
    download(true);
    downButtonOuter.style.backgroundColor = '';
  });
  settings.addEventListener('click', opencfg);
  downButtonOuter.addEventListener('mouseenter', () => {
    downButtonOuter.style.backgroundColor = 'var(--yt-spec-10-percent-layer)';
  });
  downButtonOuter.addEventListener('mouseleave', () => {
    downButtonOuter.style.backgroundColor = '';
  });
  menu.insertBefore(downButtonOuter, menu.firstChild);
}

function watchMenu() {
  menuIndex += 1;
  menuOuter = null;
  menuParent = null;
  nextSibling = null;
  if (menuMaxTries < menuIndex) {
    menuIndex = 1;
    clearTimeout(timeout);
    return;
  }
  if (document.location.href.indexOf('youtube.com/shorts') > -1) {
    const menuBtn = document.getElementById('menu-button');
    if (!menuBtn) {
      timeout = setTimeout(watchMenu, 500 * menuIndex);
      return;
    }
    menuBtn.addEventListener('click', createButton);
    menuIndex = 1;
    clearTimeout(timeout);
    return;
  }
  const topRow = document.getElementById('top-row');
  const menuBtn = topRow.querySelector('#button-shape');
  if (!topRow || !menuBtn) {
    timeout = setTimeout(() => {
      watchMenu();
    }, 500 * menuIndex);
    return;
  }
  menuBtn.addEventListener('click', createButton);
  menuIndex = 1;
  clearTimeout(timeout);
}

function modifyMenu() {
  if (document.location.href.indexOf('youtube.com/watch') === -1 && document.location.href.indexOf('youtube.com/shorts') === -1) return;
  if (document.hidden) {
    window.addEventListener('visibilitychange', () => {
      if (document.hidden) return;
      timeout = setTimeout(watchMenu, 500 * menuIndex);
    });
  } else timeout = setTimeout(watchMenu, 500 * menuIndex);
}

function checkShort() {
  if (document.location.href.indexOf('youtube.com/shorts') > -1 && gmc.get('redirectShorts')) window.location.replace(window.location.toString().replace('/shorts/', '/watch?v='));
}

function onInit() {
  const bodyList = document.querySelector('body');
  checkShort();
  modifyMenu();
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (oldHref != document.location.href) {
        checkShort();
        oldHref = document.location.href;
        addMenu(true);
        modifyMenu();
      }
    });
  });
  observer.observe(bodyList, {
    childList: true,
    subtree: true,
  });
}
