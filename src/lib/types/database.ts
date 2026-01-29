export interface Profile {
	id: string;
	username: string;
	display_name: string | null;
	avatar_url: string | null;
	total_points: number;
	total_xp: number;
	level: number;
	games_played: number;
	created_at: string;
	updated_at: string;
}

export interface DailyChallenge {
	id: number;
	challenge_date: string;
	start_article: string;
	start_article_url: string;
	target_article: string;
	article_length: number;
	article_quality: string | null;
	created_at: string;
}

export type GameMode = 'daily' | 'random' | 'archive';

export interface GameResult {
	id: string;
	user_id: string;
	challenge_id: number | null;
	mode: GameMode;
	start_article: string;
	hops: number;
	path: PathStep[];
	powerups_used: any[];
	started_at: string;
	completed_at: string | null;
	duration_seconds: number | null;
	points_awarded: number;
	verified: boolean;
}

export interface PathStep {
	article_title: string;
	timestamp: string;
	is_free_step: boolean;
	is_undone: boolean;
}

export interface GamePath {
	id: string;
	game_result_id: string;
	step_number: number;
	article_title: string;
	timestamp: string;
	is_free_step: boolean;
	is_undone: boolean;
	verified: boolean;
}

export interface LeaderboardEntry {
	user_id: string;
	username: string;
	display_name: string | null;
	avatar_url: string | null;
	hops: number;
	duration_seconds: number;
	points_awarded: number;
	path: PathStep[];
	powerups_used: any[];
	slot_1: string | null;
	slot_2: string | null;
	level?: number;
	// For monthly leaderboards
	games_played?: number;
	average_hops?: number;
	// Position change since yesterday
	position_change?: number; // positive = moved up, negative = moved down, 0 = same, null = new
}
