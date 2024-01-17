<!-- This file renders each individual blog post for reading. Be sure to update the svelte:head below -->
<script>
	import { onMount } from 'svelte';

	export let data;

	const { title, excerpt, date, updated, coverImage, coverWidth, coverHeight, tags } = data.meta;
	const { PostContent } = data;
	onMount(() => {
		const child = document.createElement('script');
		child.async = 'async';
		child.src = 'https://giscus.app/client.js';
		child.setAttribute('data-repo', 'adityawarmanfw/adityawarmanfw.id');
		child.setAttribute('data-repo-id', 'R_kgDOLE9Q7w');
		child.setAttribute('data-category', 'General');
		child.setAttribute('data-category-id', 'DIC_kwDOLE9Q784CcbbU');
		child.setAttribute('data-mapping', 'pathname');
		child.setAttribute('data-reactions-enabled', '1');
		child.setAttribute('data-emit-metadata', '0');
		child.setAttribute('data-theme', 'light_protanopia');
		child.setAttribute('data-lang', 'id');
		child.setAttribute('crossorigin', 'anonymous');
		const body = document.getElementsByTagName('body')[0];
		body.appendChild(child);
	});
</script>

<svelte:head>
	<title>{title}</title>
	<meta data-key="description" name="description" content={excerpt} />
	<meta property="og:type" content="article" />
	<meta property="og:title" content={title} />
	<meta name="twitter:title" content={title} />
	<meta property="og:description" content={excerpt} />
	<meta name="twitter:description" content={excerpt} />
	<meta property="og:image:width" content={coverWidth} />
	<meta property="og:image:height" content={coverHeight} />
</svelte:head>

<article class="post">
	<img
		class="cover-image"
		src={coverImage}
		alt=""
		style="aspect-ratio: {coverWidth} / {coverHeight};"
		width={coverWidth}
		height={coverHeight}
	/>

	<h1>{title}</h1>
	<p class="excerpt">{excerpt}</p>

	<svelte:component this={PostContent} />

	{#if tags}
		<aside class="post-footer">
			<ul>
				{#each tags as tag}
					<li>
						<a href="/tag/{tag}/">
							{tag}
						</a>
					</li>
				{/each}
			</ul>
		</aside>
	{/if}
</article>

<div class="giscus"></div>
