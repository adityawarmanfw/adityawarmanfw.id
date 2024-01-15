<script>
	export let data
	const { uniqueTags } = data
</script>


<svelte:head>
	<title>Tags</title>
</svelte:head>


<div class="compressed-content">
	<h1 class="h2">Semua tags</h1>
	
	<ul>
		{#each uniqueTags as tag}
		<li>
			<a href="/tag/{tag.title}">
				{ tag.title }
			</a>
			({tag.count})
		</li>
		{/each}
	</ul>
</div>