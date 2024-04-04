---
title: 'Astral uv di Google Colab'
date: 2024-04-04
updated: 2024-04-04
isPublished: true
tags:
  - mikroblog
excerpt: "uv adalah penginstal paket Python yang lebih satset ketimbang pip, ditulis dalam Rust."
---

Selain untuk *scraping* data, saya juga cukup sering pakai Google Colab untuk melakukan perbandingan sederhana (asal-asalan) terhadap enjin pemrosesan data yang sampai sekarang saling kebut-kebutan: DuckDB, Tableau Hyper, dan Databend, untuk menyebut beberapa. Memasang mereka di Google Colab cukup makan waktu, prosesnya bisa terjadi sampai 2 menit. Beberapa minggu lalu saya baca tentang uv dari Astral, pembuat [ruff](https://astral.sh/ruff). Astral [uv](https://astral.sh/blog/uv) adalah penginstal paket Python yang lebih satset ketimbang pip, ditulis dalam Rust.

Rupanya uv juga bisa dipakai di Google Colab dengan cara ini:

```
!curl -LsSf https://astral.sh/uv/install.sh | sh
import os
os.environ['PATH'] = '/root/.cargo/bin:' + os.environ['PATH']

!uv pip install --system tableauhyperapi
!uv pip install --system datafusion
!uv pip install --system duckdb --pre --upgrade

%reset -f
```

Waktu yang diperlukan buat mengunduh uv + memasang para enjin data ini jauh lebih singkat, cuma 7 detik.

```
downloading uv 0.1.28 x86_64-unknown-linux-gnu
installing to /root/.cargo/bin
  uv
everything's installed!

To add $HOME/.cargo/bin to your PATH, either restart your shell or run:

    source $HOME/.cargo/env
Resolved 3 packages in 190ms
Downloaded 1 package in 2.03s
Installed 1 package in 7ms
 + tableauhyperapi==0.0.18825
Resolved 3 packages in 244ms
Downloaded 1 package in 461ms
Installed 1 package in 2ms
 + datafusion==36.0.0
Resolved 1 package in 132ms
Downloaded 1 package in 496ms
Installed 1 package in 4ms
 - duckdb==0.9.2
 + duckdb==0.10.2.dev311
CPU times: user 212 ms, sys: 21.7 ms, total: 233 ms
Wall time: 7.01 s
```

