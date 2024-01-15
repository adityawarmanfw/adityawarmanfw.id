---
title: "Testing DuckDBEditor"
date: "2024-01-04"
updated: "2024-01-04"
isPublished: true
tags: 
    - blog
excerpt: Testing DuckDBEditor Component
---

<script>
  import DuckDbInstantiator from "$lib/components/DuckDBInstantiator.svelte";
  import DuckDBEditor from "$lib/components/DuckDBEditor.svelte";

  let connProm;
  let dbInit;
  
  let q = `CREATE OR REPLACE MACRO format_bytes_1024(bytes) AS (
    SELECT
        CASE WHEN bytes < 1024 THEN bytes || 'B'
            ELSE
                round((bytes / power(1024, floor(log(bytes) / log(1024)))), 2) ||
                ' ' ||
                substr('BKMGTPEZY', (floor(log(bytes) / log(1024) + 1))::INT, 1) ||
                'iB'
        END AS format_bytes_1024
);

SELECT 
    format_bytes(162800469938172) AS format_bytes,
    format_bytes_1024(162800469938172) AS format_bytes_1024`;

</script>

<DuckDbInstantiator bind:connProm bind:dbInit />

<DuckDBEditor bind:value={q} bind:connProm bind:dbInit />







