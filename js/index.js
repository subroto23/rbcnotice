/* =========================================================
   রূপসী বাংলা ক্লাব — প্যাড এডিটর
   প্যাড (হেডার, নং/তারিখ, ফুটার) ফিক্সড; ভেতরের অংশে যা খুশি লেখা/ডিজাইন।
   ========================================================= */
(() => {
'use strict';

const ASSETS = window.PAD_ASSETS || {};
const STORE_KEY = 'rbc-pad-v1';
const PAGE_W = 794;
const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
const MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
const DAYS = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
const FONT_SIZES = [10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 40, 46, 52, 60, 72, 90];

// স্বাক্ষরকারী — নতুন কেউ যোগ করতে এখানে লিখুন (ছবি js/assets.js এ)
const SIGNERS = [
    { id: 'monoj',   name: 'মনোজ দাস',   role: 'সাধারণ-সম্পাদক', asset: 'sigMonoj' },
    { id: 'chandon', name: 'চন্দন দাস',  role: 'সভাপতি',          asset: 'sigChandon' },
    { id: 'subroto', name: 'সুব্রত দাস', role: 'পদবি লিখুন',      asset: 'sigSubroto' },
    { id: 'blank',   name: 'নাম লিখুন',  role: 'পদবি লিখুন',      asset: null },
];
const DEFAULT_SIGNERS = ['monoj', 'chandon'];

const TEMPLATES = {
    notice: () => `
        <h1 style="text-align: center;"><u>নোটিশ</u></h1>
        <p><b>বিষয়ঃ</b> এখানে নোটিশের বিষয় লিখুন।</p>
        <p style="text-align: justify;">এতদ্বারা রূপসী বাংলা ক্লাবের সকল সদস্যের অবগতির জন্য জানানো যাচ্ছে যে, এখানে নোটিশের বিস্তারিত লিখুন। যেকোনো লেখা সিলেক্ট করে উপরের টুলবার থেকে ফন্ট, সাইজ, রং, অ্যালাইনমেন্ট — যা খুশি বদলাতে পারবেন।</p>
        <p style="text-align: justify;">উক্ত বিষয়ে সকলের সহযোগিতা একান্ত কাম্য।</p>
        ${sigHTML(DEFAULT_SIGNERS)}`,
    condolence: () => `
        <h1 style="text-align: center;"><u>শোকবার্তা</u></h1>
        <p style="text-align: justify;">রূপসী বাংলা ক্লাবের পক্ষ থেকে গভীর দুঃখের সাথে জানানো যাচ্ছে যে, <b>[নাম লিখুন]</b> গত <b>[তারিখ]</b> পরলোকগমন করেছেন।</p>
        <p style="text-align: justify;">আমরা তাঁর বিদেহী আত্মার শান্তি কামনা করছি এবং শোকসন্তপ্ত পরিবারের প্রতি গভীর সমবেদনা জানাচ্ছি।</p>
        ${sigHTML(DEFAULT_SIGNERS)}`,
    congrats: () => `
        <h1 style="text-align: center;"><u>অভিনন্দন</u></h1>
        <p style="text-align: justify;"><b>[নাম লিখুন]</b>-কে <b>[কারণ লিখুন]</b> উপলক্ষে রূপসী বাংলা ক্লাবের পক্ষ থেকে আন্তরিক অভিনন্দন ও শুভেচ্ছা।</p>
        <p style="text-align: justify;">আমরা তাঁর উত্তরোত্তর সাফল্য ও মঙ্গল কামনা করছি।</p>
        ${sigHTML(DEFAULT_SIGNERS)}`,
    blank: () => '<p><br></p>',
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const toBn = s => String(s).replace(/[0-9]/g, d => BN_DIGITS[d]);

const workspace = $('#workspace');
const padTpl = $('#padTemplate');
const inNo = $('#inNo'), inDate = $('#inDate');
const selBlock = $('#selBlock'), selFont = $('#selFont'), selSize = $('#selSize'), selLine = $('#selLine');
const tableTools = $('#tableTools');
const popImg = $('#popImg');
const fileImg = $('#fileImg');

const state = { no: '', date: '' };
let savedRange = null;     // টুলবারে ক্লিক করার আগে কোথায় কার্সর ছিল
let lastPage = null;       // সর্বশেষ যে পাতায় কাজ হয়েছে
let pendingFontPx = null;
let selectedImg = null;
let currentTable = null;
let zoomMode = 'fit', zoom = 1;
let fileMode = 'inline';   // ছবি কোথায় বসবে: inline | float

/* ---------------- ছোটখাটো সহায়ক ---------------- */
function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function formatDate(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return '';
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    return `${toBn(d.getDate())} ${MONTHS[d.getMonth()]} ${toBn(d.getFullYear())}, ${DAYS[d.getDay()]}`;
}
function newNumber() {
    return `আরবিসি১৫/ক/${toBn(Math.floor(Math.random() * 1000000) + 1)}`;
}
document.addEventListener('pointerdown', () => { $('#toast').hidden = true; }, true);
function toast(msg, ms = 2600) {
    const t = $('#toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { t.hidden = true; }, ms);
}
function elOf(node) { return node && (node.nodeType === 1 ? node : node.parentElement); }
function editableHost(node) { const el = elOf(node); return el && el.closest('.editor, .float-content'); }
function hydrateAssets(root) {
    $$('img[data-asset]', root).forEach(img => {
        const src = ASSETS[img.dataset.asset];
        if (src && img.getAttribute('src') !== src) img.src = src;
    });
}

/* ---------------- পাতা ---------------- */
function pages() { return $$('.page-wrap', workspace); }

function createPage(html = '', floats = '', after = null) {
    const node = padTpl.content.firstElementChild.cloneNode(true);
    $('.editor', node).innerHTML = html;
    $('.float-layer', node).innerHTML = floats;
    hydrateAssets(node);
    if (after) after.after(node); else workspace.appendChild(node);
    lastPage = node;
    refreshPad();
    return node;
}
function currentPage() {
    return (lastPage && lastPage.isConnected) ? lastPage : pages()[0];
}

function refreshPad() {
    const all = pages();
    const dateText = formatDate(state.date);
    all.forEach((p, i) => {
        $('.pad-no', p).textContent = state.no;
        $('.pad-date', p).textContent = dateText;
        $('.pg-num', p).textContent = `পাতা ${toBn(i + 1)} / ${toBn(all.length)}`;
        $('.pg-del', p).hidden = all.length < 2;
    });
    checkPages();
}

function isEditorEmpty(ed) {
    return ed.textContent.trim() === '' && !ed.querySelector('img, table, hr, .sig-row');
}
// শেষের ফাঁকা লাইনগুলো বাদ দিয়ে আসল লেখা পাতার নিচে বেরিয়ে গেছে কিনা
function overflows(ed) {
    if (ed.scrollTop > 0) return true;
    const limit = ed.getBoundingClientRect().bottom + 1;
    for (let n = ed.lastElementChild; n; n = n.previousElementSibling) {
        if (n.matches('p, div:not([class])') && n.textContent.trim() === '' && !n.querySelector('img, table, hr')) continue;
        return n.getBoundingClientRect().bottom > limit;
    }
    return false;
}
function checkPages() {
    pages().forEach(p => {
        const ed = $('.editor', p);
        ed.classList.toggle('is-empty', isEditorEmpty(ed));
        $('.pg-warn', p).hidden = !overflows(ed);
    });
}

/* ---------------- জুম ---------------- */
const ZOOM_MIN = 0.3, ZOOM_MAX = 2;
const ZOOM_STEPS = [0.3, 0.4, 0.5, 0.6, 0.75, 0.9, 1, 1.25, 1.5, 1.75, 2];
const mqMobile = window.matchMedia('(max-width: 760px)');
const isMobile = () => mqMobile.matches;

function fitZoom() {
    const cs = getComputedStyle(workspace);
    const avail = workspace.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    return Math.max(ZOOM_MIN, Math.min(1, avail / PAGE_W));
}
// focal = যে বিন্দুকে কেন্দ্র করে জুম (চিমটির মাঝখান), যাতে আঙুলের নিচের লেখা সরে না যায়
function setZoom(z, focal) {
    const old = zoom;
    zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z));
    workspace.style.setProperty('--z', zoom);
    $('#btnZoomFit').textContent = toBn(Math.round(zoom * 100)) + '%';
    if (focal && old !== zoom) {
        const k = zoom / old;
        const ws = workspace.getBoundingClientRect();
        const y = focal.y - ws.top;
        window.scrollTo(window.scrollX, window.scrollY + y * k - y);
        const x = workspace.scrollLeft + focal.x - ws.left;
        workspace.scrollLeft = x * k - (focal.x - ws.left);
    }
    positionImgPop();
    positionTableTools();
}
function applyZoom() {
    setZoom(zoomMode === 'fit' ? fitZoom() : zoom);
}
function stepZoom(dir) {
    const next = dir > 0 ? ZOOM_STEPS.find(v => v > zoom + 0.01) : [...ZOOM_STEPS].reverse().find(v => v < zoom - 0.01);
    zoomMode = 'manual';
    if (next) setZoom(next);
}

// পপআপ যেন উপরের বার বা নিচের টুলবারের নিচে ঢাকা না পড়ে
function viewTop() { return Math.max(0, $('.topbars').getBoundingClientRect().bottom) + 6; }
function viewBottom() { return (isMobile() ? $('#toolbar').getBoundingClientRect().top : window.innerHeight) - 8; }

/* ---------------- সেভ ---------------- */
function cleanHTML(el) {
    const c = el.cloneNode(true);
    $$('img[data-asset]', c).forEach(i => i.removeAttribute('src'));
    $$('.selected, .img-selected', c).forEach(n => n.classList.remove('selected', 'img-selected'));
    return c.innerHTML;
}
function serialize() {
    return {
        v: 1, no: state.no, date: state.date,
        pages: pages().map(p => ({ html: cleanHTML($('.editor', p)), floats: cleanHTML($('.float-layer', p)) })),
    };
}
let saveTimer;
function scheduleSave() {
    clearTimeout(saveTimer);
    $('#saveState').textContent = '…';
    saveTimer = setTimeout(save, 700);
}
function save() {
    clearTimeout(saveTimer);
    try {
        localStorage.setItem(STORE_KEY, JSON.stringify(serialize()));
        $('#saveState').textContent = '✓ সেভ হয়েছে';
    } catch (e) {
        $('#saveState').textContent = '⚠ অটো-সেভ হয়নি';
    }
}
function loadSaved() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) { return null; }
}

function afterChange() {
    normalizeFontSize();
    checkPages();
    updateToolbar();
    scheduleSave();
}

/* ---------------- সিলেকশন ---------------- */
document.addEventListener('selectionchange', () => {
    const sel = getSelection();
    if (!sel.rangeCount) return;
    const r = sel.getRangeAt(0);
    const host = editableHost(r.commonAncestorContainer);
    if (!host) return;
    savedRange = r.cloneRange();
    lastPage = host.closest('.page-wrap') || lastPage;
    updateToolbar();
});

function restoreSelection() {
    if (!savedRange || !savedRange.startContainer.isConnected) return false;
    const host = editableHost(savedRange.commonAncestorContainer);
    if (!host) return false;
    const focusEl = elOf(savedRange.startContainer).closest('[contenteditable="true"]') || host;
    if (document.activeElement !== focusEl) focusEl.focus({ preventScroll: true });
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(savedRange);
    return true;
}
function anchorEl() {
    const sel = getSelection();
    if (sel.rangeCount && editableHost(sel.anchorNode)) return elOf(sel.anchorNode);
    return savedRange && savedRange.startContainer.isConnected ? elOf(savedRange.startContainer) : null;
}

function exec(cmd, val = null) {
    restoreSelection();
    document.execCommand('styleWithCSS', false, true);
    const ok = document.execCommand(cmd, false, val);
    afterChange();
    return ok;
}

/* ---------------- টুলবার অবস্থা ---------------- */
const STATE_CMDS = ['bold', 'italic', 'underline', 'strikeThrough', 'justifyLeft', 'justifyCenter',
    'justifyRight', 'justifyFull', 'insertUnorderedList', 'insertOrderedList'];

function updateToolbar() {
    const el = anchorEl();
    const inEditable = !!(el && editableHost(el));
    STATE_CMDS.forEach(c => {
        const b = $(`.toolbar [data-cmd="${c}"]`);
        let on = false;
        if (inEditable) { try { on = document.queryCommandState(c); } catch (e) { /* ignore */ } }
        b.classList.toggle('active', on);
    });
    if (!inEditable) { showTableTools(null); return; }

    const blk = el.closest('h1, h2, h3, blockquote');
    selBlock.value = blk ? blk.tagName.toLowerCase() : 'p';

    const cs = getComputedStyle(el);
    const fam = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
    selFont.value = [...selFont.options].some(o => o.value === fam) ? fam : '';
    const px = Math.round(parseFloat(cs.fontSize));
    selSize.value = FONT_SIZES.includes(px) ? String(px) : '';

    showTableTools(el.closest('.editor td, .editor th') ? el.closest('table') : null);
}

function showTableTools(table) {
    currentTable = table;
    tableTools.hidden = !table;
    positionTableTools();
}
function positionTableTools() {
    if (!currentTable || tableTools.hidden) return;
    if (!currentTable.isConnected) return showTableTools(null);
    const r = currentTable.getBoundingClientRect();
    const h = tableTools.offsetHeight, w = tableTools.offsetWidth;
    const minTop = viewTop();
    let top = r.top - h - 6;
    if (top < minTop) top = Math.max(minTop, Math.min(r.bottom + 6, viewBottom() - h));
    tableTools.style.top = top + 'px';
    tableTools.style.left = Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8)) + 'px';
}

/* ---------------- ফন্ট সাইজ ---------------- */
// execCommand শুধু ১-৭ সাইজ বোঝে, তাই ৭ দিয়ে লাগিয়ে পরে আসল px বসানো হয়
function applyFontSize(px) {
    if (!restoreSelection()) return;
    pendingFontPx = px;
    document.execCommand('styleWithCSS', false, true);
    document.execCommand('fontSize', false, '7');
    afterChange();
}
function normalizeFontSize() {
    if (!pendingFontPx) return;
    $$('.editor font[size="7"], .float-content font[size="7"]').forEach(f => {
        f.removeAttribute('size');
        f.style.fontSize = pendingFontPx + 'px';
    });
    $$('.editor [style*="xxx-large"], .float-content [style*="xxx-large"]').forEach(s => {
        s.style.fontSize = pendingFontPx + 'px';
    });
}

/* ---------------- লাইন ফাঁক ---------------- */
function applyLineHeight(v) {
    if (!restoreSelection()) return;
    const r = getSelection().getRangeAt(0);
    const host = editableHost(r.commonAncestorContainer);
    let blocks = $$('p, h1, h2, h3, blockquote, li, td, th, div:not([class])', host).filter(b => r.intersectsNode(b));
    if (!blocks.length) blocks = [host];
    blocks.forEach(b => { b.style.lineHeight = v; });
    afterChange();
}

/* ---------------- ব্লক বসানো (টেবিল, স্বাক্ষর) ---------------- */
function placeCaret(node, atEnd = false) {
    const r = document.createRange();
    r.selectNodeContents(node);
    r.collapse(!atEnd);
    const s = getSelection();
    s.removeAllRanges();
    s.addRange(r);
    savedRange = r.cloneRange();
}
// কার্সর কোনো .editor এ না থাকলে বর্তমান পাতার শেষে নিয়ে যায়
function caretInEditor() {
    if (restoreSelection()) {
        const host = editableHost(savedRange.commonAncestorContainer);
        if (host.classList.contains('editor')) {
            const sig = elOf(savedRange.startContainer).closest('.sig-row');
            if (sig) { const p = document.createElement('p'); p.innerHTML = '<br>'; sig.after(p); placeCaret(p); }
            return host;
        }
    }
    const ed = $('.editor', currentPage());
    ed.focus({ preventScroll: true });
    placeCaret(ed, true);
    return ed;
}
function topLevelChild(ed, r) {
    let n = r.startContainer;
    if (n === ed) return ed.childNodes[Math.max(0, r.startOffset - 1)] || null;
    while (n && n.parentNode !== ed) n = n.parentNode;
    return n;
}
function insertBlock(html) {
    const ed = caretInEditor();
    const r = getSelection().getRangeAt(0);
    const top = topLevelChild(ed, r);
    const tmp = document.createElement('div');
    tmp.innerHTML = html.trim();
    const nodes = [...tmp.childNodes];
    const frag = document.createDocumentFragment();
    nodes.forEach(n => frag.appendChild(n));
    if (!top) ed.appendChild(frag);
    else if (top.nodeType === 1 && top.matches('p, div:not([class])') && top.textContent.trim() === '' && !top.querySelector('img')) top.replaceWith(frag);
    else top.after(frag);
    hydrateAssets(ed);
    const cell = nodes.find(n => n.nodeName === 'TABLE');
    const last = nodes[nodes.length - 1];
    if (cell) placeCaret(cell.querySelector('td, th'));
    else if (last && last.nodeName === 'P') placeCaret(last);
    afterChange();
}

function tableHTML(rows, cols, head) {
    let h = '<table class="tbl"><tbody>';
    for (let i = 0; i < rows; i++) {
        h += '<tr>';
        for (let j = 0; j < cols; j++) { const t = head && i === 0 ? 'th' : 'td'; h += `<${t}><br></${t}>`; }
        h += '</tr>';
    }
    return h + '</tbody></table><p><br></p>';
}
function tableOp(op) {
    restoreSelection();
    const el = anchorEl();
    const cell = el && el.closest('td, th');
    if (!cell) return;
    const row = cell.parentElement, table = cell.closest('table');
    const idx = [...row.children].indexOf(cell);
    const blankCell = tag => { const c = document.createElement(tag); c.innerHTML = '<br>'; return c; };
    if (op === 'rowAfter') {
        const nr = document.createElement('tr');
        [...row.children].forEach(() => nr.appendChild(blankCell('td')));
        row.after(nr);
        placeCaret(nr.children[idx] || nr.firstChild);
    } else if (op === 'colAfter') {
        $$('tr', table).forEach(tr => {
            const ref = tr.children[Math.min(idx, tr.children.length - 1)];
            const c = blankCell(ref && ref.tagName === 'TH' ? 'th' : 'td');
            if (ref) ref.after(c); else tr.appendChild(c);
        });
    } else if (op === 'rowDel') {
        if ($$('tr', table).length > 1) row.remove(); else table.remove();
    } else if (op === 'colDel') {
        if (row.children.length > 1) $$('tr', table).forEach(tr => tr.children[idx] && tr.children[idx].remove());
        else table.remove();
    } else if (op === 'tableDel') {
        table.remove();
    }
    afterChange();
}

function sigHTML(ids) {
    const items = ids.map(id => SIGNERS.find(s => s.id === id)).filter(Boolean).map(s => `
        <div class="sig">
            <div class="sig-img">${s.asset ? `<img data-asset="${s.asset}" alt="">` : ''}</div>
            <div class="sig-line"></div>
            <div class="sig-name" contenteditable="true">${s.name}</div>
            <div class="sig-role" contenteditable="true">${s.role}</div>
            <div class="sig-org" contenteditable="true">রূপসী বাংলা ক্লাব</div>
        </div>`).join('');
    return `<div class="sig-row" contenteditable="false">${items}<button class="block-del" title="স্বাক্ষর মুছুন">✕</button></div><p><br></p>`;
}

/* ---------------- ছবি ---------------- */
function readImage(file) {
    return new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onerror = reject;
        fr.onload = () => {
            const img = new Image();
            img.onerror = reject;
            img.onload = () => {
                const max = 1400;
                const { width: w, height: h } = img;
                if ((w <= max && h <= max) || file.type === 'image/svg+xml') return resolve(fr.result);
                const k = max / Math.max(w, h);
                const c = document.createElement('canvas');
                c.width = Math.round(w * k);
                c.height = Math.round(h * k);
                c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
                resolve(file.type === 'image/jpeg' ? c.toDataURL('image/jpeg', 0.9) : c.toDataURL('image/png'));
            };
            img.src = fr.result;
        };
        fr.readAsDataURL(file);
    });
}
function insertInlineImage(url) {
    const ed = caretInEditor();
    const id = 'img' + Date.now();
    document.execCommand('insertHTML', false, `<img id="${id}" src="${url}" style="width: 40%; display: block; margin: 6px auto;">`);
    const img = document.getElementById(id);
    if (img) { img.removeAttribute('id'); img.addEventListener('load', checkPages, { once: true }); }
    afterChange();
    if (img) selectImage(img);
    return ed;
}

function selectImage(img) {
    deselectImage();
    selectedImg = img;
    img.classList.add('img-selected');
    const parentW = img.parentElement.clientWidth || 1;
    const pct = /%$/.test(img.style.width) ? parseFloat(img.style.width) : Math.round(img.offsetWidth / parentW * 100);
    $('#inImgW').value = pct;
    $('#outImgW').textContent = toBn(Math.round(pct)) + '%';
    popImg.hidden = false;
    positionImgPop();
}
function deselectImage() {
    if (selectedImg) selectedImg.classList.remove('img-selected');
    selectedImg = null;
    popImg.hidden = true;
}
function positionImgPop() {
    if (!selectedImg || popImg.hidden) return;
    if (!selectedImg.isConnected) return deselectImage();
    const r = selectedImg.getBoundingClientRect();
    const h = popImg.offsetHeight, w = popImg.offsetWidth;
    let top = r.bottom + 8;
    if (top + h > viewBottom()) top = Math.max(viewTop(), r.top - h - 8);
    const left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8));
    popImg.style.top = top + 'px';
    popImg.style.left = left + 'px';
}
const IMG_ALIGN = {
    left:       { display: 'block', float: 'none', margin: '6px auto 6px 0' },
    center:     { display: 'block', float: 'none', margin: '6px auto' },
    right:      { display: 'block', float: 'none', margin: '6px 0 6px auto' },
    floatLeft:  { display: 'inline', float: 'left', margin: '4px 16px 8px 0' },
    floatRight: { display: 'inline', float: 'right', margin: '4px 0 8px 16px' },
};

/* ---------------- ফ্রি বক্স / সিল ---------------- */
function floatToolsHTML(type) {
    return `<div class="float-tools">
        <span class="ft-move" title="টেনে সরান"><i class="fa-solid fa-up-down-left-right"></i></span>
        ${type === 'image' ? '<input class="ft-op" type="range" min="10" max="100" value="100" title="স্বচ্ছতা">' : ''}
        <button class="ft-front" title="সবার সামনে আনুন"><i class="fa-solid fa-layer-group"></i></button>
        <button class="ft-del" title="মুছুন"><i class="fa-solid fa-trash"></i></button>
    </div>`;
}
function addFloat(type, src) {
    const page = currentPage();
    const layer = $('.float-layer', page);
    const el = document.createElement('div');
    el.className = 'float-item';
    el.dataset.type = type;
    const n = layer.children.length;
    el.style.left = (60 + n * 24) + 'px';
    el.style.top = (60 + n * 24) + 'px';
    if (type === 'text') {
        el.style.width = '280px';
        el.innerHTML = floatToolsHTML(type) + '<div class="float-content" contenteditable="true">এখানে লিখুন</div><span class="float-resize"></span>';
    } else {
        el.style.width = '170px';
        el.innerHTML = floatToolsHTML(type) + `<img src="${src}" alt="" draggable="false"><span class="float-resize"></span>`;
    }
    layer.appendChild(el);
    selectFloat(el);
    if (type === 'text') {
        const c = $('.float-content', el);
        c.focus({ preventScroll: true });
        const r = document.createRange();
        r.selectNodeContents(c);
        const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    }
    page.scrollIntoView({ block: 'nearest' });
    afterChange();
}
function selectFloat(el) {
    $$('.float-item.selected').forEach(f => { if (f !== el) f.classList.remove('selected'); });
    if (el) el.classList.add('selected');
}

// টেনে সরানো ও সাইজ বদল (মাউস ও টাচ দুটোতেই)
let drag = null;
workspace.addEventListener('pointerdown', e => {
    const item = e.target.closest('.float-item');
    if (!item) {
        if (!e.target.closest('.pop')) selectFloat(null);
        return;
    }
    selectFloat(item);
    const resize = e.target.closest('.float-resize');
    const move = e.target.closest('.ft-move') || (item.dataset.type === 'image' && e.target.tagName === 'IMG');
    if (!resize && !move) return;
    e.preventDefault();
    const body = item.closest('.pad-body');
    drag = {
        item, body, mode: resize ? 'resize' : 'move',
        sx: e.clientX, sy: e.clientY,
        left: item.offsetLeft, top: item.offsetTop,
        w: item.offsetWidth, h: item.offsetHeight,
    };
    e.target.setPointerCapture && e.target.setPointerCapture(e.pointerId);
});
window.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = (e.clientX - drag.sx) / zoom, dy = (e.clientY - drag.sy) / zoom;
    const bw = drag.body.clientWidth, bh = drag.body.clientHeight;
    const { item } = drag;
    if (drag.mode === 'move') {
        const x = Math.max(0, Math.min(bw - item.offsetWidth, drag.left + dx));
        const y = Math.max(0, Math.min(bh - item.offsetHeight, drag.top + dy));
        item.style.left = Math.round(x) + 'px';
        item.style.top = Math.round(y) + 'px';
    } else {
        const w = Math.max(30, Math.min(bw - item.offsetLeft, drag.w + dx));
        item.style.width = Math.round(w) + 'px';
        if (item.dataset.type === 'text') {
            item.style.minHeight = Math.round(Math.max(30, Math.min(bh - item.offsetTop, drag.h + dy))) + 'px';
        }
    }
});
window.addEventListener('pointerup', () => {
    if (!drag) return;
    drag = null;
    afterChange();
});

workspace.addEventListener('click', e => {
    const t = e.target;
    if (t.closest('.ft-del')) { t.closest('.float-item').remove(); afterChange(); return; }
    if (t.closest('.ft-front')) { const it = t.closest('.float-item'); it.parentElement.appendChild(it); afterChange(); return; }
    if (t.closest('.block-del')) { t.closest('.sig-row').remove(); afterChange(); return; }
    if (t.closest('.pg-del')) { deletePage(t.closest('.page-wrap')); return; }
    if (t.tagName === 'IMG' && t.closest('.editor') && !t.closest('.sig-row')) { selectImage(t); return; }
    if (!t.closest('#popImg')) deselectImage();
});
// পাতার নিচে লিখতে গিয়ে লেখা উপরে সরে গেলে, বের হয়ে এলে আবার আগের জায়গায়
workspace.addEventListener('focusout', e => {
    if (e.target.classList && e.target.classList.contains('editor')) { e.target.scrollTop = 0; checkPages(); }
});
workspace.addEventListener('input', e => {
    if (e.target.classList.contains('ft-op')) {
        const img = $('img', e.target.closest('.float-item'));
        img.style.opacity = e.target.value / 100;
        e.target.setAttribute('value', e.target.value);
    }
    afterChange();
});

function deletePage(p) {
    if (pages().length < 2) return;
    const ed = $('.editor', p);
    if (!isEditorEmpty(ed) || $('.float-item', p)) {
        if (!confirm('এই পাতার সব লেখা মুছে যাবে। নিশ্চিত?')) return;
    }
    p.remove();
    lastPage = pages()[0];
    refreshPad();
    scheduleSave();
}

/* ---------------- পেস্ট ও ড্রপ ---------------- */
const ALLOWED_TAGS = new Set(['P', 'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'SUB', 'SUP', 'UL', 'OL', 'LI',
    'TABLE', 'THEAD', 'TBODY', 'TR', 'TD', 'TH', 'H1', 'H2', 'H3', 'BLOCKQUOTE', 'SPAN', 'DIV', 'HR']);
// বাইরের (Word/ওয়েব) ফরম্যাটিং থেকে শুধু কাঠামো রাখে: মোটা, বাঁকা, তালিকা, টেবিল ইত্যাদি
function sanitize(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('script, style, meta, link, title, img, svg, object, iframe, video, audio, canvas, input, button')
        .forEach(n => n.remove());
    const walk = node => {
        [...node.childNodes].forEach(ch => {
            if (ch.nodeType === 8) { ch.remove(); return; }
            if (ch.nodeType !== 1) return;
            walk(ch);
            if (!ALLOWED_TAGS.has(ch.tagName)) { ch.replaceWith(...ch.childNodes); return; }
            [...ch.attributes].forEach(a => { if (a.name !== 'colspan' && a.name !== 'rowspan') ch.removeAttribute(a.name); });
            if (ch.tagName === 'TABLE') ch.className = 'tbl';
        });
    };
    walk(doc.body);
    return doc.body.innerHTML;
}
workspace.addEventListener('paste', async e => {
    const host = editableHost(e.target);
    if (!host) return;
    const cd = e.clipboardData;
    if (!cd) return;
    e.preventDefault();
    const text = cd.getData('text/plain');
    const imgItem = [...cd.items].find(i => i.type.startsWith('image/'));
    if (imgItem && !text) {
        const url = await readImage(imgItem.getAsFile());
        if (host.classList.contains('editor')) insertInlineImage(url); else addFloat('image', url);
        return;
    }
    const html = cd.getData('text/html');
    const inSig = !!elOf(e.target).closest('.sig-row');
    if (html && !inSig && host.classList.contains('editor')) {
        document.execCommand('insertHTML', false, sanitize(html));
    } else {
        document.execCommand('insertText', false, text);
    }
    afterChange();
});
window.addEventListener('dragover', e => { if (e.dataTransfer && [...e.dataTransfer.types].includes('Files')) e.preventDefault(); });
window.addEventListener('drop', async e => {
    const files = e.dataTransfer && [...e.dataTransfer.files].filter(f => f.type.startsWith('image/'));
    if (!e.dataTransfer || !e.dataTransfer.files.length) return;
    e.preventDefault();   // ফাইল ড্রপ করলে ব্রাউজার যেন পাতা ছেড়ে না যায়
    if (!files.length) return;
    const ed = e.target.closest && e.target.closest('.editor');
    if (ed && document.caretRangeFromPoint) {
        const r = document.caretRangeFromPoint(e.clientX, e.clientY);
        if (r && editableHost(r.startContainer)) { savedRange = r; }
    }
    for (const f of files) {
        const url = await readImage(f);
        if (ed) insertInlineImage(url); else addFloat('image', url);
    }
});

/* ---------------- কীবোর্ড ---------------- */
workspace.addEventListener('keydown', e => {
    if (e.key === 'Tab' && editableHost(e.target)) {
        e.preventDefault();
        const el = anchorEl();
        if (el && el.closest('li')) document.execCommand(e.shiftKey ? 'outdent' : 'indent');
        else if (!e.shiftKey) document.execCommand('insertText', false, '    ');
        afterChange();
    }
});
document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
        toast('সেভ হয়েছে। ছবি/PDF পেতে উপরের বাটন ব্যবহার করুন।');
    }
    if (e.key === 'Escape') { closePops(); deselectImage(); selectFloat(null); setMenu(false); }
});

/* ---------------- টুলবার ইভেন্ট ---------------- */
const toolbar = $('#toolbar');
// বাটনে চাপ দিলে যেন লেখার সিলেকশন হারিয়ে না যায়
toolbar.addEventListener('mousedown', e => {
    if (e.target.closest('button')) e.preventDefault();
});
toolbar.addEventListener('click', e => {
    const b = e.target.closest('button[data-cmd]');
    if (!b) return;
    const cmd = b.dataset.cmd;
    // স্বাক্ষর ব্লকের ভেতরে তালিকা/ইনডেন্ট করলে ব্লক ভেঙে যায়
    if (['insertOrderedList', 'insertUnorderedList', 'indent', 'outdent'].includes(cmd) &&
        elOf(savedRange && savedRange.startContainer)?.closest('.sig-row')) return;
    exec(cmd);
});
tableTools.addEventListener('mousedown', e => { if (e.target.closest('button')) e.preventDefault(); });
tableTools.addEventListener('click', e => {
    const b = e.target.closest('[data-table]');
    if (b) tableOp(b.dataset.table);
});

// মোবাইলের ট্যাব: লেখা / সাজানো / যোগ
function setTab(t) {
    toolbar.dataset.tab = t;
    $$('[data-tabbtn]').forEach(b => b.classList.toggle('active', b.dataset.tabbtn === t));
    $('.tool-groups').scrollLeft = 0;
}
$$('[data-tabbtn]').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tabbtn)));
$('#btnKbd').addEventListener('click', () => {
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
});

function stepFontSize(dir) {
    const el = anchorEl();
    if (!el) return;
    const cur = Math.round(parseFloat(getComputedStyle(el).fontSize));
    const next = dir > 0 ? FONT_SIZES.find(v => v > cur) : [...FONT_SIZES].reverse().find(v => v < cur);
    if (next) applyFontSize(next);
}
$('#btnSizeUp').addEventListener('click', () => stepFontSize(1));
$('#btnSizeDown').addEventListener('click', () => stepFontSize(-1));

FONT_SIZES.forEach(px => selSize.add(new Option(toBn(px), px)));
selBlock.addEventListener('change', () => { exec('formatBlock', `<${selBlock.value}>`); });
selFont.addEventListener('change', () => { if (selFont.value) exec('fontName', selFont.value); });
selSize.addEventListener('change', () => { if (selSize.value) applyFontSize(+selSize.value); });
selLine.addEventListener('change', () => { if (selLine.value) applyLineHeight(selLine.value); selLine.value = ''; });

$('#inFore').addEventListener('input', e => { $('#swFore').style.background = e.target.value; });
$('#inFore').addEventListener('change', e => { exec('foreColor', e.target.value); });
$('#inBack').addEventListener('input', e => { $('#swBack').style.background = e.target.value; });
$('#inBack').addEventListener('change', e => {
    if (!exec('hiliteColor', e.target.value)) exec('backColor', e.target.value);
});

$('#btnHr').addEventListener('click', () => { insertBlock('<hr><p><br></p>'); });
$('#btnTable').addEventListener('click', e => openPop($('#popTable'), e.currentTarget));
$('#doTable').addEventListener('click', () => {
    const r = Math.max(1, Math.min(40, +$('#inRows').value || 3));
    const c = Math.max(1, Math.min(12, +$('#inCols').value || 3));
    closePops();
    insertBlock(tableHTML(r, c, $('#inHead').checked));
});

$('#sigList').innerHTML = SIGNERS.map(s => `
    <label class="sigopt">
        <input type="checkbox" value="${s.id}" ${DEFAULT_SIGNERS.includes(s.id) ? 'checked' : ''}>
        ${s.asset ? `<img src="${ASSETS[s.asset] || ''}" alt="">` : '<span class="noimg">স্বাক্ষর ছাড়া</span>'}
        <span>${s.id === 'blank' ? 'ফাঁকা ঘর (হাতে সই)' : `${s.name} <small>— ${s.role}</small>`}</span>
    </label>`).join('');
$('#btnSig').addEventListener('click', e => openPop($('#popSig'), e.currentTarget));
$('#doSig').addEventListener('click', () => {
    const ids = $$('#sigList input:checked').map(i => i.value);
    closePops();
    if (ids.length) insertBlock(sigHTML(ids));
});

$('#btnImage').addEventListener('click', () => { fileMode = 'inline'; fileImg.click(); });
$('#btnFloatImg').addEventListener('click', () => { fileMode = 'float'; fileImg.click(); });
$('#btnFloatText').addEventListener('click', () => addFloat('text'));
fileImg.addEventListener('change', async () => {
    const f = fileImg.files[0];
    fileImg.value = '';
    if (!f) return;
    try {
        const url = await readImage(f);
        if (fileMode === 'float') addFloat('image', url); else insertInlineImage(url);
    } catch (err) {
        toast('ছবিটি খোলা যায়নি।');
    }
});

// ছবির পপআপ
popImg.addEventListener('mousedown', e => { if (e.target.tagName === 'BUTTON' || e.target.closest('button')) e.preventDefault(); });
$('#inImgW').addEventListener('input', e => {
    if (!selectedImg) return;
    selectedImg.style.width = e.target.value + '%';
    $('#outImgW').textContent = toBn(e.target.value) + '%';
    positionImgPop();
});
$('#inImgW').addEventListener('change', afterChange);
popImg.addEventListener('click', e => {
    const b = e.target.closest('[data-imgalign]');
    if (!b || !selectedImg) return;
    const a = b.dataset.imgalign;
    if (a === 'delete') { selectedImg.remove(); deselectImage(); afterChange(); return; }
    Object.assign(selectedImg.style, IMG_ALIGN[a]);
    afterChange();
    positionImgPop();
});
window.addEventListener('scroll', () => { positionImgPop(); positionTableTools(); }, { passive: true });

/* ---------------- পপআপ ---------------- */
function openPop(pop, anchor) {
    const wasOpen = !pop.hidden;
    closePops();
    if (wasOpen) return;
    pop.hidden = false;
    const r = anchor.getBoundingClientRect();
    const left = Math.max(8, Math.min(r.left, window.innerWidth - pop.offsetWidth - 8));
    pop.style.left = left + 'px';
    pop.style.top = (r.bottom + 6) + 'px';
}
function closePops() { $$('.pop:not(#popImg)').forEach(p => { p.hidden = true; }); }
document.addEventListener('pointerdown', e => {
    if (!e.target.closest('.pop') && !e.target.closest('#btnTable, #btnSig')) closePops();
});
$$('[data-close]').forEach(b => b.addEventListener('click', closePops));

/* ---------------- উপরের বার ---------------- */
inNo.addEventListener('input', () => { state.no = inNo.value; refreshPad(); scheduleSave(); });
$('#btnNewNo').addEventListener('click', () => { state.no = inNo.value = newNumber(); refreshPad(); scheduleSave(); });
inDate.addEventListener('change', () => { state.date = inDate.value || todayISO(); refreshPad(); scheduleSave(); });

$('#btnZoomIn').addEventListener('click', () => stepZoom(1));
$('#btnZoomOut').addEventListener('click', () => stepZoom(-1));
$('#btnZoomFit').addEventListener('click', () => { zoomMode = 'fit'; applyZoom(); });
window.addEventListener('resize', () => { applyZoom(); placeBottomBar(); });

// মোবাইলে দুই আঙুলে চিমটি, কম্পিউটারে Ctrl + স্ক্রল / ট্র্যাকপ্যাড পিঞ্চ
let pinch = null;
const touchDist = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
workspace.addEventListener('touchstart', e => {
    if (e.touches.length === 2) { pinch = { d: touchDist(e.touches) || 1, z: zoom }; drag = null; }
}, { passive: true });
workspace.addEventListener('touchmove', e => {
    if (!pinch || e.touches.length !== 2) return;
    e.preventDefault();
    const t = e.touches;
    zoomMode = 'manual';
    setZoom(pinch.z * touchDist(t) / pinch.d, { x: (t[0].clientX + t[1].clientX) / 2, y: (t[0].clientY + t[1].clientY) / 2 });
}, { passive: false });
workspace.addEventListener('touchend', e => { if (e.touches.length < 2) pinch = null; });
workspace.addEventListener('touchcancel', () => { pinch = null; });
workspace.addEventListener('wheel', e => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    zoomMode = 'manual';
    setZoom(zoom * Math.exp(-e.deltaY / 250), { x: e.clientX, y: e.clientY });
}, { passive: false });

// ☰ মেনু (মোবাইল)
const appbar = $('#appbar');
function setMenu(open) {
    appbar.classList.toggle('menu-open', open);
    const i = $('#btnMenu i');
    i.className = open ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
}
$('#btnMenu').addEventListener('click', () => setMenu(!appbar.classList.contains('menu-open')));
document.addEventListener('pointerdown', e => {
    if (appbar.classList.contains('menu-open') && !e.target.closest('#appmenu, #btnMenu')) setMenu(false);
});

$('#selTemplate').addEventListener('change', e => {
    const key = e.target.value;
    e.target.value = '';
    if (!key) return;
    setMenu(false);
    const page = currentPage();
    const ed = $('.editor', page);
    if (!isEditorEmpty(ed) && !confirm('এই পাতার বর্তমান লেখা মুছে টেমপ্লেট বসবে। নিশ্চিত?')) return;
    ed.innerHTML = TEMPLATES[key]();
    hydrateAssets(ed);
    ed.scrollTop = 0;
    afterChange();
});

$('#btnAddPage').addEventListener('click', () => {
    setMenu(false);
    const p = createPage('<p><br></p>', '', currentPage());
    const ed = $('.editor', p);
    ed.focus({ preventScroll: true });
    placeCaret(ed.firstChild || ed);
    p.scrollIntoView({ behavior: 'smooth', block: 'start' });
    scheduleSave();
});

$('#btnReset').addEventListener('click', () => {
    setMenu(false);
    if (!confirm('সব পাতা মুছে নতুন নোটিশ শুরু হবে। নিশ্চিত?')) return;
    startFresh();
    save();
});

/* ---------------- ছবি / PDF / প্রিন্ট ---------------- */
function prepareOutput() {
    closePops();
    showTableTools(null);
    deselectImage();
    selectFloat(null);
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    const over = pages().filter(p => !$('.pg-warn', p).hidden);
    if (over.length && !confirm('কিছু লেখা পাতার বাইরে চলে গেছে, সেগুলো আসবে না। তবুও চালিয়ে যাবেন?')) return false;
    pages().forEach(p => { $('.editor', p).scrollTop = 0; });
    return true;
}
async function capturePages() {
    if (typeof html2canvas !== 'function') throw new Error('html2canvas লোড হয়নি (ইন্টারনেট সংযোগ দেখুন)');
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    const canvases = [];
    for (const p of pages()) {
        const page = $('.page', p);
        page.setAttribute('data-capture', '1');
        try {
            canvases.push(await html2canvas(page, {
                scale: 2,
                backgroundColor: '#ffffff',
                logging: false,
                onclone: doc => {
                    doc.body.classList.add('exporting');
                    const c = doc.querySelector('[data-capture]');
                    if (c) c.style.transform = 'none';
                },
            }));
        } finally {
            page.removeAttribute('data-capture');
        }
    }
    return canvases;
}
async function withBusy(fn) {
    $('#busy').hidden = false;
    try { return await fn(); }
    catch (err) { console.error(err); toast('তৈরি করা যায়নি: ' + (err && err.message ? err.message : err), 5000); return null; }
    finally { $('#busy').hidden = true; }
}
function fileBase() {
    return `RBC-${state.date || todayISO()}`;
}
function downloadBlob(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

async function downloadPNG() {
    if (!prepareOutput()) return;
    const canvases = await withBusy(capturePages);
    if (!canvases) return;
    canvases.forEach((c, i) => {
        const name = canvases.length > 1 ? `${fileBase()}-page${i + 1}.png` : `${fileBase()}.png`;
        setTimeout(() => c.toBlob(b => downloadBlob(b, name), 'image/png'), i * 400);
    });
}
async function downloadPDF() {
    if (!prepareOutput()) return;
    await withBusy(async () => {
        if (!window.jspdf) throw new Error('jsPDF লোড হয়নি (ইন্টারনেট সংযোগ দেখুন)');
        const canvases = await capturePages();
        const pdf = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
        canvases.forEach((c, i) => {
            if (i) pdf.addPage();
            pdf.addImage(c.toDataURL('image/jpeg', 0.93), 'JPEG', 0, 0, 210, 297);
        });
        pdf.save(`${fileBase()}.pdf`);
    });
}
function doPrint() {
    if (!prepareOutput()) return;
    setTimeout(() => window.print(), 50);
}
const ACTIONS = { png: downloadPNG, pdf: downloadPDF, print: doPrint };
document.addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    setMenu(false);
    ACTIONS[b.dataset.act]();
});

/* ---------------- মোবাইল কীবোর্ড ---------------- */
// iPhone এ কীবোর্ড খুললে নিচের টুলবারকে কীবোর্ডের ঠিক উপরে তুলে দেয়
function placeBottomBar() {
    const tb = $('#toolbar');
    const vv = window.visualViewport;
    if (!isMobile() || !vv) { tb.style.transform = ''; return; }
    const hidden = document.documentElement.clientHeight - (vv.offsetTop + vv.height);
    tb.style.transform = hidden > 1 ? `translateY(${-hidden}px)` : '';
}
// লেখার সময় কার্সর যেন টুলবার/কীবোর্ডের নিচে চাপা না পড়ে
function keepCaretVisible() {
    if (!isMobile()) return;
    const sel = getSelection();
    if (!sel.rangeCount || !editableHost(sel.focusNode)) return;
    const r = sel.getRangeAt(0).cloneRange();
    r.collapse(false);
    let rect = r.getClientRects()[0];
    if (!rect) { const el = elOf(sel.focusNode); rect = el && el.getBoundingClientRect(); }
    if (!rect) return;
    const bottom = viewBottom() - 10, top = viewTop();
    if (rect.bottom > bottom) window.scrollBy(0, rect.bottom - bottom + 30);
    else if (rect.top < top) window.scrollBy(0, rect.top - top - 20);
}
if (window.visualViewport) {
    visualViewport.addEventListener('resize', () => { placeBottomBar(); setTimeout(keepCaretVisible, 50); });
    visualViewport.addEventListener('scroll', placeBottomBar);
}
workspace.addEventListener('focusin', () => setTimeout(keepCaretVisible, 350));
workspace.addEventListener('input', () => requestAnimationFrame(keepCaretVisible));

/* ---------------- শুরু ---------------- */
function startFresh() {
    workspace.innerHTML = '';
    state.no = newNumber();
    state.date = todayISO();
    inNo.value = state.no;
    inDate.value = state.date;
    createPage(TEMPLATES.notice());
}

function init() {
    document.execCommand('defaultParagraphSeparator', false, 'p');
    document.execCommand('styleWithCSS', false, true);

    const saved = loadSaved();
    if (saved && Array.isArray(saved.pages) && saved.pages.length) {
        state.no = saved.no || newNumber();
        state.date = saved.date || todayISO();
        inNo.value = state.no;
        inDate.value = state.date;
        saved.pages.forEach(p => createPage(p.html, p.floats));
        lastPage = pages()[0];
    } else {
        startFresh();
    }
    refreshPad();
    setTab('text');
    applyZoom();
    placeBottomBar();
    $('#saveState').textContent = '';

    if (isMobile()) {
        try {
            if (!localStorage.getItem('rbc-hint')) {
                localStorage.setItem('rbc-hint', '1');
                setTimeout(() => toast('টিপস: দুই আঙুলে চিমটি দিয়ে পাতা বড়-ছোট করুন। লেখায় চাপ দিলেই লেখা শুরু।', 6000), 900);
            }
        } catch (e) { /* প্রাইভেট মোডে localStorage নাও থাকতে পারে */ }
    }

    // ছবি/ফন্ট লোড হলে পাতা উপচে পড়ছে কিনা আবার দেখা
    workspace.addEventListener('load', checkPages, true);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(checkPages);
}

init();
})();
