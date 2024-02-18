---
title: 'Visualisasi Harga Kratom'
date: 2024-02-18
updated: 2024-02-18
isPublished: true
tags:
  - blog
  - analitika
excerpt: "Kratom (Mitragyna speciosa) belum termasuk dalam narkotika golongan 1 yang bisa bikin orang dipenjara 20 tahun."
---

<script>
    import ObservablePlot from '$lib/components/ObservablePlot.svelte';
    import * as Plot from '@observablehq/plot';
    import data from '$lib/data/harga_kratom.json';
</script>

Sampai sekarang, orang-orang masih bisa jual-beli kratom secara bebas di lokapasar.

Wakil Ketua Kamar Dagang dan Industri (Kadin) Kalimantan Barat bilang kalau [harga kratom turun di pasaran internasional](https://www.suarakalbar.co.id/2023/12/kadin-kalbar-dukung-untuk-perbaikan-tata-niaga-ekspor-kratom/).
Dari 40 dolar AS menjadi 5-6 dolar AS per kilogram. Anjlok.

Berapa harga kratom dalam negeri?

## Median harga kratom per 100 gram

<ObservablePlot options={{
    style: {
      fontSize: 10,
    },
    height: 140,
    x: {
      grid: false,
      label: "Harga per 100g →",
      axis: "bottom",
      type: "log",
      base: 2
    },
    y: {axis: false},
    marks: [
      Plot.tickX(data, {x: "price_100g", strokeOpacity:0.2, tip: true, channels: {url: "url", "Harga per 100g →": "price_100g", Kota: "city"}}),
      Plot.tickX(
        data,
        Plot.groupY({x: "median"}, {x: "price_100g", y: "Median", stroke: "red", strokeWidth: 3, sort: {y: "x"}, tip: true})
      )
  ]
  }}
/>

## Median harga kratom per 100 gram (kota)

<ObservablePlot options={{
    style: {
      fontSize: 10,
    },
    marginLeft: 110,
    x: {
      grid: true,
      label: "Harga per 100g →",
      axis: "bottom"
    },
    y: {label: "Kota"},
    marks: [
      Plot.ruleX([0]),
      Plot.tickX(data, {x: "price_100g",  y: (d) => d.city.length > 13 ? `${d.city.slice(0, 13)}...` : d.city, strokeOpacity:0.5 }),
      Plot.tickX(
        data,
        Plot.groupY({x: "median"}, {x: "price_100g", y: (d) => d.city.length > 13 ? `${d.city.slice(0, 13)}...` : d.city, stroke: "red", strokeWidth: 2, sort: {y: "x"}, tip: true})
      )
  ]
  }}
/>

*Data diambil dari Tokopedia per 18 Februari 2024.*

