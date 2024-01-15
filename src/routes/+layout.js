import { error } from '@sveltejs/kit';

export const prerender = true;
export const csr = true;

export const load = async ({ url, fetch }) => {
	try {
		return {
			path: url.pathname
		};
	} catch (err) {
		throw error(500, err);
	}
};
