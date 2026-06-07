# AI Founder OS

> One platform to manage AI agents, review code, operate your business, audit projects, and get CTO-level guidance — all powered by Claude AI.

## 🚀 Quick Start (5 minutes)

```bash
git clone https://github.com/your-org/ai-founder-os.git
cd ai-founder-os
cp .env.example .env
# Fill in your keys in .env

docker compose up -d             # Start PostgreSQL + Redis
pnpm install                     # Install dependencies
npx prisma migrate dev           # Run migrations
npx prisma db seed               # Insert demo data
pnpm dev                         # Start all services
```

Visit **http://localhost:3000** — use Clerk test credentials to sign in.

## 🏗️ Architecture

| Layer | Technology | Hosting |
|-------|-----------|---------|
| **Frontend** | Next.js 14 (App Router) + Tailwind + shadcn/ui | Vercel |
| **Backend** | NestJS microservices | Railway |
| **Database** | PostgreSQL 16 + Prisma ORM | Railway |
| **Cache** | Redis | Railway |
| **Auth** | Clerk (RBAC: Owner, Admin, Developer, Viewer) | Clerk Cloud |
| **Payments** | Stripe (5-plan subscription model) | Stripe |
| **AI** | Anthropic Claude + OpenAI GPT | API |
| **Analytics** | PostHog | PostHog Cloud |
| **CI/CD** | GitHub Actions → Vercel + Railway | |

## 📦 Modules

| # | Module | Route | Description |
|---|--------|-------|-------------|
| 1 | **Agent Control Center** | `/dashboard/agents` | Deploy & monitor AI agents (GPT-4o, Claude, Gemini) |
| 2 | **Code Review Auditor** | `/dashboard/code-review` | AI-powered PR reviews with vulnerability detection |
| 3 | **Business Operator** | `/dashboard/business-ops` | Customer support automation & ticket management |
| 4 | **Project Auditor** | `/dashboard/project-auditor` | Full-stack health reports (security, perf, deps) |
| 5 | **AI CTO Platform** | `/dashboard/ai-cto` | Strategic guidance, PRD generation, roadmaps |

## 🔗 Services

| Service | URL |
|---------|-----|
| Frontend | `https://ai-founder-os.vercel.app` |
| API | `https://api.ai-founder-os.railway.app` |
| API Docs (Swagger) | `https://api.ai-founder-os.railway.app/api/docs` |
| Health (Web) | `https://ai-founder-os.vercel.app/api/health` |
| Health (API) | `https://api.ai-founder-os.railway.app/health` |

## 🔑 Environment Variables

See `.env.example` for all required variables. Key variables:

### Authentication (Clerk)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET`

### AI Providers
- `ANTHROPIC_API_KEY` — Claude models
- `OPENAI_API_KEY` — GPT models

### Payments (Stripe)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Infrastructure
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `NEXT_PUBLIC_APP_URL` — Frontend URL

### Analytics
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`

## 🗄️ Database

```bash
npx prisma studio              # Visual DB browser
npx prisma migrate dev --name your_change   # New migration
npx prisma db seed             # Insert demo data
npx prisma migrate deploy      # Run production migrations
```

## 🚢 Deployment

```bash
# 1. Set up Railway (backend + DB)
bash scripts/railway-setup.sh

# 2. Configure environment variables
bash scripts/railway.env.sh

# 3. Run production migrations
bash scripts/migrate-prod.sh

# 4. Deploy frontend
bash scripts/vercel-setup.sh
vercel --prod
```

### GitHub Secrets Required

| Secret | Source |
|--------|--------|
| `VERCEL_TOKEN` | [Vercel Account Tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | `.vercel/project.json` after `vercel link` |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` after `vercel link` |
| `RAILWAY_TOKEN` | [Railway Account Tokens](https://railway.app/account/tokens) |
| `DATABASE_URL` | From Railway PostgreSQL plugin |
| `CLERK_SECRET_KEY` | Clerk Dashboard |
| `ANTHROPIC_API_KEY` | Anthropic Console |
| `STRIPE_SECRET_KEY` | Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhooks |

### Webhooks

After deployment, configure these webhooks:

**Stripe** → `https://api.ai-founder-os.railway.app/api/webhooks/stripe`
- Events: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`

**GitHub** → `https://api.ai-founder-os.railway.app/api/webhooks/github`
- Events: `Pull requests`, `Push`

**Clerk** → `https://api.ai-founder-os.railway.app/api/webhooks/clerk`
- Events: `user.created`, `user.updated`, `organization.created`, `organizationMembership.created`

## 🧪 Testing

```bash
pnpm lint          # ESLint + Prettier
pnpm type-check    # TypeScript type checking
pnpm test          # Jest unit + integration tests
pnpm build         # Production build
```

## 📝 License

MIT
