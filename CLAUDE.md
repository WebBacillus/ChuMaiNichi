# CLAUDE.md — ChuMaiNichi

> Repository: https://github.com/Phudit-2547/ChuMaiNichi
> Owner: Phudit (Big), CEDT Year 3, Chulalongkorn University
> Deadline: April 28, 2026 (course final project)

## What is this project?

ChuMaiNichi (Chunithm + maimai + 毎日/mainichi = "playing daily") is a personal dashboard for CHUNITHM and maimai DX arcade rhythm game players. It tracks daily play counts, ratings over time, and uses an AI agent to suggest songs for efficient rating improvement.

This repo merges two previous repos:
- `Phudit-2547/Chunimai-tracker` (Python Playwright scraper, 63 commits — code lives in `scraper/`)
- `Phudit-2547/Chunimai_dashboard` (old Bun/Elysia dashboard — fully replaced, no code carried over)

## Architecture overview

```
Browser (React SPA on Vercel)
    │
    ├── POST /api/query   → Neon PostgreSQL (read-only SQL)
    ├── POST /api/chat    → OpenAI-compatible API (tool-use, streaming)
    └── POST /api/refresh → GitHub API (trigger workflow_dispatch)

GitHub Actions (cron + manual trigger)
    ├── scrape-daily.yml        → Playwright scraper → Neon → Discord webhook
    └── scrape-user-data.yml    → chuumai-tools Docker → Neon (no git commit)

Neon PostgreSQL (free tier, serverless)
    ├── daily_play       — one row per date, both games combined
    └── user_scores      — JSONB snapshots from chuumai-tools scraper
```

**Key constraint:** All secrets (DATABASE_URL, OPENAI_API_KEY, OPENAI_BASE_URL, GITHUB_PAT) live exclusively in Vercel env vars and GitHub repo secrets. The browser NEVER sees connection strings or API keys. This is why we use Vercel (serverless functions) instead of GitHub Pages (static-only).

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript |
| Hosting | Vercel (free Hobby plan) |
| API routes | Vercel serverless functions (`api/*.ts`) |
| Database | Neon PostgreSQL (`@neondatabase/serverless`) |
| Scraper | Python 3.12 + Playwright (Firefox, headless) |
| Package manager (Python) | `uv` — NOT pip. Use `uv sync` / `uv run`. |
| Package manager (JS) | pnpm |
| AI | OpenAI-compatible API with tool-use (server-side) |
| CI/CD | GitHub Actions |
| Notifications | Discord webhooks |
| User data scraper | leomotors/chuumai-tools Docker images |

## Repository structure

```
ChuMaiNichi/
├── .github/workflows/
│   ├── scrape-daily.yml          # Cron: daily at 22:00 Asia/Bangkok
│   ├── scrape-user-data.yml      # Manual: workflow_dispatch for user.json
│   └── refresh-songs.yml         # Weekly: cache maimai-songs.json from wonderhoy API
├── scraper/                      # Python — migrated from Chunimai-tracker
│   ├── play_counter/
│   │   ├── config.py             # Env var loading, notification config
│   │   ├── scraper.py            # Playwright scraper for SEGA portals
│   │   ├── db.py                 # Async PostgreSQL via asyncpg
│   │   ├── daily_play_notifier.py
│   │   ├── reports/
│   │   │   ├── weekly.py
│   │   │   └── monthly.py
│   │   └── utils/
│   │       ├── constants.py      # URLs, webhook refs, cost per play
│   │       └── date_helpers.py
│   ├── import_user_data.py       # NEW: parse chuumai-tools output → Neon
│   ├── main.py
│   ├── pyproject.toml
│   ├── uv.lock
│   └── init.sql                  # Schema: daily_play + user_scores
├── api/                          # Vercel serverless functions
│   ├── query.ts                  # DB proxy (read-only SQL only)
│   ├── chat.ts                   # AI agent proxy (streaming, tool-use)
│   └── refresh.ts                # Trigger GitHub Actions workflow
├── src/                          # React frontend (single-page app, NO router)
│   ├── components/
│   │   ├── Heatmap.tsx           # Cal-heatmap play count visualization
│   │   ├── RatingChart.tsx       # Rating over time (recharts)
│   │   ├── ChatPanel.tsx         # AI chat — collapsible right sidebar
│   │   └── SettingsModal.tsx     # Theme toggle, display preferences — modal overlay
│   ├── lib/
│   │   └── api.ts                # Fetch wrappers for /api/* routes
│   ├── App.tsx                   # Single page: main view + sidebar + modal
│   └── main.tsx
├── public/
│   └── maimai-songs.json         # Cached from maimai.wonderhoy.me/api/musicData (weekly refresh)
├── config.json                   # USER EDITS THIS: games, currency (see "Config" section)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vercel.json
└── CLAUDE.md
```

## config.json

The one file friends edit after forking. Read by GitHub Actions (which scrapers to run) and the React app (which UI to render).

```json
{
  "games": ["maimai", "chunithm"],
  "currency_per_play": 40
}
```

| Field | Values | Effect |
|---|---|---|
| `games` | `["maimai"]`, `["chunithm"]`, or `["maimai", "chunithm"]` | Controls which scrapers run in Actions, which heatmap columns / rating lines render, and whether `maimai_suggest_songs` is available (maimai only) |
| `currency_per_play` | Number (THB) | Used in spending calculations on the dashboard |

**Do NOT put secrets in this file.** It is committed to git and publicly visible.

## UI layout

Single-page app. No `react-router-dom`. No client-side routing.

```
┌──────────────────────────────────────────────┐
│  Header bar                    [⚙] [💬]      │
├──────────────────────────────┬───────────────┤
│                              │               │
│  Main view                   │  Chat panel   │
│  ├── Heatmap                 │  (sidebar,    │
│  └── Rating chart            │   collapsible)│
│                              │               │
├──────────────────────────────┴───────────────┤
│  Settings modal (overlay, triggered by ⚙)    │
└──────────────────────────────────────────────┘
```

- **Main view**: Heatmap + rating chart, always visible
- **Chat panel**: Right sidebar, toggle via header button. Streams AI responses from `/api/chat`
- **Settings modal**: Overlay triggered by gear icon. Theme toggle and display preferences. Stored in `localStorage`
- **Game selection and currency**: Configured in `config.json` at repo root (deploy-time, not per-session)
- **Refresh button**: In header or settings. Calls `/api/refresh` to trigger `scrape-user-data.yml`
- No separate pages, no route transitions

## Config (`config.json`)

Single config file at repo root. Friends edit this once after forking.

```json
{
  "games": ["maimai", "chunithm"],
  "currency_per_play": 40
}
```

| Field | Values | Effect |
|---|---|---|
| `games` | `["maimai"]`, `["chunithm"]`, or `["maimai", "chunithm"]` | Controls which scrapers run in GitHub Actions, which heatmap columns render, which rating lines show, whether `maimai_suggest_songs` is available (maimai only) |
| `currency_per_play` | Integer (THB) | Used to calculate money spent in reports and Discord notifications |

**Who reads it:**
- GitHub Actions workflows: decides which Docker scrapers to run and which Playwright portals to scrape
- Vercel API routes: `api/chat.ts` reads it to configure available tools (`maimai_suggest_songs` only when `"maimai"` is in `games`)
- React frontend: imports `config.json` at build time via `src/lib/config.ts` to decide which UI components to render (heatmap columns, rating chart lines). Baked into the bundle, so editing requires a redeploy.

**Do NOT put secrets in config.json** — it is committed to git and served publicly.

## Database schema

```sql
-- Table 1: Daily play tracking (one row per date, both games combined)
CREATE TABLE IF NOT EXISTS daily_play (
    play_date            DATE PRIMARY KEY,
    maimai_play_count    INTEGER DEFAULT 0,
    chunithm_play_count  INTEGER DEFAULT 0,
    maimai_cumulative    INTEGER DEFAULT 0,
    chunithm_cumulative  INTEGER DEFAULT 0,
    maimai_rating        NUMERIC,
    chunithm_rating      NUMERIC,
    scrape_failed        BOOLEAN DEFAULT FALSE,
    failure_reason       TEXT
);

-- Table 2: Per-song score snapshots (JSONB from chuumai-tools)
CREATE TABLE IF NOT EXISTS user_scores (
    id         SERIAL PRIMARY KEY,
    game       TEXT NOT NULL,           -- 'maimai' or 'chunithm'
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    data       JSONB NOT NULL           -- Full chuumai-tools output
);
```

**Critical schema rule:** `daily_play` has ONE row per date with columns for BOTH games. Do NOT create separate rows per game. Any upsert logic that loops per-game and inserts twice is a bug.

## Rating system (maimai DX)

### DX Rating composition (CiRCLE version)
- **Top 35 "old" charts**: best scores from all versions BEFORE PRiSM+
- **Top 15 "new" charts**: best scores from PRiSM+ and CiRCLE (current + previous version)
- Total DX Rating = sum of song ratings from these 50 charts
- Rating can only go UP (except when version changes reclassify "new" → "old")

### Song rating formula (validated against real data)

```
song_rating = floor(chart_constant × rank_multiplier × min(achievement, 100.5) / 100)
```

Rank multipliers (RANK_FACTORS):
| Rank | Min Score | Multiplier |
|------|-----------|-----------|
| SSS+ | 1005000 | 22.4 |
| SSS  | 1000000 | 21.6 |
| SS+  | 995000  | 21.1 |
| SS   | 990000  | 20.8 |
| S+   | 980000  | 20.3 |

Achievement is score / 10000 (e.g., 1005000 = 100.5%).

### Chart constants source
- Cached in `public/maimai-songs.json` from `maimai.wonderhoy.me/api/musicData`
- Refreshed weekly by GitHub Actions (constants change on version updates)
- Do NOT call the API at runtime — read the cached file instead (avoids 60s timeout risk)
- `maimai.wonderhoy.me/api/calcRating` is usable as a data source BUT has a known discrepancy: if a player hasn't unlocked a song (e.g., "7 wonders"), it won't appear in their play_data scrape but CAN appear in the API's top-50 calculation, causing the API to overestimate rating for that player

## Vercel API routes specification

### POST /api/query
- Body: `{ sql: string, params?: any[] }`
- Read-only guard: reject any SQL that is not a SELECT statement
- Uses `DATABASE_URL` env var → `@neondatabase/serverless`
- Returns: `{ rows: any[], rowCount: number }`

### POST /api/chat
- Body: `{ messages: { role: string, content: string }[], model?: string }`
- Uses `OPENAI_API_KEY` and `OPENAI_BASE_URL` env vars
- Streams response via ReadableStream
- Tool definitions:
  - `query_database`: generates and executes read-only SQL against Neon
  - `maimai_suggest_songs`: maimai only — finds songs where score improvement most efficiently increases DX rating (see "Song suggestion algorithm" section below). Name is game-prefixed so a future `chunithm_suggest_songs` can coexist without ambiguity.
- System prompt includes full schema DDL, rating formula, and tool examples
- **60-second timeout on Vercel Hobby** — use streaming to keep connection alive

### POST /api/refresh
- Uses `GITHUB_PAT` env var
- Triggers `workflow_dispatch` on `scrape-user-data.yml`
- Returns: `{ run_url: string }`

## GitHub Actions workflows

### scrape-daily.yml
- Cron: `0 15 * * *` (22:00 Asia/Bangkok)
- Also: `workflow_dispatch` for manual trigger
- Reads `config.json` to determine which games to scrape
- Steps: `uv sync` → `uv run python main.py` → (scraper writes to Neon + sends Discord notification)
- On first run: executes `init.sql` to create tables if they don't exist (idempotent)
- Uses `astral-sh/setup-uv@v5` (NOT `actions/setup-python`)
- Secrets needed: `DATABASE_URL`, `SEGA_USERNAME`, `SEGA_PASSWORD`, `DISCORD_WEBHOOK_URL`

### scrape-user-data.yml
- Trigger: `workflow_dispatch` only (from Refresh button or manual)
- Reads `config.json` to determine which chuumai-tools scrapers to run
- Steps:
  1. Run `ghcr.io/leomotors/chunithm-scraper:v6` and/or `ghcr.io/leomotors/maimai-scraper:v1`
  2. Capture JSON output from `outputs/` directory
  3. Run `import_user_data.py` to write JSONB into `user_scores` table
- Data goes directly to Neon — NEVER committed to git (privacy)
- Secrets needed: `DATABASE_URL`, `SEGA_USERNAME`, `SEGA_PASSWORD`

### refresh-songs.yml
- Cron: weekly (or `workflow_dispatch`)
- Only runs if `"maimai"` is in `config.json` games array
- Fetches `maimai.wonderhoy.me/api/musicData` → writes to `public/maimai-songs.json` → commits
- Chart constants change on version updates (~weekly), so this keeps the cache fresh
- No secrets needed (public API)

## Song suggestion algorithm (maimai only)

> CHUNITHM song suggestion is a future feature, not in scope for the deadline.

The `maimai_suggest_songs` tool runs server-side in `api/chat.ts`. It is maimai-specific (a future `chunithm_suggest_songs` will be a separate file — see `src/lib/maimai-suggest.ts`).

### Data inputs
- **player_data**: From `user_scores` table (JSONB). Contains `profile`, `best` (top 35 old), `current` (top 15 new), and `allRecords` (full play history from play_data page)
- **maimai-songs.json**: Cached song catalog with chart constants per difficulty

### Two modes

**best_effort** (default): Returns the top N improvements and new songs sorted by rating gain.

**target** (when user specifies a target rating): Greedy algorithm that finds the minimum-effort path to reach the target. It:
1. Builds the player's current top-50 ratings (sorted ascending)
2. Collects all candidates: improvements (existing songs with score < SSS+) and new songs (from CiRCLE/PRiSM+ not yet in top 50)
3. Sorts all candidates by `potential_gain` descending (max_rating minus current contribution)
4. Greedily picks songs until `remaining_rating ≤ 0`:
   - **Improve**: replaces the song's own rating in the top-50 (no song pushed out)
   - **New**: enters top-50, pushes out the lowest-rated song
5. For each pick, calculates the minimum score/rank needed to achieve the required gain

### Version classification for old/new
- **New songs**: `releasedVersion` is `CiRCLE` or `PRiSM+` (current + previous version)
- **Old songs**: everything else
- This determines whether a song competes for the 15-slot "new" bucket or the 35-slot "old" bucket

### Key functions (from rating.py, to be ported to TypeScript)
- `calculate_song_rating(constant, score)`: applies the rating formula
- `calc_rating(player_data, version)`: computes total DX rating from top 50
- `get_rank_info(score)`: returns rank name and achievement percentage
- `get_next_rank(score)`: returns the next rank threshold above current score
- `RANK_FACTORS`: list of `(min_score, multiplier, rank_name)` tuples

## Environment variables

### Vercel env vars (server-side, never exposed to browser)
| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `OPENAI_API_KEY` | OpenAI-compatible API key (used if `GEMINI_API_KEY` is not set) |
| `OPENAI_BASE_URL` | OpenAI-compatible base URL (optional, defaults to OpenAI) |
| `GEMINI_API_KEY` | Google Gemini API key (takes priority over `OPENAI_API_KEY`) |
| `AI_MODEL` | Override default model name (default: `gemini-2.5-flash` for Gemini, `gpt-4o-mini` for OpenAI) |
| `GITHUB_PAT` | Fine-grained PAT for triggering workflow_dispatch |
| `GITHUB_REPO` | `Phudit-2547/ChuMaiNichi` |
| `DASHBOARD_PASSWORD` | **Required.** All `/api/*` routes require `Authorization: Bearer <password>`. Frontend prompts for password on first visit and stores it in `localStorage`. Without this, anyone can use your AI proxy and query your database. |

**AI provider detection:** `api/chat.ts` checks `GEMINI_API_KEY` first, then `OPENAI_API_KEY`. Gemini is accessed via its OpenAI-compatible endpoint using the same `openai` SDK — no additional dependencies. Set exactly one of the two API keys.

### GitHub repo secrets (for Actions)
| Secret | Description |
|---|---|
| `DATABASE_URL` | Same Neon connection string |
| `SEGA_USERNAME` | SEGA ID for game portal login |
| `SEGA_PASSWORD` | SEGA password |
| `DISCORD_WEBHOOK_URL` | Discord webhook for notifications |

## User deployment flow (fork → 3 accounts → done)

1. Fork `Phudit-2547/ChuMaiNichi` on GitHub
2. Edit `config.json`: set `games` to `["maimai"]`, `["chunithm"]`, or `["maimai", "chunithm"]`
3. Create Neon account (free, no credit card) → create project → copy `DATABASE_URL`
4. Add GitHub repo secrets: `DATABASE_URL`, `SEGA_USERNAME`, `SEGA_PASSWORD`, `DISCORD_WEBHOOK_URL`
5. Trigger first scrape manually (workflow runs `init.sql` automatically on first run)
6. Import forked repo in Vercel (free Hobby plan) → add env vars: `DATABASE_URL`, `DASHBOARD_PASSWORD`, `GITHUB_PAT`, `GITHUB_REPO`, and either `OPENAI_API_KEY` (+ optional `OPENAI_BASE_URL`) or `GEMINI_API_KEY`
7. Visit `<username>.vercel.app`
8. Total cost: 0 THB

## Constraints and gotchas

- **Neon free tier**: 100 CU-hours/project/month, 0.5 GB storage. Keep `user_scores` to latest 5 snapshots per game. Scale-to-zero means idle time costs nothing.
- **Vercel Hobby tier**: 60-second function timeout. Stream AI responses. 100 GB bandwidth/month. Non-commercial use only.
- **uv, not pip**: Always use `uv sync` to install, `uv run` to execute. In GitHub Actions, use `astral-sh/setup-uv@v5`.
- **One row per date**: The `daily_play` table combines both games in a single row. Never insert two rows for the same date.
- **No secrets in browser**: All API keys and connection strings must stay in Vercel env vars or GitHub secrets. The React app calls `/api/*` routes only.
- **chuumai-tools Docker images**: chunithm uses `ghcr.io/leomotors/chunithm-scraper:v6`, maimai uses `ghcr.io/leomotors/maimai-scraper:v1`. Version env vars: `VERSION=XVRS` (chunithm), `VERSION=CiRCLE` (maimai).
- **Timezone**: All scraping and date logic uses `Asia/Bangkok` (UTC+7).
- **Currency**: Default cost per play is 40 THB, configurable in settings.

## Academic context

This project is submitted for two courses (deadline: April 28, 2026):

1. **AI and Digital Technology** (CEDT course) — 12-min presentation + demo. The AI agent with tool-calling is the star feature (satisfies "Generative AI" requirement). Playwright scraping is framed as automation, NOT RPA.

2. **GenAI and HCI research** (NIDA) — ACM-format paper on "Designing a More Socially Equitable Rhythm-Game Dashboard." Needs a user study (6-10 participants, comparing task completion time and decision confidence with/without the dashboard).

## Code style and preferences

- Respond concisely. No filler, no enthusiasm.
- Verify claims before stating them — accuracy over speed.
- Use metric units and THB for currency.
- TypeScript for all frontend and API code.
- Python for scraper only.
- Prefer simplest solution that works. Do not over-engineer.
- When in doubt about platform pricing or limits, search and verify — do not guess.
