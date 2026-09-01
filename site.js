const STORAGE_KEY = "cloudinary-video-gallery:selected";
const LAYER_STORAGE_KEY = "cloudinary-video-gallery:layer-presets";
const PLAYER_WIDTH = 900;

const defaultVideos = [
  { id: "black-evening-suit", name: "Black Evening Suit", source: "https://res.cloudinary.com/demohost/video/upload/v1787601715/Black_Evening_Suit.mp4" },
  { id: "city-motion", name: "City Motion", source: "https://res.cloudinary.com/demohost/video/upload/v1787601515/kt11mzyxequt3cdlex88.mp4" },
  { id: "wraparound-violet", name: "Wraparound Violet", source: "https://res.cloudinary.com/demohost/video/upload/v1787601758/Wraparound_violet.mp4" },
  { id: "coral-reef", name: "Coral Reef", source: "https://res.cloudinary.com/demohost/video/upload/v1787613711/coverr-long-boarding-in-a-coral-reef-4086-original_vfwd0l.mp4" },
  { id: "hiking", name: "Hiking", source: "https://res.cloudinary.com/demohost/video/upload/v1787613722/coverr-two-men-hiking-7785-original_zfag1k.mp4" },
  { id: "check-this", name: "Check This", source: "https://res.cloudinary.com/demohost/video/upload/v1787601725/Check_this.mp4" },
  { id: "beach-flight", name: "Beach Flight", source: "https://res.cloudinary.com/demohost/video/upload/v1787613641/coverr-flying-over-the-beach-462-original_c1uoho.mp4" },
  { id: "cloudinary-sample", name: "Cloudinary Sample", source: "https://res.cloudinary.com/demohost/video/upload/v1787601673/cld-sample-video.mp4" },
  { id: "going-away", name: "Going Away", source: "https://res.cloudinary.com/demohost/video/upload/v1787601701/Going_Away.mp4" },
];

function isCloudinaryVideoUrl(value) {
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && url.hostname === "res.cloudinary.com" && url.pathname.includes("/video/");
  } catch (_) {
    return false;
  }
}

function decodeGalleryConfig(hash) {
  const encoded = new URLSearchParams((hash || "").replace(/^#/, "")).get("cfg");
  if (!encoded) return null;
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - encoded.length % 4) % 4);
    const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch (_) {
    return null;
  }
}

function encodeGalleryConfig(urls) {
  const payload = JSON.stringify({ version: 1, videos: urls });
  const binary = Array.from(new TextEncoder().encode(payload), (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function resolveGalleryVideos(config) {
  if (!config || config.version !== 1 || !Array.isArray(config.videos) || config.videos.length !== defaultVideos.length) return defaultVideos;
  return defaultVideos.map((video, index) => ({ ...video, source: isCloudinaryVideoUrl(config.videos[index]) ? config.videos[index] : video.source }));
}

const videos = resolveGalleryVideos(decodeGalleryConfig(window.location.hash));

const pages = {
  videos: { label: "VIDEO LIBRARY", title: "Videos", intro: "Choose a source video." },
  transform: { label: "TRANSFORMATION", title: "Transform", intro: "A simple URL change transforms the video on the fly." },
  showcase: { label: "SOME TRANSFORMATION EXAMPLES", title: "Showcase", intro: "A small sample of transformations you can mix and match." },
  layer: { label: "NAMED TRANSFORMATIONS", title: "Layer", intro: "Stack transformations and give a name to combinations." },
  scale: { label: "TRANSFORMATIONS AT SCALE", title: "Scale", intro: "Apply a named transformation across a whole library of assets. Set it once, apply everywhere." },
  settings: { label: "GALLERY SETUP", title: "Settings", intro: "Replace the source clips and create a shareable customized gallery link." },
};

function transformedUrl(source, width = PLAYER_WIDTH) {
  return source.replace("/upload/", `/upload/w_${width},f_auto,q_auto/`);
}

function getSelectedVideo() {
  const id = localStorage.getItem(STORAGE_KEY);
  return videos.find((video) => video.id === id) || videos[0];
}

function selectVideo(id) {
  localStorage.setItem(STORAGE_KEY, id);
}

const pageKey = document.body.dataset.page;
const page = pages[pageKey] || pages.videos;
const activeConfigHash = window.location.hash;
const nav = Object.entries(pages)
  .filter(([key]) => key !== "settings")
  .map(([key, value]) => `<a class="tab ${key === pageKey ? "is-active" : ""}" href="${key === "videos" ? "videos.html" : `${key}.html`}${activeConfigHash}">${value.title}</a>`)
  .join("");

document.body.innerHTML = `
  <div class="gallery-shell">
    <header class="site-header">
      <div class="title-bar">
        <p class="site-title">Cloudinary Video Transformation Gallery</p>
        <img class="brand-logo" src="https://res.cloudinary.com/demohost/image/upload/v1787762370/Cloudinary_Video_Logo_Lock_Up_white_text.png" alt="Cloudinary Video">
      </div>
      <div class="nav-bar">
        <nav class="tabs" aria-label="Transformation gallery">${nav}</nav>
        <a class="settings" href="settings.html${activeConfigHash}" aria-label="Gallery settings">⚙</a>
      </div>
    </header>
    <main class="page-content">
      <p class="section-kicker">${page.label}</p>
      <h1 class="page-heading">${page.title}</h1>
      <p class="intro">${page.intro}</p>
      <div id="page-experience"></div>
    </main>
  </div>
`;

function renderVideoGrid() {
  const selected = getSelectedVideo();
  const experience = document.querySelector("#page-experience");
  experience.innerHTML = `
    <section class="videos-layout">
      <div>
        <section class="video-grid" role="radiogroup" aria-label="Source video selection">
          ${videos.map((video) => `
            <article class="video-card ${video.id === selected.id ? "is-selected" : ""}" role="radio" aria-checked="${video.id === selected.id}" tabindex="0" data-video-id="${video.id}">
              <video ${video.id === selected.id ? "autoplay loop" : ""} muted playsinline preload="metadata" src="${transformedUrl(video.source)}"></video>
              <span class="select-dot" aria-hidden="true"></span>
            </article>
          `).join("")}
        </section>
        
      </div>
      ${inspectorMarkup(selected)}
      <video id="original-metadata-probe" muted playsinline preload="metadata" aria-hidden="true"></video>
    </section>
  `;

  document.querySelectorAll(".video-card").forEach((card) => {
    const video = card.querySelector("video");
    card.addEventListener("mouseenter", () => video.play().catch(() => {}));
    card.addEventListener("mouseleave", () => {
      if (!card.classList.contains("is-selected")) video.pause();
    });
    card.addEventListener("click", () => updateSelection(card.dataset.videoId));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        updateSelection(card.dataset.videoId);
      }
    });
  });
  loadOriginalMetadata(selected);
}

function updateSelection(id) {
  selectVideo(id);
  document.querySelectorAll(".video-card").forEach((card) => {
    const selected = card.dataset.videoId === id;
    card.classList.toggle("is-selected", selected);
    card.setAttribute("aria-checked", selected);
    const video = card.querySelector("video");
    video.loop = selected;
    if (selected) video.play().catch(() => {});
    else video.pause();
  });
  if (pageKey === "videos") loadOriginalMetadata(videos.find((video) => video.id === id));
}

function formatBytes(bytes) {
  if (!bytes) return "Loading…";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

function sourceFormat(source) {
  const match = source.match(/\.([a-z0-9]+)(?:\?|$)/i);
  return match ? match[1].toUpperCase() : "Unknown";
}

function codecFromContentType(contentType) {
  const match = contentType?.match(/codecs\s*=\s*"?([^";]+)"?/i);
  if (!match) return "Unavailable from delivery";
  const codec = match[1].split(",")[0].trim().toLowerCase();
  const labels = {
    avc1: "H.264", avc3: "H.264", hvc1: "H.265 / HEVC", hev1: "H.265 / HEVC",
    vp09: "VP9", vp9: "VP9", av01: "AV1", theora: "Theora",
  };
  const family = Object.keys(labels).find((key) => codec.startsWith(key));
  return family ? `${labels[family]} (${codec})` : codec.toUpperCase();
}

function inspectorMarkup(selected) {
  return `
    <aside class="inspector" aria-label="Video Inspector">
      <p class="inspector-kicker">VIDEO INSPECTOR</p>
      <dl>
        <div><dt>Size</dt><dd id="video-size">Loading…</dd></div>
        <div><dt>Dimensions</dt><dd id="video-dimensions">Loading…</dd></div>
        <div><dt>Duration</dt><dd id="video-duration">Loading…</dd></div>
        <div><dt>Codec</dt><dd id="video-codec">Loading…</dd></div>
        <div><dt>Format</dt><dd id="video-format">${sourceFormat(selected.source)}</dd></div>
      </dl>
    </aside>
  `;
}

function loadOriginalMetadata(selected) {
  const metadataProbe = document.querySelector("#original-metadata-probe");
  document.querySelector("#video-size").textContent = "Loading…";
  document.querySelector("#video-dimensions").textContent = "Loading…";
  document.querySelector("#video-duration").textContent = "Loading…";
  document.querySelector("#video-format").textContent = sourceFormat(selected.source);
  document.querySelector("#video-codec").textContent = "Loading…";
  metadataProbe.onloadedmetadata = () => {
    document.querySelector("#video-dimensions").textContent = `${metadataProbe.videoWidth} × ${metadataProbe.videoHeight}`;
    document.querySelector("#video-duration").textContent = `${metadataProbe.duration.toFixed(1)} seconds`;
  };
  metadataProbe.src = selected.source;
  fetch(selected.source, { method: "HEAD" })
    .then((response) => {
      document.querySelector("#video-size").textContent = response.headers.get("content-length") ? formatBytes(Number(response.headers.get("content-length"))) : "Available on delivery";
      document.querySelector("#video-codec").textContent = codecFromContentType(response.headers.get("content-type"));
    })
    .catch(() => {
      document.querySelector("#video-size").textContent = "Available on delivery";
      document.querySelector("#video-codec").textContent = "Unavailable from delivery";
    });
}

function mediaStatsMarkup(prefix) {
  return `
    <dl class="media-stats">
      <div><dt>Size</dt><dd id="${prefix}-size">Loading…</dd></div>
      <div><dt>Duration</dt><dd id="${prefix}-duration">Loading…</dd></div>
      <div><dt>Codec</dt><dd id="${prefix}-codec">Loading…</dd></div>
      <div><dt>Format</dt><dd id="${prefix}-format">Loading…</dd></div>
    </dl>
  `;
}

function loadPlayerStats(player, url, prefix, forcedCodec = null) {
  const requestId = String(Number(player.dataset.statsRequestId || 0) + 1);
  player.dataset.statsRequestId = requestId;
  const isCurrentRequest = () => player.dataset.statsRequestId === requestId;
  const resolvedUrl = new URL(url, window.location.href).href;
  const set = (field, value) => { document.querySelector(`#${prefix}-${field}`).textContent = value; };
  set("size", "Loading…");
  set("duration", "Loading…");
  set("format", "Loading…");
  set("codec", "Loading…");
  const updateDuration = () => {
    if (isCurrentRequest() && player.currentSrc === resolvedUrl && Number.isFinite(player.duration)) {
      set("duration", `${player.duration.toFixed(1)} seconds`);
    }
  };
  player.onloadedmetadata = updateDuration;
  player.ondurationchange = updateDuration;
  player.oncanplay = updateDuration;
  player.src = url;
  player.load();
  [600, 1600, 3500, 6000].forEach((delay) => window.setTimeout(updateDuration, delay));
  fetch(url, { method: "HEAD" })
    .then((response) => {
      const length = response.headers.get("content-length");
      const type = response.headers.get("content-type");
      if (!isCurrentRequest()) return;
      set("format", type?.split("/")[1]?.split(";")[0]?.toUpperCase() || sourceFormat(url));
      set("codec", forcedCodec || codecFromContentType(type));
      if (!length) {
        set("size", "Calculating…");
        return new Promise((resolve) => window.setTimeout(resolve, 800));
      }
      set("size", formatBytes(Number(length)));
      return null;
    })
    .then((needsBodySize) => {
      if (needsBodySize !== undefined || !isCurrentRequest()) return;
      return fetch(url).then((response) => response.blob()).then((body) => {
        if (isCurrentRequest()) set("size", formatBytes(body.size));
      });
    })
    .catch(() => {
      if (!isCurrentRequest()) return;
      set("size", "Unavailable");
      set("format", sourceFormat(url));
      set("codec", forcedCodec || "Unavailable from delivery");
    });
}

function transformationUrl(source, values) {
  const parts = [];
  if (values.duration) parts.push(`du_${values.duration}`);
  if (values.fillWidth && values.fillHeight) parts.push(`c_fill,w_${values.fillWidth},h_${values.fillHeight}`);
  else if (values.fillWidth) parts.push(`c_scale,w_${values.fillWidth}`);
  else if (values.fillHeight) parts.push(`c_scale,h_${values.fillHeight}`);
  if (values.codec === "h265") parts.push("vc_h265", "f_mp4");
  else if (values.codec === "av1") parts.push("vc_av1", "f_mp4");
  else if (values.autoFormat) parts.push("f_auto:video");
  if (values.autoOptimize) parts.push("q_auto");
  return parts.length ? source.replace("/upload/", `/upload/${parts.join("/")}/`) : source;
}

function deliveryUrl(source, components) {
  return source.replace("/upload/", `/upload/${components.join("/")}/`);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[character]);
}

function defaultLayerPresets() {
  return Array.from({ length: 3 }, (_, index) => ({
    id: `layer-${index}`,
    name: `Name ${index + 1}`,
    settings: {
      autoFormat: false,
      autoQuality: false,
      crop: "none",
      graphicOverlay: false,
      textOverlay: false,
      speedAdjust: false,
      fade: false,
    },
  }));
}

function getLayerPresets() {
  try {
    const saved = JSON.parse(localStorage.getItem(LAYER_STORAGE_KEY));
    if (Array.isArray(saved) && saved.length === 3) {
      return saved.map((preset, index) => ({
        ...preset,
        name: preset.name === `Layer ${index + 1}` ? `Name ${index + 1}` : preset.name,
      }));
    }
  } catch (_) {
    // Start with clean presets if browser storage contains malformed data.
  }
  return defaultLayerPresets();
}

function saveLayerPresets(presets) {
  localStorage.setItem(LAYER_STORAGE_KEY, JSON.stringify(presets));
}

function layerDeliveryUrl(source, settings) {
  const components = ["w_600"];
  if (settings.crop === "square") components.push("c_fill,g_auto,w_600,h_600");
  if (settings.crop === "banner") components.push("c_fill,g_auto,w_600,h_200");
  if (settings.graphicOverlay) components.push("l_cloudinary_cloud_glyph_blue_png", "c_scale,fl_relative,w_0.22", "fl_layer_apply,g_north_east,x_20,y_20");
  if (settings.textOverlay) components.push("l_text:Arial_56_bold:Layer%20Demo", "c_scale,fl_relative,w_0.7", "fl_layer_apply,g_south,y_28");
  if (settings.speedAdjust) components.push("e_accelerate:-50");
  if (settings.fade) components.push("e_fade:1000", "e_fade:-1000");
  components.push("vc_auto");
  if (settings.autoFormat) components.push("f_auto:video");
  if (settings.autoQuality) components.push("q_auto");
  return deliveryUrl(source, components);
}

function renderTransform() {
  const selected = getSelectedVideo();
  const experience = document.querySelector("#page-experience");
  experience.innerHTML = `
    <section class="transform-layout">
      <section class="transform-panel">
        <p class="player-title">Source video</p>
        <a class="video-url" href="${selected.source}" target="_blank" rel="noreferrer">${selected.source}</a>
        <div class="player-stage source-stage">
          <video id="source-player" controls autoplay muted loop playsinline preload="metadata"></video>
        </div>
        ${mediaStatsMarkup("source")}
      </section>
      <section class="transform-panel">
        <p class="player-title">Transformed Video</p>
        <a id="transformed-url" class="video-url" href="${selected.source}" target="_blank" rel="noreferrer">${selected.source}</a>
        <div class="player-stage transformed-stage">
          <video id="transformed-player" controls muted loop playsinline preload="metadata"></video>
        </div>
        ${mediaStatsMarkup("transformed")}
        <form id="transform-controls" class="transform-controls">
          <label class="switch-control"><span>Auto Format</span><input type="checkbox" name="autoFormat"><i></i></label>
          <label class="switch-control"><span>Auto Optimize</span><input type="checkbox" name="autoOptimize"><i></i></label>
          <label class="switch-control"><span>Codec H.265</span><input type="checkbox" name="codecH265"><i></i></label>
          <label class="switch-control"><span>Codec AV1</span><input type="checkbox" name="codecAv1"><i></i></label>
          <label class="field-control"><span>Fill Crop Width</span><input type="number" name="fillWidth" min="1" step="1" placeholder="Pixels"></label>
          <label class="field-control"><span>Fill Crop Height</span><input type="number" name="fillHeight" min="1" step="1" placeholder="Pixels"></label>
          <label class="field-control"><span>Duration</span><input type="number" name="duration" min="0.1" step="0.1" placeholder="Seconds"></label>
          <button class="apply-button" type="submit">Apply</button>
        </form>
      </section>
    </section>
  `;
  const sourcePlayer = document.querySelector("#source-player");
  const transformedPlayer = document.querySelector("#transformed-player");
  const transformedUrlLink = document.querySelector("#transformed-url");
  loadPlayerStats(sourcePlayer, selected.source, "source");
  loadPlayerStats(transformedPlayer, selected.source, "transformed");

  const transformControls = document.querySelector("#transform-controls");
  const autoFormatControl = transformControls.elements.autoFormat;
  const codecControls = [transformControls.elements.codecH265, transformControls.elements.codecAv1];
  autoFormatControl.addEventListener("change", () => {
    if (autoFormatControl.checked) codecControls.forEach((control) => { control.checked = false; });
  });
  codecControls.forEach((control) => control.addEventListener("change", () => {
    if (!control.checked) return;
    autoFormatControl.checked = false;
    codecControls.forEach((otherControl) => { if (otherControl !== control) otherControl.checked = false; });
  }));

  transformControls.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const codec = form.get("codecH265") === "on" ? "h265" : form.get("codecAv1") === "on" ? "av1" : null;
    const nextUrl = transformationUrl(selected.source, {
      autoFormat: form.get("autoFormat") === "on",
      autoOptimize: form.get("autoOptimize") === "on",
      codec,
      duration: form.get("duration"),
      fillWidth: form.get("fillWidth"),
      fillHeight: form.get("fillHeight"),
    });
    transformedUrlLink.href = nextUrl;
    transformedUrlLink.textContent = nextUrl;
    loadPlayerStats(transformedPlayer, nextUrl, "transformed", codec === "h265" ? "H.265 / HEVC (forced)" : codec === "av1" ? "AV1 (forced)" : null);
    transformedPlayer.play().catch(() => {});
  });
}

function renderShowcase() {
  const selected = getSelectedVideo();
  const heading = document.querySelector(".page-heading");
  const intro = document.querySelector(".intro");
  heading.classList.add("source-heading");
  heading.innerHTML = `Source Video:<span>${selected.source}</span>`;
  intro.textContent = " ";

  const treatments = [
    { title: "Original", components: ["c_scale,w_700", "vc_auto", "f_auto:video", "q_auto"] },
    { title: "Auto-crop to 9:16", components: ["w_600", "c_fill,ar_9:16,g_auto", "vc_auto", "f_auto:video", "q_auto"] },
    { title: "Blur pad to square", components: ["c_pad,b_blurred:400:15,w_600,h_600", "vc_auto", "f_auto:video", "q_auto"] },
    { title: "Text overlay", components: ["c_scale,w_700", "l_text:Arial_80_bold:Cloudinary%20Video", "c_scale,fl_relative,w_0.86", "fl_layer_apply,g_north,y_75", "vc_auto", "f_auto:video", "q_auto"] },
    { title: "Reverse", components: ["e_reverse", "c_scale,w_700", "vc_auto", "f_auto:video", "q_auto"] },
    { title: "Image overlay", components: ["c_fill,g_auto,w_700,h_394", "l_cloudinary_cloud_glyph_blue_png", "c_scale,fl_relative,w_0.22", "fl_layer_apply,g_north_east,x_20,y_20", "vc_auto", "f_auto:video", "q_auto"] },
  ];

  document.querySelector("#page-experience").innerHTML = `
    <section class="showcase-grid" aria-label="Video transformation showcase">
      ${treatments.map((treatment) => {
        const url = deliveryUrl(selected.source, treatment.components);
        return `
          <article class="showcase-card">
            <h2>${treatment.title}</h2>
            <div class="showcase-stage">
              <video autoplay muted loop playsinline preload="metadata" src="${url}"></video>
            </div>
          </article>
        `;
      }).join("")}
    </section>
  `;
}

function layerSwitch(label, setting, checked) {
  return `<label class="switch-control"><span>${label}</span><input type="checkbox" data-setting="${setting}" ${checked ? "checked" : ""}><i></i></label>`;
}

function cropSwitch(label, crop, checked) {
  return `<label class="switch-control"><span>${label}</span><input type="checkbox" data-crop="${crop}" ${checked ? "checked" : ""}><i></i></label>`;
}

function renderLayer() {
  const selected = getSelectedVideo();
  const presets = getLayerPresets();
  const heading = document.querySelector(".page-heading");
  const intro = document.querySelector(".intro");
  heading.classList.add("source-heading");
  heading.innerHTML = `Source Video:<span>${escapeHtml(selected.source)}</span>`;
  intro.textContent = "Build three named transformation recipes, then reuse them on the Scale page.";

  document.querySelector("#page-experience").innerHTML = `
    <section class="layer-grid" aria-label="Named transformation recipes">
      ${presets.map((preset, index) => {
        const settings = preset.settings;
        return `
          <article class="layer-card" data-slot="${index}">
            <label class="layer-name"><span>Name</span><input type="text" value="${escapeHtml(preset.name)}" maxlength="48" placeholder="Transformation name"></label>
            <div class="layer-switches">
              ${layerSwitch("Auto Format", "autoFormat", settings.autoFormat)}
              ${layerSwitch("Auto Quality", "autoQuality", settings.autoQuality)}
              ${layerSwitch("Graphic Overlay", "graphicOverlay", settings.graphicOverlay)}
              ${layerSwitch("Text Overlay", "textOverlay", settings.textOverlay)}
              ${layerSwitch("Speed Adjust", "speedAdjust", settings.speedAdjust)}
              ${layerSwitch("Fade In / Out", "fade", settings.fade)}
              ${cropSwitch("Square Crop", "square", settings.crop === "square")}
              ${cropSwitch("Banner Crop", "banner", settings.crop === "banner")}
            </div>
            <button class="layer-apply" type="button">Apply</button>
            <a class="layer-url" target="_blank" rel="noreferrer"></a>
            <div class="layer-stage"><video autoplay muted loop playsinline preload="metadata"></video></div>
          </article>
        `;
      }).join("")}
    </section>
  `;

  const updateCard = (card, preset) => {
    const url = layerDeliveryUrl(selected.source, preset.settings);
    const link = card.querySelector(".layer-url");
    const player = card.querySelector("video");
    link.href = url;
    link.textContent = url;
    player.src = url;
    player.load();
    player.play().catch(() => {});
  };

  document.querySelectorAll(".layer-card").forEach((card) => {
    const slot = Number(card.dataset.slot);
    updateCard(card, presets[slot]);
    const cropInputs = card.querySelectorAll("[data-crop]");
    cropInputs.forEach((input) => input.addEventListener("change", () => {
      if (input.checked) cropInputs.forEach((otherInput) => {
        if (otherInput !== input) otherInput.checked = false;
      });
    }));
    card.querySelector(".layer-apply").addEventListener("click", () => {
      const name = card.querySelector(".layer-name input").value.trim() || `Name ${slot + 1}`;
      const crop = card.querySelector('[data-crop="square"]').checked ? "square" : card.querySelector('[data-crop="banner"]').checked ? "banner" : "none";
      const settings = Object.fromEntries(
        [...card.querySelectorAll("[data-setting]")].map((input) => [input.dataset.setting, input.checked]),
      );
      presets[slot] = { id: `layer-${slot}`, name, settings: { ...settings, crop } };
      saveLayerPresets(presets);
      card.querySelector(".layer-name input").value = name;
      updateCard(card, presets[slot]);
    });
  });
}

function renderScale() {
  const presets = getLayerPresets();
  const experience = document.querySelector("#page-experience");
  experience.innerHTML = `
    <section class="scale-toolbar">
      <label><span>Named transformation</span><select id="scale-preset"><option value="none">None — original</option>${presets.map((preset, index) => `<option value="${index}">${escapeHtml(preset.name)}</option>`).join("")}</select></label>
    </section>
    <section id="scale-grid" class="scale-grid" aria-label="Transformation applied across nine videos"></section>
  `;
  const grid = document.querySelector("#scale-grid");
  const drawGrid = (preset) => {
    grid.innerHTML = videos.slice(0, 9).map((video) => {
      const url = preset ? layerDeliveryUrl(video.source, preset.settings) : deliveryUrl(video.source, ["c_scale,w_600", "vc_auto", "f_auto:video", "q_auto"]);
      return `
        <article class="scale-card">
          <div class="scale-stage"><video autoplay muted loop playsinline preload="metadata" src="${url}"></video></div>
        </article>
      `;
    }).join("");
  };
  drawGrid(null);
  document.querySelector("#scale-preset").addEventListener("change", (event) => drawGrid(event.currentTarget.value === "none" ? null : presets[Number(event.currentTarget.value)]));
}

function renderSettings() {
  const experience = document.querySelector("#page-experience");
  experience.innerHTML = `
    <form id="gallery-settings" class="gallery-settings" novalidate>
      <p class="settings-guidance">Paste Cloudinary video delivery URLs. The generated link stores all nine choices in its URL, so it can be shared or opened on any GitHub Pages visit.</p>
      <div class="settings-video-list">
        ${videos.map((video, index) => `
          <label class="settings-field">
            <span>Video ${index + 1}</span>
            <input type="url" inputmode="url" autocomplete="off" required value="${escapeHtml(video.source)}" data-video-url="${index}">
            <em class="settings-error" aria-live="polite"></em>
          </label>
        `).join("")}
      </div>
      <div class="settings-actions">
        <button class="apply-button" type="submit">Open customized gallery</button>
        <button class="settings-reset" type="button">Reset to gallery defaults</button>
      </div>
      <label class="settings-share">
        <span>Customized gallery link</span>
        <input id="settings-share-link" type="text" readonly>
      </label>
      <button class="copy-link" type="button">Copy customized link</button>
      <p id="settings-status" class="settings-status" aria-live="polite"></p>
    </form>
  `;

  const form = document.querySelector("#gallery-settings");
  const shareLink = document.querySelector("#settings-share-link");
  const status = document.querySelector("#settings-status");
  const getUrls = () => [...form.querySelectorAll("[data-video-url]")].map((input) => input.value.trim());
  const updateLink = () => {
    const urls = getUrls();
    let valid = true;
    form.querySelectorAll("[data-video-url]").forEach((input, index) => {
      const message = isCloudinaryVideoUrl(urls[index]) ? "" : "Enter a Cloudinary video delivery URL.";
      input.setAttribute("aria-invalid", String(Boolean(message)));
      input.closest(".settings-field").querySelector(".settings-error").textContent = message;
      if (message) valid = false;
    });
    if (!valid) {
      shareLink.value = "";
      return null;
    }
    const customizedUrl = new URL("videos.html", window.location.href);
    customizedUrl.hash = `cfg=${encodeGalleryConfig(urls)}`;
    shareLink.value = customizedUrl.href;
    return customizedUrl.href;
  };

  form.querySelectorAll("[data-video-url]").forEach((input) => input.addEventListener("input", () => {
    status.textContent = "";
    updateLink();
  }));
  updateLink();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const customizedUrl = updateLink();
    if (customizedUrl) window.location.assign(customizedUrl);
  });
  document.querySelector(".settings-reset").addEventListener("click", () => {
    form.querySelectorAll("[data-video-url]").forEach((input, index) => { input.value = defaultVideos[index].source; });
    status.textContent = "Defaults restored.";
    updateLink();
  });
  document.querySelector(".copy-link").addEventListener("click", async () => {
    const customizedUrl = updateLink();
    if (!customizedUrl) return;
    try {
      await navigator.clipboard.writeText(customizedUrl);
      status.textContent = "Customized link copied.";
    } catch (_) {
      shareLink.focus();
      shareLink.select();
      document.execCommand("copy");
      status.textContent = "Customized link selected and copied.";
    }
  });
}

function renderPlaceholder() {
  document.querySelector("#page-experience").innerHTML = `
    <section class="canvas" aria-label="${page.title} content area">
      <div class="placeholder"><div class="play-mark" aria-hidden="true">▶</div><h2>${page.title} content arrives here</h2><p>This dedicated canvas is ready for the video-heavy experience we design next.</p></div>
    </section>
  `;
}

if (pageKey === "videos") renderVideoGrid();
else if (pageKey === "transform") renderTransform();
else if (pageKey === "showcase") renderShowcase();
else if (pageKey === "layer") renderLayer();
else if (pageKey === "scale") renderScale();
else if (pageKey === "settings") renderSettings();
else renderPlaceholder();
