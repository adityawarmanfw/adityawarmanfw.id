---
title: Retention
date: '2022-12-26'
updated: '2022-12-26'
isPublished: false
tags:
  - blog
excerpt: Retention rate
---

<script>
    import ObservablePlot from '$lib/components/ObservablePlot.svelte';
    import * as Plot from '@observablehq/plot';
	import * as htl from 'htl';
    import data from '$lib/data/retention_rates.json';
    
    const filterDays = [1, 3, 7, 14, 28];

    const retentionRates = data.map(d => ({
        join_date: new Date(d.join_date),
        active_date: new Date(d.active_date),
        _days: +d._days,
        cohort_size: +d.cohort_size,
        retained_users: +d.retained_users,
        retention_rate: +d.retention_rate,
    }));

</script>

<ObservablePlot options={{
    x: {grid: true},
    y: {grid: true},
    color: {scheme: "observable10"},
    marks: [
      Plot.line(
        retentionRates.filter(obj => filterDays.includes(obj._days)),
        { x: "join_date", y: "retention_rate", fillOpacity: 0.8, stroke: "_days", tip: true }),
    ]
  }}
/>

<ObservablePlot options={{
        x: {domain: [1, 60], grid: true},
        y: {grid: true},
        color: {legend:true},
        marks: [
            Plot.ruleY([0]),
            Plot.line(
                retentionRates.filter(d => d._days > 0),
                {y: "retention_rate", x: "_days", z: "join_date", strokeWidth: 0.5, strokeOpacity: 0.1}
            ),
            Plot.line(
                retentionRates.filter(d => d._days > 0),
                Plot.groupX(
                    {y: "median"},
                    {y: "retention_rate", x: "_days", stroke: "red", strokeWidth: 2, sort: {y: "y"}}
                )
            ),
            Plot.line(
                retentionRates.filter(d => d._days > 0),
                Plot.groupX(
                {y: "mean"},
                {y: "retention_rate", x: "_days", stroke: "steelblue", strokeWidth: 2, sort: {y: "y"}}
                )
            )
        ]
    }}
/>

<ObservablePlot options={{
    padding: 0,
    grid: true,
    x: {axis: "top"},
    y: {type: "band"},
    color: {type: "linear", scheme: "BuGn"},
    marks: [
        Plot.cell(retentionRates.filter(d => d._days > 0 && d._days <= 14 && d.join_date >= new Date("2018-09-01")), {x: "_days", y: "join_date", fill: "retention_rate", inset: 0.5, tip: true}),
    ]
  }}
/>

<ObservablePlot options={{
    y: {grid: true},
    color: {type: "categorical", scheme: "observable10"},
    marks: [
        Plot.ruleY([0]),
        Plot.rectY(
            retentionRates,
                {y: "retained_users", x: "active_date", interval: "day", fill: "join_date", tip: true, inset: 0.3}
        )
    ]
  }}
/>
