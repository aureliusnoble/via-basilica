# Via Basilica - Deployment Guide

This guide covers the complete setup and deployment of Via Basilica, from initial repository creation to production deployment on GitHub Pages with Supabase as the backend.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [GitHub Repository Setup](#github-repository-setup)
3. [Supabase Project Setup](#supabase-project-setup)
4. [Database Migrations](#database-migrations)
5. [Edge Functions Deployment](#edge-functions-deployment)
6. [OAuth Provider Configuration](#oauth-provider-configuration)
7. [Scheduled Jobs (pg_cron)](#scheduled-jobs-pg_cron)
8. [GitHub Pages Deployment](#github-pages-deployment)
9. [Environment Variables](#environment-variables)
10. [Post-Deployment Verification](#post-deployment-verification)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js 22+** - [Download](https://nodejs.org/)
- **pnpm** - Install with `npm install -g pnpm`
- **Supabase CLI** - Install with `pnpm add -g supabase` or `brew install supabase/tap/supabase`
- **Git** - [Download](https://git-scm.com/)
- **GitHub Account** - [Sign up](https://github.com/)
- **Supabase Account** - [Sign up](https://supabase.com/)

Verify installations:

```bash
node --version    # Should be 22.x or higher
pnpm --version    # Should be 9.x or higher
supabase --version
git --version
```

---

## GitHub Repository Setup

### Step 1: Create a New Repository

1. Go to [GitHub](https://github.com/) and click **New repository**
2. Name it `via-basilica` (or your preferred name)
3. Set visibility to **Public** (required for free GitHub Pages)
4. **Do NOT** initialize with README, .gitignore, or license
5. Click **Create repository**

### Step 2: Push Local Code to GitHub

```bash
# Navigate to your project directory
cd /path/to/Basil_the_Great

# Initialize git if not already done
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Via Basilica"

# Add remote origin (replace with your repository URL)
git remote add origin https://github.com/YOUR_USERNAME/via-basilica.git

# Push to main branch
git branch -M main
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under **Build and deployment**, select **GitHub Actions** as the source
4. The workflow file (`.github/workflows/deploy.yml`) is already included in the project

---

## Supabase Project Setup

### Step 1: Create a New Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Fill in the details:
   - **Name**: `via-basilica`
   - **Database Password**: Generate a strong password and **save it securely**
   - **Region**: Choose the closest region to your users
   - **Pricing Plan**: Free tier is sufficient for starting
4. Click **Create new project**
5. Wait for the project to be provisioned (2-3 minutes)

### Step 2: Get Your Project Credentials

Once the project is ready:

1. Go to **Project Settings** → **API**
2. Note down these values (you'll need them later):
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6...` (keep this secret!)

### Step 3: Link Your Local Project to Supabase

```bash
# Login to Supabase CLI
supabase login

# Link to your remote project
supabase link --project-ref YOUR_PROJECT_REF

# The project ref is the subdomain of your project URL
# e.g., if URL is https://abcdefghijkl.supabase.co, the ref is "abcdefghijkl"
```

---

## Database Migrations

The project includes 7 migration files that create all necessary database tables, functions, and seed data.

### Step 1: Review Migrations

The migrations are located in `supabase/migrations/`:

| File | Description |
|------|-------------|
| `00001_create_profiles.sql` | User profiles table with RLS policies |
| `00002_create_daily_challenges.sql` | Daily challenge configurations |
| `00003_create_game_results.sql` | Game results and scoring |
| `00004_create_game_paths.sql` | Path tracking for verification |
| `00005_create_powerup_tables.sql` | Powerup definitions and inventory |
| `00006_seed_powerups.sql` | Initial powerup data |
| `00007_create_functions.sql` | Database functions and triggers |

### Step 2: Push Migrations to Remote Database

```bash
# Push all migrations to your Supabase project
supabase db push

# You'll see output like:
# Applying migration 00001_create_profiles.sql...
# Applying migration 00002_create_daily_challenges.sql...
# ... etc
```

### Step 3: Verify Migration Success

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Table Editor**
4. Verify these tables exist:
   - `profiles`
   - `daily_challenges`
   - `game_results`
   - `game_paths`
   - `powerup_definitions`
   - `player_powerups`
   - `daily_powerup_selections`

---

## Edge Functions Deployment

The project includes 4 Edge Functions for server-side logic.

### Step 1: Review Edge Functions

Located in `supabase/functions/`:

| Function | Purpose |
|----------|---------|
| `generate-daily-challenge` | Creates new daily challenges from Wikipedia |
| `verify-game-result` | Validates game paths for anti-cheat |
| `calculate-daily-points` | Assigns percentile-based points |
| `purchase-powerup` | Handles powerup purchases |

### Step 2: Set Function Secrets

Some functions need access to secrets:

```bash
# Set any required secrets (if you have external API keys)
supabase secrets set MY_SECRET_KEY=your_secret_value

# List current secrets
supabase secrets list
```

### Step 3: Deploy All Edge Functions

```bash
# Deploy all functions at once
supabase functions deploy

# Or deploy individually
supabase functions deploy generate-daily-challenge
supabase functions deploy verify-game-result
supabase functions deploy calculate-daily-points
supabase functions deploy purchase-powerup
```

### Step 4: Configure Function Settings

For functions that should be publicly accessible (like webhooks), update `supabase/config.toml`:

```toml
[functions.generate-daily-challenge]
verify_jwt = false  # If called by pg_cron

[functions.calculate-daily-points]
verify_jwt = false  # If called by pg_cron
```

Then redeploy:

```bash
supabase functions deploy
```

### Step 5: Verify Deployment

```bash
# List deployed functions
supabase functions list

# Test a function (replace with your project ref)
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-daily-challenge \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

---

## OAuth Provider Configuration

Via Basilica supports Google, GitHub, and Discord authentication.

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Select **Web application**
6. Add Authorized JavaScript origins:
   - `http://localhost:5173` (development)
   - `https://your-username.github.io` (production)
7. Add Authorized redirect URIs:
   - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
8. Copy **Client ID** and **Client Secret**

### GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in:
   - **Application name**: `Via Basilica`
   - **Homepage URL**: `https://your-username.github.io/via-basilica`
   - **Authorization callback URL**: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
4. Click **Register application**
5. Copy **Client ID** and generate a **Client Secret**

### Discord OAuth Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application** and name it `Via Basilica`
3. Go to **OAuth2** → **General**
4. Add redirect:
   - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
5. Copy **Client ID** and **Client Secret**

### Configure Providers in Supabase

1. Go to Supabase Dashboard → **Authentication** → **Providers**
2. For each provider (Google, GitHub, Discord):
   - Toggle **Enable**
   - Paste **Client ID**
   - Paste **Client Secret**
   - Click **Save**

### Update Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: `https://your-username.github.io/via-basilica`
3. Add **Redirect URLs**:
   - `http://localhost:5173/auth/callback`
   - `https://your-username.github.io/via-basilica/auth/callback`

---

## Scheduled Jobs (pg_cron)

Via Basilica uses pg_cron to run scheduled tasks for generating daily challenges and calculating points.

### Step 1: Enable pg_cron Extension

1. Go to Supabase Dashboard → **Database** → **Extensions**
2. Search for `pg_cron`
3. Toggle to enable it
4. Also enable `pg_net` (required for HTTP requests from cron jobs)

### Step 2: Create Scheduled Jobs

Go to **SQL Editor** and run:

```sql
-- Schedule daily challenge generation at 00:00 UTC
SELECT cron.schedule(
  'generate-daily-challenge',
  '0 0 * * *',  -- Every day at midnight UTC
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-daily-challenge',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Schedule points calculation at 23:55 UTC
SELECT cron.schedule(
  'calculate-daily-points',
  '55 23 * * *',  -- Every day at 23:55 UTC
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/calculate-daily-points',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

**Important**: Replace:
- `YOUR_PROJECT_REF` with your actual project reference
- `YOUR_SERVICE_ROLE_KEY` with your service role key

### Step 3: Verify Scheduled Jobs

```sql
-- List all scheduled jobs
SELECT * FROM cron.job;

-- Check job run history
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

### Step 4: Manually Generate First Challenge

Run this once to create your first daily challenge:

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-daily-challenge \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

### Step 5: Bulk Generate Puzzles (Recommended)

To avoid relying solely on pg_cron, you can pre-generate puzzles for an entire year:

1. Add your service role key to `.env`:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. Run the bulk generation script:
   ```bash
   # Generate next 365 days of puzzles
   npm run generate-puzzles

   # Or with custom options:
   npm run generate-puzzles -- --days=365 --start=2025-01-30

   # Preview what would be generated (dry run)
   npm run generate-puzzles -- --dry-run
   ```

**Script options:**
- `--days=N` - Number of days to generate (default: 365)
- `--start=DATE` - Start date in YYYY-MM-DD format (default: today)
- `--delay=MS` - Delay between requests in ms (default: 2000)
- `--dry-run` - Preview without making requests

The script will skip dates that already have puzzles, so it's safe to re-run.

### Step 6: Automate Annual Generation (GitHub Actions)

A GitHub Actions workflow is included to automatically regenerate puzzles each year.

1. Add the service role key as a GitHub secret:
   - Go to **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: Your service role key from Supabase Dashboard

2. The workflow runs automatically on January 1st each year.

3. You can also trigger it manually:
   - Go to **Actions** → **Generate Daily Puzzles**
   - Click **Run workflow**
   - Optionally specify days and start date

---

## GitHub Pages Deployment

### Step 1: Set Repository Variables

1. Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **Variables** tab (not Secrets - these are public values)
3. Add these repository variables:

| Variable Name | Value |
|---------------|-------|
| `PUBLIC_SUPABASE_URL` | `https://YOUR_PROJECT_REF.supabase.co` |
| `PUBLIC_SUPABASE_ANON_KEY` | Your anon/public key |

**Note**: The anon key is safe to expose publicly - it's designed for client-side use with RLS protection.

### Step 2: Trigger Deployment

Push any change to trigger the workflow:

```bash
git add .
git commit -m "Trigger deployment"
git push origin main
```

Or manually trigger:
1. Go to **Actions** tab
2. Select **Deploy to GitHub Pages**
3. Click **Run workflow**

### Step 3: Monitor Deployment

1. Go to **Actions** tab
2. Click the running workflow
3. Watch for successful completion of both `build` and `deploy` jobs

### Step 4: Access Your Site

Once deployed, your site will be available at:
- `https://YOUR_USERNAME.github.io/via-basilica/`

Or if using a custom domain:
- `https://your-custom-domain.com/`

---

## Environment Variables

### Local Development (.env)

Create a `.env` file in the project root:

```env
PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# For local OAuth testing (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
```

**Important**: Add `.env` to your `.gitignore` to prevent committing secrets.

### Production (GitHub Actions)

These are set as repository variables (not secrets) since they're client-safe:

| Variable | Description |
|----------|-------------|
| `PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `BASE_PATH` | Set to `/via-basilica` if not using custom domain |

---

## Post-Deployment Verification

### Checklist

- [ ] Site loads at GitHub Pages URL
- [ ] Dark/light mode toggle works
- [ ] Sign up flow works (email)
- [ ] OAuth providers work (Google, GitHub, Discord)
- [ ] Daily challenge loads and displays
- [ ] Game play works (clicking links, hop counting)
- [ ] Victory detection works
- [ ] Leaderboard displays correctly
- [ ] Profile page shows user stats

### Test the Full Flow

1. **Visit the site** and verify the home page loads
2. **Create an account** using email or OAuth
3. **Start a daily challenge** and navigate to Basil the Great
4. **Check the leaderboard** to see your result
5. **Check the profile** page to verify stats updated

### Verify Backend Functions

```bash
# Check if challenges exist
curl https://YOUR_PROJECT_REF.supabase.co/rest/v1/daily_challenges \
  -H "apikey: YOUR_ANON_KEY"

# Should return today's challenge
```

---

## Troubleshooting

### Build Failures

**Error**: `Module not found`
- Run `pnpm install` locally and commit the updated `pnpm-lock.yaml`

**Error**: `Type errors`
- Run `pnpm check` locally to identify issues
- Fix any TypeScript errors before pushing

### Authentication Issues

**OAuth redirect fails**
- Verify redirect URLs match exactly in both Supabase and provider settings
- Check that the callback URL includes `/auth/v1/callback`

**Email confirmation not received**
- Check Supabase **Authentication** → **Email Templates**
- Verify SMTP settings if using custom email provider

### Database Issues

**Migration fails**
- Check the SQL syntax in migration files
- Ensure tables don't already exist (use `IF NOT EXISTS`)
- Review error message in terminal output

**RLS blocking queries**
- Verify RLS policies in Supabase Dashboard → **Authentication** → **Policies**
- Test queries in SQL Editor with different roles

### Edge Function Issues

**Function returns 500**
- Check function logs: `supabase functions logs FUNCTION_NAME`
- Verify all environment variables are set
- Test locally with `supabase functions serve`

**CORS errors**
- Ensure `corsHeaders` are properly set in function responses
- Verify the function handles `OPTIONS` requests

### Cron Job Issues

**Jobs not running**
- Verify pg_cron and pg_net extensions are enabled
- Check `cron.job_run_details` for error messages
- Ensure service role key is correct in job definition

---

## Useful Commands Reference

```bash
# Local Development
pnpm dev                          # Start dev server
pnpm build                        # Build for production
pnpm check                        # Type checking

# Supabase CLI
supabase start                    # Start local Supabase
supabase stop                     # Stop local Supabase
supabase db reset                 # Reset local database
supabase db push                  # Push migrations to remote
supabase functions serve          # Serve functions locally
supabase functions deploy         # Deploy all functions
supabase functions logs NAME      # View function logs

# Git
git status                        # Check changes
git add .                         # Stage all changes
git commit -m "message"           # Commit changes
git push origin main              # Push to GitHub (triggers deploy)
```

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [SvelteKit Documentation](https://kit.svelte.dev/docs)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/start)
- [pg_cron Documentation](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)

---

## Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section above
2. Review [Supabase GitHub Discussions](https://github.com/orgs/supabase/discussions)
3. Open an issue in the project repository

---

*Last updated: January 2025*
