// Çalıştırma: npm test
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const L = require("../src/renderer/logic.js");

function ozet(p) { const o = L.orders(p); return { cesit: o.length, adet: o.reduce((t, x) => t + x.q, 0) }; }

const SEED = path.join(__dirname, "..", "private", "baslangic-stok.json");

test("Başlangıç stoğu: 1.56 HMC → 5 çeşit / 16 adet, U.C. 1.49 → 7 çeşit / 24 adet",
  { skip: !fs.existsSync(SEED) && "private/baslangic-stok.json yok (özel dosya)" }, () => {
    const st = L.normalize(JSON.parse(fs.readFileSync(SEED, "utf8")));
    const hmc = st.prods.find(p => p.name === "1.56 HMC");
    const uc = st.prods.find(p => p.name === "U.C. 1.49");
    assert.equal(hmc.maxs, 4); assert.equal(uc.maxs, 5);
    assert.equal(hmc.thr, 4); assert.equal(hmc.tgt, 6);
    const a = ozet(hmc), b = ozet(uc);
    console.log("  1.56 HMC :", a.cesit, "çeşit /", a.adet, "adet");
    console.log("  U.C. 1.49:", b.cesit, "çeşit /", b.adet, "adet");
    assert.deepEqual(a, { cesit: 5, adet: 16 });
    assert.deepEqual(b, { cesit: 7, adet: 24 });
  });

test("Kural: sınır, hedef, yoldaki, SPH sınırı ve 'Siparişe girmesin'", () => {
  const p = { thr: 4, tgt: 6, maxs: 4, transit: {}, excl: {}, stock: {
    "+1.00|-0.50": 3,   // 3<4 → 3 adet
    "+1.00|-0.75": 4,   // sınıra eşit → yok
    "-2.00|0.00": 0,    // 0 → 6 adet
    "+4.25|0.00": 1,    // |SPH| 4.25 > 4 → yok
    "-4.00|-1.00": 2,   // tam sınırda (4.00) → 4 adet
    "-1.00|-1.00": 1,   // siparişe girmesin → yok
    "+0.50|0.00": 2     // yolda 1 → 6-3 = 3 adet
  } };
  p.excl["-1.00|-1.00"] = 1;
  p.transit["+0.50|0.00"] = 1;
  const o = L.orders(p);
  assert.deepEqual(o.map(x => [x.k, x.q]), [
    ["-4.00|-1.00", 4], ["-2.00|0.00", 6], ["+0.50|0.00", 3], ["+1.00|-0.50", 3]
  ]);
  p.maxs = 0; // sınır yok
  assert.ok(L.orders(p).some(x => x.k === "+4.25|0.00" && x.q === 5));
  p.transit["+1.00|-0.50"] = 1; // 3+1 = 4 → artık sipariş yok
  assert.ok(!L.orders(p).some(x => x.k === "+1.00|-0.50"));
});

test("Fatura: KDV hesabı", () => {
  const c = L.calc(16, 100, 20);
  assert.equal(c.net, 1600); assert.equal(c.tax, 320); assert.equal(c.tot, 1920);
});

test("Excel modülü: aktar → yükle aynı stoğu geri verir", async () => {
  const os = require("os");
  const X = require("../src/excel.js");
  const st = L.normalize({ cur: 0, prods: [
    { name: "1.56 HMC", stock: { "0.00|0.00": 5, "+1.25|-0.75": 2, "-4.75|0.00": 4, "+6.00|-2.00": 2 } },
    { name: "Yeni / Çeşit", stock: { "-0.25|-0.25": 2 } }
  ] });
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "camstok-")), "t.xlsx");
  await X.exportXlsx(st, f);
  const r = await X.importXlsx(f);
  assert.deepEqual(r.map(x => x.name), ["1.56 HMC", "Yeni / Çeşit"]);
  assert.deepEqual(r[0].stock, st.prods[0].stock);
  assert.deepEqual(r[1].stock, st.prods[1].stock);
});
