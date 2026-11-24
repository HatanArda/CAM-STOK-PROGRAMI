/* CamStok arayüzü. Orijinal CamStok.html betiğinden uyarlanmıştır:
   ekranlar ve davranış aynıdır; veri artık tarayıcı yerine Belgeler/CamStok klasöründeki
   dosyaya kaydedilir (bkz. src/main.js, src/store.js). */
(function () {
  var OLD_KEY = "camstok_ozel_v1", state, tab = "stok", sign = 1, cur = null, sale = false, last = null;
  var API = window.camstok, L = window.CamLogic, fmt = L.fmt, key = L.key, orders = L.orders, calc = L.calc;
  var blocked = false, notice = null, dataDir = "", theme = "auto";
  var $ = function (i) { return document.getElementById(i); };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  function emptyState() {
    return { cur: 0, hist: [], prods: [{ name: "1.56 HMC", thr: 4, tgt: 6, maxs: 4, stock: {}, transit: {}, cost: 0, kdv: 0, excl: {} },
      { name: "U.C. 1.49", thr: 4, tgt: 6, maxs: 5, stock: {}, transit: {}, cost: 0, kdv: 0, excl: {} }] };
  }

  // Açılış: 1) dosya varsa onu kullan, 2) yoksa eski localStorage verisini dosyaya taşı,
  // 3) o da yoksa başlangıç stoğunu yükle (yalnızca veri dosyası hiç yokken).
  function load() {
    var r = API.init();
    dataDir = r.dataDir; theme = r.theme || "auto"; notice = r.notice;
    applyTheme();
    if (r.state) { state = r.state; return; }
    if (r.loadFailed) { blocked = true; state = emptyState(); return; }
    var old = null;
    try { old = L.normalize(JSON.parse(localStorage.getItem(OLD_KEY))); } catch (e) { old = null; }
    if (old) {
      state = old; save();
      try { localStorage.removeItem(OLD_KEY); } catch (e) {}
      notice = (notice ? notice + " " : "") + "Eski tarayıcı verisi bulundu ve dosyaya taşındı.";
      return;
    }
    state = r.seed || emptyState();
    save();
  }
  function save() {
    if (blocked) return;
    API.save(JSON.stringify(state));
  }
  API.onSaved(function (r) {
    var s = $("st");
    if (r.ok) { s.className = ""; s.textContent = "Kaydedildi " + new Date(r.at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }); }
    else { s.className = "err"; s.textContent = "KAYDEDİLEMEDİ"; toast("Kaydedilemedi: " + r.error); }
  });

  function applyTheme() {
    if (theme === "light" || theme === "dark") document.documentElement.setAttribute("data-theme", theme);
    else document.documentElement.removeAttribute("data-theme");
  }

  function mk(name, demo) { var p = { name: name, thr: 4, tgt: 6, maxs: 0, stock: {}, transit: {}, cost: 0, kdv: 0, excl: {} }; if (demo) seed(p); return p; }
  function seed(p) {
    var r = 7; function rnd() { r = (r * 9301 + 49297) % 233280; return r / 233280; }
    p.stock = {};
    [1, -1].forEach(function (sg) {
      for (var i = 0; i <= 16; i++) {
        for (var j = 0; j <= Math.min(i + 1, 8); j++) {
          if (sg === 1 && i === 0 && j > 0) continue; var s = sg * i * .25, c = -j * .25, x = rnd();
          p.stock[fmt(s) + "|" + fmt(c)] = x < .1 ? 1 + Math.floor(rnd() * 3) : 4 + Math.floor(rnd() * 3);
        }
      }
    });
  }
  function P() { if (!state.hist) state.hist = []; var p = state.prods[state.cur]; if (!p.transit) p.transit = {}; if (p.cost === undefined) { p.cost = 0; p.kdv = 0; } return p; }

  function chips() { var h = ""; state.prods.forEach(function (p, i) { h += '<button class="chip' + (i === state.cur ? ' on' : '') + '" data-p="' + i + '">' + esc(p.name) + '</button>'; }); $("chips").innerHTML = h; }
  function render() {
    chips(); var m = $("main"), w0 = document.querySelector(".wrap"), sc = w0 && tab === "stok" ? [w0.scrollTop, w0.scrollLeft] : null;
    var pre = noticeHtml();
    if (blocked) m.innerHTML = pre;
    else if (tab === "stok") m.innerHTML = pre + viewStok(); else if (tab === "siparis") m.innerHTML = pre + viewOrder(); else if (tab === "gecmis") m.innerHTML = pre + viewHist(); else m.innerHTML = pre + viewSet();
    var w1 = document.querySelector(".wrap"); if (sc && w1) { w1.scrollTop = sc[0]; w1.scrollLeft = sc[1]; }
    document.querySelectorAll("nav button").forEach(function (b) { b.className = b.dataset.t === tab ? "on" : ""; });
  }
  function noticeHtml() {
    if (blocked) return '<div class="notice"><b>Veri dosyası açılamadı</b>' + esc(notice || "") + '<div class="row"><button class="btn" id="restore">Yedekten geri yükle</button><button class="btn alt" id="opendir">Veri klasörünü aç</button><button class="btn alt" id="startempty">Boş başla</button></div></div>';
    if (!notice) return "";
    return '<div class="notice">' + esc(notice) + '<div class="row"><button class="btn alt sm" id="noticeok">Tamam</button></div></div>';
  }
  function viewStok() {
    var p = P(), h = '<div class="bar"><div class="seg"><button data-sg="1" class="' + (sign === 1 ? 'on' : '') + '">SPH +</button><button data-sg="-1" class="' + (sign === -1 ? 'on' : '') + '">SPH −</button></div><button class="btn sm' + (sale ? '' : ' alt') + '" id="sale">Satış modu: ' + (sale ? 'açık' : 'kapalı') + '</button>' + (sale ? '<button class="btn sm alt" id="undo">Geri al</button>' : '') + '</div>' + (sale ? '<div class="mode">Satış modu açık: dokunduğunuz hücrenin stoğu 1 azalır.</div>' : '') + '<div class="find"><input type="number" id="fs" step="0.25" placeholder="SPH"><input type="number" id="fc" step="0.25" placeholder="CYL"><span id="res" class="hint">Reçeteyi yazın, stoğa bakın.</span></div><div class="wrap"><table><thead><tr><th>SPH \\ CYL</th>';
    for (var j = 0; j <= 20; j++) h += "<th>" + fmt(-j * .25) + "</th>"; h += "</tr></thead><tbody>";
    var rows = sign === 1 ? 24 : 20; Object.keys(p.stock).forEach(function (k) { var x = Math.round(parseFloat(k) * 4) * sign; if (x > rows) rows = x; });
    for (var i = 0; i <= rows; i++) {
      var s = sign * i * .25; h += "<tr><th>" + fmt(s) + "</th>";
      for (var j2 = 0; j2 <= 20; j2++) {
        var c = -j2 * .25, k = key(s, c), n = p.stock[k], cl = "", t = "";
        if (typeof n === "number") { t = n; cl = n < p.thr ? "low" : "ok"; } if (p.excl && p.excl[k]) cl += " ex";
        h += '<td class="' + cl + '" data-k="' + k + '">' + t + "</td>";
      }
      h += "</tr>";
    }
    return h + "</tbody></table></div>";
  }
  function viewOrder() {
    var p = P(), o = orders(p), tot = 0; o.forEach(function (x) { tot += x.q; });
    var h = '<div class="card"><div class="sum"><div><b>' + o.length + '</b><span>çeşit</span></div><div><b>' + tot + '</b><span>adet</span></div></div><div class="hint">Stoğu ' + p.thr + ' altındaki camlar ' + p.tgt + ' adete tamamlanır' + (p.maxs > 0 ? ', SPH ±' + p.maxs.toFixed(2) + ' ile sınırlı' : '') + '.</div></div>';
    h += transitCard(p) + costCard(p, tot); if (!o.length) return h + '<div class="empty">Sipariş edilecek cam yok. Stoklar yeterli.</div>';
    h += '<div class="card" style="padding:0;overflow:hidden"><table class="list" style="width:100%"><thead><tr><th>SPH</th><th>CYL</th><th>ADET</th></tr></thead><tbody>';
    o.forEach(function (x) { h += "<tr><td>" + fmt(x.s) + "</td><td>" + (x.c === 0 ? "" : fmt(x.c)) + '</td><td class="q">' + x.q + "</td></tr>"; });
    h += '</tbody></table></div><div class="row"><button class="btn" id="sent">Sipariş verdim</button><button class="btn alt" id="copy">Listeyi kopyala</button><button class="btn alt" id="wa">WhatsApp’a gönder</button><button class="btn alt" id="pdf">PDF olarak kaydet</button><button class="btn alt" id="prn">Yazdır</button></div>';
    return h;
  }
  function tl(n) { return n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₺"; }
  function invHtml(c, p) { if (!p.cost) return '<div class="hint">Fiyat girerseniz fatura tutarı burada hesaplanır.</div>'; return '<div class="hint">Ara toplam: ' + tl(c.net) + '<br>KDV: ' + tl(c.tax) + '</div><div class="sum" style="margin:8px 0 0"><div><b>' + tl(c.tot) + '</b><span>fatura tutarı</span></div></div>'; }
  function costCard(p, tot) { if (!tot) return ""; return '<div class="card"><b>Tahmini fatura</b><label>Cam başına alış fiyatı (₺)<input type="number" id="cost" min="0" step="0.01" inputmode="decimal" value="' + (p.cost || "") + '" placeholder="isteğe bağlı"></label><label>KDV (%)<input type="number" id="kdv" min="0" step="1" inputmode="decimal" value="' + (p.kdv || "") + '" placeholder="0"></label><div id="inv" style="padding-top:8px">' + invHtml(calc(tot, p.cost || 0, p.kdv || 0), p) + '</div></div>'; }
  function viewHist() {
    var H = state.hist || []; if (!H.length) return '<div class="empty">Henüz kayıtlı sipariş yok. Sipariş sekmesinde “Sipariş verdim” dediğinizde burada saklanır.</div>'; var tq = 0, tt = 0; H.forEach(function (h) { tq += h.qty; tt += h.tot || 0; });
    var s = '<div class="card"><div class="sum"><div><b>' + H.length + '</b><span>sipariş</span></div><div><b>' + tq + '</b><span>adet</span></div>' + (tt ? '<div><b>' + tl(tt) + '</b><span>toplam tutar</span></div>' : '') + '</div></div>';
    H.forEach(function (h) {
      var dt = new Date(h.d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
      s += '<details class="card"><summary><b>' + dt + '</b> ' + esc(h.prod) + '<br><span class="hint">' + h.items.length + ' çeşit, ' + h.qty + ' adet' + (h.tot ? ', ' + tl(h.tot) : '') + ' (' + h.st + ')</span></summary><table class="list" style="margin-top:10px"><thead><tr><th>SPH</th><th>CYL</th><th>ADET</th></tr></thead><tbody>';
      h.items.forEach(function (x) { s += '<tr><td>' + fmt(x.s) + '</td><td>' + (x.c === 0 ? "" : fmt(x.c)) + '</td><td class="q">' + x.q + '</td></tr>'; });
      s += '</tbody></table>' + (h.cost ? '<div class="hint" style="margin-top:8px">Cam başına ' + tl(h.cost) + (h.kdv ? ', KDV %' + h.kdv : '') + '</div>' : '') + '<div class="row"><button class="btn alt sm" data-ch="' + h.id + '">Listeyi kopyala</button><button class="btn alt sm" data-ph="' + h.id + '">PDF</button><button class="btn alt sm" data-dh="' + h.id + '">Sil</button></div></details>';
    });
    return s;
  }
  function transitCard(p) { var t = 0, n = 0; Object.keys(p.transit || {}).forEach(function (k) { if (p.transit[k] > 0) { t += p.transit[k]; n++; } }); if (!n) return ""; return '<div class="card"><b>Yolda: ' + t + ' adet (' + n + ' çeşit)</b><div class="hint">Sipariş verilen camlar, cam gelene kadar listeden düşer.</div><div class="row"><button class="btn" id="arrived">Sipariş geldi</button><button class="btn alt" id="cleartr">Yolu sıfırla</button></div></div>'; }
  function backupCard() { return '<div class="card"><b>Kopyala / yapıştır (Excel, Numbers)</b><div class="hint">Stok tablosunu Excel’e ya da Numbers’a yapıştırabilir, oradan kopyalayıp geri yükleyebilirsiniz.</div><div class="row"><button class="btn alt" id="exp">Tabloyu kopyala</button></div><textarea id="imp" placeholder="Excel’den kopyaladığınız tabloyu buraya yapıştırın"></textarea><div class="row"><button class="btn" id="impgo">Tabloyu yükle</button></div></div>'; }
  function dataCard() {
    return '<div class="card"><b>Veri ve yedek</b><div class="hint">Her değişiklik otomatik kaydedilir. Her gün ilk açılışta otomatik yedek alınır (son 30 yedek saklanır).</div><div class="path">' + esc(dataDir) + '</div>' +
      '<div class="row"><button class="btn alt" id="opendir">Veri klasörünü aç</button><button class="btn alt" id="bknow">Şimdi yedek al</button><button class="btn alt" id="restore">Yedekten geri yükle</button></div>' +
      '<div class="row"><button class="btn alt" id="xout">Excel’e aktar (.xlsx)</button><button class="btn alt" id="xin">Excel’den yükle</button></div></div>';
  }
  function themeCard() {
    return '<div class="card"><b>Görünüm</b><div class="row"><div class="seg"><button data-th="auto" class="' + (theme === "auto" ? "on" : "") + '">Otomatik</button><button data-th="light" class="' + (theme === "light" ? "on" : "") + '">Açık</button><button data-th="dark" class="' + (theme === "dark" ? "on" : "") + '">Koyu</button></div></div></div>';
  }
  function cp(tx, msg) { API.copy(tx).then(function () { toast(msg); }, function () { toast("Kopyalanamadı"); }); }
  function text() { return L.orderText(P()); }
  function viewSet() {
    var p = P();
    return '<div class="card"><b>' + esc(p.name) + ' kuralları</b>' +
      '<label>Stok bunun altındaysa sipariş ver<input type="number" id="thr" min="0" value="' + p.thr + '"></label>' +
      '<label>Kaç adete tamamlansın<input type="number" id="tgt" min="1" value="' + p.tgt + '"></label>' +
      '<label>Sipariş için en yüksek SPH (±), 0 = sınır yok<input type="number" id="maxs" min="0" step="0.25" value="' + p.maxs + '"></label>' +
      '<div class="row"><button class="btn alt" id="demo">Örnek veri yükle</button><button class="btn alt" id="clear">Stoğu temizle</button></div></div>' +
      '<div class="card"><b>Yeni cam çeşidi</b><label>Ad<input type="text" id="np" placeholder="örn. 1.60 Mavi Işık"></label><div class="row"><button class="btn" id="addp">Ekle</button>' + (state.prods.length > 1 ? '<button class="btn alt" id="delp">Bu çeşidi sil</button>' : '') + '</div></div>' +
      dataCard() + backupCard() + themeCard();
  }
  var toastT = null;
  function toast(t) { var e = $("toast"); e.textContent = t; e.style.display = "block"; clearTimeout(toastT); toastT = setTimeout(function () { e.style.display = "none"; }, t.length > 40 ? 3200 : 1600); }
  function openCell(k) {
    cur = k; var a = k.split("|"), n = P().stock[k];
    $("panel").innerHTML = '<h2>' + a[0] + ' / ' + a[1] + '</h2><div class="hint">' + esc(P().name) + '</div><div class="step"><button id="dn" aria-label="Azalt">−</button><input type="number" id="val" min="0" value="' + (typeof n === "number" ? n : "") + '" placeholder="0"><button id="up" aria-label="Artır">+</button></div><div class="row"><button class="btn" id="ok">Kaydet</button><button class="btn alt" id="del">Boşalt</button><button class="btn alt" id="exc">' + (P().excl && P().excl[k] ? "Siparişe dahil et" : "Siparişe girmesin") + '</button><button class="btn alt" id="cx">Kapat</button></div>';
    $("sheet").className = "sheet show";
    var v = $("val"); v.focus(); v.select();
  }
  function setCell(v) { var p = P(); if (v === null) delete p.stock[cur]; else p.stock[cur] = v; save(); $("sheet").className = "sheet"; render(); }

  // ---- Yazdırma / PDF ----
  function printHtml(name, items, extra) {
    var tot = 0; items.forEach(function (x) { tot += x.q; });
    var d = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
    var rows = items.map(function (x) { return "<tr><td>" + fmt(x.s) + "</td><td>" + (x.c === 0 ? "" : fmt(x.c)) + "</td><td class=q>" + x.q + "</td></tr>"; }).join("");
    return '<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><title>Sipariş</title><style>' +
      'body{font:13px/1.4 "Avenir Next","Segoe UI",system-ui,sans-serif;color:#14212b;margin:0}' +
      'h1{font-size:20px;margin:0 0 2px}.m{color:#66767f;margin-bottom:14px}' +
      'table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}' +
      'th{background:#14212b;color:#fff;font-weight:600;padding:6px;text-align:center;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
      'td{border-bottom:1px solid #d5dde2;padding:5px;text-align:center}td.q{font-weight:700}tr{break-inside:avoid}' +
      '.s{margin-top:12px;font-weight:700}</style></head><body>' +
      '<h1>SİPARİŞ EDİLECEK CAMLAR</h1><div class="m">' + esc(name) + ' • ' + d + ' • ' + items.length + ' çeşit, ' + tot + ' adet</div>' +
      '<table><thead><tr><th>SPH</th><th>CYL</th><th>ADET</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      (extra ? '<div class="s">' + extra + '</div>' : '') + '</body></html>';
  }
  function fileName(name) { return ("Siparis " + name + " " + new Date().toISOString().slice(0, 10)).replace(/[\\\/:*?"<>|]/g, "-"); }
  function curInvoice(p, tot) { if (!p.cost) return ""; var c = calc(tot, p.cost, p.kdv || 0); return "Ara toplam: " + tl(c.net) + " • KDV: " + tl(c.tax) + " • Fatura tutarı: " + tl(c.tot); }

  document.addEventListener("click", function (e) {
    var t = e.target.closest("button,td,a,summary,.sheet") || e.target, d = t.dataset || {};
    if (t.closest && t.closest("nav") && d.t) { tab = d.t; render(); return; }
    if (d.p !== undefined) { state.cur = +d.p; save(); render(); return; }
    if (d.sg) { sign = +d.sg; render(); return; }
    if (d.th) { theme = d.th; applyTheme(); API.setTheme(theme); render(); return; }
    if (t.tagName === "TD" && d.k && tab === "stok") { if (sale) { var p3 = P(), n3 = p3.stock[d.k]; if (typeof n3 === "number" && n3 > 0) { p3.stock[d.k] = n3 - 1; last = d.k; t.textContent = n3 - 1; t.className = (n3 - 1 < p3.thr ? "low" : "ok") + (p3.excl && p3.excl[d.k] ? " ex" : ""); save(); toast(d.k.replace("|", " / ") + ": " + (n3 - 1) + " kaldı"); } else toast("Bu camda stok yok"); } else openCell(d.k); return; }
    var id = t.id;
    if (id === "exc") { var pe = P(); if (!pe.excl) pe.excl = {}; if (pe.excl[cur]) delete pe.excl[cur]; else pe.excl[cur] = 1; save(); $("sheet").className = "sheet"; render(); return; }
    if ((id === "sheet" && e.target === t) || id === "cx") { $("sheet").className = "sheet"; return; }
    if (id === "dn" || id === "up") { var v = $("val"), n = parseInt(v.value || "0", 10) || 0; n = Math.max(0, n + (id === "up" ? 1 : -1)); v.value = n; return; }
    if (id === "ok") { var x = $("val").value; setCell(x === "" ? null : Math.max(0, parseInt(x, 10) || 0)); return; }
    if (id === "del") { setCell(null); return; }
    if (id === "copy") { cp(text(), "Liste kopyalandı"); return; }
    if (id === "wa") { cp(text(), "Liste kopyalandı. WhatsApp’ta sohbete yapıştırın (Ctrl+V / ⌘V)."); return; }
    if (id === "pdf" || id === "prn") { var pp = P(), oo = orders(pp), tq0 = 0; oo.forEach(function (x) { tq0 += x.q; }); var html = printHtml(pp.name, oo, curInvoice(pp, tq0)); if (id === "pdf") API.savePdf(html, fileName(pp.name)).then(function (r) { if (r.ok) toast("PDF kaydedildi"); }); else API.print(html); return; }
    if (d.ph) { var hp = state.hist.filter(function (x) { return String(x.id) === d.ph; })[0]; if (hp) API.savePdf(printHtml(hp.prod, hp.items, hp.tot ? "Fatura tutarı: " + tl(hp.tot) : ""), fileName(hp.prod)).then(function (r) { if (r.ok) toast("PDF kaydedildi"); }); return; }
    if (d.dh) { if (t.dataset.arm !== "1") { t.dataset.arm = "1"; t.textContent = "Silinsin mi?"; return; } state.hist = state.hist.filter(function (x) { return String(x.id) !== d.dh; }); save(); render(); return; }
    if (d.ch) { var hh = state.hist.filter(function (x) { return String(x.id) === d.ch; })[0]; if (hh) { var NL3 = "\n", tx3 = "SİPARİŞ EDİLECEK CAMLAR" + NL3 + hh.prod + NL3 + NL3 + "SPH / CYL / ADET" + NL3; hh.items.forEach(function (x) { tx3 += fmt(x.s) + " / " + (x.c === 0 ? "-" : fmt(x.c)) + " / " + x.q + NL3; }); cp(tx3, "Liste kopyalandı"); } return; }
    if (id === "sale") { sale = !sale; last = null; render(); return; }
    if (id === "undo") { if (last) { var p4 = P(); p4.stock[last] = (p4.stock[last] || 0) + 1; var td = document.querySelector('td[data-k="' + last + '"]'); if (td) { td.textContent = p4.stock[last]; td.className = (p4.stock[last] < p4.thr ? "low" : "ok") + (p4.excl && p4.excl[last] ? " ex" : ""); } last = null; save(); toast("Geri alındı"); } else toast("Geri alınacak satış yok"); return; }
    if (id === "sent") { var q = P(), os = orders(q), tq = 0, items = []; os.forEach(function (x) { q.transit[x.k] = (q.transit[x.k] || 0) + x.q; tq += x.q; items.push({ s: x.s, c: x.c, q: x.q }); }); if (os.length) { var cc = calc(tq, q.cost || 0, q.kdv || 0); state.hist.unshift({ id: Date.now(), d: Date.now(), prod: q.name, items: items, qty: tq, cost: q.cost || 0, kdv: q.kdv || 0, tot: q.cost ? cc.tot : 0, st: "yolda" }); } save(); toast("Sipariş kaydedildi, yolda"); render(); return; }
    if (id === "arrived") { var q2 = P(); Object.keys(q2.transit).forEach(function (k) { q2.stock[k] = (q2.stock[k] || 0) + q2.transit[k]; }); q2.transit = {}; state.hist.forEach(function (h) { if (h.prod === q2.name && h.st === "yolda") { h.st = "geldi"; } }); save(); toast("Stoğa eklendi"); render(); return; }
    if (id === "cleartr") { var q5 = P(); q5.transit = {}; state.hist.forEach(function (h) { if (h.prod === q5.name && h.st === "yolda") { h.st = "iptal"; } }); save(); render(); return; }
    if (id === "exp") { var q3 = P(), TB = "\t", NL = "\n", hd = ["SPH"], j, i, rw, lines = []; for (j = 0; j <= 20; j++) hd.push(fmt(-j * .25)); lines.push(hd.join(TB)); var hi = 24, lo = -20; Object.keys(q3.stock).forEach(function (k) { var x = Math.round(parseFloat(k) * 4); if (x > hi) hi = x; if (x < lo) lo = x; }); for (i = hi; i >= lo; i--) { rw = [fmt(i * .25)]; for (j = 0; j <= 20; j++) { var v2 = q3.stock[key(i * .25, -j * .25)]; rw.push(typeof v2 === "number" ? v2 : ""); } lines.push(rw.join(TB)); } cp(lines.join(NL), "Tablo kopyalandı"); return; }
    if (id === "impgo") { var tx2 = $("imp").value.split("\r").join(""), q4 = P(), TB2 = "\t", ls = tx2.split("\n"), hd2 = (ls[0] || "").split(TB2), cnt = 0; for (var r = 1; r < ls.length; r++) { var cs = ls[r].split(TB2), sv = parseFloat((cs[0] || "").replace(",", ".")); if (isNaN(sv)) continue; sv = Math.round(sv * 4) / 4; for (var c = 1; c < cs.length; c++) { var cv = parseFloat((hd2[c] || "").replace(",", ".")), nv = parseInt((cs[c] || "").trim(), 10); if (isNaN(cv) || isNaN(nv)) continue; q4.stock[key(sv, -Math.abs(Math.round(cv * 4) / 4))] = Math.max(0, nv); cnt++; } } save(); toast(cnt + " hücre yüklendi"); return; }
    if (id === "demo") { if (!confirm("Bu çeşidin stoğu örnek (rastgele) veriyle DEĞİŞTİRİLECEK. Emin misiniz?")) return; seed(P()); save(); toast("Örnek veri yüklendi"); return; }
    if (id === "clear") { if (!confirm(P().name + " stoğunun tamamı silinecek. Emin misiniz?")) return; P().stock = {}; save(); toast("Stok temizlendi"); return; }
    if (id === "addp") { var nm = $("np").value.trim(); if (nm) { if (state.prods.some(function (p) { return p.name.toLowerCase() === nm.toLowerCase(); })) { toast("Bu adla bir çeşit zaten var"); return; } state.prods.push(mk(nm, false)); state.cur = state.prods.length - 1; save(); render(); } return; }
    if (id === "delp") { if (!confirm("“" + P().name + "” çeşidi ve tüm stoğu silinecek. Emin misiniz?")) return; state.prods.splice(state.cur, 1); state.cur = 0; save(); render(); return; }
    // ---- Masaüstü: veri ve yedek ----
    if (id === "noticeok") { notice = null; render(); return; }
    if (id === "opendir") { API.openDataDir(); return; }
    if (id === "bknow") { API.backupNow().then(function (r) { toast(r.ok ? "Yedek alındı: " + r.file : "Henüz yedeklenecek veri yok"); }); return; }
    if (id === "restore") { API.restoreBackup().then(function (r) { if (r.state) { state = r.state; blocked = false; notice = null; sale = false; last = null; render(); toast("Yedek geri yüklendi"); } }); return; }
    if (id === "startempty") { if (!confirm("Boş bir stokla başlanacak. Emin misiniz?")) return; blocked = false; notice = null; state = emptyState(); save(); render(); return; }
    if (id === "xout") { API.exportXlsx(JSON.stringify(state)).then(function (r) { if (r.ok) toast("Excel dosyası kaydedildi"); }); return; }
    if (id === "xin") {
      API.importXlsx(state.prods.map(function (p) { return p.name; })).then(function (r) {
        if (!r.prods) return;
        r.prods.forEach(function (x) {
          var p = state.prods.filter(function (y) { return y.name.toLowerCase() === x.name.toLowerCase(); })[0];
          if (p) p.stock = x.stock; else { p = mk(x.name, false); p.stock = x.stock; state.prods.push(p); }
        });
        save(); render(); toast("Excel’den yüklendi");
      });
      return;
    }
  });
  document.addEventListener("keydown", function (e) {
    if (!$("sheet").classList.contains("show")) return;
    if (e.key === "Escape") { $("sheet").className = "sheet"; }
    else if (e.key === "Enter" && e.target.id === "val") { var x = $("val").value; setCell(x === "" ? null : Math.max(0, parseInt(x, 10) || 0)); }
  });
  document.addEventListener("change", function (e) {
    var id = e.target.id, p = P();
    if (id === "thr") p.thr = Math.max(0, +e.target.value || 0);
    else if (id === "tgt") p.tgt = Math.max(1, +e.target.value || 1);
    else if (id === "maxs") p.maxs = Math.max(0, +e.target.value || 0);
    else return; save(); toast("Kaydedildi");
  });
  document.addEventListener("input", function (e) {
    var id = e.target.id;
    if (id === "cost" || id === "kdv") { var pp = P(); pp[id] = Math.max(0, parseFloat(e.target.value) || 0); save(); var o2 = orders(pp), t2 = 0; o2.forEach(function (x) { t2 += x.q; }); $("inv").innerHTML = invHtml(calc(t2, pp.cost || 0, pp.kdv || 0), pp); return; }
    if (id !== "fs" && id !== "fc") return; var s = $("fs").value, r = $("res"); if (s === "" || isNaN(parseFloat(s))) { r.textContent = "Reçeteyi yazın, stoğa bakın."; return; }
    var sv = Math.round(parseFloat(s) * 4) / 4, cv = -Math.abs(Math.round((parseFloat($("fc").value) || 0) * 4) / 4), p = P(), k = key(sv, cv), n = p.stock[k], y = p.transit[k] || 0;
    r.textContent = fmt(sv) + " / " + fmt(cv) + ": " + (typeof n === "number" && n > 0 ? n + " adet stokta" : "stokta yok") + (y ? " (yolda " + y + ")" : "");
  });
  window.onerror = function (m, u, l) { var e = document.getElementById("main"); if (e) e.innerHTML = '<div class="card"><b>Bir hata oluştu</b><div class="hint">' + esc(String(m)) + ' (satır ' + l + ')</div></div>'; };
  try { load(); render(); } catch (er) { window.onerror(er && er.message, "", 0); }
})();
