---
title: 'Setelan DuckDB CLI'
date: 2024-03-19
updated: 2024-03-19
isPublished: true
tags:
  - mikroblog
  - sql
excerpt: "Setelan dalam file .duckdbrc"
---

Begini setelan file `~/.duckdbrc` saya:

```bash
.prompt '⬤◗  '
.constant brightblack
.keyword brightblack
.maxrows 80
.timer on

.print Loading extensions...
INSTALL httpfs;
LOAD httpfs;
.print Extensions loaded.

SET temp_directory = './duckdb.tmp/';
```

Akhir-akhir ini saya jadi suka tampilan monokrom. Agar DuckDB CLI saya ikut monokrom juga, saya ubah setelan bawaan penyorotnya. Konstanta dan kata kunci jadi `brightblack`.

Ada satu baris yang tidak saya masukkan ke blok kode di atas karena ada [bug di MDsveX](https://github.com/pngwn/MDsveX/issues/524) yang bikin *backslash* gak tercetak.

Baris itu adalah `.keywordcode \033[1m`. Baris ini menyetel agar kata kunci dicetak tebal di terminal. Daftar kode terminal ini saya dapat di [kamito punya Gist](https://gist.github.com/kamito/704813).

Setelan bawaan yang cuma menampilkan 40 baris juga saya ubah jadi 80. Penanda waktu seberapa lamban kueri dijalankan juga saya buat agar selalu tampak. Kemudian ekstensi `httpfs` supaya terpasang otomatis.

`.prompt '⬤◗  '` ini lebih cocok buat fon yang saya pakai di terminal ketimbang yang ada di dokumentasi DuckDB (`.prompt '⚫◗ '`). Saya pakai fon Iosevka karena ramping. Blog ini pun juga sama. Cocok buat kerja data karena bisa muat lebih banyak karakter dalam satu baris.

Terakhir adalah direktori sementara buat DuckDB untuk melakukan kerja-kerja melebihi kapasitas memori.

