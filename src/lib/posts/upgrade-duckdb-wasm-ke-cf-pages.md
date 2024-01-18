---
title: "Upgrade DuckDB-Wasm di CF Pages"
date: 2024-01-18
updated: 2024-01-18
isPublished: true
tags: 
    - mikroblog
excerpt: Mengatasi ukuran file melebihi batas
---

Sore ini, pustaka [@duckdb/duckdb-wasm](https://www.npmjs.com/package/@duckdb/duckdb-wasm) diperbarui. Versi anyar ini sudah lama saya tunggu-tunggu karena memungkinkan penggunaan [ekstensi duckdb](https://duckdb.org/docs/extensions/overview) penting seperti [JSON](https://duckdb.org/docs/extensions/json.html) dan [spatial](https://duckdb.org/docs/extensions/spatial).

Saya *upgrade* npm. Bisa berjalan di lokal. 

Naas, ketika *deploy* ke Cloudflare Pages, saya mendapat:

```
19:40:41.898	✘ [ERROR] Error: Pages only supports files up to 26.2 MB in size
19:40:41.898	
19:40:41.898	  _app/immutable/assets/duckdb-eh.ee0056b2.wasm is 33.3 MB in size
```

File `.wasm` melebihi batas ukuran yang diperbolehkan oleh Cloudflare.

Di file `duckdb.js` SvelteKit saya coba muat duckdb dengan:

```js
import * as duckdb from 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.1-dev91.0/+esm'
```

Yang ternyata tak diperbolehkan:

```error
|- Error: Cannot find module 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.1-dev91.0/+esm'
```

Saya utak-atik file `+page.svelte`, mencoba cara di [REPL](https://svelte.dev/repl/7a7de2ad8f9648bd8ff10929156334c5?version=4.2.9) ini, juga tak berhasil.

Akhirnya, saya ke [GH Actions duckdb-wasm](https://github.com/duckdb/duckdb-wasm/actions/workflows/main.yml), lalu mengunduh berkas `duckdb-wasm-packages` dari artefak.
Buka direktori `duckdb-wasm`, hapus semua file `.wasm` yang berukuran besar, lalu `npm pack`. Unggah pustaka ke Cloudflare R2, lalu instal. 

```
"@duckdb/duckdb-wasm": "https://storage.sekuel.com/duckdb-duckdb-wasm-1.28.1-dev91.0.tgz",
```

Coba jalankan di lokal, berhasil. *Deploy* ulang ke CF Pages, sukses!

Begini isi file `duckdb.js` yang saya pakai untuk inisiasi DuckDB-WASM:

```js
import * as duckdb from '@duckdb/duckdb-wasm';

const initDB = async () => {
	const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

	// Select a bundle based on browser checks
	const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

	const worker_url = URL.createObjectURL(
		new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' })
	);

	// Instantiate the asynchronus version of DuckDB-wasm
	const worker = new Worker(worker_url);
	const logger = new duckdb.ConsoleLogger();
	const db = new duckdb.AsyncDuckDB(logger, worker);
	await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
	URL.revokeObjectURL(worker_url);
	return db;
};

export { initDB, duckdb };
```



