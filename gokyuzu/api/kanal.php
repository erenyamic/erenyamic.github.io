<?php
/* ============================================================
   AYNI GÖKYÜZÜ — Gerçek Zamanlı Kanal
   ------------------------------------------------------------
   Hiçbir kütüphane, veritabanı veya kurulum gerektirmez.
   Sadece PHP 7.4+ olan bir sunucuya yüklemen yeterli.

   Veriler api/veri/<oda>.json dosyasında tutulur.
   Gerçek zamanlılık "long-polling" ile sağlanır: istemci
   soruyu sorar, sunucu yeni bir şey olana kadar (en fazla
   BEKLE_SN saniye) cevabı bekletir. Yeni olay olduğu anda
   cevap döner -> ekranda anında görünür.
   ============================================================ */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('X-Accel-Buffering: no');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

/* ---------------- Ayarlar ---------------- */
define('VERI_DIZIN',   __DIR__ . '/veri');
define('BEKLE_SN',     20);    // long-poll bekleme süresi (sunucun 30sn limitliyse 20 idealdir)
define('CEVRIMICI_SN', 30);    // bu süre boyunca ses çıkmayan kişi çevrimdışı sayılır
define('MAX_OLAY',     300);   // hafızada tutulan son olay sayısı
define('MAX_YILDIZ',   400);
define('MAX_CIZGI',    4000);
define('MAX_SOHBET',   150);
define('MAX_MEDYA',    60);    // PHP modunda saklanan fotoğraf/ses sayısı

@ini_set('max_execution_time', (string)(BEKLE_SN + 15));
@set_time_limit(BEKLE_SN + 15);
ignore_user_abort(false);

/* ---------------- Yardımcılar ---------------- */

function cikti(array $veri, int $kod = 200): void {
    http_response_code($kod);
    echo json_encode($veri, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function girdi(): array {
    $g = $_GET;
    $ham = file_get_contents('php://input');
    if ($ham !== false && $ham !== '') {
        $j = json_decode($ham, true);
        if (is_array($j)) $g = array_merge($g, $j);
    }
    if (!empty($_POST)) $g = array_merge($g, $_POST);
    return $g;
}

function metin($v, int $uzunluk = 400): string {
    if (!is_scalar($v)) return '';
    $s = trim((string)$v);
    if (function_exists('mb_substr')) return mb_substr($s, 0, $uzunluk, 'UTF-8');
    return substr($s, 0, $uzunluk);
}

function kimlik($v): string {
    $s = preg_replace('/[^a-zA-Z0-9_-]/', '', (string)$v);
    return substr((string)$s, 0, 48);
}

function odaDosyasi(string $oda): string {
    $t = kimlik($oda);
    if ($t === '') $t = 'varsayilan';
    return VERI_DIZIN . '/oda-' . $t . '.json';
}

function bosOda(): array {
    return [
        'seq'     => 0,
        'olaylar' => [],
        'kisiler' => [],
        'durum'   => [
            'yildizlar' => [],
            'takimlar'  => [],
            'cizim'     => [],
            'kuponlar'  => (object)[],
            'uyum'      => (object)[],
            'sohbet'    => [],
            'senkron'   => ['sayi' => 0, 'son' => 0],
            'cark'      => null,
            'gunluk'    => (object)[],
            'kapsul'    => [],
            'medya'     => (object)[],
        ],
    ];
}

function duzelt(array $d): array {
    $b = bosOda();
    foreach (['seq', 'olaylar', 'kisiler'] as $k) {
        if (!isset($d[$k])) $d[$k] = $b[$k];
    }
    if (!isset($d['durum']) || !is_array($d['durum'])) $d['durum'] = [];
    foreach ((array)$b['durum'] as $k => $v) {
        if (!array_key_exists($k, $d['durum'])) $d['durum'][$k] = $v;
    }
    $d['seq'] = (int)$d['seq'];
    return $d;
}

/** Dosyayı paylaşımlı kilitle güvenle okur. */
function odaOku(string $dosya): array {
    if (!is_file($dosya)) return bosOda();
    $fp = @fopen($dosya, 'rb');
    if (!$fp) return bosOda();
    @flock($fp, LOCK_SH);
    $ham = stream_get_contents($fp);
    @flock($fp, LOCK_UN);
    fclose($fp);
    $d = json_decode((string)$ham, true);
    return is_array($d) ? duzelt($d) : bosOda();
}

/** Dosyayı özel kilitle açar, callback ile değiştirir, geri yazar. */
function odaYaz(string $dosya, callable $islem) {
    if (!is_dir(VERI_DIZIN)) @mkdir(VERI_DIZIN, 0775, true);
    $fp = @fopen($dosya, 'c+b');
    if (!$fp) cikti(['hata' => 'veri klasörüne yazılamıyor. api/veri klasörünün yazma izni (755/775) olmalı.'], 500);
    @flock($fp, LOCK_EX);
    $ham = stream_get_contents($fp);
    $d = json_decode((string)$ham, true);
    $d = is_array($d) ? duzelt($d) : bosOda();

    $sonuc = $islem($d);

    rewind($fp);
    ftruncate($fp, 0);
    fwrite($fp, json_encode($d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    fflush($fp);
    @flock($fp, LOCK_UN);
    fclose($fp);
    return $sonuc;
}

/** Kişiyi çevrimiçi olarak damgalar. Yeni geldiyse true döner. */
function varlikDamgala(array &$d, string $id, string $ad, string $sayfa, string $rol = ''): bool {
    $simdi = microtime(true);
    $yeni = true;
    if (isset($d['kisiler'][$id]) && is_array($d['kisiler'][$id])) {
        $yeni = ($simdi - (float)($d['kisiler'][$id]['son'] ?? 0)) > CEVRIMICI_SN;
    }
    $d['kisiler'][$id] = ['ad' => $ad, 'son' => $simdi, 'sayfa' => $sayfa, 'rol' => $rol];
    return $yeni;
}

/** Çevrimiçi kişi kimlikleri (sıralı). */
function cevrimiciler(array $d): array {
    $simdi = microtime(true);
    $liste = [];
    foreach ((array)$d['kisiler'] as $id => $k) {
        if (!is_array($k)) continue;
        if (($simdi - (float)($k['son'] ?? 0)) <= CEVRIMICI_SN) $liste[] = (string)$id;
    }
    sort($liste);
    return $liste;
}

function kisilerCiktisi(array $d): array {
    $simdi = microtime(true);
    $out = [];
    foreach ((array)$d['kisiler'] as $id => $k) {
        if (!is_array($k)) continue;
        $out[] = [
            'id'        => (string)$id,
            'ad'        => (string)($k['ad'] ?? ''),
            'rol'       => (string)($k['rol'] ?? ''),
            'sayfa'     => (string)($k['sayfa'] ?? ''),
            'cevrimici' => ($simdi - (float)($k['son'] ?? 0)) <= CEVRIMICI_SN,
            'oncekiSn'  => round($simdi - (float)($k['son'] ?? 0), 1),
        ];
    }
    return $out;
}

/** Olayı sıraya ekler ve kalıcı duruma yansıtır. */
function olayEkle(array &$d, string $tip, $veri, string $id, string $ad): array {
    $d['seq'] = (int)$d['seq'] + 1;
    $olay = [
        's'   => $d['seq'],
        't'   => round(microtime(true), 3),
        'tip' => $tip,
        'kim' => $id,
        'ad'  => $ad,
        'veri'=> $veri,
    ];
    $d['olaylar'][] = $olay;
    if (count($d['olaylar']) > MAX_OLAY) {
        $d['olaylar'] = array_slice($d['olaylar'], -MAX_OLAY);
    }
    durumaYansit($d, $tip, $veri, $id, $ad);
    return $olay;
}

/** Kalıcı olması gereken olayları "durum" içine işler. */
function durumaYansit(array &$d, string $tip, $veri, string $id, string $ad): void {
    $du = &$d['durum'];

    switch ($tip) {
        case 'yildiz':
            if (!is_array($veri)) return;
            $du['yildizlar'][] = [
                'id'    => metin($veri['id'] ?? uniqid('y', true), 40),
                'tur'   => metin($veri['tur'] ?? 'metin', 10),
                'mid'   => metin($veri['mid'] ?? '', 40),
                'x'     => max(0.02, min(0.98, (float)($veri['x'] ?? 0.5))),
                'y'     => max(0.02, min(0.98, (float)($veri['y'] ?? 0.5))),
                'metin' => metin($veri['metin'] ?? '', 280),
                'kim'   => $id,
                'ad'    => $ad,
                't'     => round(microtime(true)),
            ];
            if (count($du['yildizlar']) > MAX_YILDIZ) {
                $du['yildizlar'] = array_slice($du['yildizlar'], -MAX_YILDIZ);
            }
            break;

        case 'yildiz-sil':
            $hedef = metin(is_array($veri) ? ($veri['id'] ?? '') : $veri, 40);
            $du['yildizlar'] = array_values(array_filter(
                (array)$du['yildizlar'],
                static fn($y) => ($y['id'] ?? '') !== $hedef
            ));
            $du['takimlar'] = array_values(array_filter(
                (array)$du['takimlar'],
                static fn($t) => ($t['a'] ?? '') !== $hedef && ($t['b'] ?? '') !== $hedef
            ));
            break;

        case 'takim':
            if (!is_array($veri)) return;
            $a = metin($veri['a'] ?? '', 40);
            $b = metin($veri['b'] ?? '', 40);
            if ($a === '' || $b === '' || $a === $b) return;
            foreach ((array)$du['takimlar'] as $t) {
                if ((($t['a'] ?? '') === $a && ($t['b'] ?? '') === $b) ||
                    (($t['a'] ?? '') === $b && ($t['b'] ?? '') === $a)) return;
            }
            $du['takimlar'][] = ['a' => $a, 'b' => $b, 'kim' => $id];
            break;

        case 'cizgi':
            if (!is_array($veri)) return;
            $du['cizim'][] = [
                'n' => array_slice(array_map(static function ($p) {
                        return [round((float)($p[0] ?? 0), 4), round((float)($p[1] ?? 0), 4)];
                    }, array_values((array)($veri['n'] ?? []))), 0, 400),
                'r' => metin($veri['r'] ?? '#ff8fab', 20),
                'k' => max(1, min(40, (float)($veri['k'] ?? 4))),
            ];
            if (count($du['cizim']) > MAX_CIZGI) {
                $du['cizim'] = array_slice($du['cizim'], -MAX_CIZGI);
            }
            break;

        case 'cizim-temizle':
            $du['cizim'] = [];
            break;

        case 'kupon':
            if (!is_array($veri)) return;
            $k = (array)$du['kuponlar'];
            $k[(string)(int)($veri['no'] ?? 0)] = ['kim' => $id, 'ad' => $ad, 't' => round(microtime(true))];
            $du['kuponlar'] = $k;
            break;

        case 'kupon-sifirla':
            $du['kuponlar'] = (object)[];
            break;

        case 'uyum':
            if (!is_array($veri)) return;
            $u = (array)$du['uyum'];
            $soru = (string)(int)($veri['soru'] ?? 0);
            if (!isset($u[$soru]) || !is_array($u[$soru])) $u[$soru] = [];
            $u[$soru][$id] = ['c' => (int)($veri['cevap'] ?? -1), 'ad' => $ad];
            $du['uyum'] = $u;
            break;

        case 'uyum-sifirla':
            $du['uyum'] = (object)[];
            break;

        case 'senkron-basarili':
            $du['senkron'] = [
                'sayi' => (int)($du['senkron']['sayi'] ?? 0) + 1,
                'son'  => round(microtime(true)),
            ];
            break;

        case 'cark-sonuc':
            if (!is_array($veri)) return;
            $du['cark'] = ['no' => (int)($veri['no'] ?? 0), 'ad' => $ad, 't' => round(microtime(true))];
            break;

        case 'gunluk': {
            if (!is_array($veri)) return;
            $g = (array)$du['gunluk'];
            $gun = metin($veri['gun'] ?? '', 12);
            if ($gun === '') return;
            if (!isset($g[$gun]) || !is_array($g[$gun])) $g[$gun] = [];
            $g[$gun][$id] = ['metin' => metin($veri['metin'] ?? '', 1200), 'ad' => $ad, 't' => round(microtime(true))];
            $du['gunluk'] = $g;
            break;
        }

        case 'kapsul':
            if (!is_array($veri)) return;
            $du['kapsul'][] = [
                'id'     => metin($veri['id'] ?? uniqid('k', true), 40),
                'metin'  => metin($veri['metin'] ?? '', 2000),
                'acilis' => metin($veri['acilis'] ?? '', 12),
                'kim'    => $id, 'ad' => $ad, 't' => round(microtime(true)),
            ];
            break;

        case 'kapsul-sil': {
            $h = metin(is_array($veri) ? ($veri['id'] ?? '') : $veri, 40);
            $du['kapsul'] = array_values(array_filter((array)$du['kapsul'],
                static fn($k) => ($k['id'] ?? '') !== $h));
            break;
        }

        case 'medya': {
            if (!is_array($veri)) return;
            $m = (array)$du['medya'];
            $mid = metin($veri['mid'] ?? '', 40);
            if ($mid === '') return;
            $m[$mid] = (string)($veri['veri'] ?? '');
            if (count($m) > MAX_MEDYA) $m = array_slice($m, -MAX_MEDYA, null, true);
            $du['medya'] = $m;
            break;
        }

        case 'fisilti':
            if (!is_array($veri)) return;
            $du['sohbet'][] = [
                'metin' => metin($veri['metin'] ?? '', 300),
                'kim'   => $id,
                'ad'    => $ad,
                't'     => round(microtime(true)),
            ];
            if (count($du['sohbet']) > MAX_SOHBET) {
                $du['sohbet'] = array_slice($du['sohbet'], -MAX_SOHBET);
            }
            break;
    }
}

/* ---------------- İstek ---------------- */

$g       = girdi();
$aksiyon = metin($g['aksiyon'] ?? 'ping', 24);
$oda     = kimlik($g['oda'] ?? 'varsayilan');
$id      = kimlik($g['kim'] ?? '');
$ad      = metin($g['ad'] ?? '', 40);
$sayfa   = metin($g['sayfa'] ?? '', 40);
$rol     = metin($g['rol'] ?? '', 8);
$dosya   = odaDosyasi($oda);

if ($aksiyon === 'ping') {
    cikti([
        'tamam'   => true,
        'sunucu'  => true,
        'surum'   => '1.0',
        'php'     => PHP_VERSION,
        'yazilir' => is_dir(VERI_DIZIN) ? is_writable(VERI_DIZIN) : is_writable(__DIR__),
        'bekle'   => BEKLE_SN,
    ]);
}

if ($id === '') cikti(['hata' => 'kim (kimlik) gerekli'], 400);

switch ($aksiyon) {

    /* Tam durum anlık görüntüsü + katılım */
    case 'durum': {
        $sonuc = odaYaz($dosya, static function (array &$d) use ($id, $ad, $sayfa, $rol) {
            $yeni = varlikDamgala($d, $id, $ad, $sayfa, $rol);
            if ($yeni) olayEkle($d, 'katildi', ['ad' => $ad], $id, $ad);
            return true;
        });
        $d = odaOku($dosya);
        cikti([
            'tamam'     => true,
            'seq'       => $d['seq'],
            'durum'     => $d['durum'],
            'kisiler'   => kisilerCiktisi($d),
            'cevrimici' => cevrimiciler($d),
            'sunucuT'   => round(microtime(true), 3),
        ]);
    }

    /* Olay gönder */
    case 'yolla': {
        $tip  = metin($g['tip'] ?? '', 32);
        $veri = $g['veri'] ?? null;
        if ($tip === '') cikti(['hata' => 'tip gerekli'], 400);

        $olay = odaYaz($dosya, static function (array &$d) use ($tip, $veri, $id, $ad, $sayfa, $rol) {
            varlikDamgala($d, $id, $ad, $sayfa, $rol);
            return olayEkle($d, $tip, $veri, $id, $ad);
        });
        cikti(['tamam' => true, 'seq' => $olay['s']]);
    }

    /* Sadece "buradayım" de (olay üretmeden) */
    case 'varlik': {
        odaYaz($dosya, static function (array &$d) use ($id, $ad, $sayfa, $rol) {
            varlikDamgala($d, $id, $ad, $sayfa, $rol);
            return true;
        });
        cikti(['tamam' => true]);
    }

    /* Ayrıl */
    case 'ayril': {
        odaYaz($dosya, static function (array &$d) use ($id) {
            if (isset($d['kisiler'][$id])) $d['kisiler'][$id]['son'] = 0;
            $d['seq'] = (int)$d['seq'] + 1;   // karşı tarafın beklemesini uyandır
            return true;
        });
        cikti(['tamam' => true]);
    }

    /* Odayı tamamen temizle */
    case 'sil': {
        odaYaz($dosya, static function (array &$d) {
            $b = bosOda();
            $d['durum']   = $b['durum'];
            $d['olaylar'] = [];
            $d['seq']     = (int)$d['seq'] + 1;
            return true;
        });
        cikti(['tamam' => true]);
    }

    /* Gerçek zamanlı bekleme (long-poll) */
    case 'senkron': {
        $since = (int)($g['since'] ?? 0);
        $pset  = (string)($g['pset'] ?? '');

        // İsteğe başlarken varlığımızı tazele ve gerekiyorsa katılım olayı üret.
        odaYaz($dosya, static function (array &$d) use ($id, $ad, $sayfa, $rol) {
            $yeni = varlikDamgala($d, $id, $ad, $sayfa, $rol);
            if ($yeni) olayEkle($d, 'katildi', ['ad' => $ad], $id, $ad);
            return true;
        });

        $bitis = microtime(true) + BEKLE_SN;
        do {
            $d      = odaOku($dosya);
            $online = cevrimiciler($d);
            $degisti = ($d['seq'] > $since) || (implode(',', $online) !== $pset);

            if ($degisti) {
                $yeniler = [];
                foreach ((array)$d['olaylar'] as $o) {
                    if ((int)($o['s'] ?? 0) > $since) $yeniler[] = $o;
                }
                cikti([
                    'tamam'     => true,
                    'seq'       => $d['seq'],
                    'olaylar'   => $yeniler,
                    'kisiler'   => kisilerCiktisi($d),
                    'cevrimici' => $online,
                    'kacirdi'   => ($since > 0 && $d['seq'] - $since > MAX_OLAY),
                    'sunucuT'   => round(microtime(true), 3),
                ]);
            }
            usleep(280000); // 0.28 sn
        } while (microtime(true) < $bitis);

        // Değişiklik yok — istemci hemen yeniden sorsun.
        $d = odaOku($dosya);
        cikti([
            'tamam'     => true,
            'seq'       => $d['seq'],
            'olaylar'   => [],
            'kisiler'   => kisilerCiktisi($d),
            'cevrimici' => cevrimiciler($d),
            'bosDondu'  => true,
            'sunucuT'   => round(microtime(true), 3),
        ]);
    }
}

cikti(['hata' => 'bilinmeyen aksiyon: ' . $aksiyon], 400);
