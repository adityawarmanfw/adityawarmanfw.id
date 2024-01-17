---
title: Anatomi Kejadian
date: '2023-07-27'
updated: '2023-08-01'
isPublished: true
tags:
  - analitika
excerpt: Bagaimana saya biasanya menyusun perencanaan Pelacak Kejadian di produk digital. Ilmu dan amalnya.
---

Salah satu hal pokok dalam analitika produk digital adalah tentang instrumentasi Pelacak Kejadian (Event Tracker). Atau istilah lainnya yang kerap dipakai di industri, _telemetry_.

Pelacak Kejadian diperlukan untuk mengumpulkan data tentang penggunaan dan kinerja produk digital. Misal, untuk mengetahui seberapa sering fitur tertentu digunakan, melacak kekutu atau kerusakan, atau data penggunaan umum.

Data dari Pelacak Kejadianlah yang kemudian bisa diolah untuk membuat laporan umum seperti berapa jumlah pengguna aktif, laman apa yang paling populer, membantu memahami perilaku pengguna, memahami popularitas fitur untuk menentukan prioritas pengembangan, dan lain sebagainya.

Pelacak Kejadian punya sejarah panjang. Ada [sejak zaman mesin uap](https://en.wikipedia.org/wiki/Telemetry). Dikembangkan lebih jauh oleh para insinyur listrik di akhir abad 19, berkembang pesat di Perang Dunia II, hingga kemudian dipakai di angkasa luar.

Gim Crash Bandicoot (Play Station 1) yang rilis tahun 1996 juga memakainya saat masa pengembangan untuk memperbaiki desain area permainan dengan cara [mencatat riwayat pemain ke dalam Memory Card!](https://www.gamedeveloper.com/design/hot-failure-tuning-gameplay-with-simple-player-metrics)

Tulisan ini adalah tentang bagaimana saya biasanya menyusun perencanaan Pelacak Kejadian di produk digital. [Ilmu dan amalnya](https://www.marxists.org/indonesia/indones/1962-NjotoMarxismeIlmu.htm).

---

**Kejadian (_Event_)** adalah aktivitas apa pun yang terkait dengan pengguna dan produk–baik aktivitas yang disengaja oleh pengguna atau tidak (ditimpakan padanya). Data yang dihasilkan dalam proses ini disebut data kejadian atau data interaksi.

Pengguna mengeklik sebuah tombol, membuka sebuah laman, atau memainkan video adalah contoh Kejadian yang disengaja–pengguna sendiri yang melakukannya. Pengguna menerima pemberitahuan dorong, video terhenti karena berbagai alasan, adalah contoh Kejadian yang ditimpakan.

![Anatomi Kejadian 1 ><](/images/anatomi-kejadian-1.png)

Perhatikan gambar di atas. Anggap itu adalah gambar tampilan antarmuka sebuah situs web jejaring sosial. Ada tiga kejadian:

1. Seorang pengguna membuka laman profil Tineke lewat pemberitahuan dorong.

2. Pengguna memencet tombol "View All" yang ada di kotak biru sebelah kanan.

3. Pengguna memencet tombol "Follow" di dalam *popover *yang muncul ketika kursornya melayang di atas sebuah foto profil yang berada di kotak warna merah sebelah kanan.

Bagaimana amalan untuk melacak semua kejadian itu?

Sebelum lanjut, saya asumsikan pelacakan kejadian dilakukan dengan bantuan platform analitika berbasis kejadian, seperti [Google Analytics 4](https://support.google.com/analytics/answer/10089681?hl=en), [Amplitude](https://amplitude.com/), [MixPanel](https://mixpanel.com/), [SnowPlow](https://snowplow.io/), [Segment](https://segment.com/), [RudderStack](https://www.rudderstack.com/), dan lain sebagainya.

Dengan bantuan platform tersebut, kita tak perlu terlalu khawatir tentang mengambil informasi yang berkaitan dengan pengguna, lokasi pengguna, tipe gawai yang dipakai, versi aplikasi, pendefinisian sesi, dan lain-lain. Saya tak akan membahas bagaimana mengidentifikasi pengguna lewat kuki atau sinyal lainnya, atau bagaimana memperkirakan lokasi pengguna lewat alamat IP.

## Kejadian 1: Seorang pengguna membuka laman profil Tineke lewat pemberitahuan dorong

Sekarang, coba kita lacak kejadian pertama: Seorang pengguna membuka laman profil Tineke lewat pemberitahuan dorong.

Data seperti inilah yang sekurang-kurangnya perlu ditangkap:

```yaml
# page_view
# Trigger each time the page loads

- event_name: page_view
  event_params:
    - key: hit_timestamp
      value: 1690387564917
    - key: page_title
      value: Tineke
    - key: page_name
      value: profile_detail
    - key: page_id
      value: BIAK19990706
    - key: page_location
      value: https://profile.com/tineke
    - key: origin
      value: push_notification
```

Setiap kejadian pasti melibatkan seorang aktor. Di kejadian ini, aktor adalah "Seorang pengguna". Kita biarkan platform analitika yang bekerja untuk mengidentifikasi siapa "Seorang pengguna" ini. GA4 akan memberikan `user_pseudo_id` untuk tiap pengguna. Atau kita bisa berikan `user_id` jika pengguna tersebut telah terdaftar di produk kita.

### Trigger & event_name

Tiap kejadian pasti ada sebab atau pemicu (_trigger_). Di dalam Pelacakan Kejadian, pemicu adalah spesifikasi instruksi untuk mengetahui kapan mesti mengirim data tentang kejadian.

- pemicu: Tiap kali sebuah laman dimuat
- aktor: Seorang pengguna
- kejadian: Membuka laman

Kolom `event_name` dipakai untuk mengidentifikasi kejadian. Kejadian pertama ini saya identifikasi sebagai kejadian `page_view`.

Ketika memberi nama kejadian, saya biasa pakai formula sederhana:

> `{sasaran_kejadian}_{kata_kerja_bentuk_pertama}`

> Penamaan kejadian mesti konsisten dan jelas.

> Nama kejadian yang jelas bersifat deskriptif dan menunjukkan apa yang sedang terjadi.

> Konsistensi dalam penamaan berarti bahwa semua kejadian berbagi sintaks yang sama. Saya biasanya memakai gaya_penulisan_ular.

### event_params

Kolom `event_params` berisi berbagai keterangan yang menjelaskan lebih lanjut tentang sebuah kejadian.

Di kejadian `page_view`, ada beberapa `event_params`:

- `hit_timestamp`: Kapan kejadian terjadi
- `page_title`: Judul laman
- `page_name`: Nama kelompok laman
- `page_id`: Kode identifikasi laman
- `page_location`: Lokasi laman (URL/Deeplink)
- `origin`: Pemicu kejadian

Dalam kejadian `page_view` ini, lokasi dan objek sasaran adalah sama.

Parameter yang mutlak mesti ada adalah informasi tentang lokasi kejadian, waktu kejadian, objek sasaran kejadian, dari mana asal pemicu kejadian.

### Bagaimana membaca data ini?

Supaya tak perlu menggulir ke atas, saya akan tampilkan kontrak data (dalam format yaml) sekali lagi:

```yaml
# page_view
# Triggers each time the page loads

- event_name: page_view
  event_params:
    - key: hit_timestamp
      value: 1690387564917
    - key: page_title
      value: Tineke
    - key: page_name
      value: profile_detail
    - key: page_id
      value: BIAK19990706
    - key: page_location
      value: https://profile.com/tineke
    - key: origin
      value: push_notification
```

Dibaca: Ada kejadian `event_name:page_view` yang terjadi saat `hit_timestamp:690387564917` dan dipicu dari `origin: push_notification`. Kejadian tersebut terjadi tepatnya pada `page_title: Tineke` dengan `page_id: BIAK19990706` yang dikelompokkan dalam `page_name: profile_detail`, dengan lokasi laman `page_location: https://profile.com/tineke`.

Atau: Sebuah `page_view` terjadi pada waktu `690387564917`, dipicu dari pemberitahuan dorong, tepatnya di laman profile_detail Tineke (BIAK19990706), lokasi https://profile.com/tineke.

## Kejadian 2: Pengguna memencet tombol "View All" yang ada di kotak biru sebelah kanan

![Anatomi Kejadian 2 ><](/images/anatomi-kejadian-2.png)

```yaml
# button_click
# Triggers every time a user presses a non critical button

- event_name: button_click
  event_params:
    - key: hit_timestamp
      value: 1690388065799
    - key: button_name
      value: views
    - key: button_text
      value: View All
    - key: container_name
      value: sidebar_blue
    - key: page_title
      value: Tineke
    - key: page_name
      value: profile_detail
    - key: page_id
      value: BIAK19990706
    - key: page_location
      value: https://profile.com/tineke
    - key: origin
      value: in_app
```

### event_params

Ingat, parameter yang mutlak mesti ada adalah informasi tentang lokasi kejadian, waktu kejadian, objek sasaran kejadian, dari mana asal pemicu kejadian. Perlu penambahan informasi tentang lokasi persis dari tombol "View All", dengan menambah beberapa `event_params`.

- `button_name`: Nama tombol (sesuai aksi)
- `button_text`: Teks di dalam tombol
- `container_name`: Nama kontainer/penampung

Menyertakan informasi tentang laman dan dengan menambah `container_name`, kita tak akan kehilangan konteks di mana lokasi persis kejadian tombol View All dipencet itu terjadi.

### Bagaimana membaca data ini?

Dibaca: Ada kejadian `event_name: button_click` yang terjadi saat `hit_timestamp: 1690388065799` dan dipicu dari `origin: in_app`. Kejadian tersebut terjadi tepatnya pada tombol `button_name: views` dengan `button_text: View All` di `container_name: sidebar_blue` dalam laman `page_title: Tineke` dengan `page_id: BIAK19990706` yang dikelompokkan dalam `page_name: profile_detail`, dengan lokasi laman `page_location: https://profile.com/tineke`.

## Kejadian 3: Pengguna memencet tombol "Follow" di dalam _popover_ yang muncul ketika kursornya melayang di atas sebuah foto profil yang berada di kotak warna merah sebelah kanan

![Anatomi Kejadian 3 ><](/images/anatomi-kejadian-3.png)

```yaml
# user_follow
# Triggers each time a user presses a button to follow another user

- event_name: user_follow
  event_params:
    - key: hit_timestamp
      value: 1690388809839
    - key: user_id
      value: WEST19611201
    - key: username
      value: burungmambruk
    - key: subcontainer_name
      value: profile_popover
    - key: container_name
      value: sidebar_red
    - key: page_title
      value: Tineke
    - key: page_name
      value: profile_detail
    - key: page_id
      value: BIAK19990706
    - key: page_location
      value: https://profile.com/tineke
    - key: origin
      value: in_app
```

Anda barangkali bisa menebak sekarang, bagaimana sebaiknya melacak kejadian ini.

Tombol "Follow" ada di dalam sebuah kontainer yang berada di dalam kontainer yang lain. Ya, untuk menangkap informasi ini, kita hanya perlu menambah satu `event_params` lagi yaitu `subcontainer_name`.

Komponen web seperti *popover *bisa jadi muncul di banyak tempat, sehingga penamaan yang dipilih adalah `profile_popover`. Bukan, misalnya `sidebar_red_profile_popover`.

Parameter `user_id` dan `username` di sini **bukan **menunjukkan aktor kejadian, tapi sasaran kejadian: Siapa pengguna yang diikuti.

---

## Ronde Pertanyaan Cepat

### Mengapa perlu `hit_timestamp` ketika platform analitika otomatis memberi `event_timestamp`?

Platform analitika yang kita pakai, GA4 misalnya, akan merangkum beberapa kejadian sekaligus dalam satu kelompok (_batch_). Sialnya, GA4 memberi nilai `event_timestamp` yang [sama untuk tiap kejadian](https://www.linkedin.com/pulse/ga4-event-batching-understanding-sequences-bigquery-solved-kennedy). Di sini `hit_timestamp` bertindak sebagai garansi. Bayangkan betapa susahnya memetakan perjalanan pengguna jika kita bergantung pada `event_timestamp` bawaan platform analitika.

### Mengapa menggabungkan semua laman ke dalam satu kejadian `page_view`?

Beberapa contoh templat pelacakan kejadian, seperti dari [GovTech Edu](https://docs.google.com/spreadsheets/d/1KETKPZT-jxPAB2fCSGih98wKNIn3hTOMyGfO37yunDw/edit#gid=2064627196&range=N23:N40) dan [bikinan Crystal Widjaja](https://www.reforge.com/blog/why-most-analytics-efforts-fail) memakai nama laman sebagai nama kejadian. Misal pengguna membuka laman "Home", nama kejadiannya adalah "Home". Atau jika pengguna membuka laman "Toolkit List", nama kejadiannya adalah "[TOOLKIT_LIST](https://docs.google.com/spreadsheets/d/1KETKPZT-jxPAB2fCSGih98wKNIn3hTOMyGfO37yunDw/edit#gid=2064627196&range=N23:N40)".

Saya tak yakin kenapa mereka memilih model itu, tapi saya akan jelaskan kenapa saya memilih si tua andal `page_view`. Ini lebih dari sekadar _potato potato._

Seringkali, terutama dalam produk situs web, berapa total laman dibuka merupakan metriks penting. Dengan menggunakan `page_view`, mendapatkan metriks ini sangat gampang:

```sql
SELECT count(event_name) AS pageviews
FROM events
WHERE event_name = 'page_view';
```

Bandingkan dengan:

```sql
SELECT count(event_name) AS pageviews
FROM events
WHERE event_name IN ('HOME', 'TOOLKIT_LIST', ...);
```

Dengan menggabungkan ke satu nama `page_view`, mendapatkan daftar pengguna yang membuka lebih dari 10 laman juga jadi lebih mudah:

```sql
SELECT
    user_id,
    count(event_name) AS pageviews
FROM events
WHERE event_name = 'page_view'
GROUP BY 1
HAVING (pageviews >= 10)
```

Dengan asumsi kolom `event_params` telah diratakan, kueri spesifik laman tertentu pun bisa dilakukan dengan cara:

```sql
SELECT count(event_name) AS pageviews
FROM events
WHERE event_name = 'page_view'
AND event_params_page_name = 'profile_detail'
```

### Tombol "Follow" juga adalah tombol, kenapa membuatnya menjadi kejadian tersendiri alih-alih `button_click`?

Saya sengaja memberikan contoh ini untuk mengabarkan bahwa tak masalah untuk menjadikan beberapa kejadian sebagai nama kejadian tersendiri. Dalam kontrak data `button_click` saya menulis, _"Triggers every time a user presses a **non critical** button"._

Pilihan untuk menjadikan sebuah kejadian sebagai satu nama kejadian tersendiri bergantung pada seberapa penting kejadian tersebut dalam produk Anda. Di contoh produk jejaring sosial ini, kejadian seorang pengguna mengikuti pengguna lain adalah kejadian maha penting.

### Bagaimana kolega insinyur kita tahu yang mana adalah yang mana?

Dalam kontrak data, ada `page_name`, `container_name`, `subcontainer_name`, `button_name`. Bagaimana bisa tahu laman A, B, C mestinya termasuk `page_name` yang mana, atau tombol ED, EB, EC termasuk `button_name`  yang mana?

Tentu kita butuh dokumen tambahan. Sebut saja dokumen referensi. Isinya, daftar button beserta `button_name`-nya, daftar laman beserta `page_name`-nya. Sebaiknya, sertakan juga tangkapan layar yang sesuai. Bisa juga informasi tentang `*_name` ini diletakkan di Figma, misalnya.
