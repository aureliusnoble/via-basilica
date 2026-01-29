<script lang="ts">
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import { Home, Trophy, User } from 'lucide-svelte';

	interface NavItem {
		path: string;
		label: string;
		icon: typeof Home;
	}

	const navItems: NavItem[] = [
		{ path: '/', label: 'Home', icon: Home },
		{ path: '/leaderboard', label: 'Ranks', icon: Trophy },
		{ path: '/profile', label: 'Profile', icon: User }
	];

	function isActive(path: string): boolean {
		const fullPath = `${base}${path}`;
		if (path === '/') {
			return page.url.pathname === base || page.url.pathname === `${base}/`;
		}
		return page.url.pathname.startsWith(fullPath);
	}

	function getHref(path: string): string {
		return `${base}${path}`;
	}
</script>

<nav
	class="fixed bottom-0 left-0 right-0 z-40 bg-bg-dark-secondary border-t border-bg-dark-tertiary safe-bottom"
>
	<div class="flex justify-around items-center h-16 max-w-lg mx-auto">
		{#each navItems as item}
			{@const active = isActive(item.path)}
			<a
				href={getHref(item.path)}
				class="flex flex-col items-center justify-center w-16 h-full touch-target transition-colors {active
					? 'text-gold'
					: 'text-text-dark-muted hover:text-text-dark'}"
				aria-current={active ? 'page' : undefined}
			>
				<item.icon size={24} strokeWidth={active ? 2.5 : 2} />
				<span class="text-xs mt-1">{item.label}</span>
			</a>
		{/each}
	</div>
</nav>
