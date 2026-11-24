// Mac'te paketlenen uygulamaya ücretsiz "ad-hoc" imza atar.
// (Apple Developer hesabı gerekmez. İmzasız uygulamalar Apple Silicon Mac'lerde açılmaz.)
const { execFileSync } = require("child_process");
const path = require("path");

exports.default = async function (context) {
  if (context.electronPlatformName !== "darwin") return;
  if (/-temp$/.test(context.appOutDir)) return; // universal birleştirme öncesi geçici kopyalar
  const app = path.join(context.appOutDir, context.packager.appInfo.productFilename + ".app");
  console.log("  • ad-hoc imza: " + app);
  execFileSync("codesign", ["--force", "--deep", "--sign", "-", app], { stdio: "inherit" });
};
