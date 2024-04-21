---
title: 'Kompresi Parquet'
date: 2024-04-21
updated: 2024-04-21
isPublished: true
tags:
  - blog
  - analitika
excerpt: "Dari 2.4GB SQLite ke 1.4GB csv lalu ke 134MB parquet"
---

Beberapa waktu lalu, discord [Pelajar Data](https://discord.com/invite/HFzeFKxKz3) bikin *challenge* untuk menganalisis set data "indiemart" bikinan [@BukanYahya](https://twitter.com/BukanYahya/status/1764681516603613305). Set data itu berisi harga barang dari Indomaret, Alfamart, dan Yogya Mart. File disimpan dalam database SQLite sebesar 2,4GB.

```bash
curl -o indiemart.db http://194.233.94.36/indiemart.db
```

Database SQLite bisa dibaca dengan DuckDB dengan menggunakan `ATTACH`:

```sql
SET GLOBAL sqlite_all_varchar = true;
-- Run Time (s): real 0.075 user 0.226423 sys 0.061888
ATTACH 'indiemart.db' AS indiemart;
-- Run Time (s): real 0.003 user 0.003121 sys 0.001423
```

Aturan tipe data di SQLite lebih longgar ketimbang DuckDB. Pernyataan pembuatan tabel seperti di bawah ini valid dalam SQLite:

```sql
CREATE TABLE numbers (i INTEGER);
INSERT INTO numbers VALUES ('Lihat, Mama!');
```
Saya membuat semua kolom dari semua tabel SQLite dianggap sebagai `varchar` dalam DuckDB untuk [menghindari galat](https://duckdb.org/docs/extensions/sqlite.html#data-types).

Setelah `indiemart.db` berhasil disematkan ke DuckDB, skema tabel dapat dikueri dengan cara:

```sql
SELECT
    table_catalog, table_schema,
    table_name, column_name, data_type
FROM information_schema.columns;
/*──────────────┬──────────────┬──────────────┬─────────────────┬───────────┐
│ table_catalog │ table_schema │  table_name  │   column_name   │ data_type │
│    varchar    │   varchar    │   varchar    │     varchar     │  varchar  │
├───────────────┼──────────────┼──────────────┼─────────────────┼───────────┤
│ indiemart     │ main         │ items        │ id              │ VARCHAR   │
│ indiemart     │ main         │ items        │ sku             │ VARCHAR   │
│ indiemart     │ main         │ items        │ name            │ VARCHAR   │
│ indiemart     │ main         │ items        │ category        │ VARCHAR   │
│ indiemart     │ main         │ items        │ image           │ VARCHAR   │
│ indiemart     │ main         │ items        │ link            │ VARCHAR   │
│ indiemart     │ main         │ items        │ source          │ VARCHAR   │
│ indiemart     │ main         │ items        │ created_at      │ VARCHAR   │
│ indiemart     │ main         │ prices       │ id              │ VARCHAR   │
│ indiemart     │ main         │ prices       │ items_id        │ VARCHAR   │
│ indiemart     │ main         │ prices       │ price           │ VARCHAR   │
│ indiemart     │ main         │ prices       │ description     │ VARCHAR   │
│ indiemart     │ main         │ prices       │ created_at      │ VARCHAR   │
│ indiemart     │ main         │ discounts    │ id              │ VARCHAR   │
│ indiemart     │ main         │ discounts    │ items_id        │ VARCHAR   │
│ indiemart     │ main         │ discounts    │ discount_price  │ VARCHAR   │
│ indiemart     │ main         │ discounts    │ original_price  │ VARCHAR   │
│ indiemart     │ main         │ discounts    │ percentage      │ VARCHAR   │
│ indiemart     │ main         │ discounts    │ description     │ VARCHAR   │
│ indiemart     │ main         │ discounts    │ created_at      │ VARCHAR   │
│ indiemart     │ main         │ item_item    │ id              │ VARCHAR   │
│ indiemart     │ main         │ item_item    │ item_id         │ VARCHAR   │
│ indiemart     │ main         │ item_item    │ with_item_id    │ VARCHAR   │
│ indiemart     │ main         │ item_item    │ status          │ VARCHAR   │
│ indiemart     │ main         │ item_item    │ created_at      │ VARCHAR   │
│ indiemart     │ main         │ item_item    │ updated_at      │ VARCHAR   │
│ indiemart     │ main         │ belanja_link │ id              │ VARCHAR   │
│ indiemart     │ main         │ belanja_link │ status          │ VARCHAR   │
│ indiemart     │ main         │ belanja_link │ created_at      │ VARCHAR   │
│ indiemart     │ main         │ belanja_link │ updated_at      │ VARCHAR   │
│ indiemart     │ main         │ belanja_link │ deleted_at      │ VARCHAR   │
│ indiemart     │ main         │ belanja_link │ secret_key      │ VARCHAR   │
│ indiemart     │ main         │ belanja      │ id              │ VARCHAR   │
│ indiemart     │ main         │ belanja      │ belanja_link_id │ VARCHAR   │
│ indiemart     │ main         │ belanja      │ items_id        │ VARCHAR   │
│ indiemart     │ main         │ belanja      │ custom_price    │ VARCHAR   │
│ indiemart     │ main         │ belanja      │ created_at      │ VARCHAR   │
│ indiemart     │ main         │ belanja      │ updated_at      │ VARCHAR   │
│ indiemart     │ main         │ belanja      │ deleted_at      │ VARCHAR   │
├───────────────┴──────────────┴──────────────┴─────────────────┴───────────┤
│ 39 rows                                                         5 columns │
└──────────────────────────────────────────────────────────────────────────*/
--Run Time (s): real 0.056 user 0.026423 sys 0.009899
```

Beberapa tabel tidak memiliki baris (tabel kosong).

Supaya pemrosesan data lebih cepat, penamaan lebih waras, tipe data yang lebih tepat, aku buat tabel asli DuckDB dari tabel SQLite. Aku pakai yang penting-penting saja (`prices`, `discounts`, dan `items`).

```sql
CREATE TABLE prices AS (
    SELECT
        id AS price_id,
        trim(items_id) AS item_id,
        price::bigint AS price,
        strptime(created_at, '%Y-%m-%d %H:%M:%S') AS created_at
    FROM indiemart.prices
);
-- Run Time (s): real 9.776 user 11.996592 sys 0.919930
```

```sql
CREATE TABLE discounts AS (
    SELECT
        trim(id) AS discount_id,
        trim(items_id) AS item_id,
        trim(discount_price)::bigint AS discounted_price,
        trim(original_price).replace('Rp ', '').replace('.', '')::bigint AS original_price,
        strptime(created_at, '%Y-%m-%d %H:%M:%S') AS created_at
    FROM indiemart.discounts
);
-- Run Time (s): real 11.244 user 3.920572 sys 0.938970
```

Data juga sedikit kuubah. Misalnya, kolom `name` yang berisi nama produk/item kubuat menjadi huruf kapital. Kuhilangkan nilai prefiks dari tautan ke produk (`link`) dan tautan ke gambar produk (`image`), sehingga menyisakan *path* yang diperlukan saja.

```sql
CREATE TABLE items AS (
    SELECT
        trim(id) AS item_id,
        trim(sku) AS sku,
        trim(upper(name)) AS item_name,
        trim(upper(category)) AS item_category,
        CASE source
            WHEN 'alfagift' THEN replace(link, 'https://alfagift.id/p/', '')
            WHEN 'klikindomaret' THEN replace(link, 'https://www.klikindomaret.com/product/', '')
            WHEN 'yogyaonline' THEN replace(link, 'https://yogyaonline.co.id/', '')
        END AS item_link,
        CASE source
            WHEN 'alfagift' THEN replace(image, 'https://c.alfagift.id/product/', '')
            WHEN 'klikindomaret' THEN replace(image, 'https://assets.klikindomaret.com/products/', '')
            WHEN 'yogyaonline' THEN replace(image, 'https://yol-nfs.yogyaonline.co.id/media/catalog/product/cache/', '')
        END AS image_link,
        source,
        strptime(created_at, '%Y-%m-%d %H:%M:%S') AS created_at
    FROM indiemart.items
);
-- Run Time (s): real 0.145 user 0.193274 sys 0.017994
```

Berikutnya, kugabungkan tiga tabel jadi satu tabel. Proses ini dinamakan sebagai denormalisasi. Berangkat dari tabel utama (`prices`), menggabungnya dengan `discounts` dan `items` dengan `LEFT JOIN`.

```sql
CREATE TABLE denormalized AS (
    SELECT
        source, price_id,
        item_id, sku,
        item_name, item_category,
        item_link, image_link,
        price, original_price,
        created_at
    FROM prices
    LEFT JOIN discounts USING (item_id, created_at)
    LEFT JOIN items USING (item_id, created_at)
);
-- Run Time (s): real 2.029 user 5.455654 sys 1.258431
```

Begini ringkasan dari tabel `denormalized`:

```sql
SUMMARIZE denormalized;
/*───────────────┬─────────────┬──────────────────────┬────────────────────────────────────────────────────────────────────────────────────────────────────────┬───────────────┬────────────────────┬────────────────────┬─────────┬─────────┬─────────┬─────────┬─────────────────┐
│  column_name   │ column_type │         min          │                                                  max                                                   │ approx_unique │        avg         │        std         │   q25   │   q50   │   q75   │  count  │ null_percentage │
│    varchar     │   varchar   │       varchar        │                                                varchar                                                 │     int64     │      varchar       │      varchar       │ varchar │ varchar │ varchar │  int64  │  decimal(9,2)   │
├────────────────┼─────────────┼──────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────┼───────────────┼────────────────────┼────────────────────┼─────────┼─────────┼─────────┼─────────┼─────────────────┤
│ source         │ VARCHAR     │ alfagift             │ yogyaonline                                                                                            │             3 │                    │                    │         │         │         │ 7122780 │            0.00 │
│ price_id       │ VARCHAR     │ 2225zf5jq9AiCkc6jk… │ oZEpX3CfuWSaTdRAUkSW7i                                                                                 │       7025679 │                    │                    │         │         │         │ 7122780 │            0.00 │
│ item_id        │ VARCHAR     │ 1                    │ oZ8iLWkPUzCyruaQ7Ryqtk                                                                                 │         34433 │                    │                    │         │         │         │ 7122780 │            0.00 │
│ sku            │ VARCHAR     │ 0000000845146        │ fff0a1f9-7182-4985-91e0-bd1577b8a282                                                                   │         34754 │                    │                    │         │         │         │ 7122780 │            0.00 │
│ item_name      │ VARCHAR     │ 137 DEGREES ALMOND… │ [BEST BEFORE MARET 2024] NUTRIBOOST MINUMAN SUSU RASA STROBERI / ORANGE 300 ML\t                       │         33617 │                    │                    │         │         │         │ 7122780 │            0.00 │
│ item_category  │ VARCHAR     │ AIR MINERAL          │ WOMENS FASHION                                                                                         │            90 │                    │                    │         │         │         │ 7122780 │            0.00 │
│ item_link      │ VARCHAR     │ 1                    │ zwitsal-twinpack-hb-aloe-pch-2x400ml-62735624-1c6.html                                                 │         35148 │                    │                    │         │         │         │ 7122780 │            0.00 │
│ image_link     │ VARCHAR     │ 1/12a_base.jpg       │ https://yogyaonline.co.id/pub/static/frontend/Toserbayogya-New/default/id_ID/Magento_Catalog/images/… │         33871 │                    │                    │         │         │         │ 7122780 │            0.00 │
│ price          │ BIGINT      │ 0                    │ 2210400000                                                                                             │          7078 │ 214084.14595663492 │ 10357280.478508933 │ 9003    │ 18276   │ 38142   │ 7122780 │            0.00 │
│ original_price │ BIGINT      │ 0                    │ 22104000                                                                                               │          3104 │ 27446.506682012736 │ 139778.05435224116 │ 0       │ 12062   │ 30533   │ 7122780 │            0.00 │
│ created_at     │ TIMESTAMP   │ 2023-11-23 00:07:49  │ 2024-03-19 00:07:42                                                                                    │         81561 │                    │                    │         │         │         │ 7122780 │            0.00 │
├────────────────┴─────────────┴──────────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────────────┴───────────────┴────────────────────┴────────────────────┴─────────┴─────────┴─────────┴─────────┴─────────────────┤
│ 11 rows                                                                                                                                                                                                                                                               12 columns │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────*/
-- Run Time (s): real 2.450 user 3.968176 sys 1.145161
```

Aku ekspor tabel ini ke dalam format csv dan parquet dengan kueri berikut:

```sql
COPY denormalized TO 'denormalized.csv' (FORMAT CSV, DELIMITER '|', HEADER);
-- Run Time (s): real 6.180 user 6.470471 sys 3.399346

COPY denormalized TO 'denormalized-uncompressed.parquet' (FORMAT 'parquet', CODEC 'uncompressed');
-- Run Time (s): real 3.971 user 11.133548 sys 2.380525

COPY denormalized TO 'denormalized-snappy.parquet' (FORMAT 'parquet', CODEC 'snappy');
-- Run Time (s): real 4.878 user 12.538215 sys 3.016616

COPY denormalized TO 'denormalized-zstd.parquet' (FORMAT 'parquet', CODEC 'zstd');
--Run Time (s): real 4.683 user 13.977171 sys 2.292715
```

Kueri di atas menghasilkan beberapa file dengan ukuran kira-kira seperti di bawah ini:

```bash
2.4G indiemart.db
1.4G denormalized.csv
724M denormalized-uncompressed.parquet
437M denormalized-snappy.parquet
236M denormalized-zstd.parquet
```

File SQLite awal berukuran 2,4GB. Tabel denormalisasi dalam format csv berukuran jauh lebih kecil yaitu 1,4GB. Parquet, sebagai format yang dirancang untuk jadi lebih efisien, berukuran 724MB tanpa kompresi. Snappy adalah kompresi *default* dari DuckDB. Penggunaan kompresi snappy menghasilkan parquet berukuran 437MB. File dengan ukuran paling kecil dihasilkan dengan kompresi ZSTD, 236MB.

Dalam pembuatan file parquet, urutan nilai kolom penting karena memengaruhi kompresi. Jika tabel diurutkan dari kolom teks yang memiliki nilai unique paling sedikit ke paling banyak, file yang dihasilkan akan berukuran lebih kecil lagi.

```sql
COPY (FROM denormalized ORDER BY source, item_category, sku) TO 'denormalized-ordered-zstd.parquet' (FORMAT 'parquet', CODEC 'zstd');
-- Run Time (s): real 72.985 user 48.425484 sys 21.464298
```

Kueri di atas menghasilkan file parquet dengan ukuran:

```bash
134M denormalized-ordered-zstd.parquet
```

Sekitar 90 persen lebih kecil dari file csv!