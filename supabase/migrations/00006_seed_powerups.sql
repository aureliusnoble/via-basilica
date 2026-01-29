-- Seed powerup definitions
INSERT INTO powerup_definitions (id, name, description, icon, point_cost, category) VALUES
    ('category-peek', 'Category Peek', 'See the current page''s Wikipedia categories', '📂', 10, 'information'),
    ('ctrl-f', 'Ctrl+F', 'Search/filter visible links on the current page', '🔎', 10, 'information'),
    ('preview', 'Preview', 'See the first paragraph of any link before clicking', '👁️', 15, 'navigation'),
    ('free-step', 'Free Step', 'Your next click doesn''t count as a hop', '🦶', 20, 'navigation'),
    ('undo', 'Undo', 'Go back one page without it counting', '↩️', 20, 'navigation'),
    ('backlinks', 'Backlinks', 'See 5 articles that link TO the current page', '🔗', 20, 'strategic'),
    ('scout', 'Scout', 'Preview any link''s outgoing links before committing', '🔭', 25, 'strategic')
ON CONFLICT (id) DO NOTHING;
