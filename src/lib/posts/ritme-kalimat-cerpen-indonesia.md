---
title: 'Jangan hanya menulis kata-kata'
date: '2022-05-14'
updated: '2022-05-14'
isPublished: true
tags:
  - blog
excerpt: Visualisasi ritme kalimat dari 1.252 cerpen Indonesia. Bagaimana cerpenis Indonesia menyelang-nyeling panjang kalimat mereka?
---

<script>
    import ObservablePlot from '$lib/components/ObservablePlot.svelte';
    import * as Plot from '@observablehq/plot';
    import * as d3 from 'd3';
    import data from '$lib/data/cerpen.json';

    // Filter authors and get unique sorted authors
    const shortStories = data.filter(d => d.rubrik === "Cerpen");
    const authors = Array.from(new Set(shortStories.map(d => d.author))).sort((a, b) => a.localeCompare(b));

    let selectedAuthor = ''; // To store the selected author

    // Split text into paragraphs
    const splitIntoParagraphs = (str) => str.split(/\n+/).filter(Boolean);

    // Split text into sentences
    const splitIntoSentences = (str) => str.match(/[^.!?]+[.!?]+/g) || [];

    // Calculate mean of an array
    const mean = (arr = []) => arr.reduce((a, b) => a + b, 0) / arr.length;

    // Parse sample text
    const parseSample = (sample = "") => {
        const paragraphs = splitIntoParagraphs(sample).map(splitIntoSentences);
        const sentences = paragraphs.flat();
        const sentenceLengths = sentences.map(sentence => sentence.trim().split(/\s+/).length);
        const averageLength = mean(sentenceLengths);

        return {
            paragraphs,
            sentenceLengths,
            averageLength,
        };
    };

    let filteredShortStories = shortStories.filter(d => d.author == "Budi Darma");

    let calculatedFilteredData = [];
    function updateCalculatedData() {
        calculatedFilteredData = filteredShortStories.map(d => ({ ...d, ...parseSample(d.content) }));
    }
    updateCalculatedData();

    let plotData = [];
    function updatePlotData() {
        plotData = calculatedFilteredData.flatMap((d) =>
            d.sentenceLengths.map((sentenceLength, index) => ({
                title: d.title,
                shortTitle: d.title.length > 18 ? `${d.title.slice(0, 18)}...` : d.title,
                sentenceLength,
                averageLength: d.averageLength,
                index,
                date: d.date,
                content: d.content
            }))
        );
    }
    updatePlotData();

    let exampleAhmadTohari = shortStories
        .filter(d => d.title == "Menembak Mati Tujuh Orang")
        .map(d => ({ ...d, ...parseSample(d.content) }))
        .flatMap((d) =>
            d.sentenceLengths.map((sentenceLength, index) => ({
                title: d.title,
                shortTitle: d.title.length > 18 ? `${d.title.slice(0, 18)}...` : d.title,
                sentenceLength,
                averageLength: d.averageLength,
                index,
                date: d.date
            })
            )
        );

    let exampleSenoGumira = shortStories
        .filter(d => d.author == "Seno Gumira Ajidarma")
        .map(d => ({ ...d, ...parseSample(d.content) }))
        .flatMap((d) =>
            d.sentenceLengths.map((sentenceLength, index) => ({
                title: d.title,
                shortTitle: d.title.length > 18 ? `${d.title.slice(0, 18)}...` : d.title,
                sentenceLength,
                averageLength: d.averageLength,
                index,
                date: d.date
            })
            )
        );

    let colorScale = d3.scaleLinear().domain([0, 30 / 2, 30]).range(["#b8b8ff", "#fff", "#ff6978"]);

    function render(content) {
        const paragraphs = content.split('\n');
        return paragraphs.map((paragraph, index) => {
            const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [];
            const coloredSentences = sentences.map(sentence => {
                const parsed_sentence = sentence.split(" ");
                const wc = parsed_sentence.filter(word => word.length !== 0).length;
                const colorWC = colorScale(wc);
                return `<span style="background:${colorWC}">${sentence}</span>`;
            }).join("");

            return `<p id="paragraph-${index}" style="margin-bottom: 10px;" >${coloredSentences}</p>`;
        }).join("");
    }

    let titles = Array.from(new Set(filteredShortStories.map(d => d.title))).sort((a, b) => a.localeCompare(b));

    function updateTitleData() {
        titles = Array.from(new Set(filteredShortStories.map(d => d.title))).sort((a, b) => a.localeCompare(b));
    }

    function handleAuthorChange(event) {
        selectedAuthor = event.target.value;
        filteredShortStories = selectedAuthor === '' ? shortStories : shortStories.filter(d => d.author === selectedAuthor);
        selectedTitle = '';
        selectedStory = '';
        displayedStory = '';
        updateCalculatedData();
        updatePlotData();
        updateTitleData();
    }

    let selectedTitle = ''; // To store the selected title
    let selectedStory = '';
    let displayedStory = '';

    function handleStoryChange(event) {
        selectedTitle = event.target.value;
        selectedStory = selectedTitle === '' ? '' : filteredShortStories.filter(d => d.title === selectedTitle)[0].content;
        displayedStory = render(selectedStory);
    }
</script>

Tulisan dari Gary Provost ini nongol di linimasa saya:

![Gary Provost ><](/images/gary-provost.png)
_caption ????_

Tulisan tak hanya soal apa yang ingin disampaikan, tapi juga tentang bagaimana ia dibaca. Paragraf pertama dari Gary Provost adalah contoh tulisan monoton. Tak memiliki ritme. Ritme adalah salah satu hal yang mendorong pembaca untuk terus membaca. Ritme tulisan bisa membangun suasana hati pembaca. Lihat bagaimana Provost memberi ritme pada tulisannya di paragraf kedua dan ketiga. Tulisan menjadi hidup.

---

## Ritme kalimat dalam cerpen Indonesia

<ObservablePlot options={{
    marginLeft: 120,
    style: {
      fontSize: 10,
    },
    color: {legend: true},
    x: {
      grid: true,
      label: "Kalimat ke →",
      axis: "bottom"
    },
    y: {
      label: "",
      textAnchor: "center",
      axis: "left",
      tickRotate: 0,
      domain: d3
        .rollups(exampleSenoGumira, (group) => d3.max(group, (d) => d.date), (d) => d.shortTitle)
        .sort(([, a], [, b]) => d3.ascending(a, b))
        .map(([key]) => key)
    },
    marks: [
      Plot.dot(exampleSenoGumira, { x: "index", y: "shortTitle", fillOpacity: 0.8, fill: "sentenceLength", r: "sentenceLength", tip: true }),
    ]
  }}
/>

Barangkali ada sesuatu yang menarik jika memeriksa ritme kalimat dari karya-karya penulis cerpen Indonesia? Bagaimana cerpenis Indonesia memvariasikan panjang kalimat mereka?

Kebetulan saya sudah punya data cerpen-cerpennya.

Bukan kebetulan, _ding_.

Tahun lalu, saya sempat 🏴‍☠️mengambil🏴‍☠️ cerpen dari [situs yang rajin](https://ruangsastra.com/wp-json/wp/v2/posts) mengunggah cerpen yang dimuat di media massa tiap hari Minggu. Ada 1.252 cerpen yang ditulis oleh 552 penulis di 46 media.

Untuk memeriksa ritme, data teks mesti diubah jadi angka-angka. Perlu menghitung jumlah kata di tiap kalimat sambil tetap menjaga urutan kalimat.

Teknik pengubahan data dari kata-kalimat ke angka yang saya lakukan tak canggih-canggih amat. Tak keliru juga jika ada yang menyebutnya naif.

Untuk memisahkan kalimat dalam paragraf, saya hanya memakai tanda baca titik (.), tanya (?), dan seru (!). Untuk memisahkan kata, saya memakai spasi. Semua dilakukan hanya menggunakan aturan ekspresi reguler sederhana. Tidak ada teknik rumit macam pemrosesan bahasa alami. Pemrosesan data bahkan mungkin sedang berlangsung ketika kamu membaca kalimat ini. Ditenagai oleh peramban milikmu.

Data kata-kalimat cerpen berubah menjadi data angka seperti: Cerpen A, kalimat pertama panjang 5 kata, kalimat kedua panjang 12 kata, ..., Cerpen B, kalimat pertama panjang 3 kata, kalimat ke-n panjang 27 kata, dan seterusnya.

Rangkaian seperti _“Misbahul, kamu sahabat saya. Mengapa kamu kelihatan susah sekali?” tanya Ratman._ akan dianggap sebagai tiga kalimat:

1. “Misbahul, kamu sahabat saya.
2. Mengapa kamu kelihatan susah sekali?”
3. tanya Ratman.

Data teks juga tak bersih-bersih amat. Di paragraf akhir beberapa tulisan ada biodata penulis. Ada juga data cerpen yang berisi cerpen beserta polemiknya (cerpen Perempuan Tua dalam Rashomon).

Data _kotor_ macam itu tak saya bersihkan, sehingga masih masuk dalam penghitungan kata-kalimat. Sampah masuk, sampah keluar. Tapi ya, bisa, lah.

<ObservablePlot options={{
    title: "Bagan 1",
    marginLeft: 120,
    style: {
      fontSize: 10,
    },
    color: {legend: true},
    x: {
      grid: true,
      label: "Kalimat ke →",
      axis: "bottom"
    },
    y: {
      label: "",
      textAnchor: "center",
      axis: "left",
      tickRotate: 0,
      domain: d3
        .rollups(plotData, (group) => d3.max(group, (d) => d.date), (d) => d.shortTitle)
        .sort(([, a], [, b]) => d3.ascending(a, b))
        .map(([key]) => key)
    },
    marks: [
      Plot.dot(plotData, { x: "index", y: "shortTitle", fillOpacity: 0.8, fill: "sentenceLength", r: "sentenceLength", tip: true }),
    ]
  }}
/>

**Bagan 1** menampilkan ritme kalimat dari masing-masing cerpen. Tiap baris adalah cerpen, diurutkan dari cerpen yang lahir paling awal. Tiap lingkaran adalah kalimat. Sumbu x adalah urutan kalimat. Kalimat pertama ada di paling kiri. Kalimat paling akhir ada di paling kanan. Ukuran dan warna lingkaran menujukkan jumlah kata masing-masing kalimat. Bagan ini bertugas menyampaikan secara cepat jika ada cerpen yang memiliki ritme kalimat yang aneh.

<ObservablePlot options={{
    title: "Bagan 2",
    marginLeft: 120,
    style: {
        fontSize: 10,
    },
    x: {
        grid: true,
        label: "Jumlah kata dalam kalimat →",
        axis: "top"
    },
    y: {
        grid: true,
        label: "",
        textAnchor: "center",
        axis: "left",
        tickRotate: 0,
        domain: d3
        .rollups(plotData, (group) => d3.max(group, (d) => d.date), (d) => d.shortTitle)
        .sort(([, a], [, b]) => d3.ascending(a, b))
        .map(([key]) => key)
    },
    marks: [
        Plot.dot(plotData, Plot.group({ r: "count"}, { y: "shortTitle", x: "sentenceLength", tip: true})),
        Plot.tickX(plotData, { y: "shortTitle", x: "averageLength", stroke: "red", tip: true}),
    ]
  }}
/>

**Bagan 2** dibuat dari data karya cerpen Budi Darma. Cerpen diurutkan berdasarkan tanggal terbit agar terlihat jika ada perubahan pola dari waktu ke waktu. Sumbu x (kiri ke kanan) menunjukkan jumlah kata dalam kalimat. Ukuran lingkaran menunjukkan jumlah kalimat. Dalam cerpen berjudul Misbahul, kebanyakan kalimat terdiri dari 2 sampai 13 kata. Rata-rata panjang kalimat dalam cerpen itu adalah 9,5 kata (garis merah). Bagan ini bertugas hanya untuk menunjukkan sebaran jumlah kata dalam kalimat, bukan ritme. Kemungkinan perubahan gaya kepenulisan juga bisa tampak dari pergeseran kelompok lingkaran berukuran besar dari atas ke bawah.

<ObservablePlot options={{
    title: "Bagan 3",
    grid: true,
    color: {
      scheme: "Cool",
    },
    x: {
      label: "Kalimat ke →",
      tick: false
    },
    y: {
      label: "↑ Jumlah Kata"
    },
    marks: [
      Plot.dot(plotData, { x: "index", y: "sentenceLength", strokeOpacity:0.8, stroke: "sentenceLength", r: "sentenceLength", tip: true }),
    ]
  }}
/>

**Bagan 3** bertugas memperlihatkan pola kecenderungan cerpenis dalam membuat kalimat dan menyusun cerita. Tiap lingkaran adalah kalimat. Sumbu x adalah urutan kalimat. Sumbu y dan ukuran lingkaran merepresentasikan jumlah kata dalam kalimat. Bagan ini bertugas menjawab pertanyaan seperti, "Apakah penulis punya kecenderungan menulis kalimat panjang di bagian awal cerita?"

---

Dari ratusan penulis dalam daftar, saya membuka beberapa yang namanya saya kenal.

Salah satunya Ahmad Tohari.

<ObservablePlot options={{
    marginLeft: 120,
    style: {
      fontSize: 10,
    },
    color: {legend: true},
    x: {
      grid: true,
      label: "Kalimat ke →",
      axis: "bottom"
    },
    y: {
      label: "",
      textAnchor: "center",
      axis: "left",
      tickRotate: 0,
      domain: d3
        .rollups(exampleAhmadTohari, (group) => d3.max(group, (d) => d.date), (d) => d.shortTitle)
        .sort(([, a], [, b]) => d3.ascending(a, b))
        .map(([key]) => key)
    },
    marks: [
      Plot.dot(exampleAhmadTohari, { x: "index", y: "shortTitle", fillOpacity: 0.8, fill: "sentenceLength", r: "sentenceLength", tip: true }),
    ]
  }}
/>

Coba perhatikan kalimat ke 85 sampai 110. Setelah kalimat-kalimat sedang, tiba-tiba ada rentetan lingkaran berukuran kecil. Rentetan kalimat pendek.

Cerpen Ahmad Tohari ini berjudul Menembak Mati Tujuh Orang.

Rentetan kalimat pendek itu ternyata adalah suara tembakan AK 47: _Tret.t.t.t.t.t.t.t.t.t.t.t.t.t.t._

> Wajah Dar menghangat karena merasa tertantang. Dia menarik napas dalam, memajukan kaki kiri dan badan condong ke depan. Mencekal AK 47, kedua telapak tangan Dar terasa basah. Dengan sadar dia ambil posisi menembak secara gagah. Telunjuk kanan ketat di pelatuk. Tret.t.t.t.t.t.t.t.t.t.t.t.t.t.t. Dalam sekejap garis putih tebal di lembar anyaman bambu itu nyaris lenyap oleh semburan peluru.

## Penjelajahan Mandiri

Di bagian ini, kamu bisa melakukan penjelajahan data secara mandiri. Selamat menjelajah!

<select on:change={handleAuthorChange}   on:change="{() => selectedStory = ''}">
  <option value="">Pilih penulis</option>
  {#each Array.from(authors) as author}
    <option value={author}>{author}</option>
  {/each}
</select>

<ObservablePlot options={{
    marginLeft: 120,
    style: {
      fontSize: 10,
    },
    color: {legend: true},
    x: {
      grid: true,
      label: "Kalimat ke →",
      axis: "bottom"
    },
    y: {
      label: "",
      textAnchor: "center",
      axis: "left",
      tickRotate: 0,
      domain: d3
        .rollups(plotData, (group) => d3.max(group, (d) => d.date), (d) => d.shortTitle)
        .sort(([, a], [, b]) => d3.ascending(a, b))
        .map(([key]) => key)
    },
    marks: [
      Plot.dot(plotData, { x: "index", y: "shortTitle", fillOpacity: 0.8, fill: "sentenceLength", r: "sentenceLength", tip: true }),
    ]
  }}
/>

<ObservablePlot options={{
    marginLeft: 120,
    style: {
        fontSize: 10,
    },
    x: {
        grid: true,
        label: "Jumlah kata dalam kalimat →",
        axis: "top"
    },
    y: {
        grid: true,
        label: "",
        textAnchor: "center",
        axis: "left",
        tickRotate: 0,
        domain: d3
        .rollups(plotData, (group) => d3.max(group, (d) => d.date), (d) => d.shortTitle)
        .sort(([, a], [, b]) => d3.ascending(a, b))
        .map(([key]) => key)
    },
    marks: [
        Plot.dot(plotData, Plot.group({ r: "count"}, { y: "shortTitle", x: "sentenceLength", tip: true})),
        Plot.tickX(plotData, { y: "shortTitle", x: "averageLength", stroke: "red", tip: true}),
    ]
  }}
/>

<ObservablePlot options={{
    grid: true,
    color: {
      scheme: "Cool",
    },
    x: {
      label: "Kalimat ke →",
      tick: false
    },
    y: {
      label: "↑ Jumlah Kata",
    },
    marks: [
      Plot.dot(plotData, { x: "index", y: "sentenceLength", strokeOpacity:0.8, stroke: "sentenceLength", r: "sentenceLength", tip: true }),
    ]
  }}
/>

---

Silakan pilih salah satu judul untuk membaca cerpennya.

<select on:change={handleStoryChange}>
  <option value="">Pilih judul cerpen</option>
  {#each Array.from(titles) as title}
    <option value={title}> {title} </option>
  {/each}
</select>

## {selectedTitle}

<div>
  {@html displayedStory}
</div>
