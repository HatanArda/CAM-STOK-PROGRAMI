(function(){
var KEY="camstok_ozel_v1", state, tab="stok", sign=1, cur=null, sale=false, last=null;
var $=function(i){return document.getElementById(i)};
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function fmt(v){return v===0?"0.00":(v>0?"+":"-")+Math.abs(v).toFixed(2)}
function SEED(){return {cur:0,hist:[],prods:[{name:"1.56 HMC",thr:4,tgt:6,maxs:4,stock:{},transit:{},cost:0,kdv:0,excl:{}},{name:"U.C. 1.49",thr:4,tgt:6,maxs:5,stock:{},transit:{},cost:0,kdv:0,excl:{}}]}}
function normalize(st){if(!st||typeof st!=="object"||!Array.isArray(st.prods)||!st.prods.length)return null;if(!Array.isArray(st.hist))st.hist=[];
  st.prods.forEach(function(p){if(!p.stock||typeof p.stock!=="object")p.stock={};if(!p.transit||typeof p.transit!=="object")p.transit={};if(!p.excl||typeof p.excl!=="object")p.excl={};
  if(typeof p.thr!=="number")p.thr=4;if(typeof p.tgt!=="number")p.tgt=6;if(typeof p.maxs!=="number")p.maxs=0;if(typeof p.cost!=="number")p.cost=0;if(typeof p.kdv!=="number")p.kdv=0;if(!p.name)p.name="Cam"});
  if(typeof st.cur!=="number"||st.cur<0||st.cur>=st.prods.length)st.cur=0;return st}

/* ---------- Kayıt: bu iPad'de (tarayıcı deposu) + iPad'de günlük yedek ---------- */
var BKEY="camstok_yedekler_v1", LKEY="camstok_son_dosya_yedegi", KEEP=30, firstRun=false, backups=[], lastSaved=null;
function lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(k,v);return true}catch(e){return false}}
function load(){var s=null;try{s=normalize(JSON.parse(lsGet(KEY)))}catch(e){s=null}
  firstRun=!s;state=s||SEED();if(!s)save();
  try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}
  dailyBackup()}
function save(){if(lsSet(KEY,JSON.stringify(state))){lastSaved=Date.now();status()}else{status("KAYDEDİLEMEDİ",true);toast("Kaydedilemedi: cihazda yer kalmamış olabilir. Hemen yedeği Dosyalar'a kaydedin.")}}
function today(d){d=d||new Date();function p(n){return String(n).padStart(2,"0")}return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate())}
function stamp(){var d=new Date();function p(n){return String(n).padStart(2,"0")}return today(d)+"_"+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds())}
function status(t,err){var s=$("st");if(!s)return;s.className=err?"err":"";
  s.textContent=t||(lastSaved?"Bu cihazda kayıtlı "+new Date(lastSaved).toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"}):"Bu cihazda kayıtlı")}
function bkAll(){try{return JSON.parse(lsGet(BKEY))||{}}catch(e){return {}}}
function bkPut(id,st){var all=bkAll();all[id]=JSON.stringify(st);var ids=Object.keys(all).sort().reverse();ids.slice(KEEP).forEach(function(k){delete all[k]});
  while(!lsSet(BKEY,JSON.stringify(all))&&Object.keys(all).length>1){delete all[Object.keys(all).sort()[0]]}
  backups=Object.keys(all).sort().reverse()}
function dailyBackup(){var all=bkAll(),t=today();backups=Object.keys(all).sort().reverse();if(!firstRun&&!all[t])bkPut(t,state)}
function backupDoc(id,st){bkPut(id,st);return Promise.resolve()}
function daysSinceFile(){var t=+lsGet(LKEY);return t?Math.floor((Date.now()-t)/864e5):null}
function reminder(){var d=daysSinceFile(),empty=!state.prods.some(function(p){return Object.keys(p.stock).length});
  if(empty)return '<div class="notice"><b>Hoş geldiniz!</b>Stoğunuzu buraya almak için: claude.ai’deki CamStok’ta <b>Ayarlar → Yedeği Dosyalar’a kaydet</b> deyin. Sonra burada <b>Ayarlar → Dosyadan geri yükle</b> ile o dosyayı seçin.</div>';
  if(d===null||d>=7)return '<div class="notice"><b>Yedek zamanı</b>'+(d===null?'Henüz Dosyalar’a hiç yedek almadınız.':'Son yedeğiniz '+d+' gün önce.')+' Veriler yalnızca bu cihazda duruyor.<div class="row"><button class="btn sm" id="bkfile">Yedeği Dosyalar’a kaydet</button></div></div>';
  return ""}

function mk(name,demo){var p={name:name,thr:4,tgt:6,maxs:0,stock:{},transit:{},cost:0,kdv:0,excl:{}};if(demo)seed(p);return p}
function seed(p){var r=7;function rnd(){r=(r*9301+49297)%233280;return r/233280}
  p.stock={};
  [1,-1].forEach(function(sg){for(var i=0;i<=16;i++){for(var j=0;j<=Math.min(i+1,8);j++){
    if(sg===1&&i===0&&j>0)continue;var s=sg*i*.25,c=-j*.25,x=rnd();
    p.stock[fmt(s)+"|"+fmt(c)]=x<.1?1+Math.floor(rnd()*3):4+Math.floor(rnd()*3)}}})}
function P(){if(!state.hist)state.hist=[];var p=state.prods[state.cur];if(!p.transit)p.transit={};if(p.cost===undefined){p.cost=0;p.kdv=0}return p}
function key(s,c){return fmt(s)+"|"+fmt(c)}
function orders(p){var out=[];Object.keys(p.stock).forEach(function(k){var n=p.stock[k];
  var a=k.split("|"),s=parseFloat(a[0]),c=parseFloat(a[1]),e=n+((p.transit||{})[k]||0);
  if(typeof n!=="number"||e>=p.thr||(p.excl&&p.excl[k]))return;
  if(p.maxs>0&&Math.abs(s)>p.maxs+1e-9)return;
  out.push({s:s,c:c,k:k,q:Math.max(0,p.tgt-e)})});
  out.sort(function(a,b){return a.s-b.s||b.c-a.c});return out}
function chips(){var h="";state.prods.forEach(function(p,i){h+='<button class="chip'+(i===state.cur?' on':'')+'" data-p="'+i+'">'+esc(p.name)+'</button>'});$("chips").innerHTML=h}
function render(){chips();var m=$("main"),w0=document.querySelector(".wrap"),sc=w0&&tab==="stok"?[w0.scrollTop,w0.scrollLeft]:null;
  if(tab==="stok")m.innerHTML=reminder()+viewStok();else if(tab==="siparis")m.innerHTML=reminder()+viewOrder();else if(tab==="gecmis")m.innerHTML=viewHist();else m.innerHTML=viewSet();var w1=document.querySelector(".wrap");if(sc&&w1){w1.scrollTop=sc[0];w1.scrollLeft=sc[1]}
  document.querySelectorAll("nav button").forEach(function(b){b.className=b.dataset.t===tab?"on":""})}
function viewStok(){var p=P(),h='<div class="bar"><div class="seg"><button data-sg="1" class="'+(sign===1?'on':'')+'">SPH +</button><button data-sg="-1" class="'+(sign===-1?'on':'')+'">SPH −</button></div><button class="btn sm'+(sale?'':' alt')+'" id="sale">Satış modu: '+(sale?'açık':'kapalı')+'</button>'+(sale?'<button class="btn sm alt" id="undo">Geri al</button>':'')+'</div>'+(sale?'<div class="mode">Satış modu açık: dokunduğunuz hücrenin stoğu 1 azalır.</div>':'')+'<div class="find"><input type="number" id="fs" step="0.25" placeholder="SPH"><input type="number" id="fc" step="0.25" placeholder="CYL"><span id="res" class="hint">Reçeteyi yazın, stoğa bakın.</span></div><div class="wrap"><table><thead><tr><th>SPH \\ CYL</th>';
  for(var j=0;j<=20;j++)h+="<th>"+fmt(-j*.25)+"</th>";h+="</tr></thead><tbody>";
  var rows=sign===1?24:20;Object.keys(p.stock).forEach(function(k){var i=Math.round(parseFloat(k)*4)*sign;if(i>rows)rows=i});
  for(var i=0;i<=rows;i++){var s=sign*i*.25;h+="<tr><th>"+fmt(s)+"</th>";
    for(var j2=0;j2<=20;j2++){var c=-j2*.25,k=key(s,c),n=p.stock[k],cl="",t="";
      if(typeof n==="number"){t=n;cl=n<p.thr?"low":"ok"}if(p.excl&&p.excl[k])cl+=" ex";
      var yy=(p.transit||{})[k]||0;h+='<td class="'+cl+(yy?' tr':'')+'" data-k="'+k+'">'+t+(yy?'<i class="yl" title="yolda">+'+yy+'</i>':'')+"</td>"}
    h+="</tr>"}
  return h+"</tbody></table></div>"}
function viewOrder(){var p=P(),o=orders(p),tot=0;o.forEach(function(x){tot+=x.q});
  var h='<div class="card"><div class="sum"><div><b>'+o.length+'</b><span>çeşit</span></div><div><b>'+tot+'</b><span>adet</span></div></div><div class="hint">Stoğu '+p.thr+' altındaki camlar '+p.tgt+' adete tamamlanır'+(p.maxs>0?', SPH ±'+p.maxs.toFixed(2)+' ile sınırlı':'')+'.</div></div>';
  h+=transitCard(p)+costCard(p,tot);if(!o.length)return h+'<div class="empty">Sipariş edilecek cam yok. Stoklar yeterli.</div>';
  h+='<div class="card" style="padding:0;overflow:hidden"><table class="list" style="width:100%"><thead><tr><th>SPH</th><th>CYL</th><th>ADET</th></tr></thead><tbody>';
  o.forEach(function(x){h+="<tr><td>"+fmt(x.s)+"</td><td>"+(x.c===0?"":fmt(x.c))+'</td><td class="q">'+x.q+"</td></tr>"});
  h+='</tbody></table></div><div class="row"><button class="btn" id="sent">Sipariş verdim</button><button class="btn alt" id="copy">Listeyi kopyala</button><a class="btn alt" id="wa" target="_blank" rel="noopener" href="https://wa.me/?text='+encodeURIComponent(text())+'">WhatsApp’ta gönder</a><button class="btn alt" id="pdf">PDF olarak kaydet</button></div>';
  return h}
function tl(n){return n.toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2})+" ₺"}
function calc(q,cost,kdv){var net=q*cost;return {net:net,tax:net*kdv/100,tot:net*(1+kdv/100)}}
function invHtml(c,p){if(!p.cost)return '<div class="hint">Fiyat girerseniz fatura tutarı burada hesaplanır.</div>';return '<div class="hint">Ara toplam: '+tl(c.net)+'<br>KDV: '+tl(c.tax)+'</div><div class="sum" style="margin:8px 0 0"><div><b>'+tl(c.tot)+'</b><span>fatura tutarı</span></div></div>'}
function costCard(p,tot){if(!tot)return"";return '<div class="card"><b>Tahmini fatura</b><label>Cam başına alış fiyatı (₺)<input type="number" id="cost" min="0" step="0.01" inputmode="decimal" value="'+(p.cost||"")+'" placeholder="isteğe bağlı"></label><label>KDV (%)<input type="number" id="kdv" min="0" step="1" inputmode="decimal" value="'+(p.kdv||"")+'" placeholder="0"></label><div id="inv" style="padding-top:8px">'+invHtml(calc(tot,p.cost||0,p.kdv||0),p)+'</div></div>'}
function viewHist(){var H=state.hist||[];if(!H.length)return '<div class="empty">Henüz kayıtlı sipariş yok. Sipariş sekmesinde “Sipariş verdim” dediğinizde burada saklanır.</div>';var tq=0,tt=0;H.forEach(function(h){tq+=h.qty;tt+=h.tot||0});var s='<div class="card"><div class="sum"><div><b>'+H.length+'</b><span>sipariş</span></div><div><b>'+tq+'</b><span>adet</span></div>'+(tt?'<div><b>'+tl(tt)+'</b><span>toplam tutar</span></div>':'')+'</div></div>';H.forEach(function(h){var dt=new Date(h.d).toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric"});s+='<details class="card"><summary><b>'+dt+'</b> '+esc(h.prod)+'<br><span class="hint">'+h.items.length+' çeşit, '+h.qty+' adet'+(h.tot?', '+tl(h.tot):'')+' ('+h.st+')</span></summary><table class="list" style="margin-top:10px"><thead><tr><th>SPH</th><th>CYL</th><th>ADET</th></tr></thead><tbody>';h.items.forEach(function(x){s+='<tr><td>'+fmt(x.s)+'</td><td>'+(x.c===0?"":fmt(x.c))+'</td><td class="q">'+x.q+'</td></tr>'});s+='</tbody></table>'+(h.cost?'<div class="hint" style="margin-top:8px">Cam başına '+tl(h.cost)+(h.kdv?', KDV %'+h.kdv:'')+'</div>':'')+'<div class="row"><button class="btn alt sm" data-ch="'+h.id+'">Listeyi kopyala</button><button class="btn alt sm" data-ph="'+h.id+'">PDF</button><button class="btn alt sm" data-dh="'+h.id+'">Sil</button></div></details>'});return s}
function transitCard(p){var t=0,n=0;Object.keys(p.transit||{}).forEach(function(k){if(p.transit[k]>0){t+=p.transit[k];n++}});if(!n)return"";return '<div class="card"><b>Yolda: '+t+' adet ('+n+' çeşit)</b><div class="hint">Sipariş verilen camlar, cam gelene kadar listeden düşer. Tabloda yoldaki camların köşesinde +adet yazar.</div><div class="row"><button class="btn" id="arrived">Hepsi geldi</button><button class="btn alt" id="partial">Kısmen geldi</button><button class="btn alt" id="cleartr">Yolu sıfırla</button></div></div>'}
function backupCard(){return '<div class="card"><b>Kopyala / yapıştır (Excel, Numbers)</b><div class="hint">Stok tablosunu Excel’e ya da Numbers’a yapıştırabilir, oradan kopyalayıp geri yükleyebilirsiniz.</div><div class="row"><button class="btn alt" id="exp">Tabloyu kopyala</button></div><textarea id="imp" placeholder="Excel’den kopyaladığınız tabloyu buraya yapıştırın"></textarea><div class="row"><button class="btn" id="impgo">Tabloyu yükle</button></div></div>'}
function dataCard(){var d=daysSinceFile();var h='<div class="card"><b>Veri ve yedek</b><div class="hint">Veriler bu cihazda saklanır ve her değişiklikte otomatik kaydedilir. Her gün ilk açılışta otomatik yedek alınır (son 30 gün). Cihaz kaybolursa ya da bozulursa diye <b>haftada bir “Yedeği Dosyalar’a kaydet”</b> deyin (iPad’de iCloud Drive’ı seçin; bilgisayarda dosya İndirilenler klasörüne iner, onu USB belleğe ya da OneDrive’a kopyalayın).'+(d!==null?' Son dosya yedeği: '+(d===0?'bugün':d+' gün önce')+'.':'')+'</div>'+
  '<div class="row"><button class="btn" id="bkfile">Yedeği Dosyalar’a kaydet</button><button class="btn alt" id="rsfile">Dosyadan geri yükle</button></div>'+
  '<div class="row"><button class="btn alt" id="xout">Excel’e aktar (.xlsx)</button><button class="btn alt" id="xin">Excel’den yükle</button></div>';
  h+='<details style="margin-top:12px"><summary class="hint"><b>Otomatik yedekler ('+backups.length+')</b> · göster</summary>';
  if(!backups.length)h+='<div class="hint">Henüz yedek yok. Yarın ilk açılışta alınır.</div>';
  backups.forEach(function(id){var a=id.split("_"),dt=new Date(a[0]+"T12:00:00");h+='<label>'+dt.toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric"})+(a[1]?' '+a[1].slice(0,2)+':'+a[1].slice(2,4)+(a[2]==="once"?' (değişiklik öncesi)':''):'')+'<button class="btn alt sm" data-rb="'+esc(id)+'">Geri yükle</button></label>'});
  h+='</details>';
  return h+'<input type="file" id="fjson" accept=".json,application/json" hidden><input type="file" id="fxlsx" accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden></div>'}
function cp(tx,msg){try{navigator.clipboard.writeText(tx).then(function(){toast(msg)},function(){fb2(tx,msg)})}catch(er){fb2(tx,msg)}}
function fb2(tx,msg){var a=document.createElement("textarea");a.value=tx;document.body.appendChild(a);a.select();try{document.execCommand("copy");toast(msg)}catch(e){toast("Kopyalanamadı")}document.body.removeChild(a)}
function text(){var p=P(),t="SİPARİŞ EDİLECEK CAMLAR\n"+p.name+"\n\nSPH / CYL / ADET\n";
  orders(p).forEach(function(x){t+=fmt(x.s)+" / "+(x.c===0?"-":fmt(x.c))+" / "+x.q+"\n"});return t}
function viewSet(){var p=P();
  return '<div class="card"><b>'+esc(p.name)+' kuralları</b>'+
  '<label>Stok bunun altındaysa sipariş ver<input type="number" id="thr" min="0" value="'+p.thr+'"></label>'+
  '<label>Kaç adete tamamlansın<input type="number" id="tgt" min="1" value="'+p.tgt+'"></label>'+
  '<label>Sipariş için en yüksek SPH (±), 0 = sınır yok<input type="number" id="maxs" min="0" step="0.25" value="'+p.maxs+'"></label>'+
  '<div class="row"><button class="btn alt" id="demo">Örnek veri yükle</button><button class="btn alt" id="clear">Stoğu temizle</button></div></div>'+
  '<div class="card"><b>Yeni cam çeşidi</b><label>Ad<input type="text" id="np" placeholder="örn. 1.60 Mavi Işık"></label><div class="row"><button class="btn" id="addp">Ekle</button>'+(state.prods.length>1?'<button class="btn alt" id="delp">Bu çeşidi sil</button>':'')+'</div></div>'+dataCard()+backupCard()}
var toastT=null;
function toast(t){var e=$("toast");e.textContent=t;e.style.display="block";clearTimeout(toastT);toastT=setTimeout(function(){e.style.display="none"},t.length>40?3200:1600)}
function openCell(k){cur=k;var a=k.split("|"),n=P().stock[k];
  $("panel").innerHTML='<h2>'+a[0]+' / '+a[1]+'</h2><div class="hint">'+esc(P().name)+'</div><div class="step"><button id="dn" aria-label="Azalt">−</button><input type="number" id="val" min="0" value="'+(typeof n==="number"?n:"")+'" placeholder="0"><button id="up" aria-label="Artır">+</button></div><div class="row"><button class="btn" id="ok">Kaydet</button><button class="btn alt" id="del">Boşalt</button><button class="btn alt" id="exc">'+(P().excl&&P().excl[k]?"Siparişe dahil et":"Siparişe girmesin")+'</button><button class="btn alt" id="cx">Kapat</button></div>';
  $("sheet").className="sheet show"}
function setCell(v){var p=P();if(v===null)delete p.stock[cur];else p.stock[cur]=v;save();$("sheet").className="sheet";render()}
function sheetClose(){$("sheet").className="sheet";pending=null}

/* ---------- Sayfa içi onay penceresi (tarayıcı onay kutuları bu sayfada çalışmaz) ---------- */
var pending=null;
function ask(title,detail,okLabel,fn){pending=fn;
  $("panel").innerHTML='<h2>'+esc(title)+'</h2><div class="hint" style="white-space:pre-line;margin:6px 0 4px">'+esc(detail)+'</div><div class="row"><button class="btn" id="askok">'+esc(okLabel)+'</button><button class="btn alt" id="cx">Vazgeç</button></div>';
  $("sheet").className="sheet show"}
function replaceState(st,msg){var before=JSON.parse(JSON.stringify(state));state=st;sale=false;last=null;
  bkPut(stamp()+"_once",before);firstRun=false;save();render();toast(msg)}

/* ---------- Dosyaya kaydetme: iPad'de paylaşım penceresi ("Dosyalar'a Kaydet") ---------- */
var MIME={json:"application/json",xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",pdf:"application/pdf"};
function saveFile(name,data,okMsg,onOk){var ext=name.split(".").pop(),blob=data instanceof Blob?new Blob([data],{type:MIME[ext]}):new Blob([data],{type:MIME[ext]}),file=null;
  try{file=new File([blob],name,{type:MIME[ext]})}catch(e){}
  function link(){var u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(u);a.remove()},4000);toast(okMsg||"Kaydedildi");if(onOk)onOk()}
  var ua=navigator.userAgent,mobil=/iPad|iPhone|iPod|Android/.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1);
  try{if(mobil&&file&&navigator.canShare&&navigator.canShare({files:[file]})){navigator.share({files:[file]}).then(function(){toast(okMsg||"Kaydedildi");if(onOk)onOk()},function(e){if(e&&e.name==="AbortError")return;link()});return}}catch(e){}
  link()}
function XL(){return window.XLSX?Promise.resolve(window.XLSX):Promise.reject()}
function JP(){return window.jspdf?Promise.resolve(window.jspdf):Promise.reject()}

/* ---------- Excel ---------- */
function sheetName(n,used){var b=String(n).replace(/[\[\]:*?\/\\]/g,"-").slice(0,28).trim()||"Cam",x=b,i=2;while(used[x.toLowerCase()])x=b.slice(0,25)+" "+(i++);used[x.toLowerCase()]=1;return x}
function exportXlsx(){if(!window.XLSX){toast("Excel aracı yüklenemedi");return}(function(X){var wb=X.utils.book_new(),used={"sipariş":1};
  state.prods.forEach(function(p){var mx=24,mn=-20;Object.keys(p.stock).forEach(function(k){var i=Math.round(parseFloat(k.split("|")[0])*4);if(i>mx)mx=i;if(i<mn)mn=i});
    var rows=[["Cam çeşidi",p.name],["Satır: SPH • Sütun: CYL • Boş hücre = stok kaydı yok. Düzenleyip CamStok’ta “Excel’den yükle” ile geri yükleyebilirsiniz."],[],["SPH \\ CYL"]];
    for(var j=0;j<=20;j++)rows[3].push(fmt(-j*.25));
    for(var i=mx;i>=mn;i--){var r=[fmt(i*.25)];for(var j2=0;j2<=20;j2++){var v=p.stock[key(i*.25,-j2*.25)];r.push(typeof v==="number"?v:null)}rows.push(r)}
    var ws=X.utils.aoa_to_sheet(rows);ws["!cols"]=[{wch:11}].concat(Array(21).fill({wch:7}));X.utils.book_append_sheet(wb,ws,sheetName(p.name,used))});
  var o=[];state.prods.forEach(function(p){var od=orders(p),t=0;od.forEach(function(x){t+=x.q});o.push([p.name+" • "+od.length+" çeşit, "+t+" adet"]);o.push(["SPH","CYL","ADET"]);od.forEach(function(x){o.push([fmt(x.s),x.c===0?"":fmt(x.c),x.q])});o.push([])});
  X.utils.book_append_sheet(wb,X.utils.aoa_to_sheet(o),"Sipariş");
  var buf=X.write(wb,{bookType:"xlsx",type:"array"});
  saveFile("CamStok-stok-"+today()+".xlsx",new Blob([buf]),"Excel dosyası kaydedildi")})(window.XLSX)}
function num(v){if(typeof v==="number")return v;if(typeof v!=="string")return NaN;var t=v.trim().replace(/[−–]/g,"-").replace(",",".").replace(/\s/g,"");return /^[+-]?\d+(\.\d+)?$/.test(t)?parseFloat(t):NaN}
function q4(x){return Math.round(x*4)/4}
function parseXlsx(buf){return XL().then(function(X){var wb=X.read(buf,{type:"array"}),out=[],by={};
  wb.SheetNames.forEach(function(sn){var A=X.utils.sheet_to_json(wb.Sheets[sn],{header:1,raw:true,defval:null}),hdr=-1;
    for(var r=0;r<Math.min(12,A.length);r++){var row=A[r]||[];if(!/SPH/i.test(String(row[0]||"")))continue;var k=0;for(var c=1;c<=5;c++)if(!isNaN(num(row[c])))k++;if(k>=2){hdr=r;break}}
    if(hdr<0)return;
    var name="";if(/^cam çeşidi$/i.test(String((A[0]||[])[0]||"").trim()))name=String(A[0][1]||"").trim();
    if(!name)name=sn.replace(/\s*SPH\s*[+\-−].*$/i,"").trim()||sn;
    var cyl={};(A[hdr]||[]).forEach(function(v,c){if(c<1)return;var n=num(v);if(!isNaN(n))cyl[c]=-Math.abs(q4(n))});
    var e=by[name.toLowerCase()];if(!e){e=by[name.toLowerCase()]={name:name,stock:{},cells:0};out.push(e)}
    for(var r2=hdr+1;r2<A.length;r2++){var rw=A[r2]||[],s=num(rw[0]);if(isNaN(s))continue;
      Object.keys(cyl).forEach(function(c){var v=rw[+c];if(v===null||v===undefined||v==="")return;var n=num(typeof v==="number"?v:String(v));if(isNaN(n))return;e.stock[key(q4(s),cyl[c])]=Math.max(0,Math.round(n));e.cells++})}});
  return out.filter(function(x){return x.cells>0})})}

/* ---------- PDF (ekranda çizilip PDF'e konur; Türkçe harfler bozulmaz) ---------- */
function pdfFor(name,items,extra){if(!window.jspdf){toast("PDF aracı yüklenemedi");return}(function(J){var W=1240,H=1754,M=90,RH=46,doc=new J.jsPDF({unit:"mm",format:"a4"}),tot=0;items.forEach(function(x){tot+=x.q});
  var font='"Avenir Next","Segoe UI",system-ui,sans-serif',per=Math.floor((H-2*M-260)/RH),pages=Math.max(1,Math.ceil(items.length/per));
  for(var pg=0;pg<pages;pg++){var cv=document.createElement("canvas");cv.width=W;cv.height=H;var g=cv.getContext("2d");g.fillStyle="#fff";g.fillRect(0,0,W,H);
    var y=M;g.fillStyle="#14212b";g.font="700 44px "+font;g.fillText("SİPARİŞ EDİLECEK CAMLAR",M,y+40);y+=74;
    g.fillStyle="#66767f";g.font="26px "+font;g.fillText(name+"  •  "+new Date().toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric"})+"  •  "+items.length+" çeşit, "+tot+" adet"+(pages>1?"  •  Sayfa "+(pg+1)+"/"+pages:""),M,y+26);y+=70;
    var cols=[M,M+(W-2*M)/3,M+2*(W-2*M)/3],cw=(W-2*M)/3;
    g.fillStyle="#14212b";g.fillRect(M,y,W-2*M,RH);g.fillStyle="#fff";g.font="600 26px "+font;g.textAlign="center";
    ["SPH","CYL","ADET"].forEach(function(t,i){g.fillText(t,cols[i]+cw/2,y+31)});y+=RH;
    items.slice(pg*per,(pg+1)*per).forEach(function(x){g.fillStyle="#14212b";g.font="28px "+font;g.fillText(fmt(x.s),cols[0]+cw/2,y+32);g.fillText(x.c===0?"":fmt(x.c),cols[1]+cw/2,y+32);g.font="700 28px "+font;g.fillText(String(x.q),cols[2]+cw/2,y+32);
      g.fillStyle="#d5dde2";g.fillRect(M,y+RH-2,W-2*M,2);y+=RH});
    g.textAlign="left";if(extra&&pg===pages-1){g.fillStyle="#14212b";g.font="700 26px "+font;g.fillText(extra,M,y+50)}
    if(pg)doc.addPage();doc.addImage(cv.toDataURL("image/jpeg",0.92),"JPEG",0,0,210,297)}
  saveFile(("Siparis "+name+" "+today()).replace(/[\\\/:*?"<>|]/g,"-")+".pdf",new Blob([doc.output("arraybuffer")]),"PDF kaydedildi")})(window.jspdf)}


/* ---------- Yoldaki camlar: hücre bazında geldi / kısmen geldi ---------- */
function syncHist(p){var left=Object.keys(p.transit||{}).some(function(k){return p.transit[k]>0});state.hist.forEach(function(h){if(h.prod===p.name&&(h.st==="yolda"||h.st==="kısmen geldi"))h.st=left?"kısmen geldi":"geldi"})}
function arriveCell(p,k,q){var y=(p.transit||{})[k]||0;q=Math.max(0,Math.min(q,y));if(!q)return 0;p.stock[k]=(p.stock[k]||0)+q;if(y-q>0)p.transit[k]=y-q;else delete p.transit[k];return q}
function transitKeys(p){return Object.keys(p.transit||{}).filter(function(k){return p.transit[k]>0}).sort(function(a,b){var x=a.split("|"),y=b.split("|");return parseFloat(x[0])-parseFloat(y[0])||parseFloat(y[1])-parseFloat(x[1])})}
function openPartial(){var p=P(),ks=transitKeys(p),h='<h2>Kısmen geldi</h2><div class="hint">Gelen adetleri yazın. Gelmeyenleri 0 yapın; onlar yolda kalır.</div>';
  ks.forEach(function(k,i){var a=k.split("|");h+='<div class="pl"><span><b>'+a[0]+' / '+a[1]+'</b><br><span class="hint">yolda '+p.transit[k]+'</span></span><input type="number" min="0" max="'+p.transit[k]+'" value="'+p.transit[k]+'" data-pk="'+k+'" aria-label="'+a[0]+' / '+a[1]+' gelen adet"></div>'});
  h+='<div class="row"><button class="btn" id="pago">Gelenleri stoğa ekle</button><button class="btn alt" id="cx">Vazgeç</button></div>';$("panel").innerHTML=h;$("sheet").className="sheet show"}
var openCellBase=openCell;
openCell=function(k){openCellBase(k);var y=(P().transit||{})[k]||0;if(!y)return;var d=document.createElement("div");d.className="notice";
  d.innerHTML='<b>Yolda: '+y+' adet</b>Bu camdan sipariş verildi, henüz gelmedi. Sipariş listesinde stok + yoldaki birlikte sayılır.<div class="row"><button class="btn sm" id="cgeldi">Bu cam geldi</button><button class="btn alt sm" id="cyol">Yoldan çıkar</button></div>';
  var st=$("panel").querySelector(".step");$("panel").insertBefore(d,st)};
document.addEventListener("click",function(e){var t=e.target.closest("button");if(!t)return;var id=t.id,p;
  if(id==="cgeldi"){p=P();var q=arriveCell(p,cur,p.transit[cur]);syncHist(p);save();$("sheet").className="sheet";render();toast(cur.replace("|"," / ")+": "+q+" adet stoğa eklendi");return}
  if(id==="cyol"){p=P();delete p.transit[cur];syncHist(p);save();$("sheet").className="sheet";render();toast("Yoldan çıkarıldı");return}
  if(id==="partial"){openPartial();return}
  if(id==="pago"){p=P();var n=0;document.querySelectorAll("[data-pk]").forEach(function(inp){n+=arriveCell(p,inp.dataset.pk,parseInt(inp.value,10)||0)});syncHist(p);save();$("sheet").className="sheet";render();toast(n+" adet stoğa eklendi"+(transitKeys(p).length?"; kalanlar yolda":""));return}
});
document.addEventListener("click",function(e){var t=e.target.closest("button,td,a,summary,.sheet")||e.target,d=t.dataset||{};
  if(t.closest&&t.closest("nav")&&d.t){tab=d.t;render();return}
  if(d.p!==undefined){state.cur=+d.p;save();render();return}
  if(d.sg){sign=+d.sg;render();return}
  if(t.tagName==="TD"&&d.k&&tab==="stok"){if(sale){var p3=P(),n3=p3.stock[d.k];if(typeof n3==="number"&&n3>0){p3.stock[d.k]=n3-1;last=d.k;t.innerHTML=(n3-1)+((p3.transit||{})[d.k]?'<i class="yl" title="yolda">+'+p3.transit[d.k]+'</i>':'');t.className=(n3-1<p3.thr?"low":"ok")+(p3.excl&&p3.excl[d.k]?" ex":"")+((p3.transit||{})[d.k]?" tr":"");save();toast(d.k.replace("|"," / ")+": "+(n3-1)+" kaldı")}else toast("Bu camda stok yok")}else openCell(d.k);return}
  var id=t.id;
  if(id==="askok"){var f=pending;sheetClose();if(f)f();return}
  if(id==="exc"){var pe=P();if(!pe.excl)pe.excl={};if(pe.excl[cur])delete pe.excl[cur];else pe.excl[cur]=1;save();$("sheet").className="sheet";render();return}
  if((id==="sheet"&&e.target===t)||id==="cx"){sheetClose();return}
  if(id==="dn"||id==="up"){var v=$("val"),n=parseInt(v.value||"0",10)||0;n=Math.max(0,n+(id==="up"?1:-1));v.value=n;return}
  if(id==="ok"){var x=$("val").value;setCell(x===""?null:Math.max(0,parseInt(x,10)||0));return}
  if(id==="del"){setCell(null);return}
  if(id==="copy"){cp(text(),"Liste kopyalandı");return}
  if(id==="pdf"){var pp=P(),oo=orders(pp),tq0=0;oo.forEach(function(x){tq0+=x.q});var c0=calc(tq0,pp.cost||0,pp.kdv||0);pdfFor(pp.name,oo,pp.cost?"Ara toplam: "+tl(c0.net)+"  •  KDV: "+tl(c0.tax)+"  •  Fatura tutarı: "+tl(c0.tot):"");return}
  if(d.ph){var hp=state.hist.filter(function(x){return String(x.id)===d.ph})[0];if(hp){pdfFor(hp.prod,hp.items,hp.tot?"Fatura tutarı: "+tl(hp.tot):"")}return}
  if(d.dh){if(t.dataset.arm!=="1"){t.dataset.arm="1";t.textContent="Silinsin mi?";return}state.hist=state.hist.filter(function(x){return String(x.id)!==d.dh});save();render();return}
  if(d.ch){var hh=state.hist.filter(function(x){return String(x.id)===d.ch})[0];if(hh){var NL3="\n",tx3="SİPARİŞ EDİLECEK CAMLAR"+NL3+hh.prod+NL3+NL3+"SPH / CYL / ADET"+NL3;hh.items.forEach(function(x){tx3+=fmt(x.s)+" / "+(x.c===0?"-":fmt(x.c))+" / "+x.q+NL3});cp(tx3,"Liste kopyalandı")}return}
  if(id==="sale"){sale=!sale;last=null;render();return}
  if(id==="undo"){if(last){var p4=P();p4.stock[last]=(p4.stock[last]||0)+1;var td=document.querySelector('td[data-k="'+last+'"]');if(td){td.innerHTML=p4.stock[last]+((p4.transit||{})[last]?'<i class="yl" title="yolda">+'+p4.transit[last]+'</i>':'');td.className=(p4.stock[last]<p4.thr?"low":"ok")+(p4.excl&&p4.excl[last]?" ex":"")+((p4.transit||{})[last]?" tr":"")}last=null;save();toast("Geri alındı")}else toast("Geri alınacak satış yok");return}
  if(id==="sent"){var q=P(),os=orders(q),tq=0,items=[];os.forEach(function(x){q.transit[x.k]=(q.transit[x.k]||0)+x.q;tq+=x.q;items.push({s:x.s,c:x.c,q:x.q})});if(os.length){var cc=calc(tq,q.cost||0,q.kdv||0);state.hist.unshift({id:Date.now(),d:Date.now(),prod:q.name,items:items,qty:tq,cost:q.cost||0,kdv:q.kdv||0,tot:q.cost?cc.tot:0,st:"yolda"})}save();toast("Sipariş kaydedildi, yolda");render();return}
  if(id==="arrived"){var q2=P();Object.keys(q2.transit).forEach(function(k){q2.stock[k]=(q2.stock[k]||0)+q2.transit[k]});q2.transit={};state.hist.forEach(function(h){if(h.prod===q2.name&&(h.st==="yolda"||h.st==="kısmen geldi")){h.st="geldi"}});save();toast("Stoğa eklendi");render();return}
  if(id==="cleartr"){var q5=P();q5.transit={};state.hist.forEach(function(h){if(h.prod===q5.name&&(h.st==="yolda"||h.st==="kısmen geldi")){h.st="iptal"}});save();render();return}
  if(id==="exp"){var q3=P(),TB="\t",NL="\n",hd=["SPH"],j,i,rw,lines=[];for(j=0;j<=20;j++)hd.push(fmt(-j*.25));lines.push(hd.join(TB));var hi=24,lo=-20;Object.keys(q3.stock).forEach(function(k){var x=Math.round(parseFloat(k)*4);if(x>hi)hi=x;if(x<lo)lo=x});for(i=hi;i>=lo;i--){rw=[fmt(i*.25)];for(j=0;j<=20;j++){var v2=q3.stock[key(i*.25,-j*.25)];rw.push(typeof v2==="number"?v2:"")}lines.push(rw.join(TB))}cp(lines.join(NL),"Tablo kopyalandı");return}
  if(id==="impgo"){var tx2=$("imp").value.split("\r").join(""),q4_=P(),TB2="\t",ls=tx2.split("\n"),hd2=(ls[0]||"").split(TB2),cnt=0;for(var r=1;r<ls.length;r++){var cs=ls[r].split(TB2),sv=parseFloat((cs[0]||"").replace(",","."));if(isNaN(sv))continue;sv=Math.round(sv*4)/4;for(var c=1;c<cs.length;c++){var cv=parseFloat((hd2[c]||"").replace(",",".")),nv=parseInt((cs[c]||"").trim(),10);if(isNaN(cv)||isNaN(nv))continue;q4_.stock[key(sv,-Math.abs(Math.round(cv*4)/4))]=Math.max(0,nv);cnt++}}save();toast(cnt+" hücre yüklendi");return}
  if(id==="demo"){ask("Örnek veri yüklensin mi?",P().name+" stoğu rastgele örnek veriyle değiştirilecek.","Örnek veriyi yükle",function(){seed(P());save();render();toast("Örnek veri yüklendi")});return}
  if(id==="clear"){ask("Stok temizlensin mi?",P().name+" stoğunun tamamı silinecek.","Stoğu temizle",function(){P().stock={};save();render();toast("Stok temizlendi")});return}
  if(id==="addp"){var nm=$("np").value.trim();if(nm){if(state.prods.some(function(p){return p.name.toLowerCase()===nm.toLowerCase()})){toast("Bu adla bir çeşit zaten var");return}state.prods.push(mk(nm,false));state.cur=state.prods.length-1;save();render()}return}
  if(id==="delp"){ask("Çeşit silinsin mi?","“"+P().name+"” ve tüm stoğu silinecek.","Çeşidi sil",function(){state.prods.splice(state.cur,1);state.cur=0;save();render()});return}
  // ---- Veri ve yedek ----
  if(id==="bkfile"){saveFile("CamStok-yedek-"+today()+".json",JSON.stringify(state,null,1),"Yedek kaydedildi",function(){lsSet(LKEY,String(Date.now()));render()});return}
  if(id==="rsfile"){$("fjson").value="";$("fjson").click();return}
  if(id==="xout"){exportXlsx();return}
  if(id==="xin"){$("fxlsx").value="";$("fxlsx").click();return}
  if(d.rb){var bid=d.rb;ask("Bu yedek geri yüklensin mi?","Şu anki veriler önce ayrıca yedeklenir.","Geri yükle",function(){var st=null;try{st=normalize(JSON.parse(bkAll()[bid]))}catch(er){}if(!st){toast("Yedek okunamadı");return}replaceState(st,"Yedek geri yüklendi")});return}
});
document.addEventListener("change",function(e){var id=e.target.id,p=P();
  if(id==="fjson"||id==="fxlsx"){var f=e.target.files&&e.target.files[0];if(!f)return;var rd=new FileReader();
    rd.onload=function(){
      if(id==="fjson"){var st=null;try{st=normalize(JSON.parse(rd.result))}catch(er){}if(!st){toast("Bu dosya geçerli bir CamStok yedeği değil");return}
        ask("Yedek geri yüklensin mi?",f.name+"\n"+st.prods.map(function(x){return x.name}).join(", ")+"\n\nŞu anki veriler önce ayrıca yedeklenir.","Geri yükle",function(){replaceState(st,"Yedek geri yüklendi")})}
      else{toast("Excel okunuyor…");parseXlsx(rd.result).then(function(list){if(!list.length){toast("Dosyada stok tablosu bulunamadı");return}
        var names=state.prods.map(function(x){return x.name.toLowerCase()});
        ask("Excel’deki stok yüklensin mi?",list.map(function(x){return "• "+x.name+": "+x.cells+" hücre "+(names.indexOf(x.name.toLowerCase())>=0?"(mevcut stok değiştirilecek)":"(yeni çeşit eklenecek)")}).join("\n")+"\n\nYoldaki siparişler, “Siparişe girmesin” işaretleri ve geçmiş korunur.","Yükle",function(){
          var st=JSON.parse(JSON.stringify(state));list.forEach(function(x){var q=st.prods.filter(function(y){return y.name.toLowerCase()===x.name.toLowerCase()})[0];if(q)q.stock=x.stock;else{q=mk(x.name,false);q.stock=x.stock;st.prods.push(q)}});replaceState(st,"Excel’den yüklendi")})},function(){toast("Excel dosyası okunamadı")})}};
    if(id==="fjson")rd.readAsText(f);else rd.readAsArrayBuffer(f);return}
  if(id==="thr")p.thr=Math.max(0,+e.target.value||0);
  else if(id==="tgt")p.tgt=Math.max(1,+e.target.value||1);
  else if(id==="maxs")p.maxs=Math.max(0,+e.target.value||0);
  else return;save();toast("Kaydedildi")});
document.addEventListener("input",function(e){var id=e.target.id;if(id==="cost"||id==="kdv"){var pp=P();pp[id]=Math.max(0,parseFloat(e.target.value)||0);save();var o2=orders(pp),t2=0;o2.forEach(function(x){t2+=x.q});$("inv").innerHTML=invHtml(calc(t2,pp.cost||0,pp.kdv||0),pp);return}if(id!=="fs"&&id!=="fc")return;var s=$("fs").value,r=$("res");if(s===""||isNaN(parseFloat(s))){r.textContent="Reçeteyi yazın, stoğa bakın.";return}var sv=Math.round(parseFloat(s)*4)/4,cv=-Math.abs(Math.round((parseFloat($("fc").value)||0)*4)/4),p=P(),k=key(sv,cv),n=p.stock[k],y=p.transit[k]||0;r.textContent=fmt(sv)+" / "+fmt(cv)+": "+(typeof n==="number"&&n>0?n+" adet stokta":"stokta yok")+(y?" (yolda "+y+")":"")});
window.onerror=function(m,u,l){var e=document.getElementById("main");if(e)e.innerHTML='<div class="card"><b>Bir hata oluştu</b><div class="hint">'+esc(String(m))+' (satır '+l+')</div></div>'};
try{load();render();status();if("serviceWorker" in navigator&&location.protocol==="https:")navigator.serviceWorker.register("sw.js").catch(function(){})}catch(er){window.onerror(er&&er.message,"",0)}
})();
