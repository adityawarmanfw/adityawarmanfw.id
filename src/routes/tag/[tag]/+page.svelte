<!-- Renders any page at /tag/* -->
<script>
	import PostsList from '$lib/components/PostsList.svelte';
	export let data;

	const { posts, tag } = data;
</script>

<svelte:head>
	<title>{tag.toUpperCase()} - adityawarmanfw.id</title>
</svelte:head>

<h1>{tag.toUpperCase()}</h1>

{#if posts.length}
	<PostsList {posts} />
{:else}
	<p><strong>Ups!</strong> Maaf, tidak dapat menemukan pos di "{tag}".</p>

	<p><a href="/">Kembali ke laman awal</a></p>
{/if}
