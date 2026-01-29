<script lang="ts">
	import {
		FolderOpen,
		Search,
		Eye,
		Footprints,
		Undo2,
		Link,
		Telescope
	} from 'lucide-svelte';

	interface Props {
		icon: string;
		size?: number;
		class?: string;
	}

	let { icon, size = 20, class: className = '' }: Props = $props();

	const iconComponents: Record<string, typeof FolderOpen> = {
		'folder-open': FolderOpen,
		search: Search,
		eye: Eye,
		footprints: Footprints,
		'undo-2': Undo2,
		link: Link,
		telescope: Telescope
	};

	const IconComponent = $derived(iconComponents[icon] || FolderOpen);
</script>

<IconComponent {size} class={className} />
