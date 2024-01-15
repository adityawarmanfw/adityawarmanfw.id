---
title: Menjelajah data OpenSea dengan BigQuery
date: '2022-03-02'
updated: '2022-05-05'
isPublished: true
tags:
  - blog
excerpt: Belajar analitika blockchain dari riwayat transaksi Ghozali Everyday.
---

Tulisan ini dibikin untuk mendokumentasikan proses percobaan saya saat melakukan pengambilan data dan (sedikit) pengolahan data transaksi _blockchain_ dengan Google BigQuery. Data yang dipakai adalah data dari transaksi koleksi _Non-fungible token _(NFT) [Ghozali Everyday](https://opensea.io/collection/ghozali-everyday) di OpenSea yang tercatat dalam [blockchain Polygon](https://polygon.technology/solutions/polygon-pos). Lebih tepatnya, yang saya periksa bukanlah data nilai (baik dalam fiat maupun kripto), melainkan bagaimana NFT berpindah dari satu alamat ke alamat lain.

Tulisan ini cukup panjang sebab sebisa mungkin saya berusaha mencatat secara lengkap. Mulai dari alur berpikir, pembacaan artikel, percobaan-percobaan gagal, juga tindakan-tindakan yang sia-sia dan mungkin bodoh. Jika ada yang ingin memberikan koreksi, memberi pendapat tentang metode yang lebih efektif, silakan, saya sangat menantikan itu.

> ⚠️ Jika Anda berharap mendapatkan analisis berbasis data yang lengkap dan mendalam–baik tentang NFT, ekosistem OpenSea, Ghozali Everyday, atau Polygon–saya sampaikan di awal bahwa tulisan ini mungkin tak bisa memuaskan Anda.

---

### Dataset Polygon Blockchain di BigQuery

![Polygon Blockchain di BigQuery ><](/images/polygon-blockchain-bigquery.png)
_Diagram Relasional Polygon Blockchain di BigQuery_

[Dataset Polygon di BigQuery](https://console.cloud.google.com/marketplace/product/public-data-finance/crypto-polygon-dataset?project=public-data-finance) menggunakan proses ETL yang lebih kurang sama dengan yang [digunakan untuk dataset Ethereum](https://github.com/blockchain-etl/ethereum-etl). Dataset ini termasuk dalam dataset publik yang bisa diakses secara gratis dengan batasan 1TB untuk tiap bulannya. Dataset ini, dalam kondisi ideal, bersifat langsung atau waktu-nyata, (untuk Ethereum hanya selisih sekitar 4 menit.)

Ada 7 tabel di dalamnya: `blocks`, `transactions`, `logs`, `token_tranfers`, `tokens`, `contracts`, dan `traces`.

- `blocks` Blockchain terdiri dari serangkaian blok. Tiap blok bisa [berisi nol](https://etherscan.io/block/12353976) atau lebih transaksi. Tabel ini berisi data semua block yang ada di blockchain beserta atribut-atributnya.
- `transactions` Tabel ini berisi transaksi di semua blok. Tiap transaksi memiliki alamat sumber, alamat tujuan, jumlah Ether yang dipindahkan, serta beberapa atribut transaksi lain seperti jumlah gas yang digunakan, data input transaksi, dll.
- `logs` Tabel ini berisi semua data _event _(kejadian) dari _Smart Contract _(selanjutnya akan ditulis dengan Kontrak Pintar) yang disimpan dalam format kode bita. Kejadian di blockchain bisa macam-macam, misalnya, perpindahan token, pembuatan token, pembaruan konfigurasi, pergantian pemilik, dsb..
- `contracts` Sebagian transaksi memuat pembuatan Kontrak Pintar sebagai data inputnya. Tabel ini berisi alamat Kontrak Pintar, kode bita masing-masing Kontrak Pintar, serta analisis dasar terhadap kode bita tersebut.
- `tokens` Tabel ini memuat tentang data token [ERC20](https://ethereum.org/en/developers/docs/standards/tokens/erc-20/), nama token, simbol, jumlah desimal yang dipakai, dan jumlah total pasokan masing-masing token.
- `token_transfers` Transaksi yang paling umum terjadi melibatkan perpindahan token ERC20 dari satu alamat ke alamat lain. Tabel ini berisi transaksi-transaksi itu dalam bentuk yang telah diolah untuk memudahkan proses analisis.
- `traces` Tabel ini berisi data [transaksi internal](https://openethereum.github.io/JSONRPC-trace-module) yang terjadi di tiap transaksi, baik yang telah maupun yang belum ditambang di blockchain. Transaksi internal sebenarnya tidak dianggap sebagai transaksi, karena tidak dimasukkan langsung ke dalam blockchain.

Silakan merujuk pada dokumentasi di BigQuery untuk definisi dan keterangan lebih lanjut tentang tipe data untuk tiap kolom dalam tabel.

### Koleksi Ghozali Everyday

![Ghozali Everyday ><](/images/ghozali-everyday.png)
_Detail Koleksi Ghozali Everyday_

Ketika membuka salah satu NFT di Ghozali Everyday, saya melihat keterangan bahwa pencipta NFT adalah akun Ghozali_Ghozalu, deskripsi tentang koleksi Ghozali Everyday, dan detail tentang NFT terkait.

Saya punya anggapan awal jika tiap koleksi memiliki Kontrak Pintar yang berbeda satu sama lain–unik. Sampai beberapa menit kemudian menyadari ternyata anggapan itu salah.

Ketika membukanya, alamat kontrak itu mengarah ke [kontrak pintar OPENSTORE](https://polygonscan.com/address/0x2953399124f0cbb46d2cbacd8a89cf0599974963). NFT lain dari koleksi Ghozali Everyday juga memiliki alamat yang sama. Saya coba ke koleksi Ghozali_Ghozalu yang lain, [Ghozali Year](https://opensea.io/collection/ghozali-year) yang hanya berisi satu NFT. Pun ternyata memiliki alamat kontrak yang sama.

Semula, saya kira kueri SQL untuk BigQuery akan bisa dibuat setelah mengetahui alamat kontrak dari koleksi Ghozali Everyday.

```sql
SELECT *
FROM transactions
WHERE to_address = "Kontrak Pintar Ghozali Everyday"
```

Ternyata tak sesederhana itu.

Data-data baru acap kali justru memunculkan banyak pertanyaan baru.

1. Bagaimana OpenSea memilah jika NFT #1 merupakan bagian koleksi A, dan NFT #999 adalah bagian koleksi B jika bukan dengan alamat Kontrak Pintar?
2. Lantas apakah koleksi OpenSea itu juga tercatat di blockchain?
3. Jika tidak, lalu bagaimana agar bisa mengambil riwayat transaksi yang hanya terkait dengan NFT di koleksi Ghozali Everyday lewat BigQuery?

### Struktur transaksi di EVM blockchain

Di Ethereum, atau blockchain berbasis Ethereum Virtual Machine (EVM) lainnya, transaksi terjadi tak hanya dalam bentuk kejadian perpindahan mata uang asli Ethereum (Ether) dari satu alamat ke alamat lain, tapi juga transaksi terhadap Kontrak Pintar, yang kemudian memicu beragam peristiwa lain yang bisa mengubah keadaan blockchain. Kabar atas peristiwa/kejadian itu tercatat dalam log transaksi (yang kemudian dicatat di BigQuery dalam tabel `logs`.)

Setiap catatan log transaksi terdiri dari _topik_ dan _data_. Topik digunakan untuk menggambarkan apa yang terjadi dalam suatu peristiwa–menandai kejadian. Data adalah *value/*nilai untuk melengkapi informasi tentang kejadian tersebut. Untuk referensi lebih lengkap, silakan baca [artikel yang berusaha menjelaskan tentang ini](https://medium.com/mycrypto/understanding-event-logs-on-the-ethereum-blockchain-f4ae7ba50378) dan [anatomi Kontrak Pintar](https://ethereum.org/en/developers/docs/smart-contracts/anatomy/).

Ambil contoh satu [transaksi](https://polygonscan.com/tx/0x5bf2b9e86e2426fe4ed907db51117f275e7cb58573588673db23d20827bf56c7) yang terjadi di Polygon dari situs Polygonscan, di mana sebuah alamat membeli NFT yang ada di koleksi Ghozali Everyday.

![Polygonscan ><](/images/polygonscan.png)
_Tautan [Polygonscan](https://polygonscan.com/tx/0x5bf2b9e86e2426fe4ed907db51117f275e7cb58573588673db23d20827bf56c7)_

Polygonscan telah banyak membantu dalam proses pemeriksaan transaksi sebab mereka menyediakan bentuk nota transaksi yang lebih bisa dicerna. Beberapa data tentang kejadian penting telah diurai sehingga gamblang dan bisa terbaca oleh pengguna. Saya mendapat informasi bahwa sebuah alamat membeli NFT dari alamat [Ghozali_Ghozalu](https://polygonscan.com/address/0xc1e05e98466908547f30fcfc34e405b9c84dfcb7) dengan nilai 0.001 ETH yang dapat dilihat di baris pertama bagian _Tokens Transferred_, serta NFT mana yang dipindahkan dari alamat Ghozali_Ghozalu ke alamat pembeli di bagian _Transaction Action. _

Karena transaksi dapat dilakukan terhadap Kontrak Pintar yang kemudian juga bisa memicu kejadian-kejadian yang berhubungan dengan alamat-alamat lain, bekerja untuk memahami apa yang terjadi pada sebuah transaksi bisa-bisa membuat kepala meledak.

Baiklah, kepala meledak mungkin berlebihan, tapi memang membaca transaksi ini perkara yang memusingkan.

Contohnya, di sini, meskipun alamat `0x71993a...a22cD7` adalah pembeli NFT milik Ghozali_Ghozalu, tapi bukan alamat itu yang tercatat sebagai pengirim transaksi. Alamat pengirim dalam transaksi tersebut adalah `0x9b8142...c62ad2`. Tapi, itu berada di luar bahasan tulisan ini karena saya sendiri belum sepenuhnya memahami bagaimana OpenSea bekerja. Yang penting diperiksa di sini ada di bagian atas, Logs (14). Ada 14 peristiwa yang terjadi dalam satu transaksi tersebut.

### Ghozali Everyday: Keruwetan OpenSea & Polygonscan

Jika dilihat dari detail koleksi Ghozali Everyday, ada data lain yang menjadi petunjuk: **Token ID**. Umumnya, ID berarti _identifier_, pengidentifikasi yang bersifat unik. Ini adalah data ID untuk masing-masing NFT. Bagaimana dengan ID koleksi? Saya coba cari dan tak bisa menemukannya. Data yang "terlihat" unik sepertinya hanya *slug. *Tak ada data terkait slug koleksi di Polygonscan. Sampai sini, saya mengambil kesimpulan bahwa memang data koleksi "Ghozali Everyday" tidak tercatat di dalam blockchain, dan hanya tercatat di database _off-chain_ OpenSea. Sedangkan data token NFT tetap tercatat di blockchain lewat Token ID.

Kueri SQL untuk BigQuery tidak akan bisa dibangun jika tidak bisa menemukan metode pengelompokan transaksi terkait Ghozali Everyday. Satu-satunya cara, sepertinya, adalah dengan Token ID. Perlu ada daftar berisi Token ID semua NFT yang ada di dalam koleksi Ghozali Everyday.

Saya coba periksa dokumentasi API OpenSea, dan menemukan [API untuk koleksi](https://docs.opensea.io/reference/retrieving-a-single-collection). Tapi, API itu hanya mengembalikan data tentang koleksi dan tak ada daftar aset NFT yang ada di dalam koleksi tersebut. Dokumentasi menunjukkan bahwa yang bisa memunculkan daftar aset adalah [API asset](https://docs.opensea.io/reference/getting-assets), tapi saya tak punya API KEY OpenSea. Saya coba *inspect element *untuk mencari JSON yang dipakai oleh antarmuka OpenSea. Ternyata ada API internal yang bisa dipakai untuk [mengkueri data asset dengan GraphQL](https://api.opensea.io/graphql/). Tapi saya tak familiar juga dengan GraphQL (saya coba mainkan sampai kemudian saya macet karena pagination).

Keputusasaan sudah hampir menabrak saya sampai sejurus kemudian saya ingat kredo "Semua transparan, semua tercatat di dalam blockchain."

Saya buka alamat dompet Ghozali_Ghozalu dan melihat riwayat transaksinya di Polygonscan. Bagian ERC-1155 Token Txns memuat semua daftar transaksi NFT OpenSea Ghozali_Ghozalu, baik yang "berpindah dari", pun yang "berpindah ke" alamatnya. OpenSea mencatat ada 933 NFT di Ghozali Everyday. Data transaksi berjumlah sekitar 1300. Besar kemungkinan transaksi 933 NFT itu ada di data ini. Di situ ada data Token ID dan Polygonscan melayanani pengunduhan data dalam format csv. Saya unduh itu, dan dapat semua Token ID. Langkah selanjutnya adalah bagaimana memilah Token ID yang merupakan bagian dari Ghozali Everyday.

![Tabel Polygonscan ><](/images/polygonscan-table.png)
_Tabel unduhan dari Polygonscan_

Di tabel hasil unduhan ada kolom `From`. Karena Ghozali berhasil menjual semua NFT-nya, bisakah melakukan filter `From` alamat Ghozali? Mungkin saja. Tapi saya tak melakukan itu. Saya tak yakin apakah Ghozali tak pernah menjual NFT lain selain miliknya dari Ghozali Everyday. Saya tak tahu apakah Ghozali pernah membeli NFT dari orang lain kemudian menjualnya lagi.

Saya ingat jika Google Spreadsheet bisa digunakan untuk *scraping *lewat fungsi `=IMPORTXML()`.

```
=IMPORTXML(CONCATENATE("URL","+","TokenId"), //*[@id='main']/div/div/div/div[2]/div/section[1]/div/div[1]/div/a")
```

Saya coba dengan harapan mendapat keluaran nama koleksi. Tapi ternyata proses *fetch *gagal. Barangkali karena CORS.

Saya perhatikan lagi _spreadsheet_ itu. Kolom TokenId. "Lho, kok banyak yang mirip," pikir saya. Seperti ada pola. Lalu saya cari bagaimana cara OpenSea memberikan Token ID untuk tiap NFT.

### OpenSea Collection Manager

Data transaksi di Polygonscan, tabel yang diunduh, dan detail koleksi di OpenSea, semua menunjukkan bahwa transaksi selalu melibatkan [Kontrak Pintar OPENSTORE](https://polygonscan.com/address/0x2953399124f0cbb46d2cbacd8a89cf0599974963).

OPENSTORE adalah Kontrak Pintar yang dibuat oleh OpenSea untuk memungkinkan pembuatan koleksi dan NFT tanpa perlu membayar gas untuk transaksi.

Setiap koleksi dan NFT yang dibuat di OpenSea secara gratis, akan dibuat dari OPENSTORE. Seperti sebuah pabrik. Orang-orang memesan, dan pabrik bernama OPENSTORE akan memproduksinya. Tiap barang dari pabrik itu memiliki kode unik. Di OpenSea, barangnya adalah NFT dan kode uniknya adalah Token ID.

Dari mana Token ID berasal? Di [Rilis OpenSea soal Collection Manager](https://opensea.io/blog/announcements/introducing-the-collection-manager/), mereka menyebut, *"When you create an NFT, you encode your address and its total supply in the token’s ID". *Token ID adalah gabungan antara alamat pemesan + total suplai NFT.

Untuk memastikannya, saya coba buka Kontrak Pintar OPENSTORE. Terdapat baris-baris kode seperti di bawah ini.

```solidity
// File: contracts/TokenIdentifiers.sol

pragma solidity 0.8.4;

/*
    DESIGN NOTES:
    Token ids are a concatenation of:
    * creator: hex address of the creator of the token. 160 bits
    * index: Index for this token (the regular ID), up to 2^56 - 1. 56 bits
    * supply: Supply cap for this token, up to 2^40 - 1 (1 trillion).  40 bits

*/
/**
    * @title TokenIdentifiers
    * support for authentication and metadata for token ids
    */
library TokenIdentifiers {
    uint8 constant ADDRESS_BITS = 160;
    uint8 constant INDEX_BITS = 56;
    uint8 constant SUPPLY_BITS = 40;

    uint256 constant SUPPLY_MASK = (uint256(1) << SUPPLY_BITS) - 1;
    uint256 constant INDEX_MASK =
        ((uint256(1) << INDEX_BITS) - 1) ^ SUPPLY_MASK;

    function tokenMaxSupply(uint256 _id) internal pure returns (uint256) {
        return _id & SUPPLY_MASK;
    }

    function tokenIndex(uint256 _id) internal pure returns (uint256) {
        return _id & INDEX_MASK;
    }

    function tokenCreator(uint256 _id) internal pure returns (address) {
        return address(uint160(_id >> (INDEX_BITS + SUPPLY_BITS)));
    }
}
```

Apa yang dikatakan di rilis tampaknya memang benar. Terjelaskan sudah mengapa banyak Token ID di tabel unduhan itu memiliki kemiripan. Di dalam Token ID itu ada alamat Ghozali. Saya coba filter Token ID dengan beberapa karakter awal. Tersisa 933 baris dari mulanya 1300-an. Cocok dengan jumlah NFT yang ada dalam koleksi Ghozali Everyday!

Tapi bagaimana data ini bisa lebih dipercaya, juga dipertanggungjawabkan, ketimbang dengan memfilter tabel berdasarkan alamat pengirim Ghozali_Ghozalu?

Jawabannya ada di akun Ghozali_Ghozalu di OpenSea Polygon. Ghozali_Ghozalu tak menciptakan NFT lain selain di koleksi Ghozali Everyday dan Ghozali Year. NFT di Ghozali Year sama-sama dibuat dengan menggunakan Kontrak Pintar OPENSTORE dan menggunakan metode _lazy minting_. Karena belum pernah ada transaksi terjadi pada NFT itu, sebenarnya NFT itu belum tercatat di dalam blockchain. Tak ada Token ID untuk NFT di Ghozali Year di blockchain. Sehingga, 933 token ID itu tak bisa bukan adalah yang termasuk dalam koleksi Ghozali Everyday.

### Logs: Apa yang penting dari 14 logs dalam transaksi?

Beberapa data dan konteks penting terkait transaksi NFT Ghozali Everyday OpenSea sudah didapatkan:

- Tidak adanya kontrak khusus untuk koleksi Ghozali Everyday
- Alamat koleksi adalah alamat Kontrak Pintar OPENSTORE, yang juga menjadi alamat semua NFT di Open Sea yang dibuat lewat Collection Manager jika pembuat tidak mengembangkan Kontrak Pintarnya sendiri
- Masing-masing NFT diidentifikasi dengan Token ID yang merupakan gabungan antara alamat pemesan dan total suplai
- Perpindahan NFT yang terjadi TIDAK bisa diidentifikasi hanya dari alamat pengirim dan penerima transaksi sebab alamat pengirim bukan alamat pembeli dan alamat penerima bukan alamat penjual

Sekarang, saatnya kembali ke struktur transaksi di blockchain. Ada 14 logs dalam contoh transaksi yang dipakai. Karena transaksi itu juga memuat informasi tentang perpindahan NFT dari alamat Ghozali_Ghozalu ke alamat lain, mestinya data tentang perpindahan itu juga bisa diperiksa lewat log.

![Log TransferSingle() ><](/images/log-transfersingle.png)
_[Log TransferSingle()](https://polygonscan.com/tx/0x5bf2b9e86e2426fe4ed907db51117f275e7cb58573588673db23d20827bf56c7#eventlog)_

Log `TransferSingle ()` di atas ini adalah log dari transaksi dengan hash ["0x5bf2b9e86e2426fe4ed907db51117f275e7cb58573588673db23d20827bf56c7"](https://polygonscan.com/tx/0x5bf2b9e86e2426fe4ed907db51117f275e7cb58573588673db23d20827bf56c7) yang memuat perpindahan `1` NFT dengan (token) id `8769...1729` dari alamat `0xc1e05e...84dfcb7` ke alamat `0x71993a...a22cd7`.

Di situ, ada data Topics di array[0] dengan nilai "0xc3d5816...2d0f62". Dalam Topics, nilai array pada index pertama [0] merepresentasikan hash dari definisi sebuah kejadian. Jika diterjemahkan ke format yang bisa dibaca manusia, nilai itu berarti TransferSingle(address, address, address, uint256, uint256).

### Kueri transaksi Ghozali Everyday

Dari data itu, saya membuat kueri percobaan ke tabel `logs` di BigQuery seperti ini.

```sql
SELECT
    transaction_hash,
    topics,
    data
FROM `public-data-finance.crypto_polygon.logs`
WHERE DATE(block_timestamp) BETWEEN "2022-01-11" AND "2022-01-13"
    AND transaction_hash = "0x5bf2b9e86e2426fe4ed907db51117f275e7cb58573588673db23d20827bf56c7"
    AND EXISTS(SELECT * FROM UNNEST(topics) AS x WHERE x = "0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62")
```

Kueri percobaan ke tabel logs
Saya memakai `EXISTS(SELECT * FROM UNNEST(topics) ...)` untuk memfilter data array `topics` yang mengandung string `"0xc3d581...2d0f62"` agar kueri hanya mengembalikan data kejadian `TransferSingle ()` tanpa memedulikan 13 kejadian lain dalam transaksi.

Kueri itu memberikan hasil berupa tabel seperti ini:

![TransferSingle () ><](/images/ghozali-topics.png)
_TransferSingle()_

Hasil kueri percobaan
Data di dalam tabel bertipe string dengan format heksadesimal.

`topics` terdiri dari empat elemen array, sebagaimana yang ditampilkan di Polygonscan. `data` mestinya memuat Token ID dan jumlah suplai dari token.

Lalu bagaimana mengidentifikasi transaksi NFT Ghozali Everyday dari sini?

Dengan Token ID!

```
-- Nilai `data` dari hasil kueri

0xc1e05e98466908547f30fcfc34e405b9c84dfcb70000000000003400000000010000000000000000000000000000000000000000000000000000000000000001
```

Sekali lagi, Token ID adalah gabungan antara alamat pembuat (jika memakai analogi OPENSTORE adalah pabrik, berarti alamat pemesan) dan jumlah suplai token. Dan benar saja, kolom `data` memuat nilai alamat Ghozali_Ghozalu `0xc1e05e9...`. Data inilah yang kemudian menjadi kunci untuk memfilter transaksi yang berkaitan dengan NFT di Ghozali Everyday.

```sql
SELECT
    transaction_hash,
    data,
    topics
FROM `public-data-finance.crypto_polygon.logs`
WHERE DATE(block_timestamp) BETWEEN "2022-01-11" AND CURRENT_DATE()
    AND address = "0x2953399124f0cbb46d2cbacd8a89cf0599974963" -- OPENSTORE CONTRACT ADDRESS
    AND topics[safe_offset(0)] = "0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62" -- TransferSingle ()
    AND regexp_contains(data, '(?i)0xc1e05e98466908547f30fcfc34e405b9c84dfcb7') -- Ghozali_Ghozalu Address
```

Kueri Ghozali Everyday di OpenSea lewat BigQuery

### Dekode data log transaksi Ethereum di BigQuery

Hasil kueri dari tabel `logs` masih dalam bentuk heksadesimal. Agar bisa dibaca oleh manusia, data itu perlu didekode. Di BigQuery, rupanya hal itu bisa dilakukan dengan membuat Function dan menggunakan library Ethers.js. Dokumentasinya bisa dibaca di [Github blockchain-etl](https://github.com/blockchain-etl/ethers.js-bigquery).

Untuk bisa mendekode log dari transaksi OpenSea, perlu [Application Binary Interface](https://www.sitepoint.com/compiling-smart-contracts-abi/) (ABI) dari kontrak yang menjadi [alamat tujuan transaksi](https://polygonscan.com/address/0xf715beb51ec8f63317d66f491e37e7bb048fcc2d). Saya [ambil ABI untuk fungsi `TransferSingle ()`](https://api.polygonscan.com/api?module=contract&action=getabi&address=0xf715beb51ec8f63317d66f491e37e7bb048fcc2d&format=raw) dari kontrak tersebut dari Polygonscan.

```sql
CREATE TEMP FUNCTION
    decode_openstore_transfer(data STRING, topics ARRAY<STRING>)
    RETURNS STRUCT<`from` STRING, `to` STRING, `id` STRING, `value` STRING>
    LANGUAGE js AS """
    var openstoreTransferSingle = {
            "anonymous":false,
            "inputs":[
                {
                    "indexed":true,
                    "internalType":"address",
                    "name":"operator",
                    "type":"address"
                },
                {
                    "indexed":true,
                    "internalType":"address",
                    "name":"from",
                    "type":"address"
                },
                {
                    "indexed":true,
                    "internalType":"address",
                    "name":"to",
                    "type":"address"
                },
                {
                    "indexed":false,
                    "internalType":"uint256",
                    "name":"id",
                    "type":"uint256"
                },
                {
                    "indexed":false,
                    "internalType":"uint256",
                    "name":"value",
                    "type":"uint256"
                }
            ],
            "name":"TransferSingle",
            "type":"event"
            };
    var interface_instance = new ethers.utils.Interface([openstoreTransferSingle]);
    var parsedLog = interface_instance.parseLog({topics: topics, data: data});

    return parsedLog.values;
"""
OPTIONS
    ( library="gs://blockchain-etl-bigquery/ethers.js" );

WITH stg_nft_txs AS (
    SELECT
        block_timestamp,
        transaction_hash,
        data,
        topics
    FROM `public-data-finance.crypto_polygon.logs`
    WHERE DATE(block_timestamp) BETWEEN "2022-01-11" AND CURRENT_DATE()
        AND address = "0x2953399124f0cbb46d2cbacd8a89cf0599974963" -- OPENSTORE CONTRACT ADDRESS
        AND topics[safe_offset(0)] = "0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62" -- TransferSingle ()
        AND regexp_contains(data, '(?i)0xc1e05e98466908547f30fcfc34e405b9c84dfcb7') -- Ghozali_Ghozalu Address
), decode_nft_txs AS (
    SELECT
        block_timestamp,
        transaction_hash,
        decode_openstore_transfer(data, topics) AS transfer
    FROM stg_nft_txs
)
SELECT * FROM decode_nft_txs

```

Sampai saat saya menjalankan kueri ini (24 Feb 2022, 18:33:06 WIB) telah terjadi 2.157 transaksi koleksi Ghozali Everyday.

Selanjutnya, sedikit pengolahan data.

### Berapa jumlah pemilik NFT Ghozali Everyday?

Salah satu pertanyaan dasar di NFT adalah berapa jumlah alamat yang memiliki NFT Ghozali Everyday, dan berapa NFT yang dimiliki tiap alamat. Untuk bisa mendapatkan data itu, hal yang pertama-tama perlu diperiksa adalah **_kapan_** dan **_di blok berapa_** masing-masing NFT **berubah kedudukannya\*\***dalam blockchain**. Setelah mendapatkan informasi waktu, selanjutnya adalah memeriksa \***apa yang terjadi*\*\* waktu itu. *Perlu mengambil blok termutakhir\* untuk tiap NFT. Kepada alamat mana NFT itu dipindahkan? Dalam kasus Ghozali Everyday ini, semua NFT sudah berpindah dari alamat Ghozali_Ghozalu ke alamat lain. Sehingga, yang diperlukan hanyalah data alamat tujuan.

```sql
    WITH latest_block AS (
        SELECT token_id, max(block_timestamp) AS block_timestamp
          FROM ghozaliEverydayTransfer
      GROUP BY 1
    )
        SELECT trf_to AS address,
               count(DISTINCT token_id) AS nfts
          FROM ghozaliEverydayTransfer20220221
          JOIN latest_block USING (block_timestamp, token_id)
      GROUP BY 1 ORDER BY 2 DESC
```

Kueri alamat pemilik NFT
Kueri ini akan menghasilkan daftar alamat pemilik NFT, serta berapa NFT Ghozali Everyday yang dimilikinya. Karena tiap NFT Ghozali Everyday hanya memiliki 1 suplai, berarti tak perlu menghitung token dengan `sum(value)` dengan `GROUP BY token_id` karena akan menghasilkan jumlah yang sama dengan `count(DISTINCT)`.

### Penutup

Tercapai sudah tujuan utama saya. Mengambil data transaksi blockchain di BigQuery dengan mengambil contoh NFT Ghozali Everyday di OpenSea Polygon, dan melakukan sedikit saja pengolahan data.

Karena ini percobaan pertama, saya hanya mengambil data perpindahan NFT dalam tiap transaksi. Perpindahan token Wrapped Ether (WETH) juga bisa dilakukan dengan cara mengganti kondisi kueri hash di index pertama [0] dari `topics` dengan hash dari kejadian `Transfer ()` serta ABI yang sesuai untuk mendekode. Selanjutnya, agaknya tak sulit untuk melihat volume perpindahan Ether yang diakibatkan oleh perpindahan NFT dari koleksi Ghozali Everyday dan bahkan berapa keuntungan masing-masing alamat. Yang perlu diperhatikan mungkin adalah fakta bahwa kejadian `Transfer ()` tak hanya terjadi sekali dalam satu transaksi.

Buat saya, ini proses belajar yang seru. Saya belajar banyak hal. Jargon "Semua transparan di blockchain," boleh jadi benar, tapi aksesibilitas adalah perkara lain. Analitika blockchain adalah semesta yang baru–dua perusahaan pelopor bidang ini (Dune Analytics dan Nansen) baru berdiri tahun 2018-2019. Keduanya bekerja untuk aksesibilitas data, dan telah berhasil mendapatkan pelanggan yang mau membayar untuk itu.

---

_Draf tulisan ini saya kirimkan ke [Arjuna Sky Kok](https://arjunaskykok.com/tentang-situs-ini/) untuk meminta saran dan koreksi jika ada kekeliruan atau hal penting yang saya lewatkan. Beliau adalah blogger dan penulis buku "Hands-on Blockchain for Python Developers". Sekarang, Arjuna Sky Kok juga merupakan Direktur Utama perusahaan pasar loka NFT, Artpedia. Terima kasih Pak [@arjunaskykok](https://twitter.com/arjunaskykok) untuk saran perbaikannya!_
