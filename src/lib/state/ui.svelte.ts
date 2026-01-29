import { browser } from '$app/environment';

const WELCOME_KEY = 'via_basilica_welcomed';
const QUOTE_DATE_KEY = 'via_basilica_last_quote_date';
const THEME_KEY = 'via_basilica_theme';

// UI state using Svelte 5 runes - wrapped in object for proper export
function createUIState() {
	let showWelcomeModal = $state(false);
	let showDailyQuoteModal = $state(false);
	let showBiographyModal = $state(false);
	let darkMode = $state(true);
	let isMobile = $state(false);
	let initialized = false;

	function applyTheme() {
		if (!browser) return;
		document.documentElement.classList.toggle('dark', darkMode);
		document.documentElement.classList.toggle('light', !darkMode);
	}

	function checkDailyQuote() {
		if (!browser) return;

		const lastQuoteDate = localStorage.getItem(QUOTE_DATE_KEY);
		const today = new Date().toDateString();

		if (lastQuoteDate !== today) {
			showDailyQuoteModal = true;
		}
	}

	return {
		get showWelcomeModal() {
			return showWelcomeModal;
		},
		get showDailyQuoteModal() {
			return showDailyQuoteModal;
		},
		get showBiographyModal() {
			return showBiographyModal;
		},
		get darkMode() {
			return darkMode;
		},
		get isMobile() {
			return isMobile;
		},

		init() {
			if (!browser || initialized) return;
			initialized = true;

			// Check for mobile
			isMobile = window.innerWidth < 768;
			window.addEventListener('resize', () => {
				isMobile = window.innerWidth < 768;
			});

			// Load theme
			const savedTheme = localStorage.getItem(THEME_KEY);
			if (savedTheme) {
				darkMode = savedTheme === 'dark';
			} else {
				darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
			}
			applyTheme();

			// Check for welcome modal
			const welcomed = localStorage.getItem(WELCOME_KEY);
			if (!welcomed) {
				showWelcomeModal = true;
			} else {
				// Check for daily quote
				checkDailyQuote();
			}
		},

		setShowWelcomeModal(show: boolean) {
			showWelcomeModal = show;
			if (!show && browser) {
				localStorage.setItem(WELCOME_KEY, 'true');
				// After welcome, check daily quote
				checkDailyQuote();
			}
		},

		setShowDailyQuoteModal(show: boolean) {
			showDailyQuoteModal = show;
			if (!show && browser) {
				localStorage.setItem(QUOTE_DATE_KEY, new Date().toDateString());
			}
		},

		setShowBiographyModal(show: boolean) {
			showBiographyModal = show;
		},

		toggleDarkMode() {
			darkMode = !darkMode;
			if (browser) {
				localStorage.setItem(THEME_KEY, darkMode ? 'dark' : 'light');
				applyTheme();
			}
		}
	};
}

// Create singleton instance
export const ui = createUIState();

// Legacy exports for backward compatibility
export function getUIState() {
	return ui;
}

export function initUI() {
	ui.init();
}

export function setShowWelcomeModal(show: boolean) {
	ui.setShowWelcomeModal(show);
}

export function setShowDailyQuoteModal(show: boolean) {
	ui.setShowDailyQuoteModal(show);
}

export function setShowBiographyModal(show: boolean) {
	ui.setShowBiographyModal(show);
}

export function toggleDarkMode() {
	ui.toggleDarkMode();
}
