# Özel klasör

Bu klasördeki dosyalar **git'e eklenmez** (bkz. `.gitignore`).

- `baslangic-stok.json` → Uygulama ilk kez açıldığında, bilgisayarda hiç veri dosyası
  yoksa yüklenen başlangıç stoğu. Kurulum dosyası üretilirken (npm run dist-…)
  bu dosya varsa kurulumun içine konur; yoksa uygulama boş stokla başlar.
