import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url }) => {
	const startParam = url.searchParams.get('start');
	return {
		presetStart: startParam ? decodeURIComponent(startParam) : null
	};
};
