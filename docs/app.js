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
function save(){if(typeof noteChange==="function"&&state&&state.prods&&state.prods.length)noteChange();if(lsSet(KEY,JSON.stringify(state))){lastSaved=Date.now();status()}else{status("KAYDEDİLEMEDİ",true);toast("Kaydedilemedi: cihazda yer kalmamış olabilir. Hemen yedeği Dosyalar'a kaydedin.")}}
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
  var n=dirtyN();if(n>0||d===null)return '<div class="notice"><b>Yedeklenmemiş değişiklik var</b>'+(d===null?'Henüz Dosyalar’a hiç yedek almadınız.':'Son dosya yedeğinden ('+(d===0?'bugün':d+' gün önce')+') sonra <b>'+n+' değişiklik</b> yapıldı.')+' Veriler şu an yalnızca bu cihazda.<div class="row"><button class="btn sm" id="bkfile">Yedeği Dosyalar’a kaydet</button></div></div>';
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
  var R=(p.rules||{})[k],th=R?R.thr:p.thr,tg=R?R.tgt:p.tgt;
  if(typeof n!=="number"||e>=th||(p.excl&&p.excl[k]))return;
  if(!R&&p.maxs>0&&Math.abs(s)>p.maxs+1e-9)return;
  out.push({s:s,c:c,k:k,q:Math.max(0,tg-e)})});
  out.sort(function(a,b){return a.s-b.s||b.c-a.c});return out}
function chips(){var h="";state.prods.forEach(function(p,i){h+='<button class="chip'+(i===state.cur?' on':'')+'" data-p="'+i+'">'+thumb(p.name)+esc(p.name)+'</button>'});$("chips").innerHTML=h}
function render(){chips();var m=$("main"),w0=document.querySelector(".wrap"),sc=w0&&tab==="stok"?[w0.scrollTop,w0.scrollLeft]:null;
  if(tab==="stok")m.innerHTML=reminder()+imgStrip()+viewStok();else if(tab==="siparis")m.innerHTML=reminder()+imgStrip()+viewOrder();else if(tab==="analiz")m.innerHTML=imgStrip()+viewAnaliz();else if(tab==="tek")m.innerHTML=reminder()+imgStrip()+viewTek();else if(tab==="gecmis")m.innerHTML=viewHist();else m.innerHTML=viewSet();var w1=document.querySelector(".wrap");if(sc&&w1){w1.scrollTop=sc[0];w1.scrollLeft=sc[1]}
  document.querySelectorAll("nav button").forEach(function(b){b.className=b.dataset.t===tab?"on":""})}
function viewStok(){var p=P(),h='<div class="bar"><div class="seg"><button data-sg="1" class="'+(sign===1?'on':'')+'">SPH +</button><button data-sg="-1" class="'+(sign===-1?'on':'')+'">SPH −</button></div><div class="seg" title="Transpoze: tabloyu CYL(−) ya da CYL(+) yazımıyla göster"><button data-cm="-" class="'+(cylMode()==="-"?'on':'')+'">CYL −</button><button data-cm="+" class="'+(cylMode()==="+"?'on':'')+'">CYL +</button></div><button class="btn sm'+(selMode?'':' alt')+'" id="selm">'+(selMode?'Bölge seçimi: açık':'Bölge seç')+'</button><button class="btn sm'+(sale?'':' alt')+'" id="sale">Satış modu: '+(sale?'açık':'kapalı')+'</button>'+(sale?'<button class="btn sm alt" id="undo">Geri al</button>':'')+'</div>'+(sale?'<div class="mode">Satış modu açık: dokunduğunuz hücrenin stoğu 1 azalır.</div>':'')+(selMode?'<div class="mode">Bölge seçimi açık: özel kural koymak istediğiniz camların üzerinde parmağınızı sürükleyin. Tabloyu kaydırmak için SPH ya da CYL başlıklarından tutun.</div>':'')+'<div class="find"><input type="number" id="fs" step="0.25" placeholder="SPH"><input type="number" id="fc" step="0.25" placeholder="'+(cylMode()==="+"?"CYL +":"CYL")+'"><span id="res" class="hint">Reçeteyi yazın, stoğa bakın.</span><button class="btn sm" id="tkfind" hidden>Tek seferlik sipariş et</button></div><div class="wrap'+(selMode?' selmode':'')+'"><table><thead><tr><th>SPH \\ CYL</th>';
  var PL=cylMode()==="+";for(var j=0;j<=20;j++)h+="<th>"+fmt((PL?1:-1)*j*.25)+"</th>";h+="</tr></thead><tbody>";
  var rows=sign===1?24:20;Object.keys(p.stock).forEach(function(k){var a=k.split("|"),i=Math.round((parseFloat(a[0])+(PL?parseFloat(a[1]):0))*4)*sign;if(i>rows)rows=i});
  for(var i=0;i<=rows;i++){var s=sign*i*.25;h+="<tr><th>"+fmt(s)+"</th>";
    for(var j2=0;j2<=20;j2++){var c=-j2*.25,k=PL?key(s+j2*.25,c):key(s,c),dk=key(s,PL?j2*.25:c),n=p.stock[k],cl="",t="";
      if(typeof n==="number"){t=n;cl=cellCls(p,k,n)}if(p.excl&&p.excl[k])cl+=" ex";if(ruleOf(p,k))cl+=" ozel";
      var yy=(p.transit||{})[k]||0;h+='<td class="'+cl+(yy?' tr':'')+'" data-k="'+k+'" data-d="'+dk+'">'+t+(yy?'<i class="yl" title="yolda">+'+yy+'</i>':'')+"</td>"}
    h+="</tr>"}
  return h+"</tbody></table></div>"}
function viewOrder(){var p=P(),o=orders(p),tk=p.tek||[],tot=0;o.forEach(function(x){tot+=x.q});tk.forEach(function(x){tot+=x.q});
  var h='<div class="card"><div class="sum"><div><b>'+(o.length+tk.length)+'</b><span>çeşit</span></div><div><b>'+tot+'</b><span>adet</span></div></div><div class="hint">Stoğu '+p.thr+' altındaki camlar '+p.tgt+' adete tamamlanır'+(p.maxs>0?', SPH ±'+p.maxs.toFixed(2)+' ile sınırlı':'')+'.'+(Object.keys(p.rules||{}).length?' '+Object.keys(p.rules).length+' camda özel kural geçerli.':'')+(tk.length?' '+tk.length+' tek seferlik cam dahil.':'')+'</div></div>';
  h+=transitCard(p)+costCard(p,tot);if(!o.length&&!tk.length)return h+'<div class="empty">👍 Stoklar yerinde. Sipariş edilecek cam yok.</div>';
  h+='<div class="card" style="padding:0;overflow:hidden"><table class="list" style="width:100%"><thead><tr><th>SPH</th><th>'+cylHdr()+'</th><th>ADET</th></tr></thead><tbody>';
  o.forEach(function(x){h+="<tr><td>"+fS(x)+"</td><td>"+fC(x)+'</td><td class="q">'+x.q+"</td></tr>"});tk.forEach(function(x){h+="<tr><td>"+fS(x)+"</td><td>"+fC(x)+(x.n?'<span class="tekn">'+esc(x.n)+'</span>':'')+'</td><td class="q">'+x.q+'<span class="tekb">tek</span></td></tr>'});
  h+='</tbody></table></div><div class="row"><button class="btn" id="sent">Sipariş verdim</button><button class="btn alt" id="copy">Listeyi kopyala</button><a class="btn alt" id="wa" target="_blank" rel="noopener" href="https://wa.me/?text='+encodeURIComponent(text())+'">WhatsApp’ta gönder</a><button class="btn alt" id="pdf">PDF olarak kaydet</button></div>';
  return h}
function tl(n){return n.toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2})+" ₺"}
function calc(q,cost,kdv){var net=q*cost;return {net:net,tax:net*kdv/100,tot:net*(1+kdv/100)}}
function invHtml(c,p){if(!p.cost)return '<div class="hint">Fiyat girerseniz fatura tutarı burada hesaplanır.</div>';return '<div class="hint">Ara toplam: '+tl(c.net)+'<br>KDV: '+tl(c.tax)+'</div><div class="sum" style="margin:8px 0 0"><div><b>'+tl(c.tot)+'</b><span>fatura tutarı</span></div></div>'}
function costCard(p,tot){if(!tot)return"";return '<div class="card"><b>Tahmini fatura</b><label>Cam başına alış fiyatı (₺)<input type="number" id="cost" min="0" step="0.01" inputmode="decimal" value="'+(p.cost||"")+'" placeholder="isteğe bağlı"></label><label>KDV (%)<input type="number" id="kdv" min="0" step="1" inputmode="decimal" value="'+(p.kdv||"")+'" placeholder="0"></label><div id="inv" style="padding-top:8px">'+invHtml(calc(tot,p.cost||0,p.kdv||0),p)+'</div></div>'}
function viewHist(){var H=state.hist||[];if(!H.length)return '<div class="empty">Henüz kayıtlı sipariş yok. Sipariş sekmesinde “Sipariş verdim” dediğinizde burada saklanır.</div>';var tq=0,tt=0;H.forEach(function(h){tq+=h.qty;tt+=h.tot||0});var s='<div class="card"><div class="sum"><div><b>'+H.length+'</b><span>sipariş</span></div><div><b>'+tq+'</b><span>adet</span></div>'+(tt?'<div><b>'+tl(tt)+'</b><span>toplam tutar</span></div>':'')+'</div></div>';H.forEach(function(h){var dt=new Date(h.d).toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric"});s+='<details class="card"><summary><b>'+dt+'</b> '+esc(h.prod)+'<br><span class="hint">'+h.items.length+' çeşit, '+h.qty+' adet'+(h.tot?', '+tl(h.tot):'')+' ('+h.st+')</span></summary><table class="list" style="margin-top:10px"><thead><tr><th>SPH</th><th>'+cylHdr()+'</th><th>ADET</th></tr></thead><tbody>';h.items.forEach(function(x){s+='<tr><td>'+fS(x)+'</td><td>'+fC(x)+(x.n?'<span class="tekn">'+esc(x.n)+'</span>':'')+'</td><td class="q">'+x.q+(x.tek?'<span class="tekb">tek</span>':'')+'</td></tr>'});s+='</tbody></table>'+(h.cost?'<div class="hint" style="margin-top:8px">Cam başına '+tl(h.cost)+(h.kdv?', KDV %'+h.kdv:'')+'</div>':'')+'<div class="row"><button class="btn alt sm" data-ch="'+h.id+'">Listeyi kopyala</button><button class="btn alt sm" data-ph="'+h.id+'">PDF</button><button class="btn alt sm" data-dh="'+h.id+'">Sil</button></div></details>'});return s}
function transitCard(p){var t=0,n=0;Object.keys(p.transit||{}).forEach(function(k){if(p.transit[k]>0){t+=p.transit[k];n++}});if(!n)return"";return '<div class="card"><b>Yolda: '+t+' adet ('+n+' çeşit)</b><div class="hint">Sipariş verilen camlar, cam gelene kadar listeden düşer. Tabloda yoldaki camların köşesinde +adet yazar.</div><div class="row"><button class="btn" id="arrived">Hepsi geldi</button><button class="btn alt" id="partial">Kısmen geldi</button><button class="btn alt" id="kontrol">Kontrol listesi (PDF)</button><button class="btn alt" id="cleartr">Yolu sıfırla</button></div></div>'}
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
function text(){var p=P(),t="SİPARİŞ EDİLECEK CAMLAR\n"+p.name+"\n\nSPH / "+cylHdr()+" / ADET\n";
  supplierList(p).forEach(function(x){t+=fS(x)+" / "+fC(x,"-")+" / "+x.q+"\n"});return t}
function viewSet(){var p=P();
  return '<div class="card"><b>'+esc(p.name)+' kuralları</b>'+
  '<label>Stok bunun altındaysa sipariş ver<input type="number" id="thr" min="0" value="'+p.thr+'"></label>'+
  '<label>Kaç adete tamamlansın<input type="number" id="tgt" min="1" value="'+p.tgt+'"></label>'+
  '<label>Sipariş için en yüksek SPH (±), 0 = sınır yok<input type="number" id="maxs" min="0" step="0.25" value="'+p.maxs+'"></label>'+
  '<div class="hint" style="padding:8px 0">Özel kurallı camlar: <b>'+Object.keys(p.rules||{}).length+'</b> (Stok sekmesinde “Bölge seç” ile eklenir, tabloda yeşil çerçeveyle görünür).</div>'+(Object.keys(p.rules||{}).length?'<div class="row" style="margin-top:0"><button class="btn alt" id="rdelall">Özel kuralların hepsini kaldır</button></div>':'')+'<div class="row"><button class="btn alt" id="demo">Örnek veri yükle</button><button class="btn alt" id="clear">Stoğu temizle</button></div></div>'+
  '<div class="card"><b>Yeni cam çeşidi</b><label>Ad<input type="text" id="np" placeholder="örn. 1.60 Mavi Işık"></label><div class="row"><button class="btn" id="addp">Ekle</button>'+(state.prods.length>1?'<button class="btn alt" id="delp">Bu çeşidi sil</button>':'')+'</div></div>'+imgCard()+tpzCard()+dataCard()+backupCard()}
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
function replaceState(st,msg){if(st.gorseller){var gg=gAll();Object.keys(st.gorseller).forEach(function(k){if(typeof st.gorseller[k]==="string"&&/^data:image\//.test(st.gorseller[k]))gg[k]=st.gorseller[k]});gPut(gg);delete st.gorseller}var before=JSON.parse(JSON.stringify(state));state=st;sale=false;last=null;
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
  var o=[];state.prods.forEach(function(p){var od=orders(p),t=0;od.forEach(function(x){t+=x.q});o.push([p.name+" • "+od.length+" çeşit, "+t+" adet"]);o.push(["SPH","CYL","ADET"]);od.forEach(function(x){o.push([fmt(x.s),x.c===0?"":fmt(x.c),x.q])});(p.tek||[]).forEach(function(x){o.push([fmt(x.s),x.c===0?"":fmt(x.c),x.q,"tek sefer"+(x.a?" · aks "+x.a:"")+(x.n?" · "+x.n:"")])});o.push([])});
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
function pdfFor(name,items,extra){var SMd=supMode();items=items.map(function(x){var d=asMode(x.s,x.c,SMd);return {s:d.s,c:d.c,q:x.q,ax:aksOf(x,SMd)}});if(!window.jspdf){toast("PDF aracı yüklenemedi");return}(function(J){var W=1240,H=1754,M=90,RH=46,doc=new J.jsPDF({unit:"mm",format:"a4"}),tot=0;items.forEach(function(x){tot+=x.q});
  var font='"Avenir Next","Segoe UI",system-ui,sans-serif',per=Math.floor((H-2*M-260)/RH),pages=Math.max(1,Math.ceil(items.length/per));
  for(var pg=0;pg<pages;pg++){var cv=document.createElement("canvas");cv.width=W;cv.height=H;var g=cv.getContext("2d");g.fillStyle="#fff";g.fillRect(0,0,W,H);
    var y=M;g.fillStyle="#14212b";g.font="700 44px "+font;g.fillText("SİPARİŞ EDİLECEK CAMLAR",M,y+40);y+=74;
    g.fillStyle="#66767f";g.font="26px "+font;g.fillText(name+"  •  "+new Date().toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric"})+"  •  "+items.length+" çeşit, "+tot+" adet"+(pages>1?"  •  Sayfa "+(pg+1)+"/"+pages:""),M,y+26);y+=70;
    var cols=[M,M+(W-2*M)/3,M+2*(W-2*M)/3],cw=(W-2*M)/3;
    g.fillStyle="#14212b";g.fillRect(M,y,W-2*M,RH);g.fillStyle="#fff";g.font="600 26px "+font;g.textAlign="center";
    ["SPH",cylHdr(SMd),"ADET"].forEach(function(t,i){g.fillText(t,cols[i]+cw/2,y+31)});y+=RH;
    items.slice(pg*per,(pg+1)*per).forEach(function(x){g.fillStyle="#14212b";g.font="28px "+font;g.fillText(fmt(x.s),cols[0]+cw/2,y+32);g.fillText(x.c===0?"":fmt(x.c)+(x.ax?"×"+x.ax:""),cols[1]+cw/2,y+32);g.font="700 28px "+font;g.fillText(String(x.q),cols[2]+cw/2,y+32);
      g.fillStyle="#d5dde2";g.fillRect(M,y+RH-2,W-2*M,2);y+=RH});
    g.textAlign="left";if(extra&&pg===pages-1){g.fillStyle="#14212b";g.font="700 26px "+font;g.fillText(extra,M,y+50)}
    if(pg)doc.addPage();doc.addImage(cv.toDataURL("image/jpeg",0.92),"JPEG",0,0,210,297)}
  saveFile(("Siparis "+name+" "+today()).replace(/[\\\/:*?"<>|]/g,"-")+".pdf",new Blob([doc.output("arraybuffer")]),"PDF kaydedildi")})(window.jspdf)}


(function(){if(document.getElementById("cs-yolda-css"))return;var st=document.createElement("style");st.id="cs-yolda-css";st.textContent="td.tr{position:relative}td .yl{position:absolute;top:2px;right:3px;font-size:10px;font-style:normal;font-weight:700;color:var(--acc);line-height:1;pointer-events:none}.panel{max-height:88vh;overflow:auto}.pl{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:6px 0;border-bottom:1px solid var(--line)}";document.head.appendChild(st)})();

/* ---------- Ambalaj görselleri (her cam çeşidi için bir fotoğraf) ---------- */
var GKEY=KEY+"_gorseller", HAZIR_GORSEL={"1.56 HMC":"img/1-56-hmc.jpg","U.C. 1.49":"img/uc-1-49.jpg"};
(function(){if(document.getElementById("cs-gorsel-css"))return;var st=document.createElement("style");st.id="cs-gorsel-css";st.textContent=".ci{width:24px;height:24px;border-radius:50%;object-fit:cover;vertical-align:middle;margin:-4px 8px -4px -8px;border:1px solid rgba(255,255,255,.35)}.imgstrip{display:inline-flex;max-width:100%;gap:12px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:8px 10px;margin-bottom:10px;cursor:pointer;text-align:left;font:inherit;color:var(--ink)}.imgstrip img{width:56px;height:56px;border-radius:8px;object-fit:cover;background:var(--bg);flex:none}.imgstrip b{display:block}.bigimg{display:block;width:100%;max-height:70vh;object-fit:contain;border-radius:10px;background:var(--bg);margin:8px 0}.imgcard{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.imgcard img{width:96px;height:96px;border-radius:10px;object-fit:cover;background:var(--bg);border:1px solid var(--line)}.imgcard .noimg{width:96px;height:96px;border-radius:10px;border:1px dashed var(--line);display:flex;align-items:center;justify-content:center;color:var(--mute);font-size:12px;text-align:center;padding:6px}";document.head.appendChild(st)})();
function gAll(){try{return JSON.parse(lsGet(GKEY))||{}}catch(e){return {}}}
function gPut(all){if(!lsSet(GKEY,JSON.stringify(all))){toast("Görsel kaydedilemedi: cihazda yer kalmamış olabilir");return false}return true}
function imgOf(name){var g=gAll();return g[name]||HAZIR_GORSEL[name]||null}
function thumb(name){var u=imgOf(name);return u?'<img class="ci" src="'+esc(u)+'" alt="">':''}
function imgStrip(){var p=P(),u=imgOf(p.name);if(!u)return "";return '<button class="imgstrip" id="imgbig"><img src="'+esc(u)+'" alt="'+esc(p.name)+' ambalajı"><span><b>'+esc(p.name)+'</b><span class="hint">Ambalaj görseli · büyütmek için dokunun</span></span></button>'}
function imgCard(){var p=P(),u=imgOf(p.name);return '<div class="card"><b>'+esc(p.name)+' ambalaj görseli</b><div class="hint">Camın kutusunun ya da etiketinin fotoğrafını ekleyin. Stok ve Sipariş sayfalarında bu çeşidi tanımayı kolaylaştırır.</div><div class="imgcard" style="margin-top:8px">'+(u?'<img src="'+esc(u)+'" alt="">':'<div class="noimg">Görsel yok</div>')+'<div class="row" style="margin:0"><button class="btn alt" id="imgpick">'+(u?'Görseli değiştir':'Görsel ekle')+'</button>'+(gAll()[p.name]?'<button class="btn alt" id="imgdel">Kaldır</button>':'')+'</div></div><input type="file" id="fimg" accept="image/*" hidden></div>'}
function shrink(file,cb){var r=new FileReader();r.onload=function(){var im=new Image();im.onload=function(){var M=640,w=im.width,h=im.height,k=Math.min(1,M/Math.max(w,h)),c=document.createElement("canvas");c.width=Math.round(w*k);c.height=Math.round(h*k);c.getContext("2d").drawImage(im,0,0,c.width,c.height);cb(c.toDataURL("image/jpeg",0.82))};im.onerror=function(){toast("Bu görsel açılamadı")};im.src=r.result};r.readAsDataURL(file)}
document.addEventListener("click",function(e){var t=e.target.closest("button");if(!t)return;
  if(t.id==="imgpick"){$("fimg").value="";$("fimg").click();return}
  if(t.id==="imgdel"){var g=gAll();delete g[P().name];gPut(g);render();toast("Görsel kaldırıldı");return}
  if(t.id==="imgbig"){var p=P();$("panel").innerHTML='<h2>'+esc(p.name)+'</h2><img class="bigimg" src="'+esc(imgOf(p.name))+'" alt="'+esc(p.name)+' ambalajı"><div class="row"><button class="btn alt" id="cx">Kapat</button></div>';$("sheet").className="sheet show";return}
});
document.addEventListener("change",function(e){if(e.target.id!=="fimg")return;var f=e.target.files&&e.target.files[0];if(!f)return;var name=P().name;
  shrink(f,function(u){var g=gAll();g[name]=u;if(gPut(g)){render();toast("Görsel eklendi")}})});

/* ---------- Bölge seçip özel kural (sürükle-bırak) ---------- */
(function(){if(document.getElementById("cs-bolge-css"))return;var st=document.createElement("style");st.id="cs-bolge-css";st.textContent="td.ozel{box-shadow:inset 0 0 0 2px var(--acc)}td.sel{outline:3px solid #f5b400!important;outline-offset:-3px}.selmode td{touch-action:none;cursor:crosshair;-webkit-user-select:none;user-select:none}";document.head.appendChild(st)})();
var selMode=false, selA=null, selB=null, dragging=false;
function ruleOf(p,k){return (p.rules||{})[k]||null}
function thrOf(p,k){var r=ruleOf(p,k);return r?r.thr:p.thr}
function paintSel(){var ks={};selKeys().forEach(function(k){ks[k]=1});document.querySelectorAll("td[data-k]").forEach(function(td){td.classList.toggle("sel",!!ks[td.dataset.k])})}
function openRule(){var p=P(),ks=selKeys();if(!ks.length)return;var stocked=ks.filter(function(k){return typeof p.stock[k]==="number"}).length,withRule=ks.filter(function(k){return ruleOf(p,k)}).length;
  var r0=ruleOf(p,ks[0])||{thr:p.thr,tgt:p.tgt},sA=Math.min(selA.s,selB.s),sB=Math.max(selA.s,selB.s),cA=Math.max(selA.c,selB.c),cB=Math.min(selA.c,selB.c);
  $("panel").innerHTML='<h2>Seçilen bölge</h2><div class="hint">SPH '+fmt(sA)+(sA!==sB?' … '+fmt(sB):'')+' · CYL '+fmt(cA)+(cA!==cB?' … '+fmt(cB):'')+'<br>'+ks.length+' hücre, '+stocked+' tanesinde stok kaydı var'+(withRule?', '+withRule+' tanesinde zaten özel kural var':'')+'.</div>'+
  '<label>Stok bunun altındaysa sipariş ver<input type="number" id="rthr" min="0" value="'+r0.thr+'"></label><label>Kaç adete tamamlansın<input type="number" id="rtgt" min="1" value="'+r0.tgt+'"></label>'+
  '<div class="hint" style="margin-top:6px">Bu kural yalnızca seçtiğiniz camlar için geçerlidir; diğerleri '+esc(p.name)+' genel kuralını ('+p.thr+' / '+p.tgt+') kullanır. Seçilen camlarda “en yüksek SPH” sınırı uygulanmaz. Boş hücreler, stok girilene kadar siparişe girmez.</div>'+
  '<div class="row"><button class="btn" id="rset">Kuralı uygula</button>'+(withRule?'<button class="btn alt" id="rclr">Bu bölgenin özel kuralını kaldır</button>':'')+'<button class="btn alt" id="rcx">Vazgeç</button></div>';
  $("sheet").className="sheet show"}
function endSel(){selA=selB=null;paintSel()}
document.addEventListener("pointerdown",function(e){if(!selMode||tab!=="stok")return;var td=e.target.closest&&e.target.closest("td[data-k]");if(!td)return;e.preventDefault();var c=cellAt(e.clientX,e.clientY);if(!c)return;selA=selB=c;dragging=true;paintSel()});
document.addEventListener("pointermove",function(e){if(!dragging)return;var c=cellAt(e.clientX,e.clientY);if(c&&(c.s!==selB.s||c.c!==selB.c)){selB=c;paintSel()}});
document.addEventListener("pointerup",function(){if(!dragging)return;dragging=false;openRule()});
document.addEventListener("pointercancel",function(){dragging=false;endSel()});
document.addEventListener("click",function(e){var t=e.target.closest&&e.target.closest("button,td");if(!t)return;
  if(selMode&&t.tagName==="TD"&&tab==="stok"){e.stopPropagation();return}
  var id=t.id,p;
  if(id==="selm"){selMode=!selMode;if(selMode)sale=false;endSel();render();e.stopPropagation();return}
  if(id==="rset"){p=P();var th=Math.max(0,parseInt($("rthr").value,10)||0),tg=Math.max(1,parseInt($("rtgt").value,10)||1),ks=selKeys();if(!p.rules)p.rules={};
    ks.forEach(function(k){if(th===p.thr&&tg===p.tgt)delete p.rules[k];else p.rules[k]={thr:th,tgt:tg}});save();$("sheet").className="sheet";endSel();render();toast(ks.length+" cam için kural kaydedildi: stok "+th+" adedin altına düşerse "+tg+" adede tamamlanacak");e.stopPropagation();return}
  if(id==="rclr"){p=P();selKeys().forEach(function(k){if(p.rules)delete p.rules[k]});save();$("sheet").className="sheet";endSel();render();toast("Özel kural kaldırıldı");e.stopPropagation();return}
  if(id==="rcx"){$("sheet").className="sheet";endSel();e.stopPropagation();return}
  if(id==="rdel1"){p=P();if(p.rules)delete p.rules[cur];save();$("sheet").className="sheet";render();toast("Özel kural kaldırıldı");e.stopPropagation();return}
  if(id==="rdelall"){if(t.dataset.arm!=="1"){t.dataset.arm="1";t.textContent="Emin misiniz? Tekrar dokunun";e.stopPropagation();return}P().rules={};save();render();toast("Özel kurallar kaldırıldı");e.stopPropagation();return}
},true);
var openCellRule=openCell;
openCell=function(k){openCellRule(k);var r=ruleOf(P(),k);if(!r)return;var d=document.createElement("div");d.className="notice";
  d.innerHTML='<b>Özel kural</b>Bu camda stok '+r.thr+' adedin altına düşerse '+r.tgt+' adede tamamlanır.<div class="row"><button class="btn alt sm" id="rdel1">Özel kuralı kaldır</button></div>';$("panel").insertBefore(d,$("panel").querySelector(".step"))};

/* ---------- Yedeklenmemiş değişiklik takibi ve yedek hatırlatma ---------- */
var CKEY=KEY+"_yedeksiz_degisiklik", DKEY=KEY+"_yedek_sorulan_gun", lastSig=null, BUYUK=["sent","arrived","pago","cgeldi","askok","rset","rclr","impgo"];
function sigOf(){try{var o=Object.assign({},state);delete o.cur;return JSON.stringify(o)}catch(e){return ""}}
function dirtyN(){return +lsGet(CKEY)||0}
function noteChange(){var g=sigOf();if(lastSig!==null&&g!==lastSig)lsSet(CKEY,String(dirtyN()+1));lastSig=g}
function backedUp(){lsSet(CKEY,"0");lsSet(LKEY,String(Date.now()));lastSig=sigOf()}
function askBackup(title,txt){if($("sheet").classList.contains("show"))return;$("panel").innerHTML='<h2>'+title+'</h2><div class="hint" style="margin:6px 0 4px">'+txt+'</div><div class="row"><button class="btn" id="bkfile">Yedeği Dosyalar’a kaydet</button><button class="btn alt" id="cx">Sonra</button></div>';$("sheet").className="sheet show"}
document.addEventListener("click",function(e){var t=e.target.closest&&e.target.closest("button");if(!t||BUYUK.indexOf(t.id)<0)return;var d0=dirtyN();
  setTimeout(function(){if(dirtyN()>d0)askBackup("Değişikliği yedekleyin","Önemli bir değişiklik yaptınız. Yedeği şimdi Dosyalar’a (iCloud Drive) kaydedin; iPad’e bir şey olursa bu dosyayla her şeyi geri yüklersiniz.")},120)},true);
function dailyAsk(){var n=dirtyN();if(!n||lsGet(DKEY)===today())return;lsSet(DKEY,today());
  setTimeout(function(){if(typeof setup!=="undefined"&&setup)return;if(typeof locked==="function"&&locked())return;askBackup("Günlük yedek","Son dosya yedeğinden sonra <b>"+n+" değişiklik</b> yapıldı. Yedeği Dosyalar’a kaydedelim mi?")},700)}

/* ---------- Tek seferlik sipariş (stokta tutulmayan cam, bir kerelik) ---------- */
(function(){if(document.getElementById("cs-tek-css"))return;var st=document.createElement("style");st.id="cs-tek-css";st.textContent=".tekb{display:inline-block;margin-left:6px;padding:1px 8px;border-radius:999px;background:var(--acc);color:var(--acctx);font-size:11px;font-weight:700;vertical-align:middle}.tekn{display:block;font-size:12px;color:var(--mute);font-weight:400}.find input[type=text]{width:210px}#tkfind[hidden]{display:none!important}";document.head.appendChild(st)})();
function q4t(v){return Math.round(v*4)/4}
function tekCount(){var n=0;(state&&state.prods||[]).forEach(function(p){n+=(p.tek||[]).length});return n}
function mergeItems(arr){var m={},out=[];arr.forEach(function(x){var ax=x.a&&x.c!==0?+x.a:0,k=key(x.s,x.c)+(ax?"|"+ax:"");if(!m[k]){m[k]={s:x.s,c:x.c,q:0};if(ax)m[k].a=ax;out.push(m[k])}m[k].q+=x.q});return out.sort(function(a,b){return a.s-b.s||b.c-a.c})}
function supplierList(p){return mergeItems(orders(p).concat(p.tek||[]))}
function tekAdd(s,c,q,n,pi,ax){var p=(pi!==undefined&&state.prods[pi])?state.prods[pi]:P();s=parseFloat(String(s).replace(",","."));c=parseFloat(String(c===""||c===undefined?"0":c).replace(",","."));q=parseInt(q,10)||0;
  if(isNaN(s)){toast("SPH değerini yazın");return false}if(isNaN(c))c=0;if(q<1){toast("Adet en az 1 olmalı");return false}
  s=q4t(s);c=-Math.abs(q4t(c));if(!p.tek)p.tek=[];var it={id:Date.now()+Math.floor(Math.random()*1000),s:s,c:c,q:q,n:String(n||"").trim().slice(0,60)};if(ax&&c!==0)it.a=ax;p.tek.push(it);save();
  toast(p.name+" · "+fmt(s)+" / "+fmt(c)+(it.a?" aks "+it.a+"°":"")+" · "+q+" adet tek seferlik siparişe eklendi");return true}
function tekForm(pf,s,c){return '<label style="border:0;padding:8px 0 0">Cam türü<select id="'+pf+'p" style="padding:8px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);font:inherit;max-width:60%">'+state.prods.map(function(x,i){return '<option value="'+i+'"'+(i===state.cur?' selected':'')+'>'+esc(x.name)+'</option>'}).join("")+'</select></label><div class="find" style="margin-top:10px"><input type="number" id="'+pf+'s" step="0.25" inputmode="decimal" placeholder="SPH" aria-label="SPH" value="'+(s===undefined||isNaN(s)?'':s)+'"><input type="number" id="'+pf+'c" step="0.25" inputmode="decimal" placeholder="CYL" aria-label="CYL" value="'+(c===undefined||isNaN(c)?'':c)+'"><input type="number" id="'+pf+'q" min="1" value="1" aria-label="Adet" placeholder="Adet"><input type="number" id="'+pf+'a" min="0" max="180" step="1" inputmode="numeric" placeholder="AKS" aria-label="Aks (derece)"><input type="text" id="'+pf+'n" placeholder="Not (örn. müşteri adı)" aria-label="Not"></div>'}
function tekRead(pf){var md=cylMode(),cr=parseRx($(pf+"s").value,$(pf+"c").value,md);if(!cr){toast("SPH değerini yazın");return false}
  var av=$(pf+"a")?String($(pf+"a").value).trim():"",ax=0;if(av!==""){ax=Math.round(parseFloat(av));if(isNaN(ax)||ax<0||ax>180){toast("Aks 0 ile 180 arasında olmalı");return false}if(ax===0)ax=180}
  var girC=parseFloat(String($(pf+"c").value).replace(",","."))||0;if(ax&&cr.c<0&&girC>0&&md==="+")ax=rotA(ax);
  return tekAdd(cr.s,cr.c,$(pf+"q").value,$(pf+"n").value,+$(pf+"p").value,ax)}
function viewTek(){var all=[];state.prods.forEach(function(p,pi){(p.tek||[]).forEach(function(x){all.push({p:p,pi:pi,x:x})})});
  var h='<div class="card"><b>Tek seferlik sipariş</b><div class="hint">Stokta tutmadığınız bir camı yalnızca bir kez sipariş etmek için. Stoğa ve sipariş kurallarına karışmaz. Seçtiğiniz türün bir sonraki “Sipariş verdim”inde, toptancıya giden listeye normal bir satır olarak girer, sonra buradan düşer. CYL, Stok sekmesinde seçili yazıma (şu an CYL'+(cylMode()==="+"?"+":"−")+') göre okunur; eksi yazmak için başına − koyabilirsiniz. Listede olmayan bir tür için önce Ayarlar → Yeni cam çeşidi ile ekleyin.</div>'+tekForm("tk")+'<div class="row"><button class="btn" id="tkadd">Listeye ekle</button></div></div>';
  if(!all.length)h+='<div class="empty">Bekleyen tek seferlik sipariş yok. Stokta olmayan bir cam gerekirse yukarıdan ekleyin.</div>';
  else{h+='<div class="card" style="padding:0;overflow:hidden"><table class="list" style="width:100%"><thead><tr><th>TÜR</th><th>SPH</th><th>CYL</th><th>ADET</th><th></th></tr></thead><tbody>';
    all.forEach(function(r){var x=r.x;h+='<tr><td><b>'+esc(r.p.name)+'</b></td><td>'+fmt(x.s)+'</td><td>'+(x.c===0?"":fmt(x.c)+axStr(x,"-"))+(x.n?'<span class="tekn">'+esc(x.n)+'</span>':'')+'</td><td class="q">'+x.q+'</td><td><button class="btn alt sm" data-tkdel="'+x.id+'" data-tkp="'+r.pi+'">Sil</button></td></tr>'});
    h+='</tbody></table></div><div class="hint" style="margin-top:6px">Her tür, kendi sipariş listesine eklenir. Sipariş sekmesinde üstten türü seçerek görebilirsiniz.</div><div class="row"><button class="btn" id="tkgo">Sipariş sekmesine git</button></div>'}
  return h+'<div class="hint" style="margin-top:12px"><b>Kısa yollar:</b> Stok sekmesinde reçete aradığınızda cam stokta yoksa “Tek seferlik sipariş et” düğmesi çıkar. Tablodaki herhangi bir hücreye dokunup da ekleyebilirsiniz.</div>'}
function tekPanel(s,c){$("panel").innerHTML='<h2>Tek seferlik sipariş</h2><div class="hint">Stoğa eklenmez; seçtiğiniz türün bir sonraki siparişine normal bir satır olarak girer.</div>'+tekForm("tp",s,c)+'<div class="row"><button class="btn" id="tpadd">Ekle</button><button class="btn alt" id="cx">Vazgeç</button></div>';$("sheet").className="sheet show";var q=$("tpq");if(q){q.focus();q.select()}}
function tekNav(){var nv=document.querySelector("nav");if(!nv)return;var b=nv.querySelector('[data-t="tek"]');if(!b){b=document.createElement("button");b.dataset.t="tek";nv.insertBefore(b,nv.querySelector('[data-t="ayar"]'))}var n=tekCount();b.textContent="Tek sipariş"+(n?" ("+n+")":"");b.className=tab==="tek"?"on":""}
var renderTekBase=render;render=function(){renderTekBase();tekNav()};
var openCellTek=openCell;openCell=function(k){openCellTek(k);var rs=$("panel").querySelectorAll(".row");if(rs.length)rs[rs.length-1].insertAdjacentHTML("beforeend",'<button class="btn alt" id="tkcell">Tek seferlik sipariş</button>')};
document.addEventListener("click",function(e){var t=e.target.closest&&e.target.closest("button");if(!t)return;var id=t.id,d=t.dataset;
  if(id==="tkadd"){if(tekRead("tk"))render();return}
  if(id==="tpadd"){if(tekRead("tp")){$("sheet").className="sheet";render()}return}
  if(id==="tkgo"){tab="siparis";render();return}
  if(id==="tkfind"){tekPanel(parseFloat($("fs").value),parseFloat($("fc").value));return}
  if(id==="tkcell"){var a=cur.split("|");tekPanel(parseFloat(a[0]),parseFloat(a[1]));return}
  if(d.tkdel){if(d.arm!=="1"){d.arm="1";t.textContent="Silinsin mi?";return}var p=state.prods[+d.tkp]||P();p.tek=(p.tek||[]).filter(function(x){return String(x.id)!==d.tkdel});save();render();toast("Silindi");return}
});
document.addEventListener("input",function(e){if(e.target.id!=="fs"&&e.target.id!=="fc")return;var b=$("tkfind");if(!b)return;var s=parseFloat($("fs").value);if(isNaN(s)){b.hidden=true;return}
  var c=parseFloat($("fc").value)||0,n=P().stock[key(q4t(s),-Math.abs(q4t(c)))];b.hidden=typeof n==="number"&&n>0});
document.addEventListener("keydown",function(e){if(e.key!=="Enter")return;var id=e.target.id||"";if(/^tp[scqn]$/.test(id)){e.preventDefault();$("tpadd").click()}else if(/^tk[scqn]$/.test(id)){e.preventDefault();$("tkadd").click()}});

/* ---------- Transpoze: aynı camın CYL(−) ve CYL(+) yazımları ----------
   Kayıtlar hep eksi silindir yazımıyla tutulur. Yeni SPH = SPH + CYL, yeni CYL = −CYL (aks 90° döner; stok camında aks tutulmaz). */
var YKEY=KEY+"_cyl_yazim", SKEY=KEY+"_siparis_cyl_yazim";
function cylMode(){return lsGet(YKEY)==="+"?"+":"-"}
function supMode(){return lsGet(SKEY)==="+"?"+":"-"}
function asMode(s,c,m){if(m==="+"&&c<0)return {s:Math.round((s+c)*4)/4,c:-c};return {s:s,c:c}}
function cylHdr(m){return (m||supMode())==="+"?"CYL (+)":"CYL"}
function sv(x){return asMode(x.s,x.c,supMode())}
function fS(x){return fmt(sv(x).s)}
function rotA(a){a=Math.round(+a);return a>90?a-90:a+90}
function aksOf(x,m){if(!x.a||x.c===0)return 0;return m==="+"&&x.c<0?rotA(x.a):x.a}
function axStr(x,m){var a=aksOf(x,m);return a?"×"+a:""}
function fC(x,bos){var d=sv(x);return d.c===0?(bos===undefined?"":bos):fmt(d.c)+axStr(x,supMode())}
function parseRx(sv_,cv_,m){var s=parseFloat(String(sv_).replace(",",".")),c=parseFloat(String(cv_===undefined?"":cv_).replace(",","."))||0;if(isNaN(s))return null;
  s=Math.round(s*4)/4;c=Math.round(c*4)/4;if(c<0)return {s:s,c:c};if(c===0)return {s:s,c:0};if(m==="+")return {s:Math.round((s+c)*4)/4,c:-c};return {s:s,c:-c}}
function ikiYazim(s,c){if(c===0)return fmt(s)+" / 0.00";var t=asMode(s,c,"+");return "CYL(−): "+fmt(s)+" / "+fmt(c)+"   ·   CYL(+): "+fmt(t.s)+" / "+fmt(t.c)}
function tpzCard(){var m=cylMode(),sm=supMode();return '<div class="card"><b>Transpoze (CYL yazımı)</b><div class="hint">Aynı cam iki şekilde yazılabilir. CYL(+) yazımından CYL(−) yazımına geçerken SPH ile CYL toplanır, CYL’nin yalnızca işareti değişir (aks 90° döner; stok camında aks önemli değildir). Örnek: +1.00 / +2.50 = +3.50 / −2.50 · −1.50 / +2.50 = +1.00 / −2.50. CamStok kayıtları her zaman CYL(−) yazımıyla tutar; aşağıdaki seçimler yalnızca görünümü değiştirir.</div>'+
  '<label>Stok tablosu ve reçete arama<span class="seg"><button data-cm="-" class="'+(m==="-"?"on":"")+'">CYL −</button><button data-cm="+" class="'+(m==="+"?"on":"")+'">CYL +</button></span></label>'+
  '<label>Sipariş listesi ve toptancıya giden mesaj<span class="seg"><button data-sm="-" class="'+(sm==="-"?"on":"")+'">CYL −</button><button data-sm="+" class="'+(sm==="+"?"on":"")+'">CYL +</button></span></label></div>'}
function cellAt(x,y){var el=document.elementFromPoint(x,y);el=el&&el.closest?el.closest("td[data-k]"):null;if(!el)return null;var a=(el.dataset.d||el.dataset.k).split("|");return {s:parseFloat(a[0]),c:parseFloat(a[1])}}
function selKeys(){if(!selA||!selB)return [];var s1=Math.min(selA.s,selB.s),s2=Math.max(selA.s,selB.s),c1=Math.min(selA.c,selB.c),c2=Math.max(selA.c,selB.c),out=[],plus=cylMode()==="+";
  for(var s=Math.round(s1*4);s<=Math.round(s2*4);s++)for(var c=Math.round(c1*4);c<=Math.round(c2*4);c++)out.push(plus&&c>0?key((s+c)/4,-c/4):key(s/4,c/4));return out}
var openCellTpz=openCell;openCell=function(k){openCellTpz(k);var a=k.split("|"),s=parseFloat(a[0]),c=parseFloat(a[1]);if(c===0)return;var t=asMode(s,c,"+");var h2=$("panel").querySelector("h2");
  if(h2)h2.insertAdjacentHTML("afterend",'<div class="hint" style="font-size:15px;margin-bottom:4px"><b>Transpoze:</b> '+fmt(t.s)+' / '+fmt(t.c)+' (aynı cam, CYL+ yazımı)</div>')};
document.addEventListener("click",function(e){var t=e.target.closest&&e.target.closest("button");if(!t)return;var d=t.dataset;
  if(d.cm){lsSet(YKEY,d.cm);selMode=false;render();toast(d.cm==="+"?"Tablo CYL(+) yazımıyla gösteriliyor":"Tablo CYL(−) yazımıyla gösteriliyor");return}
  if(d.sm){lsSet(SKEY,d.sm);render();toast(d.sm==="+"?"Sipariş listesi CYL(+) yazımıyla gidecek":"Sipariş listesi CYL(−) yazımıyla gidecek");return}});
window.addEventListener("input",function(e){if(e.target.id!=="fs"&&e.target.id!=="fc")return;var r=$("res"),b=$("tkfind");if(!r)return;
  var cr=parseRx($("fs").value,$("fc").value,cylMode());if(!cr){r.textContent="Reçeteyi yazın, stoğa bakın.";if(b)b.hidden=true;return}
  var p=P(),k=key(cr.s,cr.c),n=p.stock[k],y=(p.transit||{})[k]||0,var_=typeof n==="number"&&n>0;
  r.textContent=ikiYazim(cr.s,cr.c)+" → "+(var_?n+" adet stokta":"stokta yok")+(y?" (yolda "+y+")":"");if(b)b.hidden=var_});

/* ---------- Analiz: sipariş sıklığı, stoğa ekleme / azaltma tavsiyesi, satış hızı ----------
   Satış kaydı: p.satis[anahtar][YYYY-MM-DD] = adet (yalnız Satış modu; Geri al düşer). 400 günden eskisi silinir. */
var GUN=864e5, AKEY=KEY+"_analiz";
function anAyar(){var d={donem:6,tekMin:3,durgun:6};try{var o=JSON.parse(lsGet(AKEY))||{};Object.keys(d).forEach(function(k){if(typeof o[k]==="number")d[k]=o[k]})}catch(e){}return d}
function anKaydet(o){lsSet(AKEY,JSON.stringify(o))}
function logSale(p,k,n){if(!state.takipBas)state.takipBas=Date.now();var t=today();if(!p.satis)p.satis={};var g=p.satis[k]||(p.satis[k]={});g[t]=(g[t]||0)+n;if(g[t]<=0)delete g[t];
  var sinir=today(new Date(Date.now()-400*GUN));Object.keys(g).forEach(function(d){if(d<sinir)delete g[d]});if(!Object.keys(g).length)delete p.satis[k]}
function satisSay(p,k,bas){var g=(p.satis||{})[k];if(!g)return 0;var b=today(new Date(bas)),n=0;Object.keys(g).forEach(function(d){if(d>=b)n+=g[d]});return n}
function dk(k){var a=k.split("|"),d=asMode(parseFloat(a[0]),parseFloat(a[1]),cylMode());return fmt(d.s)+" / "+(d.c===0?"0.00":fmt(d.c))}
function tarihKisa(ts){return ts?new Date(ts).toLocaleDateString("tr-TR",{day:"numeric",month:"short",year:"2-digit"}):"—"}
function siparisIst(p,bas){var m={};(state.hist||[]).forEach(function(h){if(h.prod!==p.name||h.st==="iptal"||h.d<bas)return;var gor={};
  (h.items||[]).forEach(function(x){var k=key(x.s,x.c),r=m[k]||(m[k]={k:k,kez:0,adet:0,tek:0,son:0});r.adet+=x.q;if(x.tek)r.tek++;if(!gor[k]){r.kez++;gor[k]=1}if(h.d>r.son)r.son=h.d})});return m}
function veriBas(p){var b=state.takipBas||Date.now();(state.hist||[]).forEach(function(h){if(h.prod===p.name&&h.d<b)b=h.d});return b}
function viewAnaliz(){var p=P(),A=anAyar(),now=Date.now(),bas=A.donem?now-A.donem*30*GUN:0,vb=veriBas(p),gun=Math.max(1,Math.round((now-Math.max(bas,vb))/GUN));
  var ist=siparisIst(p,bas),liste=Object.keys(ist).map(function(k){return ist[k]}),satToplam=0,satTakipGun=state.takipBas?Math.max(1,Math.round((now-state.takipBas)/GUN)):0;
  Object.keys(p.satis||{}).forEach(function(k){satToplam+=satisSay(p,k,bas)});
  var seg=function(v,l){return '<button data-and="'+v+'" class="'+(A.donem===v?'on':'')+'">'+l+'</button>'};
  var h='<div class="card"><b>Analiz · '+esc(p.name)+'</b><div class="row" style="margin-top:8px"><div class="seg">'+seg(3,"3 ay")+seg(6,"6 ay")+seg(12,"12 ay")+seg(0,"Tümü")+'</div></div>'+
    '<div class="hint" style="margin-top:8px">Sipariş geçmişi: '+(state.hist||[]).filter(function(x){return x.prod===p.name}).length+' sipariş, ilk kayıt '+tarihKisa(vb)+'. Satış kaydı: '+(satTakipGun?satTakipGun+' gündür tutuluyor':'henüz başlamadı (Stok sekmesindeki Satış modu ile her satış kaydedilir)')+'. Bu dönemde incelenen süre: '+gun+' gün.</div></div>';
  // 1) stoğa ekleme tavsiyesi
  var ekle=liste.filter(function(r){return r.tek>=A.tekMin&&typeof p.stock[r.k]!=="number"}).sort(function(a,b){return b.tek-a.tek||b.adet-a.adet});
  h+='<div class="card"><b>Stoğa eklemeyi düşünün</b><div class="hint">Stokta olmayıp bu dönemde en az '+A.tekMin+' kez tek seferlik sipariş edilen camlar.</div>';
  if(!ekle.length)h+='<div class="hint" style="margin-top:8px">Şu an böyle bir cam yok.</div>';
  else{h+='<table class="list" style="margin-top:8px"><thead><tr><th>SPH / CYL</th><th>TEK SİPARİŞ</th><th>ADET</th><th>SON</th><th>ÖNERİ</th><th></th></tr></thead><tbody>';
    ekle.forEach(function(r){var ay=Math.max(1,gun/30),tg=Math.max(2,Math.ceil(r.adet/ay*1.5)),th=Math.max(1,Math.ceil(tg/2));
      h+='<tr><td><b>'+dk(r.k)+'</b></td><td>'+r.tek+' kez</td><td>'+r.adet+'</td><td>'+tarihKisa(r.son)+'</td><td>stok '+th+' adedin altına düşünce '+tg+' adede tamamla</td><td><button class="btn sm" data-anadd="'+r.k+'" data-th="'+th+'" data-tg="'+tg+'">Stoğa ekle</button></td></tr>'});
    h+='</tbody></table><div class="hint" style="margin-top:6px">“Stoğa ekle” camı 0 adetle stoğa alır; bir sonraki “Sipariş verdim”de önerilen hedefe kadar sipariş edilir. Öneriyi sonra Bölge seç ile değiştirebilirsiniz.</div>'}
  h+='</div>';
  // 2) azaltma tavsiyesi
  var dBas=now-A.durgun*30*GUN,yeterli=(now-vb)>=A.durgun*30*GUN,ist2=siparisIst(p,dBas),satYeter=state.takipBas&&(now-state.takipBas)>=A.durgun*30*GUN;
  h+='<div class="card"><b>Yenileme adedini düşürmeyi düşünün</b><div class="hint">Stokta olup son '+A.durgun+' ayda hiç sipariş edilmemiş'+(satYeter?' ve hiç satılmamış':'')+' camlar.</div>';
  if(!yeterli)h+='<div class="hint" style="margin-top:8px">Bu öneri için en az '+A.durgun+' aylık kayıt gerekiyor. Şu an '+Math.round((now-vb)/GUN)+' günlük veri var; yaklaşık '+Math.max(1,Math.ceil((vb+A.durgun*30*GUN-now)/GUN))+' gün sonra öneriler görünmeye başlar.</div>';
  else{var azal=Object.keys(p.stock).filter(function(k){if(typeof p.stock[k]!=="number"||(p.excl&&p.excl[k]))return false;var R=(p.rules||{})[k];var s=parseFloat(k);if(!R&&p.maxs>0&&Math.abs(s)>p.maxs+1e-9)return false;
      if(ist2[k])return false;if(satYeter&&satisSay(p,k,dBas)>0)return false;var th=R?R.thr:p.thr,tg=R?R.tgt:p.tgt;return tg>2}).sort(function(a,b){return parseFloat(a)-parseFloat(b)});
    if(!azal.length)h+='<div class="hint" style="margin-top:8px">Şu an böyle bir cam yok.</div>';
    else{h+=(azal.length>10?'<details style="margin-top:8px"><summary class="hint"><b>'+azal.length+' cam</b> · listeyi göster</summary>':'')+'<table class="list" style="margin-top:8px"><thead><tr><th>SPH / CYL</th><th>STOK</th><th>ŞU ANKİ KURAL</th><th>ÖNERİ</th><th></th></tr></thead><tbody>';
      azal.slice(0,40).forEach(function(k){var R=(p.rules||{})[k],th=R?R.thr:p.thr,tg=R?R.tgt:p.tgt,ntg=Math.max(1,Math.ceil(tg/2)),nth=Math.max(1,Math.min(th,ntg)-(ntg>1?1:0));
        h+='<tr><td><b>'+dk(k)+'</b></td><td>'+p.stock[k]+'</td><td>'+th+' / '+tg+'</td><td>'+nth+' / '+ntg+'</td><td><button class="btn alt sm" data-anazal="'+k+'" data-th="'+nth+'" data-tg="'+ntg+'">Azalt</button> <button class="btn alt sm" data-anexc="'+k+'">Siparişe girmesin</button></td></tr>'});
      h+='</tbody></table>'+(azal.length>10?'</details>':'')+(azal.length>40?'<div class="hint">İlk 40 cam gösteriliyor ('+azal.length+' cam).</div>':'')+(satYeter?'':'<div class="hint" style="margin-top:6px">Not: Satış kaydı henüz '+A.durgun+' ayı doldurmadığı için yalnızca sipariş geçmişine bakıldı. Stoğu sınırın üstünde kalan ama satılan camlar da bu listede çıkabilir; karar vermeden önce kontrol edin.</div>')}}
  h+='</div>';
  // 3) en sık sipariş edilenler
  var sik=liste.slice().sort(function(a,b){return b.kez-a.kez||b.adet-a.adet}).slice(0,15);
  h+='<div class="card"><b>En sık sipariş edilen camlar</b>';
  if(!sik.length)h+='<div class="hint" style="margin-top:8px">Bu dönemde sipariş yok.</div>';
  else{h+='<table class="list" style="margin-top:8px"><thead><tr><th>SPH / CYL</th><th>SİPARİŞ</th><th>ADET</th><th>AYLIK ORT.</th><th>SON</th><th>STOKTA</th></tr></thead><tbody>';
    sik.forEach(function(r){h+='<tr><td><b>'+dk(r.k)+'</b>'+(r.tek?'<span class="tekb">tek '+r.tek+'</span>':'')+'</td><td>'+r.kez+' kez</td><td>'+r.adet+'</td><td>'+(r.adet/Math.max(1,gun/30)).toFixed(1)+'</td><td>'+tarihKisa(r.son)+'</td><td>'+(typeof p.stock[r.k]==="number"?p.stock[r.k]:'yok')+'</td></tr>'});
    h+='</tbody></table>'}
  h+='</div>';
  // 4) satış hızı
  h+='<div class="card"><b>Satış hızı</b>';
  if(!satTakipGun)h+='<div class="hint" style="margin-top:8px">Satış hızı, Stok sekmesindeki <b>Satış modu</b> ile kaydedilen satışlardan ölçülür. Satış modunda her dokunuş tarihiyle kaydedilir; “Geri al” kaydı siler. İlk satışla birlikte burada görünmeye başlar.</div>';
  else{var sg=Math.max(1,Math.min(gun,satTakipGun)),hiz=Object.keys(p.satis||{}).map(function(k){return {k:k,n:satisSay(p,k,bas)}}).filter(function(r){return r.n>0}).sort(function(a,b){return b.n-a.n});
    var hzOk=sg>=7;h+='<div class="sum" style="margin-top:8px"><div><b>'+satToplam+'</b><span>satış ('+sg+' gün)</span></div>'+(hzOk?'<div><b>'+(satToplam/sg*7).toFixed(1)+'</b><span>haftalık ort.</span></div><div><b>'+(satToplam/sg*30).toFixed(1)+'</b><span>aylık ort.</span></div>':'')+'</div>';
    if(hiz.length){h+='<table class="list"><thead><tr><th>SPH / CYL</th><th>SATIŞ</th><th>AYLIK HIZ</th><th>STOK</th><th>YAKLAŞIK BİTİŞ</th></tr></thead><tbody>';
      hiz.slice(0,15).forEach(function(r){var gh=r.n/sg,st=typeof p.stock[r.k]==="number"?p.stock[r.k]:0;h+='<tr><td><b>'+dk(r.k)+'</b></td><td>'+r.n+'</td><td>'+(hzOk?(gh*30).toFixed(1):'—')+'</td><td>'+st+'</td><td>'+(st<=0?'tükendi':hzOk?Math.round(st/gh)+' gün':'—')+'</td></tr>'});
      h+='</tbody></table>'}
    if(!hzOk)h+='<div class="hint" style="margin-top:6px">Satış kaydı '+satTakipGun+' günlük. Satış hızı ve bitiş tahmini en az 7 günlük kayıttan sonra gösterilir.</div>';else if(satTakipGun<30)h+='<div class="hint" style="margin-top:6px">Satış kaydı '+satTakipGun+' günlük; hızlar en az bir ay sonra daha güvenilir olur.</div>'}
  h+='</div>';
  // ayarlar
  h+='<div class="card"><b>Analiz ayarları</b><label>Stoğa ekleme önerisi için en az kaç tek seferlik sipariş<input type="number" id="antek" min="1" value="'+A.tekMin+'"></label><label>Hareketsiz sayılması için kaç ay sipariş edilmemiş olmalı<input type="number" id="andur" min="1" value="'+A.durgun+'"></label></div>';
  return h}
function anNav(){var nv=document.querySelector("nav");if(!nv)return;var b=nv.querySelector('[data-t="analiz"]');if(!b){b=document.createElement("button");b.dataset.t="analiz";b.textContent="Analiz";nv.insertBefore(b,nv.querySelector('[data-t="ayar"]'))}b.className=tab==="analiz"?"on":""}
var renderAnBase=render;render=function(){renderAnBase();anNav()};
var openCellAn=openCell;openCell=function(k){openCellAn(k);var p=P(),n=satisSay(p,k,Date.now()-90*GUN),ist=siparisIst(p,0)[k],hint=$("panel").querySelector(".hint");
  if(hint)hint.insertAdjacentHTML("afterend",'<div class="hint">Son 90 günde '+n+' satış · '+(ist?ist.kez+' siparişte '+ist.adet+' adet, son: '+tarihKisa(ist.son):'hiç sipariş edilmedi')+'</div>')};
document.addEventListener("click",function(e){var t=e.target.closest&&e.target.closest("button");if(!t)return;var d=t.dataset,p;
  if(d.and!==undefined){var A=anAyar();A.donem=+d.and;anKaydet(A);render();return}
  if(d.anadd){p=P();var th=+d.th,tg=+d.tg;if(typeof p.stock[d.anadd]!=="number")p.stock[d.anadd]=0;if(!p.rules)p.rules={};if(th!==p.thr||tg!==p.tgt)p.rules[d.anadd]={thr:th,tgt:tg};else delete p.rules[d.anadd];
    if(p.excl)delete p.excl[d.anadd];save();render();toast(dk(d.anadd)+" stoğa eklendi; bir sonraki siparişte "+tg+" adet sipariş edilecek");return}
  if(d.anazal){p=P();if(!p.rules)p.rules={};p.rules[d.anazal]={thr:+d.th,tgt:+d.tg};save();render();toast(dk(d.anazal)+": artık stok "+d.th+" adedin altına düşünce "+d.tg+" adede tamamlanacak");return}
  if(d.anexc){p=P();if(!p.excl)p.excl={};p.excl[d.anexc]=1;save();render();toast(dk(d.anexc)+" artık siparişe girmeyecek");return}});
document.addEventListener("change",function(e){var id=e.target.id;if(id!=="antek"&&id!=="andur")return;var A=anAyar(),v=Math.max(1,parseInt(e.target.value,10)||1);if(id==="antek")A.tekMin=v;else A.durgun=v;anKaydet(A);render()});

/* ---------- Arayüz: özet rozetleri, simgeli menü, renk geçişli tablo, hücre vurgusu, satış modu hissi ---------- */
(function(){if(document.getElementById("cs-ui-css"))return;var st=document.createElement("style");st.id="cs-ui-css";st.textContent=":root{--z:#c0392b;--ztx:#fff;--mid:#f1f7e6;--midtx:#4d6b1f;--warn:#fff1d6;--warntx:#8a5a00;--sat:#b4571c}\n@media (prefers-color-scheme:dark){:root:not([data-theme=\"light\"]){--z:#8f2a20;--ztx:#ffe9e4;--mid:#1f2f18;--midtx:#b9d98f;--warn:#3a2c10;--warntx:#ffcf7a;--sat:#9a4a16}}\n:root[data-theme=\"dark\"]{--z:#8f2a20;--ztx:#ffe9e4;--mid:#1f2f18;--midtx:#b9d98f;--warn:#3a2c10;--warntx:#ffcf7a;--sat:#9a4a16}\ntd.z{background:var(--z)!important;color:var(--ztx)!important;font-weight:800}\ntd.mid{background:var(--mid);color:var(--midtx);font-weight:600}\ntd.hlc{box-shadow:inset 0 0 0 3px var(--acc)}th.hl{background:var(--acc)!important;color:var(--acctx)!important}\ntd.flash{animation:csflash 1.4s ease}@keyframes csflash{0%,60%{box-shadow:inset 0 0 0 4px #f5b400}100%{box-shadow:inset 0 0 0 0 transparent}}\n.ozet{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}\n.oz{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:999px;padding:8px 14px;font:inherit;font-size:14px;cursor:pointer;min-height:40px}\n.oz b{font-size:16px}.oz.red{background:var(--low);color:var(--lowtx);border-color:transparent}.oz.warn{background:var(--warn);color:var(--warntx);border-color:transparent}.oz.good{background:var(--ok);color:var(--oktx);border-color:transparent}\n.altseg{display:inline-flex;margin-bottom:12px}\nnav{padding-top:4px}\nnav button{display:flex;flex-direction:column;align-items:center;gap:3px;font-size:12px;padding:6px 0 10px;position:relative}\nnav button svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}\nnav .nb{position:absolute;top:0;left:calc(50% + 8px);background:#e0533d;color:#fff;border-radius:999px;font-size:11px;font-weight:700;min-width:18px;height:18px;line-height:18px;padding:0 5px;text-align:center}\n.card>.hint{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;cursor:pointer}\n.card>.hint.acik{display:block;-webkit-line-clamp:unset}\n.qn{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin:-4px 0 10px}.qn button{min-width:44px;height:40px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:var(--ink);font:inherit;font-weight:700;cursor:pointer}\nbody.satis-acik header,body.satis-acik::before{background:var(--sat)!important}\n.eksi{position:fixed;z-index:40;font-weight:900;font-size:22px;color:#e0533d;pointer-events:none;animation:cseksi .8s ease-out forwards}@keyframes cseksi{from{opacity:1;transform:translate(-50%,-50%)}to{opacity:0;transform:translate(-50%,-180%)}}\n.btn.sm,.seg button{min-height:40px}\n.btn:active,.chip:active,.oz:active,nav button:active,.seg button:active,.qn button:active{transform:scale(.96)}\n#main.gecis>*{animation:csfade .22s ease}@keyframes csfade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}\n@media (prefers-reduced-motion:reduce){#main.gecis>*,td.flash,.eksi{animation:none}.btn:active,.chip:active,.oz:active,nav button:active{transform:none}}\n";document.head.appendChild(st)})();
function tgtOf(p,k){var r=(p.rules||{})[k];return r?r.tgt:p.tgt}
function cellCls(p,k,n){return n===0?"z low":n<thrOf(p,k)?"low":n<tgtOf(p,k)?"mid":"ok"}
var IKON={stok:'<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  siparis:'<svg viewBox="0 0 24 24"><path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L20 8H6"/><circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/></svg>',
  analiz:'<svg viewBox="0 0 24 24"><path d="M5 20V11M11 20V5M17 20v-6M3 20h18"/></svg>',
  gecmis:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  ayar:'<svg viewBox="0 0 24 24"><path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/></svg>'};
var AD={stok:"Stok",siparis:"Sipariş",analiz:"Analiz",gecmis:"Geçmiş",ayar:"Ayarlar"};
function siparisBekleyen(){var n=0;(state&&state.prods||[]).forEach(function(p){n+=orders(p).length+(p.tek||[]).length});return n}
function navFix(){var nv=document.querySelector("nav");if(!nv)return;var tk=nv.querySelector('[data-t="tek"]');if(tk)tk.style.display="none";
  ["stok","siparis","analiz","gecmis","ayar"].forEach(function(t){var b=nv.querySelector('[data-t="'+t+'"]');if(!b)return;nv.appendChild(b);
    var n=t==="siparis"?siparisBekleyen():0;b.innerHTML=IKON[t]+'<span>'+AD[t]+'</span>'+(n?'<span class="nb">'+n+'</span>':'');
    b.className=(tab===t||(t==="siparis"&&tab==="tek"))?"on":"";b.setAttribute("aria-label",AD[t]+(n?" ("+n+" bekliyor)":""))})}
function ozetBar(){var p=P(),o=orders(p).length,y=Object.keys(p.transit||{}).filter(function(k){return p.transit[k]>0}).length,tk=tekCount(),d=daysSinceFile(),n=dirtyN(),h='<div class="ozet">';
  if(o)h+='<button class="oz red" data-go="siparis"><b>'+o+'</b> cam sipariş bekliyor</button>';else h+='<button class="oz good" data-go="siparis">👍 Stoklar yerinde</button>';
  if(y)h+='<button class="oz" data-go="siparis">🚚 <b>'+y+'</b> çeşit yolda</button>';
  if(tk)h+='<button class="oz" data-go="tek">⭐ <b>'+tk+'</b> tek sipariş</button>';
  var acil=d===null||d>=7,yz=d===null?"Henüz yedek yok":n>0?"Yedek: "+n+" değişiklik bekliyor":"Yedek: "+(d===0?"bugün":d+" gün önce");
  h+='<button class="oz '+(acil?"red":n>0?"warn":"good")+'" id="bkfile" title="Yedeği Dosyalar’a kaydet">💾 '+yz+'</button>';
  return h+'</div>'}
var reminderUi=reminder;reminder=function(){var r=reminderUi();if(/Stok henüz boş|Hoş geldiniz/.test(r))return r;return ozetBar()};
function altSeg(){var n=tekCount();return '<div class="seg altseg"><button data-go="siparis" class="'+(tab==="siparis"?"on":"")+'">Sipariş listesi</button><button data-go="tek" class="'+(tab==="tek"?"on":"")+'">Tek sipariş'+(n?" ("+n+")":"")+'</button></div>'}
var sonTab=null,renderUi=render;render=function(){renderUi();navFix();var m=$("main");
  if(tab==="siparis"||tab==="tek"){var oz=m.querySelector(".ozet");if(oz)oz.insertAdjacentHTML("afterend",altSeg());else m.insertAdjacentHTML("afterbegin",altSeg())}
  document.body.classList.toggle("satis-acik",!!sale&&tab==="stok");
  if(sonTab!==tab){m.classList.remove("gecis");void m.offsetWidth;m.classList.add("gecis");sonTab=tab}};
function hlTemizle(){document.querySelectorAll(".hl,.hlc").forEach(function(e){e.classList.remove("hl","hlc")})}
var openCellUi=openCell;openCell=function(k){hlTemizle();openCellUi(k);var td=document.querySelector('td[data-k="'+k+'"]');if(td){td.classList.add("hlc");var tr=td.parentElement;if(tr.firstElementChild)tr.firstElementChild.classList.add("hl");var th=document.querySelectorAll("thead th")[td.cellIndex];if(th)th.classList.add("hl")}
  var st=$("panel").querySelector(".step");if(st){var q='<div class="qn">';[0,1,2,3,4,5,6,8,10].forEach(function(n){q+='<button data-qn="'+n+'">'+n+'</button>'});st.insertAdjacentHTML("afterend",q+'</div>')}};
document.addEventListener("click",function(e){var t=e.target.closest&&e.target.closest("button,.hint");if(!t)return;var d=t.dataset||{};
  if(t.classList.contains("hint")&&t.parentElement&&t.parentElement.classList.contains("card")){t.classList.toggle("acik");return}
  if(d.go){tab=d.go;render();window.scrollTo({top:0,behavior:"smooth"});return}
  if(d.qn!==undefined){var v=$("val");if(v){v.value=d.qn;v.focus()}return}});
document.addEventListener("click",function(){setTimeout(function(){if(!$("sheet").classList.contains("show"))hlTemizle()},0)});
window.addEventListener("click",function(e){var td=e.target.closest&&e.target.closest("td[data-k]");if(!td||!sale||tab!=="stok"||last!==td.dataset.k)return;
  var r=td.getBoundingClientRect(),s=document.createElement("span");s.className="eksi";s.textContent="−1";s.style.left=(r.left+r.width/2)+"px";s.style.top=(r.top+r.height/2)+"px";document.body.appendChild(s);setTimeout(function(){s.remove()},850)});
var araT=null;window.addEventListener("input",function(e){if(e.target.id!=="fs"&&e.target.id!=="fc")return;clearTimeout(araT);araT=setTimeout(function(){var cr=parseRx($("fs").value,$("fc").value,cylMode());if(!cr)return;
  var td=document.querySelector('td[data-k="'+key(cr.s,cr.c)+'"]'),w=document.querySelector(".wrap");if(!td||!w)return;
  w.scrollTo({left:Math.max(0,td.offsetLeft-w.clientWidth/2+td.offsetWidth/2),top:Math.max(0,td.offsetTop-w.clientHeight/2),behavior:"smooth"});td.classList.remove("flash");void td.offsetWidth;td.classList.add("flash")},500)});

/* ---------- Sipariş adım şeridi, analiz grafikleri, çeşit renkleri ---------- */
(function(){if(document.getElementById("cs-ui2-css"))return;var st=document.createElement("style");st.id="cs-ui2-css";st.textContent=".adim{display:flex;align-items:flex-start;margin:4px 0 12px;gap:0}\n.adim .a{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;position:relative;font-size:13px;color:var(--mute);text-align:center}\n.adim .a:not(:last-child)::after{content:\"\";position:absolute;top:15px;left:calc(50% + 18px);right:calc(-50% + 18px);height:3px;border-radius:2px;background:var(--line)}\n.adim .a.ok:not(:last-child)::after{background:var(--acc)}\n.adim .n{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;border:2px solid var(--line);background:var(--card);color:var(--mute)}\n.adim .a.ok .n{background:var(--acc);border-color:var(--acc);color:var(--acctx)}\n.adim .a.on .n{border-color:var(--acc);color:var(--acc);box-shadow:0 0 0 5px color-mix(in srgb,var(--acc) 22%,transparent)}\n.adim .a.on,.adim .a.ok{color:var(--ink);font-weight:700}\n.sirada{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.sirada .btn{font-size:17px;padding:13px 20px}\n.grafik{display:flex;align-items:flex-end;gap:6px;height:150px;margin-top:10px;padding-top:18px}\n.grafik .s{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:4px;min-width:0}\n.grafik .c{width:100%;max-width:46px;border-radius:6px 6px 2px 2px;background:var(--acc);min-height:2px;position:relative}\n.grafik .c.bos{background:var(--line)}\n.grafik .v{font-size:12px;font-weight:700;color:var(--ink)}.grafik .l{font-size:11px;color:var(--mute);white-space:nowrap}\n.cubuk{display:grid;grid-template-columns:minmax(110px,auto) 1fr auto;gap:6px 10px;align-items:center;margin-top:10px;font-variant-numeric:tabular-nums}\n.cubuk .bar{height:16px;border-radius:999px;background:var(--acc);min-width:4px}.cubuk .bg{background:var(--bg);border-radius:999px;overflow:hidden}\n.cubuk .lab{font-weight:700;white-space:nowrap}.cubuk .val{font-size:13px;color:var(--mute);white-space:nowrap}\n.renkler{display:flex;gap:10px;flex-wrap:wrap;margin-top:8px}.renkler button{width:38px;height:38px;border-radius:50%;border:3px solid transparent;cursor:pointer}\n.renkler button.on{border-color:var(--ink);box-shadow:0 0 0 2px var(--card) inset}\n";document.head.appendChild(st)})();
var HAZIR_RENK={"1.56 HMC":"#d9a400","U.C. 1.49":"#2c4a8a"};var RENKLER=["#d9a400","#2c4a8a","#0f8f7a","#c2410c","#7c3aed","#be185d","#4d7c0f","#475569"];
function renkOf(p,i){if(p.renk)return p.renk;if(HAZIR_RENK[p.name])return HAZIR_RENK[p.name];return RENKLER[(i===undefined?state.prods.indexOf(p):i)%RENKLER.length]}
function yaziRengi(hex){var c=hex.replace("#",""),r=parseInt(c.substr(0,2),16),g=parseInt(c.substr(2,2),16),b=parseInt(c.substr(4,2),16);return (0.299*r+0.587*g+0.114*b)/255>0.6?"#14212b":"#ffffff"}
function renkUygula(){var hd=document.querySelector("header");if(!hd||!state||!state.prods||!state.prods.length)return;var p=state.prods[state.cur];if(!p)return;var rk=renkOf(p,state.cur);hd.style.boxShadow="inset 0 -4px 0 "+rk;
  document.querySelectorAll(".chip[data-p]").forEach(function(c){var i=+c.dataset.p,q=state.prods[i];if(!q)return;var r=renkOf(q,i);
    if(i===state.cur){c.style.background=r;c.style.borderColor=r;c.style.color=yaziRengi(r)}else{c.style.background="";c.style.color="";c.style.borderColor=r}})}
function adimDurum(p){var o=orders(p).length+(p.tek||[]).length,y=Object.keys(p.transit||{}).some(function(k){return p.transit[k]>0});
  if(y)return 3;if(o)return p.gonderildi?2:1;var son=(state.hist||[]).filter(function(h){return h.prod===p.name})[0];return son&&son.st==="geldi"?4:0}
function adimHtml(){var p=P(),a=adimDurum(p),ad=["Liste hazır","Gönderildi","Yolda","Geldi"],h='<div class="card"><div class="adim">';
  ad.forEach(function(t,i){var n=i+1,cl=a===0?"":n<a||(a===4&&n===4)?"ok":n===a?"on":"";if(a===2&&n===2)cl="ok";h+='<div class="a '+cl+'"><span class="n">'+(cl==="ok"?"✓":n)+'</span>'+t+'</div>'});
  h+='</div><div class="sirada">';
  if(a===1)h+='<a class="btn" id="wa2" target="_blank" rel="noopener" href="https://wa.me/?text='+encodeURIComponent(text())+'">WhatsApp’a gönder</a><button class="btn alt" data-st="pdf">PDF olarak kaydet</button><span class="hint">Gönderince sıradaki adım: Sipariş verdim</span>';
  else if(a===2)h+='<button class="btn" data-st="sent">Sipariş verdim</button><button class="btn alt" data-st="geri">Listeyi tekrar gönder</button><span class="hint">Liste '+tarihKisa(p.gonderildi)+' tarihinde gönderildi</span>';
  else if(a===3)h+='<button class="btn" data-st="arrived">Hepsi geldi</button><button class="btn alt" data-st="partial">Kısmen geldi</button><button class="btn alt" data-st="kontrol">Kontrol listesi (PDF)</button>';
  else if(a===4)h+='<span class="hint">👍 Son sipariş geldi. Yeni sipariş gerekince liste burada hazırlanır.</span>';
  else h+='<span class="hint">👍 Stoklar yerinde. Sipariş edilecek cam yok.</span>';
  return h+'</div></div>'}
function gonderildiIsaretle(){var p=P();p.gonderildi=Date.now();save();setTimeout(render,300)}
/* analiz grafikleri */
function aylikGrafik(p,ay){var now=new Date(),aylar=[];for(var i=ay-1;i>=0;i--){var d=new Date(now.getFullYear(),now.getMonth()-i,1);aylar.push({y:d.getFullYear(),m:d.getMonth(),n:0})}
  (state.hist||[]).forEach(function(h){if(h.prod!==p.name||h.st==="iptal")return;var d=new Date(h.d);aylar.forEach(function(a){if(a.y===d.getFullYear()&&a.m===d.getMonth())a.n+=h.qty||0})});
  var mx=Math.max.apply(null,aylar.map(function(a){return a.n}).concat([1])),h='<div class="grafik">';
  aylar.forEach(function(a){h+='<div class="s"><span class="v">'+(a.n||"")+'</span><div class="c'+(a.n?"":" bos")+'" style="height:'+Math.max(2,Math.round(a.n/mx*100))+'%"></div><span class="l">'+new Date(a.y,a.m,1).toLocaleDateString("tr-TR",{month:"short"})+'</span></div>'});return h+'</div>'}
function haftalikSatis(p){var now=Date.now(),hf=[];for(var i=7;i>=0;i--)hf.push({bas:now-(i+1)*7*GUN,bit:now-i*7*GUN,n:0});
  Object.keys(p.satis||{}).forEach(function(k){var g=p.satis[k];Object.keys(g).forEach(function(d){var t=new Date(d+"T12:00:00").getTime();hf.forEach(function(w){if(t>w.bas&&t<=w.bit)w.n+=g[d]})})});
  var mx=Math.max.apply(null,hf.map(function(w){return w.n}).concat([1])),h='<div class="grafik">';
  hf.forEach(function(w,i){h+='<div class="s"><span class="v">'+(w.n||"")+'</span><div class="c'+(w.n?"":" bos")+'" style="height:'+Math.max(2,Math.round(w.n/mx*100))+'%"></div><span class="l">'+(i===7?"bu hafta":(7-i)+" hf önce")+'</span></div>'});return h+'</div>'}
function sikCubuk(p,bas){var ist=siparisIst(p,bas),l=Object.keys(ist).map(function(k){return ist[k]}).sort(function(a,b){return b.kez-a.kez||b.adet-a.adet}).slice(0,12);
  if(!l.length)return '<div class="hint" style="margin-top:8px">Bu dönemde sipariş yok.</div>';var mx=Math.max.apply(null,l.map(function(r){return r.adet})),h='<div class="cubuk">';
  l.forEach(function(r){h+='<span class="lab">'+dk(r.k)+(r.tek?'<span class="tekb">tek</span>':'')+'</span><span class="bg"><span class="bar" style="display:block;width:'+Math.max(3,Math.round(r.adet/mx*100))+'%"></span></span><span class="val">'+r.kez+' kez · '+r.adet+' adet'+(typeof p.stock[r.k]==="number"?'':' · stokta yok')+'</span>'});return h+'</div>'}
var viewAnalizG=viewAnaliz;viewAnaliz=function(){var h=viewAnalizG(),p=P(),A=anAyar(),bas=A.donem?Date.now()-A.donem*30*GUN:0;
  var i1=h.indexOf('<div class="card"><b>Stoğa eklemeyi'),grafik='<div class="card"><b>Aylık sipariş adedi</b>'+aylikGrafik(p,A.donem||12)+'</div>';if(i1>=0)h=h.slice(0,i1)+grafik+h.slice(i1);
  var a=h.indexOf('<div class="card"><b>En sık sipariş edilen camlar</b>'),b=h.indexOf('<div class="card"><b>Satış hızı</b>');
  if(a>=0&&b>a)h=h.slice(0,a)+'<div class="card"><b>En sık sipariş edilen camlar</b>'+sikCubuk(p,bas)+'</div>'+h.slice(b);
  var c=h.indexOf('<div class="card"><b>Satış hızı</b>');if(c>=0&&Object.keys(p.satis||{}).length){var k='<div class="card"><b>Satış hızı</b>';h=h.slice(0,c)+k+'<div class="hint" style="margin-top:6px">Son 8 haftanın satışları</div>'+haftalikSatis(p)+h.slice(c+k.length)}
  return h};
function renkKart(){var p=P(),cur=renkOf(p,state.cur),h='<div class="card"><b>'+esc(p.name)+' rengi</b><div class="hint">Seçili çeşidin düğmesi ve başlıktaki çizgi bu renkte görünür; çeşitleri karıştırmamanıza yardım eder.</div><div class="renkler">';
  RENKLER.forEach(function(r){h+='<button data-renk="'+r+'" class="'+(r===cur?"on":"")+'" style="background:'+r+'" aria-label="Renk '+r+'"></button>'});return h+'</div></div>'}
var renderG=render;render=function(){renderG();var m=$("main");
  if(tab==="siparis"&&state.prods&&state.prods.length){var sg=m.querySelector(".altseg");if(sg)sg.insertAdjacentHTML("afterend",adimHtml());else m.insertAdjacentHTML("afterbegin",adimHtml())}
  if(tab==="ayar"&&state.prods&&state.prods.length){var c=m.querySelector(".card");if(c)c.insertAdjacentHTML("afterend",renkKart())}
  renkUygula()};
document.addEventListener("click",function(e){var t=e.target.closest&&e.target.closest("button,a");if(!t)return;var d=t.dataset||{},id=t.id;
  if(id==="wa2"||id==="wa"||id==="copy"||id==="pdf"){if(tab==="siparis")gonderildiIsaretle();return}
  if(d.st){if(d.st==="geri"){var p=P();p.gonderildi=0;save();render();return}var b=$(d.st);if(b)b.click();else if(d.st==="pdf"){}return}
  if(id==="sent"){var q=P();delete q.gonderildi;return}
  if(d.renk){P().renk=d.renk;save();render();toast("Renk değiştirildi");return}},true);

/* ---------- Yoldaki camlar: yazdırılabilir kontrol listesi (PDF) ---------- */
function yoldaVeri(){var out=[];state.prods.forEach(function(p){var ks=Object.keys(p.transit||{}).filter(function(k){return p.transit[k]>0}).sort(function(a,b){var x=a.split("|"),y=b.split("|");return parseFloat(x[0])-parseFloat(y[0])||parseFloat(y[1])-parseFloat(x[1])});
    var tek=[],tarih=[],sinir=Date.now()-21*GUN;(state.hist||[]).forEach(function(h){if(h.prod!==p.name)return;var acik=h.st==="yolda"||h.st==="kısmen geldi"||(h.st==="verildi"&&h.d>=sinir);if(!acik)return;tarih.push(h.d);(h.items||[]).forEach(function(x){if(x.tek)tek.push(x)})});
    if(ks.length||tek.length)out.push({p:p,ks:ks,tek:tek,tarih:tarih})});return out}
function kontrolPdf(){if(!window.jspdf){toast("PDF aracı yüklenemedi");return}var veri=yoldaVeri();if(!veri.length){toast("Yolda cam yok");return}
  var J=window.jspdf,W=1240,H=1754,M=80,RH=44,doc=new J.jsPDF({unit:"mm",format:"a4"}),font='"Avenir Next","Segoe UI",system-ui,sans-serif',SMd=supMode(),sayfa=0,cv,g,y,topC=0,topA=0;
  var cols=[M,M+70,M+300,M+620,M+800,M+990],cw=W-M-M;
  function yeni(){if(cv){if(sayfa)doc.addPage();doc.addImage(cv.toDataURL("image/jpeg",0.92),"JPEG",0,0,210,297);sayfa++}cv=document.createElement("canvas");cv.width=W;cv.height=H;g=cv.getContext("2d");g.fillStyle="#fff";g.fillRect(0,0,W,H);y=M;g.textBaseline="alphabetic"}
  function yaz(t,x,yy,f,c,al){g.font=f+" "+font;g.fillStyle=c||"#14212b";g.textAlign=al||"left";g.fillText(t,x,yy)}
  function cizgi(yy,c){g.fillStyle=c||"#d5dde2";g.fillRect(M,yy,cw,2)}
  function kutu(x,yy,w,h){g.strokeStyle="#14212b";g.lineWidth=2;g.strokeRect(x,yy,w,h)}
  function yer(h){if(y+h>H-M-90){yeni();baslik(true)}}
  function baslik(dev){yaz("YOLDAKİ CAMLAR · KONTROL LİSTESİ"+(dev?" (devam)":""),M,y+36,"700 38px");y+=58;
    yaz((typeof shopName==="function"&&shopName()?shopName()+"  •  ":"")+"Yazdırma: "+new Date().toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric"})+"  •  CYL yazımı: "+(SMd==="+"?"artı (+)":"eksi (−)")+", parantez içinde öbür yazım",M,y+22,"24px","#66767f");y+=50}
  function satirBaslik(cl){g.fillStyle="#14212b";g.fillRect(M,y,cw,RH);["#","SPH","CYL",cl||"YOLDA","GELEN","✓"].forEach(function(t,i){yaz(t,i===0?cols[0]+18:cols[i]+(i>=3?60:10),y+30,"600 22px","#fff",i>=3?"center":"left")});y+=RH}
  function cam(i,s,c,adet,not,ax){var X={s:s,c:c,a:ax};var d=asMode(s,c,SMd),o=asMode(s,c,SMd==="+"?"-":"+");yaz(String(i),cols[0]+18,y+30,"24px","#66767f");yaz(fmt(d.s),cols[1]+10,y+30,"700 28px");
    yaz(d.c===0?"0.00":fmt(d.c)+axStr(X,SMd),cols[2]+10,y+30,"700 28px");if(c!==0)yaz("("+fmt(o.s)+" / "+fmt(o.c)+axStr(X,SMd==="+"?"-":"+")+")",cols[2]+(ax?185:130),y+30,"20px","#66767f");
    yaz(String(adet),cols[3]+60,y+31,"800 30px","#14212b","center");kutu(cols[4]+20,y+7,80,30);kutu(cols[5]+46,y+8,28,28);
    if(not)yaz(not,cols[1]+10,y+RH+16,"18px","#66767f");cizgi(y+RH+(not?22:0)-2);y+=RH+(not?22:0)}
  yeni();baslik(false);
  veri.forEach(function(v){var p=v.p,ad=0;v.ks.forEach(function(k){ad+=p.transit[k]});yer(150);
    var tr=v.tarih.length?" · Sipariş: "+Array.from(new Set(v.tarih.map(function(t){return new Date(t).toLocaleDateString("tr-TR",{day:"numeric",month:"short"})}))).join(", "):"";
    g.fillStyle=renkOf(p,state.prods.indexOf(p));g.fillRect(M,y+8,10,34);yaz(p.name,M+24,y+36,"700 32px");yaz(v.ks.length+" çeşit, "+ad+" adet"+tr,M+24+g.measureText(p.name).width+30,y+36,"24px","#66767f");y+=56;
    if(v.ks.length){satirBaslik();v.ks.forEach(function(k,i){yer(RH);var a=k.split("|");cam(i+1,parseFloat(a[0]),parseFloat(a[1]),p.transit[k])});topC+=v.ks.length;topA+=ad}
    if(v.tek.length){yer(110);y+=14;yaz("Tek seferlik (müşteri için)",M,y+26,"700 24px","#0f8f7a");y+=38;satirBaslik("ADET");v.tek.forEach(function(x,i){yer(RH+24);cam(i+1,x.s,x.c,x.q,x.n?"Not: "+x.n:"",x.a)});topC+=v.tek.length;v.tek.forEach(function(x){topA+=x.q})}
    y+=26});
  yer(140);y+=10;cizgi(y,"#14212b");y+=40;yaz("Toplam: "+topC+" çeşit, "+topA+" adet",M,y,"700 28px");y+=64;
  yaz("Kontrol eden: ______________________     Tarih: ____ / ____ / ________     İmza: ______________",M,y,"24px");
  yeni();
  saveFile("Yoldaki camlar kontrol "+today()+".pdf",new Blob([doc.output("arraybuffer")]),"Kontrol listesi hazır")}
document.addEventListener("click",function(e){var t=e.target.closest&&e.target.closest("button");if(t&&t.id==="kontrol"){kontrolPdf();e.stopPropagation()}},true);
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
  if(t.tagName==="TD"&&d.k&&tab==="stok"){if(sale){var p3=P(),n3=p3.stock[d.k];if(typeof n3==="number"&&n3>0){p3.stock[d.k]=n3-1;last=d.k;logSale(p3,d.k,1);t.innerHTML=(n3-1)+((p3.transit||{})[d.k]?'<i class="yl" title="yolda">+'+p3.transit[d.k]+'</i>':'');t.className=cellCls(p3,d.k,n3-1)+(ruleOf(p3,d.k)?" ozel":"")+(p3.excl&&p3.excl[d.k]?" ex":"")+((p3.transit||{})[d.k]?" tr":"");save();toast(d.k.replace("|"," / ")+": "+(n3-1)+" kaldı")}else toast("Bu camda stok yok")}else openCell(d.k);return}
  var id=t.id;
  if(id==="askok"){var f=pending;sheetClose();if(f)f();return}
  if(id==="exc"){var pe=P();if(!pe.excl)pe.excl={};if(pe.excl[cur])delete pe.excl[cur];else pe.excl[cur]=1;save();$("sheet").className="sheet";render();return}
  if((id==="sheet"&&e.target===t)||id==="cx"){sheetClose();return}
  if(id==="dn"||id==="up"){var v=$("val"),n=parseInt(v.value||"0",10)||0;n=Math.max(0,n+(id==="up"?1:-1));v.value=n;return}
  if(id==="ok"){var x=$("val").value;setCell(x===""?null:Math.max(0,parseInt(x,10)||0));return}
  if(id==="del"){setCell(null);return}
  if(id==="copy"){cp(text(),"Liste kopyalandı");return}
  if(id==="pdf"){var pp=P(),oo=supplierList(pp),tq0=0;oo.forEach(function(x){tq0+=x.q});var c0=calc(tq0,pp.cost||0,pp.kdv||0);pdfFor(pp.name,oo,pp.cost?"Ara toplam: "+tl(c0.net)+"  •  KDV: "+tl(c0.tax)+"  •  Fatura tutarı: "+tl(c0.tot):"");return}
  if(d.ph){var hp=state.hist.filter(function(x){return String(x.id)===d.ph})[0];if(hp){pdfFor(hp.prod,mergeItems(hp.items),hp.tot?"Fatura tutarı: "+tl(hp.tot):"")}return}
  if(d.dh){if(t.dataset.arm!=="1"){t.dataset.arm="1";t.textContent="Silinsin mi?";return}state.hist=state.hist.filter(function(x){return String(x.id)!==d.dh});save();render();return}
  if(d.ch){var hh=state.hist.filter(function(x){return String(x.id)===d.ch})[0];if(hh){var NL3="\n",tx3="SİPARİŞ EDİLECEK CAMLAR"+NL3+hh.prod+NL3+NL3+"SPH / "+cylHdr()+" / ADET"+NL3;mergeItems(hh.items).forEach(function(x){tx3+=fS(x)+" / "+fC(x,"-")+" / "+x.q+NL3});cp(tx3,"Liste kopyalandı")}return}
  if(id==="sale"){sale=!sale;if(sale)selMode=false;last=null;render();return}
  if(id==="undo"){if(last){var p4=P();p4.stock[last]=(p4.stock[last]||0)+1;logSale(p4,last,-1);var td=document.querySelector('td[data-k="'+last+'"]');if(td){td.innerHTML=p4.stock[last]+((p4.transit||{})[last]?'<i class="yl" title="yolda">+'+p4.transit[last]+'</i>':'');td.className=cellCls(p4,last,p4.stock[last])+(ruleOf(p4,last)?" ozel":"")+(p4.excl&&p4.excl[last]?" ex":"")+((p4.transit||{})[last]?" tr":"")}last=null;save();toast("Geri alındı")}else toast("Geri alınacak satış yok");return}
  if(id==="sent"){var q=P(),os=orders(q),tq=0,items=[];os.forEach(function(x){q.transit[x.k]=(q.transit[x.k]||0)+x.q;tq+=x.q;items.push({s:x.s,c:x.c,q:x.q})});(q.tek||[]).forEach(function(x){tq+=x.q;items.push(x.a?{s:x.s,c:x.c,q:x.q,tek:1,n:x.n||"",a:x.a}:{s:x.s,c:x.c,q:x.q,tek:1,n:x.n||""})});q.tek=[];if(items.length){var cc=calc(tq,q.cost||0,q.kdv||0);state.hist.unshift({id:Date.now(),d:Date.now(),prod:q.name,items:items,qty:tq,cost:q.cost||0,kdv:q.kdv||0,tot:q.cost?cc.tot:0,st:os.length?"yolda":"verildi"})}save();toast("Sipariş kaydedildi, yolda");render();return}
  if(id==="arrived"){var q2=P();Object.keys(q2.transit).forEach(function(k){q2.stock[k]=(q2.stock[k]||0)+q2.transit[k]});q2.transit={};state.hist.forEach(function(h){if(h.prod===q2.name&&(h.st==="yolda"||h.st==="kısmen geldi")){h.st="geldi"}});save();toast("Stoğa eklendi");render();return}
  if(id==="cleartr"){var q5=P();q5.transit={};state.hist.forEach(function(h){if(h.prod===q5.name&&(h.st==="yolda"||h.st==="kısmen geldi")){h.st="iptal"}});save();render();return}
  if(id==="exp"){var q3=P(),TB="\t",NL="\n",hd=["SPH"],j,i,rw,lines=[];for(j=0;j<=20;j++)hd.push(fmt(-j*.25));lines.push(hd.join(TB));var hi=24,lo=-20;Object.keys(q3.stock).forEach(function(k){var x=Math.round(parseFloat(k)*4);if(x>hi)hi=x;if(x<lo)lo=x});for(i=hi;i>=lo;i--){rw=[fmt(i*.25)];for(j=0;j<=20;j++){var v2=q3.stock[key(i*.25,-j*.25)];rw.push(typeof v2==="number"?v2:"")}lines.push(rw.join(TB))}cp(lines.join(NL),"Tablo kopyalandı");return}
  if(id==="impgo"){var tx2=$("imp").value.split("\r").join(""),q4_=P(),TB2="\t",ls=tx2.split("\n"),hd2=(ls[0]||"").split(TB2),cnt=0;for(var r=1;r<ls.length;r++){var cs=ls[r].split(TB2),sv=parseFloat((cs[0]||"").replace(",","."));if(isNaN(sv))continue;sv=Math.round(sv*4)/4;for(var c=1;c<cs.length;c++){var cv=parseFloat((hd2[c]||"").replace(",",".")),nv=parseInt((cs[c]||"").trim(),10);if(isNaN(cv)||isNaN(nv))continue;q4_.stock[key(sv,-Math.abs(Math.round(cv*4)/4))]=Math.max(0,nv);cnt++}}save();toast(cnt+" hücre yüklendi");return}
  if(id==="demo"){ask("Örnek veri yüklensin mi?",P().name+" stoğu rastgele örnek veriyle değiştirilecek.","Örnek veriyi yükle",function(){seed(P());save();render();toast("Örnek veri yüklendi")});return}
  if(id==="clear"){ask("Stok temizlensin mi?",P().name+" stoğunun tamamı silinecek.","Stoğu temizle",function(){P().stock={};save();render();toast("Stok temizlendi")});return}
  if(id==="addp"){var nm=$("np").value.trim();if(nm){if(state.prods.some(function(p){return p.name.toLowerCase()===nm.toLowerCase()})){toast("Bu adla bir çeşit zaten var");return}state.prods.push(mk(nm,false));state.cur=state.prods.length-1;save();render()}return}
  if(id==="delp"){ask("Çeşit silinsin mi?","“"+P().name+"” ve tüm stoğu silinecek.","Çeşidi sil",function(){state.prods.splice(state.cur,1);state.cur=0;save();render()});return}
  // ---- Veri ve yedek ----
  if(id==="bkfile"){saveFile("CamStok-yedek-"+today()+".json",JSON.stringify(Object.assign({},state,{gorseller:gAll()}),null,1),"Yedek kaydedildi",function(){backedUp();$("sheet").className="sheet";render()});return}
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
try{load();lastSig=sigOf();render();status();dailyAsk();if("serviceWorker" in navigator&&location.protocol==="https:")navigator.serviceWorker.register("sw.js").catch(function(){})}catch(er){window.onerror(er&&er.message,"",0)}
})();
