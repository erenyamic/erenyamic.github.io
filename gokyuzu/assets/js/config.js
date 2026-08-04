/* ============================================================
   AYNI GÖKYÜZÜ — Ayar Dosyası
   ------------------------------------------------------------
   Siteyi kişiselleştirmek için SADECE bu dosyayı düzenlemen
   yeterli. Kod bilmene gerek yok; tırnak içindeki yazıları
   değiştir, kaydet, sunucuya yükle.
   ============================================================ */

window.AYAR = {

  /* --- 1) SİZ --------------------------------------------- */
  ikimiz: {
    // Kim olduğunu ilk girişte site sana soracak.
    ben: { ad: "Eren",  harf: "E", renk: "#7ee8fa" },
    o:   { ad: "Betül", harf: "B", renk: "#ff8fab" }
  },

  /* --- 2) ODA (gizli anahtar) ------------------------------
     İkinizin buluştuğu kanalın adı. Kimsenin tahmin
     edemeyeceği bir şey yaz. Sadece bu odayı bilenler
     birbirini görebilir.                                      */
  oda: "gokyuzu-5a1e5fe8e12e",

  /* --- 3) BAŞLANGIÇ TARİHİ --------------------------------
     Tanıştığınız / birlikte olduğunuz gün.
     Biçim: "YIL-AY-GÜN SAAT:DAKİKA"                           */
  baslangic: "2022-12-21 00:00",

  /* --- 4) SİTE METİNLERİ ---------------------------------- */
  site: {
    baslik: "Aynı Gökyüzü",
    slogan: "İki kişi, iki ayrı yer, tek bir gökyüzü.",
    kapiUstYazi: "Sana özel yapıldı",
    kapiBaslik: "Aynı Gökyüzü",
    kapiMetin: "Nerede olursan ol, bu gökyüzü ikimizin.<br>Aç ve içeri gir.",
    kapiButon: "Gökyüzünü Aç"
  },

  /* --- 5) İSTEĞE BAĞLI KİLİT ------------------------------
     aktif: true yaparsan siteye girmeden önce sadece
     ikinizin bildiği bir soru sorulur.                        */
  kilit: {
    aktif: false,
    soru: "İlk buluştuğumuz yerin adı neydi?",
    ipucu: "Kahve kokuyordu ve çok kalabalıktı.",
    // Birden fazla kabul edilen cevap yazabilirsin.
    // Büyük/küçük harf ve Türkçe karakter farkı önemsenmez.
    cevaplar: ["kahve dünyası", "kahve dunyasi"]
  },

  /* --- 6) YILDIZ HARİTASI --------------------------------
     Gökyüzüne tıklayıp anı bırakıyorsunuz. Aşağıdakiler
     site ilk açıldığında hazır gelen örnek yıldızlar.        */
  baslangicYildizlari: [
    { x: 0.22, y: 0.30, metin: "Seni ilk gördüğüm an. Zaman bir saniyeliğine durmuştu." },
    { x: 0.68, y: 0.24, metin: "İlk kez birlikte güldüğümüz gece." },
    { x: 0.48, y: 0.62, metin: "Bugün. Ve daha çok yıldızımız olacak." }
  ],

  /* --- 7) UYUM TESTİ --------------------------------------
     İkiniz de aynı soruyu aynı anda cevaplıyorsunuz,
     cevaplar aynı anda açılıyor. Aynı cevap = puan.          */
  uyumSorulari: [
    { soru: "Bu akşam ne yapsak?",            secenekler: ["Film", "Yürüyüş", "Dışarıda yemek", "Hiçbir şey, sadece yan yana"] },
    { soru: "Tatil deyince aklına ne geliyor?", secenekler: ["Deniz", "Dağ", "Şehir turu", "Ev, sen varken"] },
    { soru: "Kim daha inatçı?",                secenekler: ["Ben", "Sen", "İkimiz de", "Kimse değil, uyumluyuz 😇"] },
    { soru: "Sabah ilk ne yaparsın?",          secenekler: ["Telefona bakarım", "Kahve", "5 dakika daha uyurum", "Sana sarılırım"] },
    { soru: "En sevdiğimiz ortak şey?",        secenekler: ["Yemek", "Müzik", "Yolculuk", "Sessizce oturmak"] },
    { soru: "Tartışınca önce kim barışır?",    secenekler: ["Ben", "Sen", "Aynı anda", "Karnımız acıkınca ikimiz de"] },
    { soru: "Bir süper güç seçsen?",           secenekler: ["Uçmak", "Zamanı durdurmak", "Işınlanmak", "Zihin okumak"] },
    { soru: "10 yıl sonra neredeyiz?",         secenekler: ["Aynı evde", "Başka bir ülkede", "Deniz kenarında", "Nerede olursak, beraber"] }
  ],

  /* --- 8) AŞK KUPONLARI -----------------------------------
     Biri kuponu kullandığında diğerinin ekranına anında
     bildirim düşer.                                           */
  kuponlar: [
    { ikon: "🍳", baslik: "Yatakta Kahvaltı",     aciklama: "Kahvaltın yatağına gelir. İtiraz kabul edilmez." },
    { ikon: "💆", baslik: "30 Dakika Masaj",      aciklama: "Kronometreyi ben tutuyorum ama biraz uzatabilirim." },
    { ikon: "🎬", baslik: "Film Seçme Hakkı",     aciklama: "Bu akşam ne izleyeceğimize sen karar veriyorsun. Homurdanmak yok." },
    { ikon: "🧽", baslik: "Bulaşık Muafiyeti",    aciklama: "Bugün mutfak benden. Sen sadece izle." },
    { ikon: "🚗", baslik: "Sürpriz Kaçamak",      aciklama: "Nereye gittiğimizi söylemiyorum. Sadece ceketini al." },
    { ikon: "😴", baslik: "Pazar Uykusu",         aciklama: "Kimse seni uyandırmıyor. Ev sessiz, kahve hazır." },
    { ikon: "🍰", baslik: "Gece Yarısı Tatlısı",  aciklama: "Saat kaç olursa olsun, canın ne çekiyorsa gidip alıyorum." },
    { ikon: "🏆", baslik: "Tartışma Kazanma",     aciklama: "Bir defaya mahsus haklı olan sensin. Dikkatli harca." },
    { ikon: "📵", baslik: "Telefonsuz Akşam",     aciklama: "İki saat boyunca sadece ikimiz. Ekran yok." },
    { ikon: "💃", baslik: "Mutfakta Dans",        aciklama: "Şarkıyı sen seç. Utanmak yasak." }
  ],

  /* --- 9) ÇARK --------------------------------------------
     Biri çevirdiğinde ikinizin ekranında aynı anda dönüyor.
     Yazıları kısa tut (2-3 kelime).                          */
  carkSecenekleri: [
    "Film gecesi", "Yürüyüşe çık", "Yeni tarif", "Dondurma",
    "Oyun gecesi", "Kahve kaçamağı", "Mutfakta dans", "Eski fotoğraflar",
    "Erken uyku", "Sürpriz"
  ],

  /* --- 10) KALP SENKRONU ----------------------------------
     İkiniz aynı anda basılı tuttuğunuzda açılan mesajlar.
     Her başarılı senkronda sıradaki mesaj açılır.            */
  senkronMesajlari: [
    "Şu anda ikimizin de kalbi aynı ritimde attı. Bu tesadüf değil.",
    "Kaç kilometre uzakta olursak olalım, aynı anda aynı şeyi hissedebiliyoruz.",
    "Bu ekranın öbür ucunda sen varsın. Bana bu yetiyor.",
    "Bir gün geriye dönüp bakacağız ve 'iyi ki' diyeceğiz.",
    "Seninle her şey daha kolay. Zor günler bile.",
    "Sen benim en sevdiğim tesadüfümsün.",
    "Kalbim seni bulmakta hiç zorlanmadı."
  ],

  /* --- 11) ZAMAN TÜNELİ -----------------------------------
     foto alanına istersen kendi fotoğrafını koy:
     önce resmi assets/img/ klasörüne at, sonra
     foto: "assets/img/ilk-bulusma.jpg" yaz.                  */
  zamanTuneli: [
    { tarih: "2022", baslik: "İlk Bakış",        metin: "Seni ilk gördüğüm an. Ne konuştuğumuzu hatırlamıyorum ama nasıl hissettiğimi hatırlıyorum.", foto: "" },
    { tarih: "2023", baslik: "İlk Yolculuk",     metin: "Yolu kaybettik, saatlerce güldük. En iyi anılar plansız olanlarmış.", foto: "" },
    { tarih: "2024", baslik: "Zor Bir Yıl",      metin: "Her şey zorlaştı ama sen yanımdaydın. O yüzden dayanabildim.", foto: "" },
    { tarih: "2025", baslik: "Evet Dediğin Gün", metin: "Hayatımın en güzel 'evet'i. Hâlâ inanamıyorum.", foto: "" },
    { tarih: "2026", baslik: "Bizim Evimiz",     metin: "Dört duvarı eve çeviren şeyin sen olduğunu orada anladım.", foto: "" },
    { tarih: "Bugün", baslik: "Ve Devam Ediyor", metin: "Hikâyenin en güzel kısmı: daha bitmedi.", foto: "" }
  ],

  /* --- 12) MEKTUP ------------------------------------------
     Satır aralarını <br> ile ayır.                            */
  mektup: {
    hitap: "Sevgilim,",
    metin:
      "Bu siteyi yaparken çok düşündüm; sana ne yazsam da anlatabilsem diye.<br><br>" +
      "Sonra fark ettim ki aslında anlatmaya çalıştığım şey çok basit: hayatım seninle daha iyi. " +
      "Sabahları daha kolay kalkıyorum, kötü günler daha çabuk geçiyor, iyi günler daha çok iyi oluyor.<br><br>" +
      "Bu gökyüzündeki her yıldız bizim bir anımız. Bazıları çok parlak, bazıları küçücük. " +
      "Ama hepsi bizim ve hepsi orada duruyor.<br><br>" +
      "Nerede olursan ol, aynı gökyüzüne bakıyoruz. Ben bunu her zaman hatırlayacağım.",
    imza: "Seni seviyorum."
  },

  /* --- 13) GÜNÜN MESAJI -----------------------------------
     Ana sayfada her gün otomatik olarak biri gösterilir.     */
  gunlukMesajlar: [
    "Bugün de seni seçiyorum.",
    "Aklımdan çıkmıyorsun, denedim olmuyor.",
    "Bir sarılmaya ihtiyacım var. Senden.",
    "Seninle sıradan bir gün bile güzel.",
    "Bugün seni düşününce gülümsedim, iki kere.",
    "Sen benim en sevdiğim alışkanlığımsın.",
    "Yanımda olmadığında bile yanımdasın.",
    "Bu gökyüzü seni özlüyor.",
    "Seninle her şey daha az korkutucu.",
    "İyi ki varsın. Gerçekten.",
    "Bugün de aynı gökyüzündeyiz.",
    "Seni sevmek en kolay işim.",
    "Bir gün seninle yaşlanacağım ve bu beni hiç korkutmuyor.",
    "Kalbim hâlâ senin adına hızlanıyor."
  ],

  /* --- 14) FISILTI (canlı sohbet) hazır cevaplar ---------- */
  hizliFisiltilar: ["Seni özledim 🤍", "Buradayım 👀", "Sarıl bana", "Gel buraya", "❤️", "😂", "Ne yapıyorsun?"],


  /* --- 16) GÜNLÜK SORULAR ---------------------------------
     Her gün otomatik olarak biri seçilir (aynı gün ikinizde
     de aynı soru çıkar). İstediğin kadar ekleyebilirsin.     */
  gunlukSorular: [
    "Bugün seni ne güldürdü?",
    "Bugün bana söylemeyi unuttuğun bir şey var mı?",
    "Şu an aklından geçen ilk şey ne?",
    "Bugün için minnettar olduğun bir şey yaz.",
    "Bugün kendinle gurur duyduğun bir an oldu mu?",
    "Şu anda en çok neye ihtiyacın var?",
    "Bugün beni ne zaman düşündün?",
    "Bu hafta birlikte yapmak istediğin bir şey?",
    "Bugünü tek kelimeyle anlatsan?",
    "Seni bugün ne yordu?",
    "Son zamanlarda fark ettiğin, benim yaptığım küçük bir şey?",
    "Bugün olmasını istediğin ama olmayan ne vardı?",
    "Aklından geçen ama söylemeye çekindiğin bir şey?",
    "Bugün kendine iyi geldin mi? Nasıl?",
    "Bir yıl sonra bugünü hatırlarsan aklına ne gelsin isterdin?",
    "Bugün seni en çok ne şaşırttı?",
    "Şu an burada olsaydım ne yapardık?",
    "Bu aralar en çok neyi merak ediyorsun?",
    "Bugün birine iyilik yaptın mı, sana yapan oldu mu?",
    "En son ne zaman içten içe rahatladın?",
    "Bugün canını sıkan küçük bir şey neydi?",
    "Bu hafta seni en çok ne mutlu etti?",
    "Şu an bir yere ışınlanabilsen nereye giderdin?",
    "Bana bugün hangi şarkıyı dinletmek isterdin?",
    "Bugün nasıl uyudun, ne rüya gördün?",
    "Beraber en son ne zaman doyasıya güldük?",
    "Bugün kendine ne söyledin?",
    "Bir dileğin gerçekleşse bugün ne dilerdin?"
  ],

  /* --- 17) TEKNİK ------------------------------------------ */
  teknik: {
    api: "api/kanal.php",   // kendi sunucundaki PHP kanalı
    muzikVarsayilanAcik: false,
    imlecPaylas: true,      // eşinin imlecini kuyruklu yıldız olarak gör

    /* GERÇEK ZAMANLI BAĞLANTI — iki yol var, birini seç:

       A) Kendi sunucun PHP çalıştırıyorsa (cPanel, hosting, VPS…)
          Hiçbir şey yapma. Yukarıdaki "api" satırı yeterli.

       B) PHP olmayan statik bir yerde yayınlıyorsan
          (GitHub Pages, Netlify, Vercel, Cloudflare Pages…)
          Ücretsiz bir Firebase veritabanı aç ve adresini aşağıya yaz.
          Nasıl yapılacağı README.md içinde adım adım anlatılıyor.
          Buradaki databaseURL doluysa site otomatik olarak Firebase'i kullanır. */
    firebase: {
      databaseURL: "https://ifeel-62452-default-rtdb.firebaseio.com",

      /* Verilerin veritabanında duracağı üst klasör.
         Paylaşılan bir veritabanı kullanıyorsan burayı kendine ayır ki
         mevcut verilere hiç değmesin. Site sadece şuraya yazar:
             <yol>/<oda>/...
         yani: denemeler/ayni-gokyuzu/gokyuzu-5a1e5fe8e12e/... */
      yol: "denemeler/ayni-gokyuzu"
    }
  }
};
