<script>
	import PostsList from '$lib/components/PostsList.svelte';
	import { siteDescription } from '$lib/config';

	export let data;
</script>

<svelte:head>
	<title> adityawarmanfw.id - {siteDescription} </title>
	<meta data-key="description" name="description" content={siteDescription} />
</svelte:head>

<PostsList posts={data.posts} />
