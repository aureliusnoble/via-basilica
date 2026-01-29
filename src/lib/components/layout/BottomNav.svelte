<script lang="ts">
	import { page } from '$app/state';
	import { Home, Trophy, User } from 'lucide-svelte';

	interface NavItem {
		href: string;
		label: string;
		icon: typeof Home;
	}

	const navItems: NavItem[] = [
		{ href: '/', label: 'Home', icon: Home },
		{ href: '/leaderboard', label: 'Ranks', icon: Trophy },
		{ href: '/profile', label: 'Profile', icon: User }
	];

	function isActive(href: string): boolean {
		if (href === '/') {
			return page.url.pathname === '/';
		}
		return page.url.pathname.startsWith(href);
	}
</script>

<nav
	class="fixed bottom-0 left-0 right-0 z-40 bg-bg-dark-secondary border-t border-bg-dark-tertiary safe-bottom"
>
	<div class="flex justify-around items-center h-16 max-w-lg mx-auto">
		{#each navItems as item}
			{@const active = isActive(item.href)}
			<a
				href={item.href}
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
