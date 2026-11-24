const { app, BrowserWindow, ipcMain, dialog, shell, Menu, nativeTheme, clipboard, screen } = require("electron");
const fs = require("fs");
const path = require("path");
const { Store, today } = require("./store.js");
const L = require("./renderer/logic.js");

app.setName("CamStok");

// Aynı anda yalnızca bir CamStok penceresi açık olsun (iki pencere aynı dosyaya yazmasın).
if (!app.requestSingleInstanceLock()) { app.quit(); return; }

let win = null, store = null, startNotice = null, loadFailed = false;
const prefsFile = () => path.join(app.getPath("userData"), "pencere.json");

function readPrefs() {
  try { return JSON.parse(fs.readFileSync(prefsFile(), "utf8")) || {}; } catch (_) { return {}; }
}
function writePrefs(p) {
  try { fs.mkdirSync(path.dirname(prefsFile()), { recursive: true }); fs.writeFileSync(prefsFile(), JSON.stringify(p, null, 1)); } catch (_) {}
}
let prefs = {};

function seedState() {
  const f = app.isPackaged
    ? path.join(process.resourcesPath, "baslangic-stok.json")
    : path.join(__dirname, "..", "private", "baslangic-stok.json");
  try { return L.normalize(JSON.parse(fs.readFileSync(f, "utf8"))); } catch (_) { return null; }
}

function boundsVisible(b) {
  return b && screen.getAllDisplays().some(d => {
    const a = d.workArea;
    return b.x < a.x + a.width - 50 && b.x + b.width > a.x + 50 && b.y >= a.y - 10 && b.y < a.y + a.height - 50;
  });
}

function createWindow() {
  const b = prefs.bounds;
  const dark = prefs.theme === "dark" || (prefs.theme !== "light" && nativeTheme.shouldUseDarkColors);
  win = new BrowserWindow({
    width: (b && b.width) || 1100,
    height: (b && b.height) || 800,
    x: boundsVisible(b) ? b.x : undefined,
    y: boundsVisible(b) ? b.y : undefined,
    minWidth: 420,
    minHeight: 500,
    title: "CamStok",
    show: false,
    backgroundColor: dark ? "#0e161c" : "#f2f5f7",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false
    }
  });
  if (prefs.maximized) win.maximize();
  win.once("ready-to-show", () => win.show());
  win.loadFile(path.join(__dirname, "renderer", "index.html"));

  // Dış bağlantılar uygulama içinde açılmasın.
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", e => e.preventDefault());

  win.on("close", () => {
    prefs.maximized = win.isMaximized();
    if (!win.isMaximized() && !win.isMinimized() && !win.isFullScreen()) prefs.bounds = win.getBounds();
    writePrefs(prefs);
  });
  win.on("closed", () => { win = null; });
}

function buildMenu() {
  const mac = process.platform === "darwin";
  const t = [];
  if (mac) t.push({ label: "CamStok", submenu: [
    { role: "about", label: "CamStok Hakkında" }, { type: "separator" },
    { role: "hide", label: "CamStok'u Gizle" }, { role: "hideOthers", label: "Diğerlerini Gizle" }, { role: "unhide", label: "Tümünü Göster" },
    { type: "separator" }, { role: "quit", label: "CamStok'tan Çık" }] });
  t.push({ label: "Dosya", submenu: [
    { label: "Veri klasörünü aç", click: () => shell.openPath(store.dir) },
    { type: "separator" },
    mac ? { role: "close", label: "Pencereyi Kapat" } : { role: "quit", label: "Çıkış" }] });
  t.push({ label: "Düzen", submenu: [
    { role: "undo", label: "Geri Al" }, { role: "redo", label: "Yinele" }, { type: "separator" },
    { role: "cut", label: "Kes" }, { role: "copy", label: "Kopyala" }, { role: "paste", label: "Yapıştır" },
    { role: "selectAll", label: "Tümünü Seç" }] });
  t.push({ label: "Görünüm", submenu: [
    { role: "resetZoom", label: "Gerçek Boyut" }, { role: "zoomIn", label: "Yakınlaştır" }, { role: "zoomOut", label: "Uzaklaştır" },
    { type: "separator" }, { role: "togglefullscreen", label: "Tam Ekran" }] });
  t.push({ label: "Pencere", submenu: [{ role: "minimize", label: "Küçült" }, { role: "zoom", label: "Yakınlaştır/Büyüt" }] });
  Menu.setApplicationMenu(Menu.buildFromTemplate(t));
}

function ask(msg, detail, ok) {
  return dialog.showMessageBoxSync(win, {
    type: "question", buttons: [ok || "Devam", "Vazgeç"], defaultId: 0, cancelId: 1,
    title: "CamStok", message: msg, detail: detail || ""
  }) === 0;
}

// ---------- IPC ----------
ipcMain.on("init", e => {
  e.returnValue = {
    state: store.exists() ? store.load().state : null,
    seed: store.exists() || loadFailed ? null : seedState(),
    loadFailed: loadFailed && !store.exists(),
    theme: prefs.theme || "auto",
    dataDir: store.dir,
    notice: startNotice
  };
  startNotice = null;
});

ipcMain.on("save", (e, json) => {
  try {
    const st = L.normalize(JSON.parse(json));
    if (!st) throw new Error("Geçersiz veri");
    store.write(st);
    e.sender.send("saved", { ok: true, at: Date.now() });
  } catch (err) {
    e.sender.send("saved", { ok: false, error: String(err && err.message || err) });
  }
});

ipcMain.handle("open-data-dir", () => shell.openPath(store.dir));

ipcMain.handle("backup-now", () => {
  const f = store.backupNow("elle");
  return f ? { ok: true, file: path.basename(f) } : { ok: false };
});

ipcMain.handle("restore-backup", async () => {
  store.ensureDirs();
  const r = await dialog.showOpenDialog(win, {
    title: "Yedekten geri yükle", defaultPath: store.backupDir, buttonLabel: "Geri yükle",
    properties: ["openFile"], filters: [{ name: "CamStok yedeği", extensions: ["json"] }]
  });
  if (r.canceled || !r.filePaths[0]) return { canceled: true };
  let st;
  try { st = L.normalize(JSON.parse(fs.readFileSync(r.filePaths[0], "utf8"))); } catch (_) { st = null; }
  if (!st) { dialog.showErrorBox("CamStok", "Bu dosya geçerli bir CamStok yedeği değil."); return { canceled: true }; }
  if (!ask("Bu yedek geri yüklensin mi?", path.basename(r.filePaths[0]) + "\n\nŞu anki veriler, geri yüklemeden önce ayrıca yedeklenecek.", "Geri yükle")) return { canceled: true };
  store.backupNow("geri-yukleme-oncesi");
  store.write(st);
  loadFailed = false;
  return { state: st };
});

ipcMain.handle("export-xlsx", async (e, json) => {
  const st = L.normalize(JSON.parse(json));
  const r = await dialog.showSaveDialog(win, {
    title: "Excel'e aktar", buttonLabel: "Kaydet",
    defaultPath: path.join(app.getPath("documents"), "CamStok-stok-" + today() + ".xlsx"),
    filters: [{ name: "Excel", extensions: ["xlsx"] }]
  });
  if (r.canceled || !r.filePath) return { canceled: true };
  try {
    await require("./excel.js").exportXlsx(st, r.filePath);
    shell.showItemInFolder(r.filePath);
    return { ok: true, file: path.basename(r.filePath) };
  } catch (err) { dialog.showErrorBox("CamStok", "Excel dosyası kaydedilemedi:\n" + err.message); return { canceled: true }; }
});

ipcMain.handle("import-xlsx", async (e, names) => {
  const r = await dialog.showOpenDialog(win, {
    title: "Excel'den yükle", buttonLabel: "Yükle", defaultPath: app.getPath("documents"),
    properties: ["openFile"], filters: [{ name: "Excel", extensions: ["xlsx"] }]
  });
  if (r.canceled || !r.filePaths[0]) return { canceled: true };
  let list;
  try { list = await require("./excel.js").importXlsx(r.filePaths[0]); }
  catch (err) { dialog.showErrorBox("CamStok", "Excel dosyası okunamadı:\n" + err.message); return { canceled: true }; }
  list = list.filter(x => x.cells > 0);
  if (!list.length) { dialog.showErrorBox("CamStok", "Dosyada stok tablosu bulunamadı.\nİlk sütunda SPH, başlık satırında CYL değerleri (0.00, -0.25 …) olan bir tablo gerekir."); return { canceled: true }; }
  const low = (names || []).map(n => String(n).toLowerCase());
  const detail = list.map(x => "• " + x.name + ": " + x.cells + " hücre " + (low.includes(x.name.toLowerCase()) ? "(mevcut stok bununla değiştirilecek)" : "(yeni çeşit olarak eklenecek)")).join("\n")
    + "\n\nYoldaki siparişler, “Siparişe girmesin” işaretleri ve geçmiş korunur. Şu anki veriler önce yedeklenecek.";
  if (!ask("Excel'deki stok yüklensin mi?", detail, "Yükle")) return { canceled: true };
  store.backupNow("excel-oncesi");
  return { prods: list.map(x => ({ name: x.name, stock: x.stock })) };
});

function printWindow(html) {
  const w = new BrowserWindow({ show: false, webPreferences: { sandbox: true, contextIsolation: true, javascript: false } });
  return w.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html)).then(() => w);
}

ipcMain.handle("save-pdf", async (e, html, name) => {
  const r = await dialog.showSaveDialog(win, {
    title: "PDF olarak kaydet", buttonLabel: "Kaydet",
    defaultPath: path.join(app.getPath("documents"), (name || "Siparis") + ".pdf"),
    filters: [{ name: "PDF", extensions: ["pdf"] }]
  });
  if (r.canceled || !r.filePath) return { canceled: true };
  const w = await printWindow(html);
  try {
    const pdf = await w.webContents.printToPDF({ pageSize: "A4", printBackground: true, margins: { marginType: "default" } });
    fs.writeFileSync(r.filePath, pdf);
    shell.openPath(r.filePath);
    return { ok: true };
  } catch (err) { dialog.showErrorBox("CamStok", "PDF kaydedilemedi:\n" + err.message); return { canceled: true }; }
  finally { w.destroy(); }
});

ipcMain.handle("print", async (e, html) => {
  const w = await printWindow(html);
  return new Promise(res => w.webContents.print({ printBackground: true }, ok => { w.destroy(); res({ ok }); }));
});

ipcMain.handle("copy", (e, text) => { clipboard.writeText(String(text)); return true; });

ipcMain.handle("set-theme", (e, t) => {
  prefs.theme = ["light", "dark"].includes(t) ? t : "auto";
  nativeTheme.themeSource = prefs.theme === "auto" ? "system" : prefs.theme;
  writePrefs(prefs);
  return prefs.theme;
});

// ---------- Başlangıç ----------
app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });

app.whenReady().then(() => {
  prefs = readPrefs();
  nativeTheme.themeSource = prefs.theme === "light" || prefs.theme === "dark" ? prefs.theme : "system";
  store = new Store(app.getPath("documents"));
  store.ensureDirs();
  const res = store.exists() ? store.load() : {};   // bozuk dosya varsa burada onarılır
  startNotice = res.notice || null;
  loadFailed = !!res.notice && !res.state;
  try { store.dailyBackup(); } catch (_) {}           // günün ilk açılışında yedek
  buildMenu();
  createWindow();
  app.on("activate", () => { if (!win) createWindow(); });
});

app.on("window-all-closed", () => app.quit());
