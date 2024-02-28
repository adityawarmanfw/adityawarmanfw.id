---
title: 'Perbandingan Tipe Komposit'
date: 2024-02-28
updated: 2024-02-28
isPublished: true
tags:
  - mikroblog
  - sql
excerpt: "Perbedaan nilai baris di PostgreSQL dan DuckDB"
---

`SELECT` bisa dilakukan terhadap keseluruhan tabel dengan cara mengkueri nama tabel atau alias tabel:

```sql
SELECT T FROM T
-- atau
SELECT t FROM T AS t
```

Perbuatan ini dikenal sebagai *row variable binding*. Variabel baris `t` terikat secara iteratif ke nilai baris, yang nilai dan tipe datanya ditentukan oleh baris pada tabel `T`. Tak hanya kolom, ternyata baris juga memiliki tipe. Istilah resminya adalah [tipe komposit](https://www.postgresql.org/docs/current/rowtypes.html#ROWTYPES-USAGE). `SELECT t FROM T AS t` akan menghasilkan satu kolom komposit `t` dengan jumlah baris yang sama dengan baris tabel `T`.

```sql
     (a,     b)    --> nama field
t -> (1,     NULL)   ⎫
t -> (NULL,  1)      ⎬ nilai baris
t -> (NULL,  NULL)   |
t -> (1,     1)      ⎭
      ^      ^
     (int,   int)  --> tipe field
```

Di PostgreSQL, kueri:

```sql
SELECT
    t, x, y,
    t IS NULL as t_is_null,
    t IS NOT NULL as t_is_not_null,
    NOT t IS NULL as not_t_is_null
FROM (VALUES (1,1),(NULL,1),(1,NULL),(NULL,NULL)) AS t(x, y);

-- menghasilkan
/*──────┬───┬───┬───────────┬───────────────┬───────────────┐
│   t   │ x │ y │ t_is_null │ t_is_not_null │ not_t_is_null │
├───────┼───┼───┼───────────┼───────────────┼───────────────┤
│ (1,1) │ 1 │ 1 │ f         │ t             │ t             │
│ (,1)  │   │ 1 │ f         │ f             │ t             │
│ (1,)  │ 1 │   │ f         │ f             │ t             │
│ (,)   │   │   │ t         │ f             │ f             │
└───────┴───┴───┴───────────┴───────────────┴──────────────*/
```

Nilai baris dianggap `NULL` jika dan hanya jika semua field berisi nilai `NULL`.

```sql
t -> (NULL,  NULL)
```

Nilai barisnya adalah `NULL`.

Di DuckDB, kueri yang sama, rupanya punya hasil lain:

```sql
/*───────────────────────┬───┬───┬───────────┬───────────────┬───────────────┐
│           t            │ x │ y │ t_is_null │ t_is_not_null │ not_t_is_null │
├────────────────────────┼───┼───┼───────────┼───────────────┼───────────────┤
│ {'x': 1, 'y': 1}       │ 1 │ 1 │ false     │ true          │ true          │
│ {'x': NULL, 'y': 1}    │   │ 1 │ false     │ true          │ true          │
│ {'x': 1, 'y': NULL}    │ 1 │   │ false     │ true          │ true          │
│ {'x': NULL, 'y': NULL} │   │   │ false     │ true          │ true          │
└────────────────────────┴───┴───┴───────────┴───────────────┴──────────────*/
```

Saya kirim ini ke Discord DuckDB karena nggak yakin apakah ini kekutu atau bukan. Salah satu pengembangnya bilang, bukan. "Di DuckDB, sebuah baris belum tentu `NULL` hanya karena elemen turunannya semuanya `NULL`."