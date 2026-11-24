const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs"), os = require("os"), path = require("path");
const { Store, KEEP } = require("../src/store.js");

function tmpStore() { return new Store(fs.mkdtempSync(path.join(os.tmpdir(), "camstok-belgeler-"))); }
const ST = { cur: 0, hist: [], prods: [{ name: "A", thr: 4, tgt: 6, maxs: 0, stock: { "0.00|0.00": 3 } }] };

test("Kayıt: Belgeler/CamStok/camstok-veri.json dosyasına yazılır ve geri okunur", () => {
  const s = tmpStore();
  assert.equal(s.load().state, null);          // dosya yokken boş
  s.write(ST);
  assert.ok(fs.existsSync(s.file));
  assert.equal(s.load().state.prods[0].stock["0.00|0.00"], 3);
});

test("Günlük yedek: günde bir kez alınır, en fazla 30 yedek kalır", () => {
  const s = tmpStore();
  s.write(ST);                                  // ilk yazımda dosya yoktu → yedek yok
  s.lastBackupDay = null;
  assert.ok(s.dailyBackup());                   // günün ilk açılışı
  assert.equal(s.dailyBackup(), null);          // aynı gün ikinci kez alınmaz
  for (let i = 0; i < 40; i++) fs.writeFileSync(path.join(s.backupDir, "camstok-2020-01-" + String(i).padStart(2, "0") + ".json"), "{}");
  s.prune();
  const list = s.listBackups();
  assert.equal(list.length, KEEP);
  assert.ok(list.some(f => f.includes(new Date().getFullYear() + "-")), "bugünün yedeği silinmemeli");
});

test("Bozuk veri dosyası: kenara ayrılır, en yeni yedek açılır", () => {
  const s = tmpStore();
  s.write(ST); s.lastBackupDay = null; s.dailyBackup();
  fs.writeFileSync(s.file, "{ bozuk");
  const r = s.load();
  assert.equal(r.state.prods[0].name, "A");
  assert.match(r.notice, /yedek/);
  assert.ok(fs.readdirSync(s.dir).some(f => f.includes("BOZUK")));
});
