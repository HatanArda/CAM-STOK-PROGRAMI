// Pencere (arayüz) ile ana süreç arasındaki güvenli köprü.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("camstok", {
  init: () => ipcRenderer.sendSync("init"),
  save: json => ipcRenderer.send("save", json),
  onSaved: cb => ipcRenderer.on("saved", (e, r) => cb(r)),
  openDataDir: () => ipcRenderer.invoke("open-data-dir"),
  backupNow: () => ipcRenderer.invoke("backup-now"),
  restoreBackup: () => ipcRenderer.invoke("restore-backup"),
  exportXlsx: json => ipcRenderer.invoke("export-xlsx", json),
  importXlsx: names => ipcRenderer.invoke("import-xlsx", names),
  savePdf: (html, name) => ipcRenderer.invoke("save-pdf", html, name),
  print: html => ipcRenderer.invoke("print", html),
  copy: text => ipcRenderer.invoke("copy", text),
  setTheme: t => ipcRenderer.invoke("set-theme", t)
});
