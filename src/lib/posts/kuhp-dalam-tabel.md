---
title: 'Yang Fana adalah PDF, Tabel Abadi: Membaca KUHP 2023 Lewat Tabel'
date: 2024-01-29
updated: 2024-01-29
isPublished: true
tags:
  - blog
  - analitika
  - sql
excerpt: "KUHP lama yang bersumber dari hukum kolonial berlaku sejak 1918. Meski begitu, sistem temu kembali dan pemetaan rujukan KUHP baru ada 101 tahun kemudian. Saya berupaya untuk cepat-cepat mengubah KUHP 2023 ke format yang lebih mudah diakses sebelum UU itu mulai diberlakukan."
---

<script>
    import DuckDbInstantiator from "$lib/components/DuckDBInstantiator.svelte";
    import DuckDBEditor from "$lib/components/DuckDBEditor.svelte";

    let connProm;
    let dbInit;

    let createTableStmt = `
SET default_null_order = 'NULLS FIRST';

CREATE OR REPLACE TABLE t_buku AS (
    SELECT
        buku::int32 AS buku,
        teks::varchar AS teks
    FROM read_csv_auto('https://raw.githubusercontent.com/adityawarmanfw/KUHP2023/main/tsvs/buku.tsv', sep='\t')
);

CREATE OR REPLACE TABLE t_bab AS (
    SELECT
        buku::int32 AS buku,
        bab::int32 AS bab,
        bab_romawi::varchar AS bab_romawi,
        pasal_awal::int32 AS pasal_awal,
        pasal_akhir::int32 AS pasal_akhir,
        teks::varchar AS teks,
    FROM read_csv_auto('https://raw.githubusercontent.com/adityawarmanfw/KUHP2023/main/tsvs/bab.tsv', sep='\t')
);

CREATE OR REPLACE TABLE t_bagian AS (
    SELECT
        bab::int32 AS bab,
        bagian::int32 AS bagian,
        pasal_awal::int32 AS pasal_awal,
        pasal_akhir::int32 AS pasal_akhir,
        teks::varchar AS teks,
    FROM read_csv_auto('https://raw.githubusercontent.com/adityawarmanfw/KUHP2023/main/tsvs/bagian.tsv', sep='\t')
);

CREATE OR REPLACE TABLE t_paragraf AS (
    SELECT
        bab::int32 AS bab,
        bagian::int32 AS bagian,
        paragraf::int32 AS paragraf,
        pasal_awal::int32 AS pasal_awal,
        pasal_akhir::int32 AS pasal_akhir,
        teks::varchar AS teks
    FROM read_csv_auto('https://raw.githubusercontent.com/adityawarmanfw/KUHP2023/main/tsvs/paragraf.tsv', sep='\t')
);

CREATE OR REPLACE TABLE t_pasal AS (
    SELECT
        sha256(concat(pasal, ayat, huruf, angka)) AS id,
        pasal::int32 AS pasal,
        ayat::int32 AS ayat,
        huruf::varchar AS huruf,
        angka::int32 AS angka,
        list_transform(string_split(pasal_rujukan::varchar, ','), x -> if(x = '', null, x))::int32 [] AS pasal_rujukan,
        list_transform(string_split(ayat_rujukan::varchar, ','), x -> if(x = '', null, x))::int32 [] AS ayat_rujukan,
        list_transform(string_split(huruf_rujukan::varchar, ','), x -> coalesce(x, ''))::varchar [] AS huruf_rujukan,
        teks::varchar AS teks
    FROM read_csv_auto('https://raw.githubusercontent.com/adityawarmanfw/KUHP2023/main/tsvs/pasal.tsv', sep='\t')
);

SHOW ALL TABLES;
    `;

    let diagramBatang = `
SELECT
    bab, bagian,
    pasal_awal, pasal_akhir,
    (pasal_akhir - pasal_awal + 1) AS jumlah_pasal,
    teks,
    concat(bar(jumlah_pasal, 0, max_jumlah_pasal), ' ', round(jumlah_pasal / max_pasal, 3), '%') AS diagram_batang
FROM 
    t_bagian, 
    (
        SELECT 
            max((pasal_akhir - pasal_awal + 1)) AS max_jumlah_pasal, 
            max(pasal_akhir) AS max_pasal 
        FROM t_bagian
    ) AS diagram
ORDER BY pasal_awal;
    `;

    let penalTree = `
WITH struktur AS (
    SELECT 
        t_bab.bab,
        t_bab.bab_romawi,
        t_bab.teks AS teks_bab,
        t_bagian.bagian,
        t_bagian.teks AS teks_bagian,
        t_paragraf.paragraf,
        t_paragraf.teks AS teks_paragraf,
        t_pasal.pasal,
        t_pasal.ayat,
        t_pasal.huruf,
        t_pasal.angka,
        ROW_NUMBER() OVER (ORDER BY t_pasal.pasal, t_pasal.ayat, t_pasal.huruf NULLS FIRST, t_pasal.angka NULLS FIRST) AS urutan
    FROM t_pasal
    LEFT JOIN t_bab ON t_pasal.pasal BETWEEN t_bab.pasal_awal AND t_bab.pasal_akhir
    LEFT JOIN t_bagian ON t_pasal.pasal BETWEEN t_bagian.pasal_awal AND t_bagian.pasal_akhir
    LEFT JOIN t_paragraf ON t_bagian.bagian = t_paragraf.bagian AND t_pasal.pasal BETWEEN t_paragraf.pasal_awal AND t_paragraf.pasal_akhir
), teks_struktur AS (
    SELECT
        urutan,
        if(bab IS NOT NULL, concat('Bab ', bab_romawi, ' ', teks_bab), NULL) AS bab,
        if(bagian IS NOT NULL, concat('Bagian ', bagian, ' ', CASE bagian WHEN 1 THEN '(Kesatu)' WHEN 2 THEN '(Kedua)' WHEN 3 THEN '(Ketiga)' WHEN 4 THEN '(Keempat)' END, ': ', teks_bagian), NULL) AS bagian,
        if(paragraf IS NOT NULL, concat('Paragraf ', paragraf, ' ', teks_paragraf), NULL) AS paragraf,
        concat('Pasal ', pasal) AS pasal,
        if(ayat > 0, concat('ayat (', ayat, ')'), NULL) AS ayat,
        if(huruf IS NOT NULL, concat('huruf ', huruf), NULL) AS huruf,
        if(angka IS NOT NULL, concat('angka ', angka), NULL) AS angka,
    FROM struktur
)
SELECT LIST(concat_ws('/', 'BUKU KESATU', bab, bagian, paragraf, pasal, ayat, huruf, angka)) AS tree 
FROM teks_struktur;
    `;

    let regexText = `
PREPARE cari_teks_regex AS (
    SELECT pasal, ayat, huruf, angka, teks
    FROM t_pasal
    WHERE regexp_matches(teks, ?, 'i')
    ORDER BY 1,2,3,4  
);

EXECUTE cari_teks_regex('nakhoda');
    `;

    let ftsText = `
PRAGMA create_fts_index(t_pasal, id, teks, stemmer = 'indonesian', stopwords = 'none', lower = 1, overwrite = 1);

PREPARE cari_teks_fts AS (
    WITH skor_dokumen AS (
        SELECT 
            pasal, ayat, huruf, angka, teks, 
            fts_main_t_pasal.match_bm25(id, ?, conjunctive := 1) AS score
        FROM t_pasal
    )
    SELECT pasal, ayat, huruf, angka, teks
    FROM skor_dokumen
    WHERE score IS NOT NULL
    ORDER BY score DESC
);

EXECUTE cari_teks_fts('nakhoda kapal');
    `;

    let humanReadable = `
SELECT 
    CASE 
        WHEN angka IS NOT NULL AND ayat > 0 THEN format('Pasal {} ayat ({}) huruf {} angka {}', pasal, ayat, huruf, angka)
        WHEN angka IS NOT NULL THEN format('Pasal {} huruf {} angka {}', pasal, huruf, angka)
        WHEN huruf IS NOT NULL AND ayat > 0 THEN format('Pasal {} ayat ({}) huruf {}', pasal, ayat, huruf)
        WHEN huruf IS NOT NULL THEN format('Pasal {} huruf {}', pasal, huruf)
        WHEN ayat > 0 THEN format('Pasal {} ayat ({})', pasal, ayat)
        ELSE format('Pasal {}', pasal)
    END AS pasal_baca,
    CASE 
        WHEN angka IS NOT NULL THEN format('{:>8}. {}', angka, teks)
        WHEN huruf IS NOT NULL THEN format('{:>5}. {}', huruf, teks) 
        WHEN ayat > 0 THEN format('({}) {}', ayat, teks)
        ELSE teks
    END AS teks
FROM t_pasal 
WHERE pasal = 130
ORDER BY pasal, ayat, huruf, angka;
    `

    let unnested = `
CREATE OR REPLACE TABLE unnested_pasal AS (
    SELECT
        t_pasal.pasal,
        t_pasal.ayat,
        t_pasal.huruf,
        t_pasal.angka,
        rujukan.pasal_rujukan,
        rujukan.ayat_rujukan,
        rujukan.huruf_rujukan,
        teks
    FROM t_pasal
    LEFT JOIN LATERAL (
        SELECT
            unnest(pasal_rujukan),
            unnest(ayat_rujukan),
            unnest(huruf_rujukan)
    ) AS rujukan(pasal_rujukan, ayat_rujukan, huruf_rujukan) ON TRUE
);
    `

    let traversal = `
CREATE OR REPLACE MACRO traversed_path(pasal, ayat, huruf) AS (
    CASE 
        WHEN huruf IS NOT NULL THEN concat(pasal, '(', ayat, ')', huruf)
        WHEN huruf IS NULL AND ayat IS NOT NULL THEN concat(pasal, '(', ayat, ')')
        WHEN huruf IS NULL AND ayat IS NULL THEN pasal
    END
);

PREPARE get_rujukan AS (
    WITH RECURSIVE traverse AS (
        SELECT 
            0 AS step,
            *,
            list_value(traversed_path(pasal, ayat, huruf)) AS traversed_path
        FROM unnested_pasal 
        WHERE pasal = ?
        UNION ALL
        SELECT 
            traverse.step + 1,
            unnested_pasal.*,
            array_append(traverse.traversed_path, traversed_path(traverse.pasal_rujukan, traverse.ayat_rujukan, traverse.huruf_rujukan))
        FROM traverse
        JOIN unnested_pasal 
            ON (traverse.huruf_rujukan IS NOT NULL 
                AND traverse.pasal_rujukan = unnested_pasal.pasal 
                AND traverse.ayat_rujukan = unnested_pasal.ayat 
                AND traverse.huruf_rujukan = unnested_pasal.huruf)
            OR (traverse.huruf_rujukan IS NULL 
                AND traverse.ayat_rujukan IS NOT NULL 
                AND traverse.pasal_rujukan = unnested_pasal.pasal 
                AND traverse.ayat_rujukan = unnested_pasal.ayat)
            OR (traverse.huruf_rujukan IS NULL 
                AND traverse.ayat_rujukan IS NULL 
                AND traverse.pasal_rujukan = unnested_pasal.pasal)
        WHERE 
            NOT list_contains(traverse.traversed_path, traversed_path(traverse.pasal_rujukan, traverse.ayat_rujukan, traverse.huruf_rujukan))
    )
    SELECT DISTINCT * EXCLUDE (step, traversed_path) 
    FROM traverse 
    ORDER BY step, pasal, ayat, huruf, angka, pasal_rujukan, ayat_rujukan, huruf_rujukan
);

EXECUTE get_rujukan(18);
    `
</script>

<DuckDbInstantiator bind:connProm bind:dbInit />

Kerja ini dimulai sejak beredarnya dokumen [draft_ruu_kuhp_final.pdf](https://bphn.go.id/data/documents/draft_ruu_kuhp_final.pdf) di situs web Badan Pembinaan Hukum Nasional (BPHN) pada 6 Desember 2022. RUU KUHP kini sudah disahkan menjadi UU, tapi pada waktu itu dokumen drafnya memicu [kehebohan](https://www.tempo.co/tag/ruu-kuhp) [besar](https://www.kompas.com/tag/RUU-KUHP) dan [ramai dikritik](https://www.vice.com/id/topic/ruu-kuhp) karena isinya dianggap mengancam demokrasi. Ahli hukum, aktivis, dan publik menanggapi draf itu dengan merinci, menganalisis, dan memberikan pandangan mereka atas isinya. Saya pun ikut membaca draf itu.

Saya sendiri merasakan bahwa membaca dokumen hukum adalah pekerjaan melelahkan dan merepotkan. Soal ini [saya tidak sendirian](https://twitter.com/search?q=capek%20baca%20undang%20undang&src=typed_query&f=live).

Sebagai orang yang bukan praktisi hukum, kerap kali saya mengandalkan mesin pencari ketika ingin mencari sesuatu terkait hukum. Kata-kata kunci saya seperti [banyak orang lain](https://trends.google.com/trends/explore?date=today%205-y&geo=ID&q=pasal,undang-undang&hl=id-ID), "pasal x ayat y uu z", "hukum xxx", "pidana sss", atau "UU tentang abcde". Hasil pencarian biasanya cukup baik. Ada situs-situs web yang menyediakan artikel tentang hukum yang berisi redaksi pasal disertai penjelasan dan rujukan-rujukan yang relevan. Tapi artikel dengan pembahasan yang lengkap seperti itu terbatas hanya pada dokumen hukum yang sudah terbit cukup lama.

Membaca dokumen hukum secara langsung dalam PDF tanpa lewat situs perantara memberikan pengalaman yang sama sekali berbeda. Terasa betapa repotnya ketika menemukan pasal yang merujuk pasal yang lain. Satu pasal bisa merujuk ke pasal lain yang merujuk ke pasal lainnya yang juga merujuk ke pasal yang lain lagi. Untuk memahami konteks secara utuh, berulang kali saya perlu bolak-balik mengusap layar menggulir dokumen.

Memeriksa struktur dokumen pun tak gampang. Dalam undang-undang, selain pasal, juga ada ayat, huruf, angka, paragraf, bab, buku. Pertanyaan-pertanyaan sederhana seperti "Ada berapa pasal dalam buku kesatu?", "Ada berapa pasal yang memiliki huruf dan angka?", atau "Dari pasal berapa sampai pasal berapa bab yang membahas tentang penyelundupan manusia?" tak bisa dijawab dengan cepat. Lagi-lagi perlu bolak-balik menggulir layar.

Format penyimpanan dokumen hukum dalam bentuk [Portable Document Format (PDF)](https://id.wikipedia.org/wiki/Portable_Document_Format) tak membantu banyak. Saya menghabiskan dua jam mencari dokumen undang-undang dalam format lain. Hasilnya nihil. Jaringan Dokumentasi dan Informasi Hukum Nasional ([JDIHN](https://jdihn.go.id/pencarian/detail/1563588/undang-undang-nomor-1-tahun-2023-tentang-kitab-undang-undang-hukum-pidana)) hanya menyediakan PDF.

Pencarian kata tidak akurat jika dokumen PDF tidak dibikin dengan baik. Sebagai contoh,  lakukan pencarian kata dengan cara terbalik. Mencari "s6lagaimana" di dokumen [Undang-Undang KUHP baru](https://peraturan.bpk.go.id/Details/234935/uu-no-1-tahun-2023) akan menemukan kata "sebagaimana". Mencari "orurng" akan menemukan "orang". PDF Undang-Undang KUHP yang ditulis ulang dan ditayangkan di situs [hukumonline.com](https://www.hukumonline.com/pusatdata/detail/lt63b3943c53853/undang-undang-nomor-1-tahun-2023) jelas dibikin dengan lebih baik. Pencarian kata "sebagaimana" memberikan hasil 573 kata, sedangkan di PDF versi pemerintah hanya 554 kata.

Lalu mengapa pemerintah hanya menyediakan format PDF? Mengapa menyimpan dalam PDF? Ada beberapa kemungkinan alasan. Tata letak yang ajek, fon yang tetap, mudah untuk dicetak, ... ya, saya kira itu saja. Tak ada nomor halaman, sehingga tak bisa juga dipakai untuk mempermudah pencarian jika pun dicetak (bandingkan dengan versi hukumonline.com). Keburukan lain adalah dokumen PDF Undang-Undang dari pemerintah juga tidak punya daftar isi interaktif (bisa diklik).

Ada beberapa alternatif untuk menyimpan dan meyebarkan dokumen hukum. Teks polos atau [laman HTML tanpa kosmetik](https://www.marxists.org/reference/archive/stalin/works/decades-index.htm), misalnya. [Pemerintah Amerika Serikat](https://uscode.house.gov/download/download.shtml) menyediakan dokumen dalam format selain PDF. Ada Extensible Markup Language ([XML](https://en.wikipedia.org/wiki/XML)) dan Extensible HyperText Markup Language ([XHTML](https://en.wikipedia.org/wiki/XHTML)).

Di Indonesia, upaya pengubahan Undang-Undang ke format lain sudah dilakukan. Saya menemukan sebuah skripsi yang ditulis Siti Mawadah di tahun 2006 yang bisa dibaca juga sebagai proposal ["Pengembangan standar dokumen legal Indonesia berbasis XML"](https://lib.ui.ac.id/detail?id=124826&lokasi=lokal). Siti berfokus pada dokumen Undang-Undang. Pasca skripsi itu, ada upaya-upaya lain. Susy Violina di tahun 2009 membuat skripsi yang memiliki cakupan lebih luas dengan juga [memakai studi kasus UU Perubahan](https://lib.ui.ac.id/detail?id=123118&lokasi=lokal#). Mulyandra Pratama di tahun yang sama memakai studi kasus Peraturan Pemerintah (PP). Upaya-upaya itu lahir di Universitas Indonesia. Mereka telah mengkonversi ratusan dokumen legal ke format yang lebih mudah diakses. Bahkan Yans Sukma Pratama  membuat sistem perolehan informasi yang [menggunakan dokumen hukum yang terbit dari tahun 1983 sampai 2009](https://lib.ui.ac.id/detail?id=122890&lokasi=lokal#).

Termutakhir yang bisa saya temukan, tahun 2019 Roha‘di Oloan Tampubolon dari Universitas YARSI membuat skripsi tentang [visualisasi informasi hukum pidana umum](https://digilib.yarsi.ac.id/4858/) (KUHP lama), yang kemudian [terbit dalam bentuk jurnal di IEEE](https://ieeexplore.ieee.org/document/9288591) dengan tajuk "PenalViz: A Web-Based Visualization Tool for the Indonesian Penal Code".

Celakanya, saya tidak bisa menemukan hasil olahan (dokumen XML atau format lainnya) dari semua penelitian itu.

Tanggal 20 Desember 2022, [saya bilang di Twitter](https://twitter.com/adityawarmanfw/status/1605050449396015104) akan mendedikasikan waktu luang untuk membuat KUHP baru dalam bentuk tabel. Format terstruktur yang paling saya akrabi.

---

## Pada mulanya adalah tabel

Meminjam kata-kata Sapardi, "Yang fana adalah PDF. Tabel abadi."

Umat manusia [akrab dengan tabel sejak 3000 SM](https://en.wikipedia.org/wiki/Proto-cuneiform#Corpus). Jika dibandingkan dengan XML, bentuk tabel akan lebih mudah diakses, terutama karena bisa [dikueri dengan SQL](https://sekuel.com/sql-courses/) secara alami. Selain itu, ukuran dokumen juga bisa jadi lebih kecil.

Bagaimana membuat struktur tabel yang cocok dalam hal ini?

Berdasarkan UU No. 12 TAHUN 2011 tentang Pembentukan Peraturan Perundang-undangan, kerangka UU adalah judul, pembukaan, batang tubuh, penutup, penjelasan, dan lampiran. Dua yang terakhir hanya ada jika diperlukan.

Saat ini saya hanya fokus ke batang tubuh, yang memuat semua materi muatan Peraturan Perundang-undangan yang dirumuskan dalam pasal atau beberapa pasal. Pembukaan, penutup, penjelasan, dan lampiran akan dikerjakan secara bertahap nanti.

Lampiran II UU 12 Tahun 2011 menjelaskan bahwa:

Dalam Peraturan Perundang-undangan, pengelompokan materi disusun dalam buku, bab, bagian, dan paragraf. Pengelompokkan materi muatan dalam buku, bab, bagian, dan paragraf dilakukan atas dasar kesamaan materi. Urutan pengelompokan adalah sebagai berikut:

    * bab dengan pasal atau beberapa pasal tanpa bagian dan paragraf;
    * bab dengan bagian dan pasal atau beberapa pasal tanpa paragraf; atau
    * bab dengan bagian dan paragraf yang berisi pasal atau beberapa pasal. 

```
BUKU
    BAB
        BAGIAN
            Paragraf
```

Satuan aturan dalam Perundang-undangan dirumuskan dalam Pasal yang bisa dirinci ke beberapa ayat dan dirinci dengan huruf abjad kecil dengan titik (`.`) dan jika perlu lebih rinci bisa ditambah dengan angka dengan titik (`.`) dan jika perlu lebih rinci lagi, huruf abjad kecil dan angka dengan kurung tutup (` ) `). 

Contohnya:

```
Pasal 9
… .
    (1) … .
    (2) …:
        a. …;
        b. …; (dan, atau, dan/atau)
        c. …:
            1. …;
            2. …; (dan, atau, dan/atau)
            3. …:
                a) …;
                b) …; (dan, atau, dan/atau)
                c) … .
                    1) …;
                    2) …; (dan, atau, dan/atau)
                    3) … . 
```

Sehingga jika diubah ke dalam format tabel akan menjadi seperti ini:

```
t_buku
|-------|-------|
| buku  | teks 	|
|-------|-------|

t_bab
|------|-----|------------|------------|-------------|------|
| buku | bab | bab_romawi | pasal_awal | pasal_akhir | teks |
|------|-----|------------|------------|-------------|------|

t_bagian
|-----|--------|------------|-------------|------|
| bab | bagian | pasal_awal | pasal_akhir | teks |
|-----|--------|------------|-------------|------|

t_paragraf
|-----|--------|----------|------------|-------------|------|
| bab | bagian | paragraf | pasal_awal | pasal_akhir | teks |
|-----|--------|----------|------------|-------------|------|

t_pasal
|-------|------|-------|-------|---------------|--------------|---------------|------|
| pasal | ayat | huruf | angka | pasal_rujukan | ayat_rujukan | huruf_rujukan | teks |
|-------|------|-------|-------|---------------|--------------|---------------|------|
```

Sampai tulisan ini dibuat, saya telah [mengubah KUHP baru Buku Kesatu ke dalam bentuk tabel](https://github.com/adityawarmanfw/KUHP2023/tree/main). Di buku kesatu ini, Pasal paling rinci hanya diturunkan sampai angka (lihat tabel `t_pasal`). Contoh tabel di atas mengikuti struktur batang tubuh KUHP 2023 Buku Kesatu.

Silakan jalankan kueri SQL di bawah ini dengan klik tombol `Eksekusi`. Kueri ini akan [mengambil data dari repositori GitHub KUHP2023](https://github.com/adityawarmanfw/KUHP2023/tree/main) dan memuatnya ke dalam tabel di sistem basis data DuckDB secara transien.

<DuckDBEditor bind:value={createTableStmt} bind:connProm bind:dbInit />

Seberapa jauh format tabel menjawab masalah-masalah yang ada?

Mari coba bersama.

### Memeriksa Struktur Undang-Undang KUHP 2023

Jika tabel sudah berhasil dimuat, silakan periksa salah satu tabel dengan mengeksekusi kueri di bawah ini:

<DuckDBEditor value='SELECT * FROM t_bab;' bind:connProm bind:dbInit />

Kolom `pasal_awal` dan `pasal_akhir` yang ada dalam beberapa tabel (`t_bab`, `t_bagian`, dan `t_paragraf`) berisi informasi pasal berapa saja yang termasuk ke dalam masing-masing bab. Dengan format seperti ini, memeriksa struktur dokumen Undang-Undang jadi perkara gampang.

Menghitung berapa jumlah pasal di masing-masing paragraf, misalnya, juga sepele:

<DuckDBEditor value={diagramBatang} bind:connProm bind:dbInit />

Format terstruktur membuat banyak hal jadi lebih mudah. Termasuk mengubahnya ke format lain dan memvisualisasikannya. 

Untuk memeriksa struktur, bentuk visualisasi yang jamak dipakai adalah diagram pohon seperti di bawah ini.

![Diagaram Pohon ><](/svgs/miniPenalTree.svg)

[Versi lengkap dari diagram pohon bisa diakses di sini](/svgs/penalTree.svg).

Diagram pohon di atas dibangun menggunakan pustaka [Observable Plot](https://observablehq.com/plot/).
Kueri untuk menyiapkan data yang bisa dikonsumsi oleh pustaka visualisasi:

<DuckDBEditor value={penalTree} bind:connProm bind:dbInit />

Seperti yang bisa dilihat dari contoh kueri untuk membuat visualisasi, ide utama dari struktur pembuatan `pasal_awal` dan `pasal_akhir` adalah:
    
    1. Menghitung jumlah pasal tak perlu fungsi agregat.
        ```sql
        (pasal_akhir - pasal_awal + 1)
        ```
    2. Penyatuan dengan tabel `t_pasal` bisa dilakukan dengan range `JOIN`.
        ```sql
        FROM t_pasal
        LEFT JOIN t_bab ON t_pasal.pasal BETWEEN t_bab.pasal_awal AND t_bab.pasal_akhir
        ```
    3. Penyimpanan lebih hemat, ukuran lebih kecil.

### Membangun Tabel Pasal (`t_pasal`)

Mari coba mengambil data dari tabel `t_pasal`.

<DuckDBEditor value='SELECT * EXCLUDE (id) FROM t_pasal WHERE pasal IN (130, 142, 175) ORDER BY 1,2,3,4;' bind:connProm bind:dbInit />

Kueri di atas mengambil data dari Pasal 130, 142, dan 175 UU KUHP.

Teks untuk Pasal tersebut adalah (dipersingkat) seperti ini:

```
---
Pasal 130
(1) Jika terjadi perbarengan sebagaimana dimaksud dalam Pasal 127 dan Pasal 129, penjatuhan pidana tambahan dilakukan dengan ketentuan sebagai berikut:
    a. ...:
        1. ...; atau
        2. ....
    b. ...; atau
    c. ....
(2) Ketentuan mengenai lamanya pidana pengganti bagi pidana perampasan Barang tertentu sebagaimana dimaksud pada ayat (1) huruf c berlaku ketentuan pidana pengganti untuk denda.

Pasal 142
(1) ....
(2) ....
(3) ....
(4) Jika pidana mati diubah menjadi pidana penjara seumur hidup sebagaimana dimaksud dalam Pasal 101, kewenangan pelaksanaan pidana gugur karena kedaluwarsa setelah lewat waktu yang sama dengan tenggang waktu kedaluwarsa kewenangan menuntut sebagaimana dimaksud dalam Pasal 136 ayat (1) huruf e ditambah 1/3 (satu per tiga) dari tenggang waktu kedaluwarsa tersebut.

Pasal 175
Penumpang adalah orang selain Nakhoda dan Anak Buah Kapal yang berada di Kapal atau orang selain kapten penerbang dan awak Pesawat Udara lain yang berada dalam Pesawat Udara.
---
```

Konversi ke dalam bentuk tabel dilakukan dengan cara memuat tiap baris ke dalam `t_pasal` dalam dokumen `tsv` dengan ketentuan:
    1. Kolom `pasal` dan `ayat` tidak boleh bernilai `null`.
        * Jika Pasal tidak memiliki ayat seperti Pasal 175, kolom `ayat` diisi dengan nilai `0`.
    2. Berikan nilai pada kolom `huruf` dan `angka` jika Pasal mengandung unsur tersebut.
    3. Rujukan ditulis dengan koma (`,`) sebagai pemisah.
        * Pasal 130 ayat 1 merujuk ke Pasal 127 dan Pasal 129. Kolom `pasal_rujukan` diisi dengan `127,129` sesuai urutan penyebutan dalam teks pasal.
        * Pasal 130 ayat 2 merujuk secara implisit ke Pasal yang sama--teks hanya menyebut ayat (1) huruf c. Dalam kondisi demikian, selain `ayat_rujukan` dan `huruf_rujukan`, `pasal_rujukan` harus tetap diisi secara eksplisit.
        
        * Pasal 142 ayat 4 merujuk ke dua Pasal. Pertama adalah Pasal 101 tanpa ayat dan kedua adalah 136 ayat (1) huruf e. Penulisan di kolom `pasal_rujukan` menjadi `101,136`, kolom `ayat_rujukan` menjadi `,1` dan `huruf_rujukan` menjadi `,e`. Ada penambahan teks kosong sebelum koma (`,`) pada nilai kolom `ayat_rujukan` dan `huruf_rujukan`. Ini diperlukan agar urutan tidak kacau jika nilai pada tiap kolom dengan sufiks `_rujukan` dikeluarkan dari kurungan (`unnested`).

Untuk lebih memperjelas, baris dalam tabel `t_pasal` representasi dari struktur terkecil atau terdalam yaitu `angka` selama `angka` memiliki nilai selain `null`. Jika kolom `angka` bernilai `null`, maka naik satu tingkat ke `huruf`, begitu seterusnya. Baris `t_pasal` merujuk pada kombinasi (`pasal`, `ayat`, `huruf`, `angka`).

Struktur ini mungkin belum sempurna, tapi setidaknya ini yang terbaik yang bisa saya pikirkan sekarang. Masukan dari Anda sangat saya harapkan.

### Tabel dengan Teks yang Lebih Ramah Dibaca Manusia

Penyimpanan dalam bentuk tabel akan mempermudah pembuatan API. Umumnya, tugas menampilkan teks yang lebih ramah dibaca manusia mestinya berada pada bagian antar muka. Pun begitu, jika ingin membuat tabel lebih mudah dibaca, itu juga mudah dilakukan!

<DuckDBEditor value={humanReadable} bind:connProm bind:dbInit />

### Pencarian Teks dalam Pasal

Lalu sebaik apa pencarian teks dalam format tabel?

Sudah barang tentu akan lebih baik dari PDF. Bahkan [teks polos saja lebih baik](https://raw.githubusercontent.com/adityawarmanfw/KUHP2023/main/text/uu__1_2023.txt) dari PDF. 

Tapi, [mari kita coba](https://www.youtube.com/watch?v=6usdtGZ-mzI).

<DuckDBEditor value={regexText} bind:connProm bind:dbInit />

Kueri di atas akan mengembalikan semua teks pasal yang ada kata "nakhoda" di dalamnya. Dalam contoh ini saya memakai `regexp_matches`. Bisa juga pakai `LIKE`.

Regex juga memungkinkan pencarian lebih dari satu kata kunci.

<DuckDBEditor value="EXECUTE cari_teks_regex('nakhoda|kapal');" bind:connProm bind:dbInit />

Simbol pipa (`|`) berarti `OR` (atau). Jadi, kueri mencari tiap teks pasal yang di dalamnya ada kata "nakhoda" atau "kapal". 

Yang menjadi masalah kemudian adalah jika ingin mencari pasal yang terdiri dari dua kata tersebut.

Saya memakai [DuckDB](https://duckdb.org/) sebagai enjin kueri SQL. DuckDB memakai enjin regex [RE2](https://duckdb.org/docs/sql/functions/patternmatching#the-re2-library) yang tidak mendukung [*lookahead*](https://www.regular-expressions.info/lookaround.html). Sehingga, kueri menjadi rumit:

<DuckDBEditor value="EXECUTE cari_teks_regex('nakhoda.*kapal|kapal.*nakhoda');" bind:connProm bind:dbInit />

Bayangkan jika ingin mencari gabungan tiga kata atau lebih dengan regex.

Beruntungnya, ada cara yang lebih anggun.

Di RDBMS mumpuni seperti SQLite, PostgreSQL, dan DuckDB ada [Full](https://www.postgresql.org/docs/current/textsearch-intro.html) [Text](https://www.sqlite.org/fts5.html) [Search](https://duckdb.org/docs/extensions/full_text_search.html) (FTS) yang memungkinkan pencarian teks dengan bahasa alami. Mirip mesin pencari.

<DuckDBEditor value={ftsText} bind:connProm bind:dbInit />

Salah satu kelebihan FTS dibandingkan regex atau `LIKE` adalah FTS memberikan ranking pada hasil pencarian. Selain itu, `FTS` juga bisa mengembalikan hasil pencarian meski kata tak persis sama. 

<DuckDBEditor value="EXECUTE cari_teks_fts('pemidanaan anak');" bind:connProm bind:dbInit />

Pencarian "pemidanaan anak" akan memberikan hasil berupa daftar pasal yang terkait dengan pidana anak. Perhatikan tabel. Tidak ada Pasal yang mengandung kata "pemidanaan" di sana. Hanya ada "Pidana", tapi FTS bisa menyimpulkan bahwa itu sama atau mirip.

## Memetakan Rujukan Pasal

Bisakah tabel menyudahi kerepotan "bolak-balik mengusap layar menggulir dokumen" untuk memahami Pasal secara utuh?

Tentu! Ini sudah dilakukan dalam [PenalViz](https://ieeexplore.ieee.org/document/9288591). Meskipun produk akhir penelitian tak bisa saya temukan, setidaknya saya melihat beberapa tangkapan layar. Mereka menggunakan visualisasi graf. 

Di sini, saya berusaha memberikan contoh bagaimana memetakan jejaring pasal dari data tabel. Untuk mencapai tujuan itu, pertama-tama tabel `t_pasal` perlu ditransformasi ke bentuk terdenormalisasi dengan mengeluarkan nilai `pasal_rujukan`, `ayat_rujukan`, dan `huruf_rujukan` dari sangkar (`UNNEST`). Selanjutnya, perlu kueri `RECURSIVE CTE` untuk melakukan *traversal*.

<DuckDBEditor value={unnested} bind:connProm bind:dbInit />

Kueri di atas akan membuat sebuah tabel baru bernama `unnested_pasal`. Tiap baris dalam tabel tersebut tidak lagi merepresentasikan kombinasi (`pasal`, `ayat`, `huruf`, `angka`) seperti dalam `t_pasal`, tapi berubah menjadi (`pasal`, `ayat`, `huruf`, `angka`, `pasal_rujukan`, `ayat_rujukan`, `huruf_rujukan`). Perlu diingat bahwa satu baris dalam `t_pasal` bisa memuat banyak rujukan sekaligus, sehingga dalam tabel `unnested_pasal` ini, nilai kolom `teks` bisa berulang.

<DuckDBEditor value={traversal} bind:connProm bind:dbInit />

Kueri di atas memberikan hasil berupa Pasal secara utuh, ditambah dengan Pasal lain yang dirujuk oleh Pasal tersebut, sekaligus Pasal lain yang dirujuk oleh Pasal yang menjadi rujukan sampai tidak ditemukan rujukan lain lagi.

Mari coba pasal lainnya:

<DuckDBEditor value="EXECUTE get_rujukan(142);" bind:connProm bind:dbInit />

---

## Penutup

### Mengapa KUHP?

KUHP adalah salah satu produk hukum yang terus menerus dibaca dan dijadikan rujukan. KUHP lama yang bersumber dari hukum kolonial [berlaku sejak 1918](https://id.wikipedia.org/wiki/Kitab_Undang-Undang_Hukum_Pidana_Indonesia#:~:text=mulai%20berlaku%20sejak%20tanggal%201%20Januari%201918), bertahan hingga 100 tahun.

Meski begitu, sistem temu kembali dan pemetaan rujukan di KUHP lama menjadi penelitian di 2019: 101 tahun pasca UU diberlakukan.

Besar kemungkinan KUHP baru juga akan bertahan cukup lama. Saya rasa penting untuk cepat-cepat mengubahnya ke format yang lebih mudah diakses sebelum KUHP baru berlaku.

### Jadi, ini proyek apa sebenarnya?

Tujuan saya hanya sebatas mengubah KUHP 2023 ke dalam format tabel. Format ini kemudian, sebagaimana dibahas dalam tulisan ini, bisa dikonsumsi ke dalam basis data relasional untuk kemudian diturunkan menjadi format atau produk lain. 

Jika boleh berharap pada pemerintah, saya ingin mereka menyediakan format alternatif untuk mengakses dokumen-dokumen hukum. Mungkin bisa dimulai dalam bentuk teks polos atau html.

### Struktur tabel

Seperti yang saya ungkapkan di atas: Struktur ini mungkin belum sempurna, tapi setidaknya ini yang terbaik yang bisa saya pikirkan sekarang. Masukan dari Anda sangat saya harapkan.

Bagian yang saya belum yakin betul adalah terkait penyimpanan rujukan. Sepertinya ada cara lain yang lebih baik ketimbang mencatatnya dengan dipisahkan koma. Sebuah pasal juga bisa juga merujuk ke Undang-Undang atau Peraturan lain (dalam Buku Kedua).

### Pengubahan dokumen PDF ke tabel secara otomatis?

Beberapa pembaca mungkin berharap menemukan bahasan mengenai cara untuk mengubah dokumen-dokumen PDF ke dalam bentuk tabel secara otomatis. Sampai tulisan ini dibuat, saya belum berhasil membuatnya. Pengubahan dari PDF ke dalam tabel di [repositori KUHP2023](https://github.com/adityawarmanfw/KUHP2023/blob/main/tsvs/pasal.tsv) sejauh ini saya lakukan secara manual. 

Saya sudah mencoba menghubungi beberapa nama yang disebut di atas lewat LinkedIn dan masih menunggu respons. Harapan saya, mereka masih menyimpan program yang mereka bangun untuk mengubah PDF ke XML, atau paling tidak, dokumen yang sudah terkonversi.

### Kontribusi

Hasil dan dokumentasi kerja pengubahan dokumen KUHP ke dalam tabel ini saya unggah di repositori Github KUHP 2023: https://github.com/adityawarmanfw/KUHP2023.

Silakan jika ada dari pembaca yang ingin berkontribusi, apa pun bentuknya.

---

*"Memungut Pasal demi Pasal, merangkainya ke dalam tabel."*.