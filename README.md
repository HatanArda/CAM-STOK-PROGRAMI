# CamStok: Masaüstü Uygulaması (Mac ve Windows)

Gözlükçü cam stok takibi ve otomatik sipariş listesi. İnternet gerekmez; kendi penceresinde açılır.

---

## 1. Neden Electron?

- **Kurulumu kolay:** Tek gereken program **Node.js**. (Tauri, Rust programlama dilinin ve
  ek derleme araçlarının kurulmasını ister; yazılımcı olmayan biri için zahmetli.)
- **Her yerde aynı görünüm:** Electron, Chrome motorunu uygulamanın içine koyar. Mevcut
  CamStok sayfanız Mac'te ve Windows'ta birebir aynı görünür.
- **Bakımı basit:** Arayüz yine HTML/JavaScript. Dosyaya kaydetme, yedek, Excel ve PDF
  işleri için hazır ve yaygın araçlar var.
- **Bedeli:** Kurulum dosyası biraz büyük (~100 MB). Bir gözlükçü bilgisayarı için sorun değil.

---

## 2. Klasörde ne var?

| Yer | Ne işe yarar |
|---|---|
| `src/renderer/index.html` | Ekran tasarımı (orijinal CamStok.html'in tasarımı, aynen) |
| `src/renderer/app.js` | Ekranların çalışması (orijinal betik, dosyaya kayıt için uyarlandı) |
| `src/renderer/logic.js` | Sipariş kuralı ve fatura hesabı (testler de bunu kullanır) |
| `src/main.js` | Pencere, menüler, dosya seçme pencereleri, PDF, tema |
| `src/store.js` | Veri dosyasına kayıt ve günlük yedek |
| `src/excel.js` | Excel'e aktar / Excel'den yükle |
| `test/` | Otomatik testler |
| `private/` | **Özel dosyalar** (başlangıç stoğu). Git'e/GitHub'a **gönderilmez**. |
| `build/` | Uygulama simgesi ve Mac imza adımı |

---

## 3. Bilgisayarınızda ilk kez çalıştırma (deneme)

Bunu **bir kez** yapmanız yeterli.

### Adım 1: Node.js'i kurun
1. https://nodejs.org adresine gidin.
2. **"LTS"** yazan sürümü indirin (Mac için `.pkg`, Windows için `.msi`).
3. İndirilen dosyayı açıp "İleri / Devam" diyerek kurun.

### Adım 2: Proje klasörünü açın
- Proje klasörünü (içinde `package.json` olan klasör) Masaüstüne koyun ve adını `CamStok` bırakın.
- **Mac:** Terminal'i açın (Spotlight'ta `Terminal` yazın). Şunu yazın, ama Enter'a basmadan önce
  `cd ` yazıp bir boşluk bırakın, sonra klasörü Finder'dan Terminal penceresine sürükleyip bırakın, ardından Enter:
  ```
  cd /Users/ADINIZ/Desktop/CamStok
  ```
- **Windows:** Klasörü açın, üstteki adres çubuğuna tıklayın, `cmd` yazıp Enter'a basın.
  Siyah bir pencere (Komut İstemi) doğrudan o klasörde açılır.

### Adım 3: Gerekli parçaları indirin (bir kez, birkaç dakika sürer)
```
npm install
```

### Adım 4: Uygulamayı açın
```
npm start
```
CamStok penceresi açılır. Kapatmak için pencereyi kapatmanız yeterli.

### (İsteğe bağlı) Testleri çalıştırın
```
npm test
```

---

## 4. Kurulum dosyası üretme

> **Önemli:** Mac kurulum dosyası (`.dmg`) **yalnızca bir Mac'te**, Windows kurulum dosyası
> (`.exe`) **en kolay bir Windows bilgisayarda** üretilir. Yani ikisi için de ayrı bilgisayar
> gerekir. Elinizde ikisi yoksa **4C**'deki GitHub yolunu kullanın: iki kurulum dosyasını da
> sizin yerinize GitHub'ın Mac ve Windows bilgisayarları üretir.

Başlangıç stoğu: Kurulum dosyasını üretirken `private/baslangic-stok.json` dosyası klasörde
varsa kurulumun içine konur ve uygulama ilk açılışta bu stokla başlar. Dosya yoksa uygulama boş başlar.

### 4A. Mac için `.dmg` (bir Mac'te)
1. Bölüm 3'teki Adım 1-3'ü yapın (Node.js, klasörü açma, `npm install`).
2. Terminal'de:
   ```
   npm run dist-mac
   ```
3. Birkaç dakika sonra `dist` klasöründe **`CamStok-1.0.0-universal.dmg`** oluşur.
   (Hem Intel hem Apple M1/M2/M3/M4 Mac'lerde çalışır.)
4. `.dmg`'yi açın, **CamStok** simgesini **Applications (Uygulamalar)** klasörüne sürükleyin.
5. **İlk açılışta** Mac "geliştiricisi doğrulanamadı" diyebilir (uygulama Apple'a ücretli
   olarak kaydedilmediği için, bu normal):
   - CamStok'a **sağ tıklayın → Aç → Aç**.
   - O da işe yaramazsa: **Sistem Ayarları → Gizlilik ve Güvenlik**, aşağıda
     "CamStok engellendi" yazısının yanındaki **"Yine de Aç"** düğmesine basın.
   - Bu yalnızca bir kez yapılır.

### 4B. Windows için `.exe` (bir Windows bilgisayarda)
1. Bölüm 3'teki Adım 1-3'ü yapın.
2. Komut İstemi'nde:
   ```
   npm run dist-win
   ```
3. `dist` klasöründe **`CamStok-Kurulum-1.0.0.exe`** oluşur.
4. Çift tıklayıp kurun. Masaüstüne ve Başlat menüsüne **CamStok** kısayolu eklenir.
5. Windows "Bilgisayarınız korundu" (SmartScreen) derse: **Ek bilgi → Yine de çalıştır**.
   (Uygulama ücretli bir sertifikayla imzalanmadığı için çıkar, bir kez görülür.)

### 4C. İkisini birden GitHub'da üretmek (ayrı bilgisayar gerekmez)
Bu projede hazır bir GitHub iş akışı var (`.github/workflows/kurulum-dosyalari.yml`).
Repoya her yeni değişiklik gönderildiğinde GitHub, Mac ve Windows kurulum dosyalarını kendisi üretir.
1. GitHub'da repoyu açın → üstte **Actions** sekmesi.
2. En üstteki yeşil tikli **"Kurulum dosyalari"** çalıştırmasına tıklayın.
3. Sayfanın altında **Artifacts** bölümünden **CamStok-Mac** ve **CamStok-Windows**'u indirin
   (zip içinden `.dmg` / `.exe` çıkar).
4. Elle başlatmak için: Actions → "Kurulum dosyalari" → **Run workflow**.

> **Dikkat:** Başlangıç stoğu gizli olduğu için GitHub'a hiç gönderilmez. Bu yüzden GitHub'da
> üretilen kurulumlar **boş stokla** başlar. Kurduktan sonra bir kez:
> **Ayarlar → Yedekten geri yükle →** `baslangic-stok.json` dosyasını seçin.
>
> GitHub'dan indirilen Mac uygulaması "hasarlı" uyarısı verirse Terminal'de bir kez şunu yazın:
> `xattr -cr /Applications/CamStok.app`

---

## 5. Verileriniz nerede duruyor?

Tüm veriler **Belgeler** klasöründe, **CamStok** adlı klasörde durur:

| | Konum |
|---|---|
| **Mac** | `Belgeler/CamStok/` (tam yol: `/Users/ADINIZ/Documents/CamStok/`) |
| **Windows** | `Belgeler\CamStok\` (tam yol: `C:\Users\ADINIZ\Documents\CamStok\`). Belgeler klasörünüz OneDrive'a bağlıysa `OneDrive\Belgeler\CamStok\` |

İçinde:
- **`camstok-veri.json`**: Tüm stok, ayarlar, yoldaki siparişler ve sipariş geçmişi.
  **Her değişiklikte otomatik kaydedilir** (başlıkta "Kaydedildi 14:32" gibi görünür).
- **`Yedekler/`**: Otomatik ve elle alınan yedekler.

Kısa yol: Uygulamada **Ayarlar → Veri klasörünü aç** (ya da menüde **Dosya → Veri klasörünü aç**).

Pencere boyutu ve tema tercihi ayrı küçük bir ayar dosyasında tutulur, stok verisine karışmaz.

---

## 6. Yedekleme

**Otomatik:** Her gün uygulama ilk açıldığında bir yedek alınır
(`Yedekler/camstok-2026-11-24.json` gibi). **Son 30 yedek** saklanır, eskiler kendiliğinden silinir.

**Elle yedek:** Ayarlar → **Şimdi yedek al**.

**Bilgisayar bozulursa diye (önerilir):** Haftada bir, **Belgeler/CamStok** klasörünün tamamını
bir USB belleğe ya da iCloud Drive / Google Drive / OneDrive'a kopyalayın.

**Excel kopyası:** Ayarlar → **Excel'e aktar (.xlsx)**: Her cam çeşidi ayrı sayfada stok tablosu,
ayrıca bir "Sipariş" sayfası. Bu dosya okunabilir bir yedek olarak da işe yarar.

### Geri yükleme
- **Ayarlar → Yedekten geri yükle →** bir yedek dosyası seçin → **Geri yükle**.
  Geri yüklemeden önce o anki veriler otomatik olarak ayrıca yedeklenir; yanlışlıkla
  geri yükleseniz bile kaybolmaz.
- **Excel'den yükle:** Excel'de düzenlediğiniz stok tablosunu geri alır. Dosyadaki her cam
  çeşidinin stoğu değiştirilir (aynı adlı çeşit yoksa yeni çeşit eklenir). Yoldaki siparişler,
  "Siparişe girmesin" işaretleri ve geçmiş korunur. Yüklemeden önce otomatik yedek alınır.
  Numbers'tan "Excel olarak dışa aktar" ile alınan eski stok tablolarınızı da okur.
- Veri dosyası bir şekilde bozulursa uygulama bunu fark eder, bozuk dosyayı kenara ayırır ve
  en yeni yedeği otomatik açar.

---

## 7. Eski (tarayıcıdaki) verilerinizi taşıma

- Uygulama ilk açılışta, kendi içinde eski bir tarayıcı kaydı (localStorage) bulursa onu
  otomatik olarak dosyaya taşır.
- **Ancak** Safari/Chrome'da açtığınız eski CamStok sayfasının verisini masaüstü uygulaması
  **göremez** (tarayıcılar bunu güvenlik için başka programlarla paylaşmaz). Eski sayfada
  güncel stoğunuz varsa her cam çeşidi için:
  1. Eski sayfada **Ayarlar → Tabloyu kopyala**.
  2. CamStok uygulamasında aynı çeşidi seçin → **Ayarlar → Kopyala / yapıştır** kutusuna yapıştırın
     → **Tabloyu yükle**.
- Başlangıç stoğu (`baslangic-stok.json`) **yalnızca hiç veri dosyası yokken** yüklenir;
  mevcut verinizin üzerine asla yazılmaz.

---

## 8. Değişenler ve yeni özellikler

Ekranlar, renkler ve sipariş mantığı orijinal sayfayla aynıdır. Farklar:

- Veri tarayıcı yerine **Belgeler/CamStok** klasörüne kaydedilir; günlük yedek; geri yükleme.
- Ayarlar'da yeni **Veri ve yedek** kartı: Veri klasörünü aç, Şimdi yedek al, Yedekten geri yükle,
  Excel'e aktar (.xlsx), Excel'den yükle. Hepsi gerçek dosya seçme pencereleri kullanır.
- Sipariş sekmesinde **PDF olarak kaydet** ve **Yazdır**. Geçmişteki her siparişin de **PDF** düğmesi var.
- **WhatsApp'a gönder:** Listeyi panoya kopyalar; WhatsApp'ta sohbete yapıştırmanız yeterli
  (Mac'te ⌘V, Windows'ta Ctrl+V). İnternete kendisi bağlanmaz.
- **Görünüm:** Otomatik / Açık / Koyu tema (Ayarlar'ın en altında). Tercih hatırlanır.
- Pencere boyutu ve konumu hatırlanır.
- Güvenlik için onay soruları eklendi: "Örnek veri yükle", "Stoğu temizle", "Bu çeşidi sil".
- Hücre penceresinde **Enter** = Kaydet, **Esc** = Kapat.
- Aynı adla ikinci bir cam çeşidi eklenemez.
- Uygulama aynı anda yalnızca bir kez açılır (iki pencere aynı dosyaya yazmasın diye).

---

## 9. Doğrulama testi

`npm test`, mevcut başlangıç stoğuyla sipariş listesini hesaplar:

| Cam | Beklenen | Sonuç |
|---|---|---|
| 1.56 HMC (sınır 4, hedef 6, en yüksek SPH 4.00) | 5 çeşit / 16 adet | **5 çeşit / 16 adet ✔** |
| U.C. 1.49 (sınır 4, hedef 6, en yüksek SPH 5.00) | 7 çeşit / 24 adet | **7 çeşit / 24 adet ✔** |

Ek testler: sipariş kuralı (sınır, hedef, yoldaki, SPH sınırı, "Siparişe girmesin"), KDV hesabı,
Excel'e aktar → geri yükle, dosyaya kayıt, günlük yedek / 30 yedek sınırı, bozuk dosyadan kurtarma.
(Başlangıç stoğu testi yalnızca `private/baslangic-stok.json` olan bilgisayarda çalışır;
GitHub'da bu test atlanır.)

---

## 10. Sık sorulanlar

- **İnternet gerekiyor mu?** Hayır. Yalnızca ilk `npm install` sırasında, parçaları indirmek için gerekir.
- **Uygulamayı güncellersem verim gider mi?** Hayır. Veri uygulamanın içinde değil, Belgeler/CamStok'ta durur.
- **Başka bilgisayara taşımak:** Yeni bilgisayara CamStok'u kurun, eski bilgisayardaki
  `Belgeler/CamStok` klasörünü yenisinin Belgeler klasörüne kopyalayın.
