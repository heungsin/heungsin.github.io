// (주)흥신산업 제품몰 — 목록·검색·상세·견적함
(function () {
  const DATA = (window.PRODUCTS || []).map((p, i) => Object.assign({ key: 'p' + p.id, order: i }, p));
  const CATS = {
    all: { label: '전체' },
    road: { label: '도로표지', code: '5512171002' },
    traffic: { label: '교통안전표지', code: '5512171001' },
    chevron: { label: '갈매기표지판', code: '5512170401' },
    post: { label: '도로안전표지판 지주', code: '4616157001' },
    bollard: { label: '볼라드', code: '' },
  };
  const media = (p, lazy) => p.img
    ? `<img src="${p.img}" alt="${esc(p.name)} ${esc(p.model)}"${lazy ? ' loading="lazy"' : ''}>`
    : `<span class="noimg"><b>${CATS[p.cat].label}</b>이미지 준비 중</span>`;
  const STORE = 'hs_quote_v2';
  const $ = (s, el = document) => el.querySelector(s);
  const won = n => n.toLocaleString('ko-KR') + '원';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- 견적함 저장 ----------
  let cart = {};
  try { cart = JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch (e) { cart = {}; }
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(cart)); } catch (e) {} };

  // ---------- 표지 모양 아이콘 (규격 비율 기준 도식) ----------
  function dims(spec) {
    const r = spec.match(/^Φ([\d.]+)/);
    if (r) return { round: true, w: +r[1], h: +r[1] };
    const m = spec.match(/^([\d.]+)×([\d.]+)/);
    return m ? { w: +m[1], h: +m[2] } : { w: 1, h: 1 };
  }
  function shape(p) {
    const W = 120, H = 90;
    if (p.cat === 'post') return postShape(p);
    const d = dims(p.spec);
    const n = p.name;
    let kind = 'rect', fill = '#fff', stroke = '#1d2633', inner = '';
    if (p.cat === 'road') { fill = /도로명|노선/.test(n) ? '#1650a8' : '#11714a'; stroke = '#fff'; }
    if (p.cat === 'chevron') { fill = '#f6c518'; stroke = '#1d2633'; kind = 'chevron'; }
    if (p.cat === 'traffic') {
      if (/양보/.test(n)) { kind = 'tri-down'; fill = '#fff'; stroke = '#d62d2d'; }
      else if (/주의/.test(n)) { kind = 'tri'; fill = '#f6c518'; stroke = '#d62d2d'; }
      else if (/일시정지/.test(n)) { kind = 'oct'; fill = '#d62d2d'; stroke = '#fff'; }
      else if (/진입금지/.test(n)) { kind = 'circle'; fill = '#d62d2d'; stroke = '#fff'; inner = 'bar'; }
      else if (d.round || /최고속도/.test(n)) { kind = 'circle'; fill = '#fff'; stroke = '#d62d2d'; }
      else if (/어린이/.test(n)) { fill = '#f6c518'; }
      else if (/지시|일방|비보호/.test(n)) { fill = '#1f5fbf'; stroke = '#fff'; }
    }
    let svg = '';
    const cx = W / 2, cy = H / 2;
    if (kind === 'circle') {
      svg = `<circle cx="${cx}" cy="${cy}" r="34" fill="${fill}" stroke="${stroke === '#fff' ? '#b51f1f' : stroke}" stroke-width="7"/>`;
      if (inner === 'bar') svg += `<rect x="${cx - 20}" y="${cy - 5}" width="40" height="10" fill="#fff"/>`;
    } else if (kind === 'tri' || kind === 'tri-down') {
      const pts = kind === 'tri' ? `${cx},10 ${cx + 40},78 ${cx - 40},78` : `${cx - 40},12 ${cx + 40},12 ${cx},80`;
      svg = `<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="7" stroke-linejoin="round"/>`;
    } else if (kind === 'oct') {
      const r = 36, pts = [];
      for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * Math.PI / 4; pts.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1)); }
      svg = `<polygon points="${pts.join(' ')}" fill="${fill}" stroke="#fff" stroke-width="3"/><polygon points="${pts.join(' ')}" fill="none" stroke="#b51f1f" stroke-width="1"/>`;
    } else {
      const s = Math.min(96 / d.w, 70 / d.h);
      const w = d.w * s, h = d.h * s, x = cx - w / 2, y = cy - h / 2;
      svg = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${fill}" stroke="${stroke === '#fff' ? fill : stroke}" stroke-width="2"/>`;
      if (stroke === '#fff') svg += `<rect x="${x + 3}" y="${y + 3}" width="${w - 6}" height="${h - 6}" rx="2" fill="none" stroke="#fff" stroke-width="1.5"/>`;
      if (kind === 'chevron') {
        const k = Math.min(w, h) * 0.32;
        svg += `<path d="M${cx - k * 0.6} ${cy - k} L${cx + k * 0.5} ${cy} L${cx - k * 0.6} ${cy + k}" fill="none" stroke="#1d2633" stroke-width="${Math.max(5, k * 0.45)}" stroke-linejoin="miter"/>`;
      }
    }
    return `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">${svg}</svg>`;
  }
  function postShape(p) {
    const f = p.form || '';
    const pole = '#7b8796', plate = '#11714a';
    let s = `<rect x="56" y="8" width="6" height="76" rx="2" fill="${pole}"/><rect x="44" y="82" width="30" height="5" rx="1" fill="#a9b3bf"/>`;
    if (/편지식|내민식/.test(f) && !/양내민식/.test(f)) s = `<rect x="34" y="8" width="6" height="76" rx="2" fill="${pole}"/><rect x="34" y="12" width="66" height="4" fill="${pole}"/><rect x="58" y="18" width="44" height="26" rx="2" fill="${plate}"/><rect x="22" y="82" width="30" height="5" rx="1" fill="#a9b3bf"/>`;
    else if (/현수식/.test(f)) s = `<rect x="28" y="8" width="6" height="76" rx="2" fill="${pole}"/><rect x="28" y="12" width="74" height="4" fill="${pole}"/><rect x="50" y="18" width="50" height="22" rx="2" fill="#1650a8"/><rect x="16" y="82" width="30" height="5" rx="1" fill="#a9b3bf"/>`;
    else if (/양내민식/.test(f)) s = `<rect x="57" y="8" width="6" height="76" rx="2" fill="${pole}"/><rect x="14" y="12" width="92" height="4" fill="${pole}"/><rect x="14" y="18" width="38" height="22" rx="2" fill="${plate}"/><rect x="68" y="18" width="38" height="22" rx="2" fill="${plate}"/><rect x="45" y="82" width="30" height="5" rx="1" fill="#a9b3bf"/>`;
    else if (/부착식/.test(f)) s = `<rect x="56" y="8" width="6" height="76" rx="2" fill="${pole}"/><rect x="40" y="22" width="38" height="5" rx="1" fill="#5d6b7e"/><rect x="40" y="58" width="38" height="5" rx="1" fill="#5d6b7e"/>`;
    else s += `<circle cx="59" cy="24" r="14" fill="#fff" stroke="#d62d2d" stroke-width="4"/>`;
    return `<svg viewBox="0 0 120 90" aria-hidden="true">${s}</svg>`;
  }

  // ---------- 목록 ----------
  const grid = $('#grid'), count = $('#shop-count'), empty = $('#shop-empty');
  const search = $('#shop-search'), sort = $('#shop-sort');
  let cat = (location.hash || '').replace('#', '');
  if (!CATS[cat] || (cat !== 'all' && !DATA.some(p => p.cat === cat))) cat = 'all';

  function chips() {
    const box = $('#shop-chips');
    box.innerHTML = Object.entries(CATS).map(([k, v]) => {
      const n = k === 'all' ? DATA.length : DATA.filter(p => p.cat === k).length;
      if (!n) return '';
      return `<button type="button" class="chip${k === cat ? ' on' : ''}" data-cat="${k}" aria-pressed="${k === cat}">${v.label}<span>${n}</span></button>`;
    }).join('');
  }
  function render() {
    const q = search.value.trim().toLowerCase().replace(/\s+/g, '').replace(/x/g, '×');
    let list = DATA.filter(p => (cat === 'all' || p.cat === cat) && (!q || [p.model, p.name, p.spec, p.id, p.use || '', p.type || '', p.signno || '', CATS[p.cat].label, (p.tags || []).join('')].join('|').toLowerCase().replace(/\s+/g, '').includes(q)));
    const v = sort.value;
    if (v === 'size') list.sort((a, b) => { const A = dims(a.spec), B = dims(b.spec); return A.w * A.h - B.w * B.h; });
    count.textContent = `${list.length}개 품목`;
    empty.hidden = list.length > 0;
    grid.innerHTML = list.map(p => `
      <article class="pcard">
        <button type="button" class="pcard-media" data-open="${p.key}" aria-label="${esc(p.name)} 상세 보기">${media(p, true)}</button>
        <div class="pcard-body">
          <div class="pcard-tags"><span class="tag">${CATS[p.cat].label}</span>${(p.tags || []).map(t => `<span class="tag gray">${esc(t)}</span>`).join('')}</div>
          <h3><button type="button" data-open="${p.key}">${esc(p.name)}</button></h3>
          <p class="pcard-meta">${esc(p.model)} · ${esc(p.spec)}</p>${p.use ? `<p class="pcard-meta">${esc(p.use)}</p>` : ''}
          <div class="pcard-foot"><span class="pcard-ask">견적 문의</span><button type="button" class="btn sm add" data-add="${p.key}">${cart[p.key] ? '담김 ✓' : '견적 담기'}</button></div>
        </div>
      </article>`).join('');
  }

  // ---------- 나라장터 링크 (assets/g2b-links.js 에서 식별번호별 상품 주소 관리) ----------
  const G2B = window.G2B_LINKS || {};
  const g2bLink = p => G2B[p.id] ? 'https://shop.g2b.go.kr//link/GMSF001_01/?ctrtItemMngNo=' + encodeURIComponent(G2B[p.id]) : '';
  const g2bBtn = p => `<a class="btn outline" href="${g2bLink(p) || 'https://shop.g2b.go.kr/'}" target="_blank" rel="noopener">${g2bLink(p) ? '나라장터에서 이 제품 보기' : '나라장터 쇼핑몰'} ↗</a>`;

  // ---------- 상세 ----------
  const dlg = $('#detail');
  function openDetail(key) {
    const p = DATA.find(x => x.key === key); if (!p) return;
    const rows = [['분류', CATS[p.cat].label], ['모델명', p.model]];
    if (p.type) rows.push(['상세품명', p.type]);
    rows.push(['명칭', p.name + (p.tags ? ' (' + p.tags.join(', ') + ')' : '')]);
    if (p.signno) rows.push(['표지번호', p.signno]);
    if (p.use) rows.push([p.cat === 'post' ? '설치·용도' : '용도', p.use]);
    rows.push(['규격', p.spec + (p.thick && p.cat !== 'post' ? '' : '')]);
    if (p.form) rows.push(['형식', p.form]);
    if (p.sign) rows.push(['적용 표지 규격', p.sign]);
    if (p.bar) rows.push(['가로재', p.bar]);
    if (p.set) rows.push(['구성', p.set]);
    $('#detail-body').innerHTML = `
      <div class="detail-media">${media(p)}</div>
      <div class="detail-info">
        <div class="kicker">${CATS[p.cat].label}</div>
        <h2>${esc(p.name)}</h2>
        <dl class="spec-list">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
        <div class="qty-row"><label for="dq">수량</label><div class="stepper"><button type="button" data-step="-1" aria-label="수량 줄이기">−</button><input id="dq" type="number" min="1" value="${cart[p.key] || 1}" inputmode="numeric"><button type="button" data-step="1" aria-label="수량 늘리기">+</button></div></div>
        <div class="btn-row"><button type="button" class="btn" data-add-qty="${p.key}">견적함에 담기</button>${g2bBtn(p)}</div>
      </div>`;
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
  }
  dlg.addEventListener('click', e => {
    if (e.target === dlg || e.target.closest('[data-close]')) dlg.close();
    const st = e.target.closest('[data-step]');
    if (st) { const i = $('#dq'); i.value = Math.max(1, (+i.value || 1) + +st.dataset.step); }
    const add = e.target.closest('[data-add-qty]');
    if (add) { setQty(add.dataset.addQty, Math.max(1, +$('#dq').value || 1)); dlg.close(); toast('견적함에 담았습니다.'); }
    const cp = e.target.closest('[data-copy]');
    if (cp) { navigator.clipboard && navigator.clipboard.writeText(cp.dataset.copy).then(() => { cp.textContent = '복사됨'; }).catch(() => {}); }
  });

  // ---------- 견적함 ----------
  const drawer = $('#quote'), qlist = $('#quote-list'), badge = document.querySelectorAll('[data-quote-count]');
  function setQty(key, n) { if (n > 0) cart[key] = n; else delete cart[key]; save(); renderQuote(); render(); }
  function renderQuote() {
    const items = Object.keys(cart).map(k => [DATA.find(p => p.key === k), cart[k]]).filter(x => x[0]);
    const n = items.length;
    badge.forEach(b => { b.textContent = n; });
    $('#quote-empty').hidden = n > 0;
    $('#quote-form').hidden = n === 0;
    qlist.innerHTML = items.map(([p, q]) => `
      <li><div class="qi-info"><b>${esc(p.name)}</b><span>${esc(p.model)} · ${esc(p.spec)}</span></div>
      <div class="qi-ctrl"><div class="stepper sm"><button type="button" data-q="${p.key}" data-d="-1" aria-label="수량 줄이기">−</button><input type="number" min="1" value="${q}" data-qi="${p.key}" aria-label="수량"><button type="button" data-q="${p.key}" data-d="1" aria-label="수량 늘리기">+</button></div><button type="button" class="remove" data-rm="${p.key}">삭제</button></div></li>`).join('');
    $('#quote-total').innerHTML = n ? `<small>담긴 품목 ${n}개의 규격·수량을 확인해 견적을 회신드립니다.</small>` : '';
    $('#quote-items').value = items.map(([p, q], i) => `${i + 1}. [${CATS[p.cat].label}] ${p.model} ${p.name} ${p.spec} / 식별번호 ${p.id} / 수량 ${q}개`).join('\n');
  }
  function openQuote(open) {
    drawer.classList.toggle('open', open);
    drawer.setAttribute('aria-hidden', !open);
    document.body.classList.toggle('drawer-open', open);
  }
  document.querySelectorAll('[data-quote-open]').forEach(b => b.addEventListener('click', () => openQuote(true)));
  drawer.addEventListener('click', e => {
    if (e.target === drawer || e.target.closest('[data-quote-close]')) openQuote(false);
    const st = e.target.closest('[data-q]');
    if (st) setQty(st.dataset.q, Math.max(1, (cart[st.dataset.q] || 1) + +st.dataset.d));
    const rm = e.target.closest('[data-rm]');
    if (rm) setQty(rm.dataset.rm, 0);
  });
  drawer.addEventListener('change', e => { const i = e.target.closest('[data-qi]'); if (i) setQty(i.dataset.qi, Math.max(1, +i.value || 1)); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') openQuote(false); });

  // 견적 요청 전송 (FormSubmit)
  const form = $('#quote-form');
  form.querySelector('[name="_next"]').value = location.href.split('?')[0].split('#')[0] + '?sent=1';
  form.addEventListener('submit', e => { if (!Object.keys(cart).length) { e.preventDefault(); toast('견적함이 비어 있습니다.'); } });

  // ---------- 공통 ----------
  let tt;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 2400); }

  $('#shop-chips').addEventListener('click', e => {
    const b = e.target.closest('[data-cat]'); if (!b) return;
    cat = b.dataset.cat; history.replaceState(null, '', cat === 'all' ? location.pathname : '#' + cat); chips(); render();
  });
  search.addEventListener('input', render);
  sort.addEventListener('change', render);
  grid.addEventListener('click', e => {
    const o = e.target.closest('[data-open]'); if (o) openDetail(o.dataset.open);
    const a = e.target.closest('[data-add]');
    if (a) { const k = a.dataset.add; if (cart[k]) { openQuote(true); } else { setQty(k, 1); toast('견적함에 담았습니다.'); } }
  });

  if (new URLSearchParams(location.search).get('sent') === '1') {
    cart = {}; save();
    history.replaceState(null, '', location.pathname);
    setTimeout(() => toast('견적 요청이 전송되었습니다. 확인 후 회신드리겠습니다.'), 300);
  }
  chips(); render(); renderQuote();
})();
