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
			'codemirror',
			'@codemirror/language-javascript',
			'@codemirror/language-sql',
			'jsdom' /* ... */
		]
	}
};

export default config;
