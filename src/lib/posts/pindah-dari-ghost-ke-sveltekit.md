---
title: "Pindah dari Ghost ke SvelteKit"
date: 2024-01-17
updated: 2024-01-17
isPublished: true
tags: 
    - mikroblog
excerpt: Migrasi blog (lagi).
---

Sejak tahun lalu saya belajar SvelteKit. Berhasil bikin satu situs web ([Sekuel](https://sekuel.com)).

SvelteKit bikin saya lebih gampang bikin konten interaktif. [Sekuel](https://sekuel.com) punya taman bermain SQL pakai DuckDB-WASM.

Saya memutuskan untuk memindah blog ini dari Ghost yang di-*hosting* di VM Oracle gratisan ke SvelteKit + Cloudflare Pages, mengingat beberapa kali saya juga ngeblog dengan visualisasi dinamis atau interaktif.

Untuk memindahkan konten, saya pakai pustaka [ghost-to-md](https://github.com/hswolff/ghost-to-md) yang bisa mengonversi file JSON hasil ekspor Ghost jadi markdown.
