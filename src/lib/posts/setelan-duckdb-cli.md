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

```
.prompt '⬤◗  '
.constant brightblack
.keyword brightblack
.keywordcode \033[1m
.maxrows 80
.timer on

.print Loading extensions...
INSTALL httpfs;
LOAD httpfs;
.print Extensions loaded.

SET temp_directory = './duckdb.tmp/';
```

Akhir-akhir ini saya jadi suka tampilan monokrom. Agar DuckDB CLI saya ikut monokrom juga, saya ubah setelan bawaan penyorotnya. Konstanta dan kata kunci jadi `brightblack`. Kata kunci dicetak tebal di terminal dengan `.keywordcode \033[1m`. Daftar kode terminal ini saya dapat di [kamito punya Gist](https://gist.github.com/kamito/704813).

Setelah bawaan yang cuma menampilkan 40 baris juga saya ubah jadi 80. Penanda waktu seberapa lamban kueri dijalankan juga saya buat agar selalu tampak. Kemudian ekstensi `httpfs` supaya terpasang otomatis.

`.prompt '⬤◗  '` ini lebih cocok buat fon yang saya pakai di terminal ketimbang yang ada di dokumentasi DuckDB (`.prompt '⚫◗ '`).
Fon saya pakai Iosevka karena ramping. Cocok buat kerja data karena bisa muat banyak karakter.

Terakhir adalah direktori sementara buat DuckDB untuk melakukan kerja-kerja melebihi kapasitas memori.

