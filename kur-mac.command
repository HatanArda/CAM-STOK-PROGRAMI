#!/bin/bash
# CamStok'u bu Mac'e kurar. Yazılım bilgisi gerekmez.
# Kullanım: Terminal'e "bash " yazın, bu dosyayı Terminal penceresine sürükleyin, Enter'a basın.
cd "$(dirname "$0")" || exit 1

hata() {
  echo ""
  echo "HATA: $1"
  echo "Bu pencerenin ekran görüntüsünü alıp Claude'a gönderin."
  exit 1
}

echo ""
echo "=== CamStok kuruluyor (5-10 dakika sürebilir, internet gerekir) ==="
echo ""

ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then NA=arm64; else NA=x64; fi

# 1) Node.js: bilgisayarda yoksa bu klasöre geçici olarak indirilir (şifre istemez).
if ! command -v node >/dev/null 2>&1 || ! node -e 'process.exit(+process.versions.node.split(".")[0] < 20 ? 1 : 0)' 2>/dev/null; then
  if [ ! -x ".node/bin/node" ]; then
    echo "1/4  Gerekli araç (Node.js) indiriliyor..."
    NODEV=v22.12.0
    curl -fL --progress-bar "https://nodejs.org/dist/$NODEV/node-$NODEV-darwin-$NA.tar.gz" -o node.tgz || hata "Node.js indirilemedi. İnternet bağlantısını kontrol edin."
    mkdir -p .node && tar -xzf node.tgz -C .node --strip-components 1 && rm -f node.tgz || hata "Node.js açılamadı."
  fi
  export PATH="$PWD/.node/bin:$PATH"
fi

echo "2/4  Uygulama parçaları indiriliyor..."
npm install --no-audit --no-fund || hata "Parçalar indirilemedi."

echo "3/4  CamStok uygulaması oluşturuluyor..."
rm -rf dist
npx electron-builder --mac dir --$NA || hata "Uygulama oluşturulamadı."
APP=$(find dist -maxdepth 2 -name "CamStok.app" | head -1)
[ -n "$APP" ] || hata "CamStok.app bulunamadı."

echo "4/4  Uygulamalar klasörüne kopyalanıyor..."
HEDEF=/Applications
if ! ( rm -rf "$HEDEF/CamStok.app" && cp -R "$APP" "$HEDEF/" ) 2>/dev/null; then
  HEDEF="$HOME/Applications"; mkdir -p "$HEDEF"
  rm -rf "$HEDEF/CamStok.app"; cp -R "$APP" "$HEDEF/" || hata "Uygulama kopyalanamadı."
fi
xattr -cr "$HEDEF/CamStok.app" 2>/dev/null

# Masaüstüne kısayol
rm -f "$HOME/Desktop/CamStok"
ln -s "$HEDEF/CamStok.app" "$HOME/Desktop/CamStok"

echo ""
echo "=== TAMAM! CamStok kuruldu. ==="
echo "Masaüstündeki \"CamStok\" simgesine çift tıklayarak açabilirsiniz."
echo "Verileriniz: Belgeler/CamStok klasöründe."
echo "Bu pencereyi kapatabilirsiniz."
open "$HEDEF/CamStok.app"
