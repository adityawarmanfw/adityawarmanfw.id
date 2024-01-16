<!-- This page handles any error encountered by the site. -->
<script>
	import { page } from '$app/stores';
</script>

<h2>{$page.status}</h2>
<p class="py-4 text-xl">
	{#if $page.status === 404}
		Halaman tidak ditemukan.
	{:else}
		An unexpected error occurred.
	{/if}
</p>

<p><strong>Maaf!</strong> Coba kembali ke <a href="/">laman awal</a></p>
