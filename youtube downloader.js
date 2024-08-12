// ==UserScript==
// @name                Youtube direct downloader
// @version             2.1.0
// @description         Video/short download button hidden in three dots combo menu below video. Downloads MP4, WEBM or MP3 from youtube + option to redirect shorts to normal videos. Choose your preferred quality from 8k to audio only, codec (h264, vp9 or av1) or service provider (cobalt, y2mate, yt1s) in settings.
// @author              FawayTT
// @namespace           FawayTT
// @icon                https://i.imgur.com/D57wQrY.png
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
  downloadService: 'cobalt',
  quality: 'max',
  vCodec: 'vp9',
  aFormat: 'mp3',
  filenamePattern: 'pretty',
  isAudioMuted: false,
  disableMetadata: false,
  audioOnly: false,
  redirectShorts: false,
};
 
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
    videoCodec: {
      label: 'Video codec (h264 [MP4] for best compatibility, vp9 [WEBM] for better quality. AV1 = best quality but is used only by few videos):',
      labelPos: 'left',
      type: 'select',
      default: defaults.vCodec,
      options: ['h264', 'vp9', 'av1'],
    },
    audioFormat: {
      label: 'Audio format:',
      type: 'select',
      default: defaults.aFormat,
      options: ['best', 'mp3', 'ogg', 'wav', 'opus'],
    },
    audioOnly: {
      label: 'Always download only audio:',
      type: 'checkbox',
      default: defaults.audioOnly,
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
let oldHref = document.location.href;
let menuIndex = 1;
let menuMaxTries = 10;
 
function getYouTubeVideoID(url) {
  const urlParams = new URLSearchParams(new URL(url).search);
  return urlParams.get('v');
}
 
function download(audioOnly) {
  switch (gmc.get('downloadService')) {
    case 'y2mate':
      if (audioOnly) window.open(`https://www.y2mate.com/youtube-mp3/${getYouTubeVideoID(document.location.href)}`);
      else window.open(`https://www.y2mate.com/download-youtube/${getYouTubeVideoID(document.location.href)}`);
      break;
    case 'yt1s':
      if (audioOnly) window.open(`https://www.yt1s.com/en/youtube-to-mp3?q=${getYouTubeVideoID(document.location.href)}`);
      else window.open(`https://www.yt1s.com/en/youtube-to-mp4?q=${getYouTubeVideoID(document.location.href)}`);
      break;
    default:
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
          vCodec: gmc.get('videoCodec'),
          aFormat: gmc.get('audioFormat'),
          filenamePattern: gmc.get('filenamePattern'),
          isAudioMuted: gmc.get('isAudioMuted'),
          disableMetadata: gmc.get('disableMetadata'),
          isAudioOnly: audioOnly || gmc.get('audioOnly'),
        }),
        onload: (response) => {
          const data = JSON.parse(response.responseText);
          if (data.url) window.open(data.url);
        },
      });
      break;
  }
}
 
function createButton() {
  if (document.getElementsByTagName('custom-dwn-button').length !== 0) return;
  const menu = document.getElementsByTagName('ytd-menu-popup-renderer')[0];
  const downButtonOuter = document.createElement('custom-dwn-button');
  const icon = document.createElement('div');
  const text = document.createElement('div');
  const downButton = document.createElement('button');
  const extra = document.createElement('div');
  const settings = document.createElement('div');
  const downAudioOnly = document.createElement('div');
  downAudioOnly.title = 'Download audio only';
  settings.title = 'Settings';
  menu.style.minHeight = '100px';
  menu.style.minWidth = '150px';
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
          gap: 21px;
          align-items: center;`;
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
  icon.innerText = '⇩';
  text.innerText = 'Download';
  settings.innerText = '☰';
  downAudioOnly.innerText = '▶';
  icon.style.cssText = `
            font-size: 2.1rem;`;
  downButtonOuter.appendChild(icon);
  downButtonOuter.appendChild(text);
  downButtonOuter.appendChild(extra);
  downButtonOuter.appendChild(downButton);
  extra.appendChild(settings);
  extra.appendChild(downAudioOnly);
  downButton.addEventListener('click', () => {
    download();
  });
  downAudioOnly.addEventListener('click', () => {
    download(true);
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
  if (menuMaxTries < menuIndex) {
    menuIndex = 1;
    clearTimeout(timeout);
    return;
  }
  if (document.location.href.indexOf('youtube.com/shorts') > -1) {
    const menu = document.getElementById('menu-button');
    if (!menu) {
      timeout = setTimeout(watchMenu, 500 * menuIndex);
      return;
    }
    menu.addEventListener('click', createButton);
    menuIndex = 1;
    clearTimeout(timeout);
    return;
  }
  const topRow = document.getElementById('top-row');
  const menu = topRow.querySelector('#button-shape');
  if (!topRow || !menu) {
    timeout = setTimeout(() => {
      watchMenu(false);
    }, 500 * menuIndex);
    return;
  }
  menu.addEventListener('click', createButton);
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
        modifyMenu();
      }
    });
  });
  observer.observe(bodyList, {
    childList: true,
    subtree: true,
  });
}
