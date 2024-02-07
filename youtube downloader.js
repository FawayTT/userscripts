// ==UserScript==
// @name                Youtube Downloader
// @version             1.0.2
// @description         Add video download button in combo menu
// @author              FawayTT
// @namespace           FawayTT
// @icon                https://i.imgur.com/D57wQrY.png
// @homepage            https://github.com/FawayTT/userscripts
// @match               https://www.youtube.com/watch*
// @grant               none
// @license             MIT
// ==/UserScript==

(function () {
  let timeout;
  let replaced = false;

  function addButton() {
    if (document.location.href.includes('playlist') || document.getElementsByTagName('custom-dwn-button').length !== 0) return;
    const menu = document.getElementsByTagName('ytd-menu-popup-renderer')[0];
    const downButton = document.createElement('custom-dwn-button');
    const icon = document.createElement('div');
    const text = document.createElement('div');
    menu.style.minHeight = '100px';
    downButton.style.cssText = `
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
          padding: 10px 0 10px 21px;
          gap: 21px;
          align-items: center;`;
    icon.innerText = '⇩';
    text.innerText = 'Download';
    icon.style.cssText = `
            font-size: 2.1rem;`;
    downButton.appendChild(icon);
    downButton.appendChild(text);
    downButton.addEventListener('click', onClick);
    downButton.addEventListener('mouseenter', () => {
      downButton.style.backgroundColor = 'rgba(255,255,255,0.1)';
    });
    downButton.addEventListener('mouseleave', () => {
      downButton.style.backgroundColor = '';
    });
    menu.insertBefore(downButton, menu.firstChild);
  }

  function watchMenu() {
    const menu = document.getElementById('button-shape');
    menu.addEventListener('click', addButton);
    replaced = true;
    clearTimeout(timeout);
  }

  function onClick() {
    window.open(document.location.href.replace('youtube', 'youtubepp'));
  }

  if (document.hidden) {
    window.addEventListener('visibilitychange', () => {
      if (document.hidden) return;
      for (let i = 0; i < 10; i++) {
        if (replaced) break;
        timeout = setTimeout(watchMenu, 500 * i);
      }
    });
  } else {
    for (let i = 0; i < 10; i++) {
      if (replaced) break;
      timeout = setTimeout(watchMenu, 500 * i);
    }
  }
})();
