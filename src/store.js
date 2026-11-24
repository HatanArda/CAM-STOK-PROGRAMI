// Veri dosyası ve yedekler: Belgeler/CamStok/
const fs = require("fs");
const path = require("path");
const L = require("./renderer/logic.js");

const KEEP = 30;

function pad(n) { return String(n).padStart(2, "0"); }
function today(d = new Date()) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
function stamp(d = new Date()) { return today(d) + "_" + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds()); }

class Store {
  constructor(documentsDir) {
    this.dir = path.join(documentsDir, "CamStok");
    this.file = path.join(this.dir, "camstok-veri.json");
    this.backupDir = path.join(this.dir, "Yedekler");
    this.lastBackupDay = null;
  }

  ensureDirs() { fs.mkdirSync(this.backupDir, { recursive: true }); }
  exists() { return fs.existsSync(this.file); }

  // Dosyayı okur. Bozuksa kenara ayırır ve en yeni yedekten açmayı dener.
  load() {
    if (!this.exists()) return { state: null };
    try {
      const st = L.normalize(JSON.parse(fs.readFileSync(this.file, "utf8")));
      if (!st) throw new Error("Geçersiz veri biçimi");
      return { state: st };
    } catch (e) {
      const bad = path.join(this.dir, "camstok-veri-BOZUK-" + stamp() + ".json");
      try { fs.renameSync(this.file, bad); } catch (_) {}
      for (const b of this.listBackups()) {
        try {
          const st = L.normalize(JSON.parse(fs.readFileSync(b, "utf8")));
          if (st) {
            this.write(st);
            return { state: st, notice: "Veri dosyası okunamadı (" + e.message + "). Bozuk dosya \"" + path.basename(bad) + "\" adıyla saklandı ve en yeni yedek \"" + path.basename(b) + "\" açıldı." };
          }
        } catch (_) {}
      }
      return { state: null, notice: "Veri dosyası okunamadı ve kullanılabilir yedek bulunamadı. Bozuk dosya \"" + path.basename(bad) + "\" adıyla saklandı." };
    }
  }

  // Güvenli yazma: önce geçici dosyaya yazar, sonra yerine taşır (yarım dosya oluşmaz).
  write(state) {
    this.ensureDirs();
    this.dailyBackup();
    const tmp = this.file + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(state, null, 1), "utf8");
    fs.renameSync(tmp, this.file);
  }

  listBackups() {
    if (!fs.existsSync(this.backupDir)) return [];
    return fs.readdirSync(this.backupDir)
      .filter(f => /^camstok-.*\.json$/i.test(f))
      .sort().reverse()
      .map(f => path.join(this.backupDir, f));
  }

  // Günün ilk açılışında (ya da gün değiştiğinde ilk kayıtta) bir kez yedek alır.
  dailyBackup() {
    const d = today();
    if (this.lastBackupDay === d || !this.exists()) return null;
    this.ensureDirs();
    const dest = path.join(this.backupDir, "camstok-" + d + ".json");
    this.lastBackupDay = d;
    if (fs.existsSync(dest)) return null;
    fs.copyFileSync(this.file, dest);
    this.prune();
    return dest;
  }

  backupNow(label) {
    if (!this.exists()) return null;
    this.ensureDirs();
    const dest = path.join(this.backupDir, "camstok-" + stamp() + (label ? "-" + label : "") + ".json");
    fs.copyFileSync(this.file, dest);
    this.prune();
    return dest;
  }

  prune() {
    this.listBackups().slice(KEEP).forEach(f => { try { fs.unlinkSync(f); } catch (_) {} });
  }
}

module.exports = { Store, today, stamp, KEEP };
