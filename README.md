# Stark Health

**Your health data, unified.** Stark Health aggregates data from WHOOP, Withings, and more into a single, elegant dashboard — powered by AI.

## Features

- **Unified Dashboard** — Recovery, HRV, sleep, strain, weight, and body composition in one view
- **Stark Health Score** — Proprietary composite score from all your connected devices
- **AI Health Assistant** — Chat with Claude about your health data, trends, and get personalized recommendations
- **Device Integrations** — Connect WHOOP and Withings via OAuth (more coming)
- **Privacy-First** — Bring your own API key, self-host your database, own your data

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, TypeScript)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Auth & Database**: [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security)
- **AI**: [Anthropic Claude](https://anthropic.com/) via [Vercel AI SDK](https://sdk.vercel.ai/)
- **Charts**: [Recharts](https://recharts.org/)
- **Deployment**: [Vercel](https://vercel.com/)

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com/) account (free tier works)
- An [Anthropic](https://console.anthropic.com/) API key (each user provides their own)

### 1. Clone the repo

```bash
git clone https://github.com/ilan-ibh/starkhealth.git
cd starkhealth
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Go to **SQL Editor** and run [`supabase/schema.sql`](supabase/schema.sql), then [`supabase/migration-002-providers.sql`](supabase/migration-002-providers.sql)
3. Go to **Project Settings → API** and copy your project URL and anon key
4. Go to **Authentication → URL Configuration** and set:
   - **Site URL**: `https://your-domain.com` (e.g. `http://localhost:3000` for local dev)
   - **Redirect URLs**: add `https://your-domain.com/**` (the `**` wildcard is required)

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — sign up, add your Anthropic API key in Settings, and you're good to go.

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ilan-ibh/starkhealth&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY)

1. Click the button above or run `vercel` from the project root
2. Add the two environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
3. Deploy

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Your Supabase anonymous/public key |
| `NEXT_PUBLIC_SITE_URL` | Yes | Your deployment URL (e.g. `https://starkhealth.io`) |
| `WHOOP_CLIENT_ID` | For WHOOP | Register at [developer.whoop.com](https://developer.whoop.com) |
| `WHOOP_CLIENT_SECRET` | For WHOOP | WHOOP OAuth client secret |
| `WITHINGS_CLIENT_ID` | For Withings | Register at [developer.withings.com](https://developer.withings.com) |
| `WITHINGS_CLIENT_SECRET` | For Withings | Withings OAuth client secret |

> **Note**: Each user provides their own Anthropic API key and Hevy API key through the Settings page. No server-side keys are needed for those.

## Database Schema

The app uses a single `profiles` table in Supabase with Row Level Security:

| Column | Type | Description |
|---|---|---|
| `id` | uuid (PK) | References `auth.users` |
| `anthropic_api_key` | text | User's Anthropic API key |
| `units` | text | `'metric'` or `'imperial'` |
| `created_at` | timestamptz | Auto-set on creation |
| `updated_at` | timestamptz | Auto-updated on change |

A database trigger automatically creates a profile row when a new user signs up.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts          # AI chat endpoint (streams Claude responses)
│   │   └── settings/route.ts      # User profile/settings CRUD
│   ├── auth/withings/callback/     # Withings OAuth callback
│   ├── dashboard/page.tsx          # Main health dashboard
│   ├── login/page.tsx              # Sign in / sign up
│   ├── privacy/page.tsx            # Privacy policy
│   ├── settings/page.tsx           # API key, connections, account
│   ├── layout.tsx                  # Root layout
│   └── page.tsx                    # Landing page
├── components/
│   ├── Charts.tsx                  # Recharts trend & sleep charts
│   ├── ChatPanel.tsx               # AI chat slide-in panel
│   ├── HealthScore.tsx             # Animated score ring
│   └── MetricCard.tsx              # Metric card with sparkline
├── lib/
│   ├── sample-data.ts              # Sample WHOOP + Withings data
│   └── supabase/
│       ├── client.ts               # Browser Supabase client
│       ├── middleware.ts            # Auth middleware helper
│       └── server.ts               # Server Supabase client
├── middleware.ts                    # Next.js route protection
supabase/
└── schema.sql                      # Database migration
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## License

MIT — see [LICENSE](LICENSE) for details.

## Contact

Email: [contact@starkhealth.io](mailto:contact@starkhealth.io)
Website: [starkhealth.io](https://starkhealth.io)
