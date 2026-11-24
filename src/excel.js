// Excel (.xlsx) aktarma ve yükleme. Ana süreçte (main) çalışır.
const ExcelJS = require("exceljs");
const L = require("./renderer/logic.js");

const CYLS = []; for (let j = 0; j <= 20; j++) CYLS.push(-j * 0.25);

function sheetName(name, used) {
  let base = String(name).replace(/[\[\]:*?\/\\]/g, "-").slice(0, 28).trim() || "Cam";
  let n = base, i = 2;
  while (used.has(n.toLowerCase())) n = base.slice(0, 25) + " " + (i++);
  used.add(n.toLowerCase());
  return n;
}

async function exportXlsx(state, file) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "CamStok";
  wb.created = new Date();
  const used = new Set(["sipariş"]);
  const head = { type: "pattern", pattern: "solid", fgColor: { argb: "FF14212B" } };
  const lowFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFDE3D8" } };

  state.prods.forEach(p => {
    const ws = wb.addWorksheet(sheetName(p.name, used), { views: [{ state: "frozen", xSplit: 1, ySplit: 4 }] });
    ws.getCell("A1").value = "Cam çeşidi";
    ws.getCell("B1").value = p.name;
    ws.getCell("A1").font = { bold: true };
    ws.getCell("B1").font = { bold: true, size: 13 };
    ws.getCell("A2").value = "Satır: SPH  •  Sütun: CYL  •  Boş hücre = stok kaydı yok. Bu tabloyu düzenleyip CamStok'ta \"Excel'den yükle\" ile geri yükleyebilirsiniz.";
    ws.getCell("A2").font = { italic: true, color: { argb: "FF66767F" } };

    let maxS = 24, minS = -20; // ekrandaki tabloyla aynı: +6.00 … −5.00
    Object.keys(p.stock).forEach(k => {
      const i = Math.round(parseFloat(k.split("|")[0]) * 4);
      if (i > maxS) maxS = i; if (i < minS) minS = i;
    });
    const hr = ws.getRow(4);
    hr.getCell(1).value = "SPH \\ CYL";
    CYLS.forEach((c, j) => { hr.getCell(j + 2).value = L.fmt(c); });
    hr.eachCell(c => { c.fill = head; c.font = { bold: true, color: { argb: "FFFFFFFF" } }; c.alignment = { horizontal: "center" }; });

    let r = 5;
    for (let i = maxS; i >= minS; i--) {
      const s = i * 0.25, row = ws.getRow(r++);
      row.getCell(1).value = L.fmt(s);
      row.getCell(1).fill = head;
      row.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      row.getCell(1).alignment = { horizontal: "center" };
      CYLS.forEach((c, j) => {
        const n = p.stock[L.key(s, c)];
        if (typeof n === "number") {
          const cell = row.getCell(j + 2);
          cell.value = n;
          cell.alignment = { horizontal: "center" };
          if (n < p.thr) cell.fill = lowFill;
        }
      });
    }
    ws.getColumn(1).width = 11;
    for (let j = 2; j <= 22; j++) ws.getColumn(j).width = 7;
  });

  const os = wb.addWorksheet("Sipariş");
  os.columns = [{ width: 16 }, { width: 10 }, { width: 10 }, { width: 10 }];
  state.prods.forEach(p => {
    const o = L.orders(p);
    const t = os.addRow([p.name + "  •  " + o.length + " çeşit, " + o.reduce((a, x) => a + x.q, 0) + " adet"]);
    t.font = { bold: true, size: 13 };
    const h = os.addRow(["SPH", "CYL", "ADET"]);
    h.eachCell(c => { c.fill = head; c.font = { bold: true, color: { argb: "FFFFFFFF" } }; });
    o.forEach(x => os.addRow([L.fmt(x.s), x.c === 0 ? "" : L.fmt(x.c), x.q]));
    os.addRow([]);
  });

  await wb.xlsx.writeFile(file);
}

function val(cell) {
  let v = cell && cell.value;
  if (v && typeof v === "object") {
    if ("result" in v) v = v.result;
    else if (Array.isArray(v.richText)) v = v.richText.map(t => t.text).join("");
    else if ("text" in v) v = v.text;
  }
  return v;
}
function num(v) {
  if (typeof v === "number") return v;
  if (typeof v !== "string") return NaN;
  const t = v.trim().replace(/[−–]/g, "-").replace(",", ".").replace(/\s/g, "");
  if (!/^[+-]?\d+(\.\d+)?$/.test(t)) return NaN;
  return parseFloat(t);
}
const q4 = x => Math.round(x * 4) / 4;

// Dönen değer: [{ name, stock, cells }]. Aynı ada sahip sayfalar (ör. "SPH+" ve "SPH−") birleştirilir.
async function importXlsx(file) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  const out = [], byName = {};
  wb.eachSheet(ws => {
    let hdr = 0;
    for (let r = 1; r <= Math.min(12, ws.rowCount); r++) {
      const a = String(val(ws.getRow(r).getCell(1)) || "");
      if (!/SPH/i.test(a)) continue;
      let k = 0;
      for (let c = 2; c <= 6; c++) if (!isNaN(num(val(ws.getRow(r).getCell(c))))) k++;
      if (k >= 2) { hdr = r; break; }
    }
    if (!hdr) return; // stok tablosu olmayan sayfa (ör. Sipariş)

    let name = "";
    if (/^cam çeşidi$/i.test(String(val(ws.getCell("A1")) || "").trim())) name = String(val(ws.getCell("B1")) || "").trim();
    if (!name) name = ws.name.replace(/\s*SPH\s*[+\-−].*$/i, "").trim() || ws.name;

    const hrow = ws.getRow(hdr), cyl = {};
    hrow.eachCell((cell, c) => {
      if (c < 2) return;
      const v = num(val(cell));
      if (!isNaN(v)) cyl[c] = -Math.abs(q4(v));
    });
    let e = byName[name.toLowerCase()];
    if (!e) { e = byName[name.toLowerCase()] = { name, stock: {}, cells: 0 }; out.push(e); }
    for (let r = hdr + 1; r <= ws.rowCount; r++) {
      const row = ws.getRow(r), s = num(val(row.getCell(1)));
      if (isNaN(s)) continue;
      Object.keys(cyl).forEach(c => {
        const v = val(row.getCell(+c));
        if (v === null || v === undefined || v === "") return;
        const n = num(typeof v === "number" ? v : String(v));
        if (isNaN(n)) return;
        e.stock[L.key(q4(s), cyl[c])] = Math.max(0, Math.round(n));
        e.cells++;
      });
    }
  });
  return out;
}

module.exports = { exportXlsx, importXlsx };
