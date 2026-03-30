/**
 * Agora Video Watermark (Beta) — local camera track only.
 * Requires Agora’s UMD bundle (sets window.VideoWatermarkExtension, window.AgoraWatermarkImage):
 * https://agora-packages.s3.us-west-2.amazonaws.com/ext/watermark/index.js
 */
let watermarkExtension = null;
let lastAutoResolutionKey = '';

window.isWatermarkEnabled = false;
window.watermarkProcessor = null;

function notify(message) {
  if (typeof window.showPopup === 'function') window.showPopup(message);
}

function getWatermarkClasses() {
  const VideoWatermarkExtension = window.VideoWatermarkExtension;
  const AgoraWatermarkImage = window.AgoraWatermarkImage;
  if (!VideoWatermarkExtension || !AgoraWatermarkImage) {
    throw new Error('Watermark extension not loaded (include ext/watermark/index.js before this page)');
  }
  return { VideoWatermarkExtension, AgoraWatermarkImage };
}

function getWatermarkExtension() {
  if (watermarkExtension) return watermarkExtension;
  const { VideoWatermarkExtension } = getWatermarkClasses();
  watermarkExtension = new VideoWatermarkExtension();
  if (typeof AgoraRTC === 'undefined' || !AgoraRTC.registerExtensions) {
    throw new Error('Agora Web SDK not loaded');
  }
  AgoraRTC.registerExtensions([watermarkExtension]);
  return watermarkExtension;
}

function getLayoutMode() {
  return document.getElementById('watermarkLayoutMode')?.value || 'manual';
}

function getLayout() {
  const xEl = document.getElementById('watermarkX');
  const yEl = document.getElementById('watermarkY');
  const wEl = document.getElementById('watermarkW');
  const hEl = document.getElementById('watermarkH');
  const aEl = document.getElementById('watermarkAlpha');
  const wRaw = wEl ? wEl.value.trim() : '';
  const hRaw = hEl ? hEl.value.trim() : '';
  return {
    x: xEl ? parseInt(xEl.value, 10) || 0 : 0,
    y: yEl ? parseInt(yEl.value, 10) || 0 : 0,
    w: wRaw === '' ? -1 : (parseInt(wRaw, 10) || -1),
    h: hRaw === '' ? -1 : (parseInt(hRaw, 10) || -1),
    alpha: aEl ? Math.min(1, Math.max(0, parseFloat(aEl.value))) : 0.8
  };
}

function getCurrentSendResolution() {
  const width = Number(window.currentSendResolutionWidth) || 0;
  const height = Number(window.currentSendResolutionHeight) || 0;
  return { width, height };
}

function resolveAutoCornerPosition(mode, frameW, frameH, wmW, wmH, marginX, marginY) {
  const xLeft = marginX;
  const xRight = Math.max(0, frameW - wmW - marginX);
  const yTop = marginY;
  const yBottom = Math.max(0, frameH - wmH - marginY);

  switch (mode) {
    case 'top-right':
      return { x: xRight, y: yTop };
    case 'bottom-left':
      return { x: xLeft, y: yBottom };
    case 'bottom-right':
      return { x: xRight, y: yBottom };
    case 'top-left':
    default:
      return { x: xLeft, y: yTop };
  }
}

async function ensureImageLoaded(img) {
  if (img.complete) {
    if (img.naturalWidth > 0) return;
    throw new Error('Image failed to load or has no dimensions');
  }
  await new Promise((resolve, reject) => {
    const done = () => {
      img.removeEventListener('load', done);
      img.removeEventListener('error', onErr);
      resolve();
    };
    const onErr = () => {
      img.removeEventListener('load', done);
      img.removeEventListener('error', onErr);
      reject(new Error('Image failed to load'));
    };
    img.addEventListener('load', done);
    img.addEventListener('error', onErr);
  });
  if (img.naturalWidth === 0) {
    throw new Error('Image has no dimensions');
  }
}

async function applyWatermarkImages(processor) {
  const { AgoraWatermarkImage } = getWatermarkClasses();
  const source = document.getElementById('watermarkSource')?.value || 'url';
  const layout = getLayout();
  const mode = getLayoutMode();

  processor.clearVideoWatermarks();

  let wm;
  if (source === 'dom') {
    const id = (document.getElementById('watermarkImgId')?.value || '').trim() || 'watermarkDomImg';
    const el = document.getElementById(id);
    if (!el || !(el instanceof HTMLImageElement)) {
      throw new Error(`No <img> with id "${id}".`);
    }
    await ensureImageLoaded(el);
    wm = new AgoraWatermarkImage(el, layout.x, layout.y, layout.w, layout.h, layout.alpha);
  } else {
    const url = (document.getElementById('watermarkUrl')?.value || '').trim();
    if (!url) {
      throw new Error('Enter a watermark image URL');
    }
    wm = new AgoraWatermarkImage(url, layout.x, layout.y, layout.w, layout.h, layout.alpha);
  }

  await wm.ready;

  if (mode !== 'manual') {
    const { width: frameW, height: frameH } = getCurrentSendResolution();
    if (frameW > 0 && frameH > 0 && wm.width > 0 && wm.height > 0) {
      const pos = resolveAutoCornerPosition(mode, frameW, frameH, wm.width, wm.height, layout.x, layout.y);
      wm.x = pos.x;
      wm.y = pos.y;
      lastAutoResolutionKey = `${frameW}x${frameH}`;
    }
  }

  const wid = processor.addVideoWatermark(wm);
  if (wid < 0) {
    throw new Error('addVideoWatermark failed');
  }
}

function updateWatermarkSourceUI() {
  const source = document.getElementById('watermarkSource')?.value || 'url';
  const urlG = document.getElementById('watermarkUrlGroup');
  const domG = document.getElementById('watermarkDomGroup');
  if (urlG) urlG.style.display = source === 'url' ? 'block' : 'none';
  if (domG) domG.style.display = source === 'dom' ? 'block' : 'none';
}

async function disableWatermark() {
  if (!window.isWatermarkEnabled && !window.watermarkProcessor) return;
  lastAutoResolutionKey = '';
  window.isWatermarkEnabled = false;

  try {
    // Rebuild *before* release/null so cleanupProcessors can unpipe the watermark while the
    // processor still exists. Releasing first leaves VideoProcessorDestination stuck piped.
    if (window.rebuildVideoPipeline) {
      await window.rebuildVideoPipeline();
    }
    if (window.watermarkProcessor) {
      try {
        await window.watermarkProcessor.disable();
      } catch (e) {}
      try {
        window.watermarkProcessor.clearVideoWatermarks();
      } catch (e) {}
      try {
        await window.watermarkProcessor.release();
      } catch (e) {}
      window.watermarkProcessor = null;
    }
  } catch (e) {
    console.warn('disableWatermark:', e);
  }
  const btn = document.getElementById('watermarkBtn');
  if (btn) btn.textContent = 'Enable Watermark';
}

async function toggleWatermark() {
  if (!window.localVideoTrack) {
    notify('Join a channel first');
    return;
  }

  try {
    getWatermarkExtension();

    if (!window.isWatermarkEnabled) {
      if (!window.watermarkProcessor) {
        window.watermarkProcessor = watermarkExtension.createProcessor();
      }
      await applyWatermarkImages(window.watermarkProcessor);
      window.isWatermarkEnabled = true;
      const btn = document.getElementById('watermarkBtn');
      if (btn) btn.textContent = 'Disable Watermark';
      if (window.rebuildVideoPipeline) {
        await window.rebuildVideoPipeline();
      }
      notify('Watermark on');
    } else {
      await disableWatermark();
      notify('Watermark off');
    }
  } catch (e) {
    console.error(e);
    notify(e.message || 'Watermark failed');
    window.isWatermarkEnabled = false;
    lastAutoResolutionKey = '';
    if (window.rebuildVideoPipeline) {
      try {
        await window.rebuildVideoPipeline();
      } catch (err) {}
    }
    if (window.watermarkProcessor) {
      try {
        await window.watermarkProcessor.release();
      } catch (err) {}
      window.watermarkProcessor = null;
    }
    const btn = document.getElementById('watermarkBtn');
    if (btn) btn.textContent = 'Enable Watermark';
  }
}

async function refreshWatermarkIfEnabled(showMessage = true) {
  if (!window.isWatermarkEnabled || !window.watermarkProcessor) return;
  try {
    await applyWatermarkImages(window.watermarkProcessor);
    // Auto-corner updates (showMessage=false) can happen during profile changes while
    // VB/beauty are rebuilding. Updating watermark in-place is enough; rebuilding the
    // whole pipeline can cause flicker.
    if (showMessage && window.rebuildVideoPipeline) {
      await window.rebuildVideoPipeline();
    }
    if (showMessage) notify('Watermark updated');
  } catch (e) {
    console.error(e);
    if (showMessage) notify(e.message || 'Failed to update watermark');
  }
}

async function maybeRefreshWatermarkLayoutForResolutionChange() {
  if (!window.isWatermarkEnabled) return;
  const mode = getLayoutMode();
  if (mode === 'manual') return;

  const { width, height } = getCurrentSendResolution();
  const key = `${width}x${height}`;
  if (width <= 0 || height <= 0 || key === lastAutoResolutionKey) return;

  lastAutoResolutionKey = key;
  await refreshWatermarkIfEnabled(false);
}

function initWatermarkControls() {
  const sourceSel = document.getElementById('watermarkSource');
  if (sourceSel) {
    sourceSel.addEventListener('change', () => {
      updateWatermarkSourceUI();
      if (window.isWatermarkEnabled) refreshWatermarkIfEnabled();
    });
    updateWatermarkSourceUI();
  }

  const layoutSel = document.getElementById('watermarkLayoutMode');
  if (layoutSel) {
    layoutSel.addEventListener('change', () => {
      lastAutoResolutionKey = '';
      if (window.isWatermarkEnabled) refreshWatermarkIfEnabled();
    });
  }

  const ids = ['watermarkUrl', 'watermarkImgId', 'watermarkX', 'watermarkY', 'watermarkW', 'watermarkH', 'watermarkAlpha'];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const evt = id === 'watermarkUrl' || id === 'watermarkImgId' ? 'change' : 'input';
    el.addEventListener(evt, () => {
      lastAutoResolutionKey = '';
      if (window.isWatermarkEnabled) refreshWatermarkIfEnabled();
    });
  });
}

window.toggleWatermark = toggleWatermark;
window.disableWatermark = disableWatermark;
window.initWatermarkControls = initWatermarkControls;
window.maybeRefreshWatermarkLayoutForResolutionChange = maybeRefreshWatermarkLayoutForResolutionChange;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWatermarkControls);
} else {
  initWatermarkControls();
}
