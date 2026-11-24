/* CamStok sipariş mantığı.
   Orijinal CamStok.html içindeki fonksiyonlar birebir korunmuştur; hem uygulama
   (tarayıcı penceresi) hem de testler (Node) aynı dosyayı kullanır. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CamLogic = factory();
})(typeof self !== "undefined" ? self : this, function () {
  function fmt(v) { return v === 0 ? "0.00" : (v > 0 ? "+" : "-") + Math.abs(v).toFixed(2); }
  function key(s, c) { return fmt(s) + "|" + fmt(c); }

  // Sipariş kuralı: stok + yoldaki < sınır ise adet = hedef − (stok + yoldaki).
  // "en yüksek |SPH|" sınırı (0 = sınır yok) ve hücre bazında "Siparişe girmesin" (excl).
  function orders(p) {
    var out = [];
    Object.keys(p.stock).forEach(function (k) {
      var n = p.stock[k];
      var a = k.split("|"), s = parseFloat(a[0]), c = parseFloat(a[1]), e = n + ((p.transit || {})[k] || 0);
      if (typeof n !== "number" || e >= p.thr || (p.excl && p.excl[k])) return;
      if (p.maxs > 0 && Math.abs(s) > p.maxs + 1e-9) return;
      out.push({ s: s, c: c, k: k, q: Math.max(0, p.tgt - e) });
    });
    out.sort(function (a, b) { return a.s - b.s || b.c - a.c; });
    return out;
  }

  function calc(q, cost, kdv) { var net = q * cost; return { net: net, tax: net * kdv / 100, tot: net * (1 + kdv / 100) }; }

  function orderText(p) {
    var t = "SİPARİŞ EDİLECEK CAMLAR\n" + p.name + "\n\nSPH / CYL / ADET\n";
    orders(p).forEach(function (x) { t += fmt(x.s) + " / " + (x.c === 0 ? "-" : fmt(x.c)) + " / " + x.q + "\n"; });
    return t;
  }

  // Veri dosyasının biçimini doğrular ve eksik alanları tamamlar.
  function normalize(st) {
    if (!st || typeof st !== "object" || !Array.isArray(st.prods) || !st.prods.length) return null;
    if (!Array.isArray(st.hist)) st.hist = [];
    st.prods.forEach(function (p) {
      if (!p.stock || typeof p.stock !== "object") p.stock = {};
      if (!p.transit || typeof p.transit !== "object") p.transit = {};
      if (!p.excl || typeof p.excl !== "object") p.excl = {};
      if (typeof p.thr !== "number") p.thr = 4;
      if (typeof p.tgt !== "number") p.tgt = 6;
      if (typeof p.maxs !== "number") p.maxs = 0;
      if (typeof p.cost !== "number") p.cost = 0;
      if (typeof p.kdv !== "number") p.kdv = 0;
    });
    if (typeof st.cur !== "number" || st.cur < 0 || st.cur >= st.prods.length) st.cur = 0;
    return st;
  }

  return { fmt: fmt, key: key, orders: orders, calc: calc, orderText: orderText, normalize: normalize };
});
