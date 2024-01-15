---
title: "Testing DuckDBEditor"
date: "2024-01-04"
updated: "2024-01-04"
isPublished: false
tags: 
    - blog
excerpt: Testing DuckDBEditor Component
---

<script>
  import DuckDbInstantiator from "$lib/components/DuckDBInstantiator.svelte";
  import DuckDBEditor from "$lib/components/DuckDBEditor.svelte";

  let connProm;
  let dbInit;
  
  let q = `SELECT * FROM duckdb_functions()`;

</script>

<DuckDbInstantiator bind:connProm bind:dbInit />

<DuckDBEditor bind:value={q} bind:connProm bind:dbInit />







