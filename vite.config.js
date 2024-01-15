import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit()],
	server: {
		fs: {
			allow: ['.']
		}
	},
	optimizeDeps: {
		exclude: [
			"@codemirror/state",
			"@codemirror/view",
			"@codemirror/lang-sql",
			"codemirror",
			'jsdom' /* ... */
		]
	}
};

export default config;
