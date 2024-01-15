<!-- This file renders each individual blog post for reading. Be sure to update the svelte:head below -->
<script>
export let data

const {
	title,
	excerpt,
	date,
	updated,
	coverImage,
	coverWidth,
	coverHeight,
	tags 
} = data.meta
const { PostContent } = data
</script>


<svelte:head>
	<title>{title}</title>
	<meta data-key="description" name="description" content="{excerpt}">
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
		src="{coverImage}"
		alt=""
		style="aspect-ratio: {coverWidth} / {coverHeight};"
		width={coverWidth}
		height={coverHeight}
	/>

	<h1>{ title }</h1>
	<p class="excerpt">{ excerpt }</p>
	
	<svelte:component this={PostContent} />

	{#if tags}
		<aside class="post-footer">
			<ul>
				{#each tags as tag}
					<li>
						<a href="/tag/{tag}/">
							{ tag }
						</a>
					</li>
				{/each}
			</ul>
		</aside>
	{/if}
</article> 