# 🌌 Aynı Gökyüzü

**İki kişi, iki ayrı yer, tek bir gökyüzü.**

Eşinle *aynı anda* içinde olabildiğiniz, canlı bir web sitesi. O linki açtığı an
yıldızı gökyüzünde beliriyor, imleci senin ekranında kuyruklu yıldız olarak geziyor,
yazdığı fısıltı anında sana düşüyor.

Derleme yok, paket yok, `npm install` yok. Dosyaları yükle, çalışsın.

---

## 🔌 Önce bunu seç: nereye yükleyeceksin?

Sitenin canlı olması (eşinin yaptıklarını anında görmen) için bir "kanal" gerekiyor.
İki yol var, **birini** seçmen yeterli:

| | **A — Kendi sunucun** | **B — GitHub Pages / statik** |
|---|---|---|
| Nerede çalışır | cPanel, hosting, VPS (PHP varsa) | GitHub Pages, Netlify, Vercel, Cloudflare Pages |
| Gereken | Sadece dosyaları yüklemek | Ücretsiz bir Firebase veritabanı (5 dakika) |
| Veri nerede durur | Senin sunucunda, bir JSON dosyasında | Google'ın sunucusunda (senin hesabında) |
| Gizlilik | Tam sende | Oda adı, herkese açık repoda görünür |
| Ücret | — | Ücretsiz (bu iş için limitler fazlasıyla yeter) |

**Kendi sunucun varsa A'yı seç** — daha basit ve daha gizli.
Bölüm **A** aşağıda, bölüm **B** ondan sonra.

Not: ikisi de yoksa site yine açılır ama "çevrimdışı mod"a düşer —
her şey sadece kendi cihazında kalır, eşin göremez.

---

# A) Kendi sunucuna yükleme (PHP)

## ⚡ 3 adımda yayına al

1. **`assets/js/config.js`** dosyasını aç, en az şu üçünü değiştir:
   - `ikimiz` → ikinizin adı
   - `oda` → kimsenin tahmin edemeyeceği gizli bir kelime
   - `baslangic` → birlikte olduğunuz tarih
2. Klasörün **tamamını** sunucuna yükle (`public_html` içine ya da bir alt klasöre).
3. `api/veri` klasörünün **yazma izni** olsun (cPanel → izinler → `755` veya `775`).

Bitti. Linki eşine gönder.

> **Kontrol:** Tarayıcında `siteadresin/api/kanal.php?aksiyon=ping` adresini aç.
> `{"tamam":true,"sunucu":true,...,"yazilir":true}` görüyorsan her şey yolunda.
> `yazilir:false` diyorsa `api/veri` klasörünün iznini düzelt.

## 📤 Dosyaları yükleme

FTP / cPanel Dosya Yöneticisi / `scp` — hangisi kolayına geliyorsa.

```
public_html/
└── gokyuzu/          ← istediğin adı verebilirsin
    ├── index.html
    ├── api/
    ├── assets/
    └── README.md
```

Adres `https://siteadresin.com/gokyuzu/` olur.

- **Alt klasörde çalışır**, ekstra ayar gerekmez (sayfa geçişleri `#/...` ile yapılır).
- `.htaccess`, yönlendirme kuralı, Node.js, Composer — hiçbiri gerekmiyor.
- Nginx kullanıyorsan `api/veri/.htaccess` çalışmaz; oda adın gizli olduğu için sorun değil,
  ama istersen `location ~ /api/veri/ { deny all; }` ekleyebilirsin.

**Gereken tek şey:** sunucuda PHP 7.4 veya üstü olması.

---

# B) GitHub Pages'te yayınlama (PHP'siz)

GitHub Pages tamamen statiktir, **PHP çalıştırmaz**. Bu yüzden gerçek zamanlı kanalı
Google'ın ücretsiz **Firebase Realtime Database**'i üstlenir. Sunucu kiralamana gerek yok.

### 1. Firebase veritabanını aç (~5 dakika)

1. <https://console.firebase.google.com> → **Proje ekle** → bir isim ver (örn. `bizim-gokyuzumuz`).
   Google Analytics'i **kapat**, gerek yok.
2. Sol menü → **Build → Realtime Database** → **Veritabanı oluştur**.
   - Bölge: **europe-west1** (Türkiye'ye en yakını).
   - **"Kilitli modda başlat"** seç. Kuralları birazdan biz yazacağız.
3. Açılan sayfada üstte şuna benzer bir adres göreceksin — **kopyala**:
   ```
   https://bizim-gokyuzumuz-default-rtdb.europe-west1.firebasedatabase.app
   ```
4. **Kurallar (Rules)** sekmesine geç, içindekini sil ve şunu yapıştır
   (`yol` ve `oda` değerleri config.js'tekiyle birebir aynı olmalı):
   ```json
   {
     "rules": {
       "denemeler": {
         "ayni-gokyuzu": {
           "$oda": {
             ".read":  "$oda === 'gokyuzu-5a1e5fe8e12e'",
             ".write": "$oda === 'gokyuzu-5a1e5fe8e12e'"
           }
         }
       }
     }
   }
   ```
   **Yayınla**'ya bas. Bu kural sayesinde sadece sizin odanız okunup yazılabilir,
   veritabanının geri kalanı kapalı kalır.

### 2. Adres ve yol config.js'e yazılır

`assets/js/config.js` → en alttaki `teknik` bölümü:

```js
oda: "gokyuzu-5a1e5fe8e12e",     // ← Rules'takiyle AYNI olmalı
...
firebase: {
  databaseURL: "https://....firebaseio.com",
  yol: "denemeler/ayni-gokyuzu"  // veriler burada durur
}
```

> `oda` adında sadece harf, rakam ve tire kullan (nokta, boşluk, `/`, `#`, `$` olmasın).

Burası dolduğu anda site otomatik olarak Firebase'e bağlanır; PHP'ye hiç bakmaz.

### Paylaşılan bir veritabanı kullanıyorsan

Site **yalnızca** `<yol>/<oda>/` altına yazar, başka hiçbir yere dokunmaz.
`yol` değerini değiştirerek kendine ayrı bir köşe açabilirsin — böylece aynı
veritabanındaki mevcut verilerin etkilenmez.

**Mevcut düğümlerin varsa kuralları silme, üstüne ekle.** Örnek:

```json
{
  "rules": {
    "mevcutDugumun":  { ".read": true, ".write": true },
    "digerDugumun":   { ".read": true, ".write": true },

    "denemeler": {
      "ayni-gokyuzu": {
        "$oda": {
          ".read":  "$oda === 'gokyuzu-5a1e5fe8e12e'",
          ".write": "$oda === 'gokyuzu-5a1e5fe8e12e'"
        }
      }
    }
  }
}
```

> ⚠️ Realtime Database'de izinler **aşağı doğru miras alınır ve alt seviyeden geri alınamaz.**
> Yani kuralların en tepesinde `".read": true` varsa, bütün veritabanı (bu site dahil)
> internete açık demektir. Kuralları yazdıktan sonra **Rules Playground** ile
> (`/` yolunu okumayı dene → *Denied* çıkmalı) kontrol et.

### 3. GitHub'a yükle

```bash
cd bizim-evrenimiz
git init
git add .
git commit -m "Aynı Gökyüzü"
git branch -M main
git remote add origin https://github.com/erenyamic/erenyamic.github.io.git
git push -u origin main
```

Repo ayarları → **Settings → Pages** → *Source: Deploy from a branch* → `main` / `root` → **Save**.
Birkaç dakika içinde `https://erenyamic.github.io` adresinde yayında olur.

> Ayrı bir repoya da koyabilirsin (örn. `gokyuzu`); o zaman adres
> `https://erenyamic.github.io/gokyuzu/` olur. Site alt klasörde de sorunsuz çalışır.

### Bilmen gerekenler

- **Repo herkese açıksa `config.js` de herkese açıktır** — yani oda adın ve veritabanı
  adresin kaynak kodda görünür. Repoyu bulan biri teorik olarak odanıza girebilir.
  Aşk mektubu için pratikte sorun değil ama bilmeni isterim. Tam gizlilik istiyorsan
  **A yolunu** (kendi sunucun) kullan, ya da repoyu private yap (Pages için GitHub Pro gerekir).
- **Ücret:** Firebase ücretsiz (Spark) planı 1 GB veri ve aylık 10 GB indirme veriyor.
  İki kişilik bir site bunun binde birini bile kullanmaz.
- **`api/` klasörünü silebilirsin** — Firebase kullanıyorsan gerekmiyor.
  (Silmesen de bir zararı yok, sadece boşta durur.)

---

## 💗 Eşinle nasıl kullanılıyor

1. Linki gönder.
2. Site "**Sen kimsin?**" diye soracak — o, kendi adını seçsin.
3. İkiniz de açtığınızda üst köşedeki iki yuvarlak yanar ve aradaki çizgi canlanır.
   Artık aynı gökyüzündesiniz.

**Aynı anda olmanız gerekenler:** Kalp Senkronu, Uyum Testi, Birlikte Çiz, Kader Çarkı.
**Ayrı ayrı da olur:** Yıldız Haritası, Kuponlar, Fısıltı, Sayaç, Zaman Tüneli, Mektup —
sen bırakırsın, o girdiğinde görür.

> **Tek bilgisayarda denemek için:** ikinci kişiyi gizli pencerede aç,
> ya da adresin sonuna `?ben=o` ekle (`siteadresin/?ben=o`).

---

## ✏️ Kişiselleştirme

Her şey **`assets/js/config.js`** içinde, Türkçe açıklamalarla. Kod bilmene gerek yok:
tırnak içindeki yazıları değiştir, kaydet, dosyayı sunucuya tekrar yükle.

| Bölüm | Ne işe yarıyor |
|---|---|
| `ikimiz` | İkinizin adı, baş harfi, rengi |
| `oda` | Gizli kanal adı — **mutlaka değiştir** |
| `baslangic` | Sayacın başlangıç tarihi |
| `site` | Başlık, slogan, giriş perdesi yazıları |
| `kilit` | `aktif: true` yaparsan girişte sadece ikinizin bildiği bir soru sorulur |
| `baslangicYildizlari` | Gökyüzü ilk açıldığında hazır gelen anılar |
| `uyumSorulari` | Uyum testinin soruları ve seçenekleri |
| `kuponlar` | Aşk kuponları |
| `carkSecenekleri` | Çarktaki yazılar (kısa tut, 2-3 kelime) |
| `senkronMesajlari` | Kalpleri birlikte tuttuğunuzda açılan mesajlar |
| `zamanTuneli` | Hikâyenizin kilometre taşları |
| `mektup` | Kapanıştaki mektup |
| `gunlukMesajlar` | Ana sayfada her gün değişen mesaj |
| `hizliFisiltilar` | Sohbetteki hazır cevap düğmeleri |

### Fotoğraf eklemek

1. Fotoğrafı `assets/img/` klasörüne at (örn. `ilk-bulusma.jpg`).
2. `config.js` içinde `zamanTuneli` bölümünde ilgili anının `foto` alanına yaz:

```js
{ tarih: "2019", baslik: "İlk Bakış", metin: "...", foto: "assets/img/ilk-bulusma.jpg" }
```

### Link önizlemesi

WhatsApp'ta link gönderdiğinde çıkan görsel: `assets/img/onizleme.jpg`.
İstersen kendi fotoğrafınızla değiştir (1200×630 piksel olsun).
En sağlıklısı `index.html` içindeki `og:image` satırını tam adresle yazmaktır:

```html
<meta property="og:image" content="https://siteadresin.com/gokyuzu/assets/img/onizleme.jpg">
```

---

## 🔧 Sorun giderme

**"Çevrimdışı mod" yazıyor**

*A yolunu (PHP) kullanıyorsan:*
- `api/kanal.php` sunucuya yüklendi mi?
- `siteadresin/api/kanal.php?aksiyon=ping` ne diyor?
- `api/veri` klasörü var mı ve yazılabilir mi (755/775)?
- Sunucuda PHP açık mı?

*B yolunu (Firebase) kullanıyorsan:*
- `config.js` içindeki `databaseURL` dolu mu ve `https://` ile mi başlıyor?
- `config.js` içindeki `oda` ile Firebase **Rules**'taki oda adı birebir aynı mı?
- Tarayıcıda `F12 → Console` aç; `permission_denied` yazıyorsa kural yanlıştır.
- Kuralları **Yayınla**'ya basmayı unutmuş olabilirsin.

**Eşim çevrimiçi görünmüyor**
İkinizin de `config.js` dosyasındaki `oda` değeri aynı olmalı — yani ikiniz de
*aynı* sunucudaki *aynı* linki açmalısınız.

**İkimiz de aynı kişi olarak görünüyoruz**
Aynı tarayıcıdan giriyorsunuz. Biriniz gizli pencere kullansın ya da ana sayfadaki
"ben … değilim" bağlantısından kimliğini değiştirsin.

**Her şeyi sıfırlamak istiyorum**
- PHP yolu: sunucuda `api/veri/oda-<odaadın>.json` dosyasını sil.
- Firebase yolu: Firebase konsolunda **Realtime Database → Veri** sekmesinde
  `denemeler/ayni-gokyuzu/<odaadın>` düğümünü sil.

Bütün yıldızlar, çizimler, kuponlar ve sohbet sıfırlanır.

**Mektuptaki yazı çok hızlı/yavaş akıyor**
`assets/js/views/mektup.js` içinde `setInterval(yaz, 26)` satırındaki sayıyı değiştir.

---

## 📁 Dosya yapısı

```
index.html                 tek sayfa — bütün odalar burada açılır
api/                       (sadece A yolu için; Firebase kullanıyorsan gereksiz)
  kanal.php                gerçek zamanlı kanal (long-polling)
  veri/                    oda verileri (otomatik oluşur, yazılabilir olmalı)
assets/
  css/style.css            bütün görsel tasarım
  img/onizleme.jpg         link önizleme görseli
  js/
    config.js              ⭐ kişiselleştirme burada
    utils.js               yardımcılar, konfeti, bildirim
    kanal.js               kanal yöneticisi — hangi yol varsa onu seçer
    kanal-firebase.js      Firebase taşıyıcısı (B yolu)
    arkaplan.js            yıldızlı gökyüzü, kayan yıldızlar
    muzik.js               dosyasız müzik kutusu (WebAudio)
    router.js              sayfa geçişleri
    app.js                 giriş perdesi, fısıltı, eşin imleci
    views/                 odalar (her biri ayrı dosya)
```

**Kanal nasıl seçiliyor:** `config.js` → `firebase.databaseURL` doluysa **Firebase**;
değilse `api/kanal.php` yoklanır, varsa **PHP**; o da yoksa **çevrimdışı mod**.

---

## 🔒 Gizlilik

- **A yolu:** veriler sadece senin sunucunda, düz bir JSON dosyasında durur.
  Hiçbir dış servise veri gitmez.
- **B yolu:** veriler senin Firebase hesabındaki veritabanında durur.
  Google'ın sunucusundadır ama proje senindir; istediğin an silebilirsin.
- Analitik, izleme kodu, reklam, üçüncü taraf çerezi yok.
- Google Fonts (yazı tipleri) dışında dış bağlantı yoktur. İstemezsen `index.html` içindeki
  `fonts.googleapis.com` satırlarını silebilirsin; site sistem yazı tipleriyle çalışmaya devam eder.
- Sayfaya `noindex` etiketi konuldu, arama motorlarına düşmez.
- Odanın adını gizli tut — o linki ve oda adını bilmeyen kimse odanıza giremez.

---

Kolay gelsin. Umarım beğenir. ✨
