<script>
	export let posts = [];
</script>

<ul class="posts-list">
	{#each posts as post}
		<li>
			<!-- {#if post.tags}
				<aside class="post-list-tags">
					<ul>
						{#each post.tags as tag}
							<li>
								<a href="/tag/{tag}/">
									{tag}
								</a>
							</li>
						{/each}
					</ul>
				</aside>
			{/if} -->
			<a href="/{post.slug}">
				<h2>
					{post.title}
				</h2>
			</a>
			<p>{post.excerpt}</p>
		</li>
	{/each}
</ul>
