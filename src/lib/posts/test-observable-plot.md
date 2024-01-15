---
title: Testing Observable Plot
date: '2022-05-14'
updated: '2022-05-14'
isPublished: false
tags:
  - blog
excerpt: Testing Observable Plot
---

<script>
    import ObservablePlot from '$lib/components/ObservablePlot.svelte';
    import * as Plot from '@observablehq/plot';
	import * as htl from 'htl';

    let a = 100;
    let b = 0;

</script>

<ObservablePlot
options={{
		marks: [Plot.barY([1,2,4,8])],
    width: 400
	}} />

<ObservablePlot
options={{
		title: 'A simple line chart',
		marks: [Plot.lineY([1,2,4,5,3,2,4,5,7,6])]
	}} />

<ObservablePlot
options={{
		title: 'A more complex bar chart',
		subtitle: 'Using date ticks. Try setting interval to "quarter".',
		x: { interval: 'year' },
		marks: [
			Plot.barY([
				{date: Date.UTC(2018,0,1), value:1},
				{date: Date.UTC(2019,0,1), value:2},
				{date: Date.UTC(2020,0,1), value:4},
				{date: Date.UTC(2021,0,1), value:8}
			], { x: 'date', y: 'value', fill: '#999' }),
			Plot.barY([
				{date: Date.UTC(2018,0,1), value:2},
				{date: Date.UTC(2019,0,1), value:1.5},
				{date: Date.UTC(2020,0,1), value:6},
				{date: Date.UTC(2021,0,1), value:7}
			], {
				x: 'date',
				y: 'value',
				fill: 'red',
				insetLeft:20,
				insetRight: 20,
				mixBlendMode: 'multiply'
			})]
	}} />

<ObservablePlot
options={{
		title: 'A more complex bar chart',
		subtitle: 'Using date ticks. Try setting interval to "quarter".',
		x: { interval: 'year' },
		marks: [
			() => htl.svg`<defs>
				<linearGradient id="gradient" gradientTransform="rotate(90)">
					<stop offset="20%" stop-color="steelblue" stop-opacity="0.5" />
					<stop offset="100%" stop-color="brown" stop-opacity="0" />
				</linearGradient>
				</defs>`,
			Plot.barY([
				{date: Date.UTC(2018,0,1), value:1},
				{date: Date.UTC(2019,0,1), value:2},
				{date: Date.UTC(2020,0,1), value:4},
				{date: Date.UTC(2021,0,1), value:8}
			], { x: 'date', y: 'value', fill: 'url(#gradient)' }),
			Plot.barY([
				{date: Date.UTC(2018,0,1), value:2},
				{date: Date.UTC(2019,0,1), value:1.5},
				{date: Date.UTC(2020,0,1), value:6},
				{date: Date.UTC(2021,0,1), value:7}
			], {
				x: 'date',
				y: 'value',
				fill: 'red',
				insetLeft:20,
				insetRight: 20,
				mixBlendMode: 'multiply'
			})]
	}} />
