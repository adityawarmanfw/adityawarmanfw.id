const fetchPosts = async ({ tag = '' } = {}) => {
	const posts = await Promise.all(
		Object.entries(import.meta.glob('/src/lib/posts/*.md')).map(async ([path, resolver]) => {
			const { metadata } = await resolver();
			const slug = path.split('/').pop().slice(0, -3);
			return { ...metadata, slug };
		})
	);

	let sortedPosts = posts
		.filter((post) => post.isPublished == true)
		.sort((a, b) => new Date(b.date) - new Date(a.date));

	if (tag) {
		sortedPosts = sortedPosts.filter((post) => post.tags.includes(tag));
	}

	sortedPosts = sortedPosts.map((post) => ({
		title: post.title,
		slug: post.slug,
		excerpt: post.excerpt,
		coverImage: post.coverImage,
		coverWidth: post.coverWidth,
		coverHeight: post.coverHeight,
		date: post.date,
		tags: post.tags
	}));

	return {
		posts: sortedPosts
	};
};

export default fetchPosts;
