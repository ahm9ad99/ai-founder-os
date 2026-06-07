import { PrismaClient, UserRole, PlanType, SubscriptionStatus, AgentStatus, AgentModel, TicketStatus, TicketPriority, Severity, ReviewStatus, ChatRole, AuditStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ─── Plans ───────────────────────────────────────────────
  const plans = [
    { type: PlanType.FREE, name: "Free", description: "Get started with basic features", price: 0, maxAgents: 1, maxTokensPerDay: 10000, maxTeamSeats: 0, maxProjects: 1, features: JSON.stringify(["1 agent", "10K tokens/day", "Basic code review", "Community support"]) },
    { type: PlanType.STARTER, name: "Starter", description: "For small teams getting started", price: 2900, maxAgents: 5, maxTokensPerDay: 50000, maxTeamSeats: 3, maxProjects: 5, features: JSON.stringify(["5 agents", "50K tokens/day", "3 team seats", "Code review", "Email support"]) },
    { type: PlanType.PRO, name: "Pro", description: "For growing businesses", price: 9900, maxAgents: 15, maxTokensPerDay: 200000, maxTeamSeats: 10, maxProjects: 20, features: JSON.stringify(["15 agents", "200K tokens/day", "10 team seats", "Advanced code review", "AI CTO platform", "Priority support"]) },
    { type: PlanType.BUSINESS, name: "Business", description: "For scaling organizations", price: 29900, maxAgents: 50, maxTokensPerDay: 500000, maxTeamSeats: 25, maxProjects: 100, features: JSON.stringify(["50 agents", "500K tokens/day", "25 team seats", "All features", "Custom integrations", "Dedicated support"]) },
    { type: PlanType.ENTERPRISE, name: "Enterprise", description: "Custom solutions for large organizations", price: 0, maxAgents: 9999, maxTokensPerDay: 999999999, maxTeamSeats: 9999, maxProjects: 9999, features: JSON.stringify(["Unlimited agents", "Unlimited tokens", "Unlimited seats", "All features", "Custom SLA", "White-label option"]) },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({ where: { type: plan.type }, update: plan, create: plan });
  }
  console.log("Plans created");

  // ─── Demo User & Org ─────────────────────────────────────
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@aifounderos.com" },
    update: {},
    create: { email: "demo@aifounderos.com", firstName: "Demo", lastName: "User", clerkId: "demo_clerk_id" },
  });

  const demoOrg = await prisma.organization.upsert({
    where: { slug: "demo-org" },
    update: {},
    create: {
      name: "Demo Organization", slug: "demo-org",
      members: { create: { userId: demoUser.id, role: UserRole.OWNER } },
      subscription: { create: { planType: PlanType.PRO, status: SubscriptionStatus.ACTIVE, tokensUsedToday: 4200, tokenResetDate: new Date() } },
    },
  });
  console.log("Demo org created");

  // ─── AI Agents (3) ───────────────────────────────────────
  const agents = [
    { name: "Customer Support Bot", model: AgentModel.GPT4_TURBO, status: AgentStatus.ACTIVE, tokensUsed: 15000, totalCost: 0.75, systemPrompt: "You are a helpful customer support agent. Respond to inquiries professionally and escalate when needed." },
    { name: "Code Reviewer", model: AgentModel.CLAUDE_3_SONNET, status: AgentStatus.ACTIVE, tokensUsed: 8900, totalCost: 0.45, systemPrompt: "You are a senior code reviewer. Analyze pull requests for bugs, security issues, and best practices." },
    { name: "Data Analyst", model: AgentModel.GEMINI_PRO, status: AgentStatus.IDLE, tokensUsed: 3200, totalCost: 0.16, systemPrompt: "You analyze data and generate insights from provided datasets." },
  ];

  for (const agent of agents) {
    await prisma.agent.create({ data: { ...agent, organizationId: demoOrg.id, createdBy: demoUser.id } });
  }
  console.log("Demo agents created");

  // ─── Code Reviews (2) ────────────────────────────────────
  const review1 = await prisma.codeReview.create({
    data: {
      prTitle: "feat: add stripe webhooks", prUrl: "https://github.com/demo/repo/pull/42", branch: "feat/stripe-webhooks", repo: "demo/repo",
      organizationId: demoOrg.id, reviewerId: demoUser.id,
      status: ReviewStatus.COMPLETED, qualityScore: 87,
      summary: "Well-structured PR. Minor improvements suggested for error handling.",
      issues: {
        create: [
          { file: "src/webhooks/stripe.ts", line: 23, severity: Severity.MEDIUM, category: "error-handling", title: "Missing try/catch", description: "Webhook handler doesn't catch errors", suggestion: "Wrap in try/catch and return 500" },
          { file: "src/lib/stripe.ts", line: 45, severity: Severity.LOW, category: "style", title: "Unused import", description: "Console import is unused", suggestion: "Remove unused import" },
        ],
      },
    },
  });

  const review2 = await prisma.codeReview.create({
    data: {
      prTitle: "fix: auth middleware", prUrl: "https://github.com/demo/repo/pull/43", branch: "fix/auth-middleware", repo: "demo/repo",
      organizationId: demoOrg.id, reviewerId: demoUser.id,
      status: ReviewStatus.IN_PROGRESS, qualityScore: 62,
      summary: "Critical security issue found in token validation logic.",
      issues: {
        create: [
          { file: "src/middleware/auth.ts", line: 15, severity: Severity.CRITICAL, category: "security", title: "JWT not verified", description: "JWT token is decoded but not verified against secret", suggestion: "Use jwt.verify() instead of jwt.decode()", code: "jwt.decode(token)" },
          { file: "src/middleware/auth.ts", line: 42, severity: Severity.HIGH, category: "security", title: "Missing rate limiting", description: "Auth endpoint has no rate limiting", suggestion: "Add rate limiting middleware" },
        ],
      },
    },
  });
  console.log("Demo code reviews created");

  // ─── Customer Tickets (5) ────────────────────────────────
  const tickets = [
    { subject: "Cannot login after password reset", body: "I reset my password but now I can't login. It says invalid credentials.", status: TicketStatus.OPEN, priority: TicketPriority.HIGH, customerName: "John Smith", customerEmail: "john@example.com" },
    { subject: "Billing issue - double charge", body: "I was charged twice for my subscription this month. Please refund.", status: TicketStatus.IN_PROGRESS, priority: TicketPriority.URGENT, customerName: "Sarah Johnson", customerEmail: "sarah@example.com", aiReply: "We apologize for the billing issue. I've flagged this to our billing team for immediate review." },
    { subject: "Feature request: Dark mode toggle", body: "Would love to see a dark mode option in the dashboard.", status: TicketStatus.OPEN, priority: TicketPriority.LOW, customerName: "Mike Brown", customerEmail: "mike@example.com" },
    { subject: "API rate limiting too strict", body: "We're hitting rate limits frequently during normal usage. Can we get these increased?", status: TicketStatus.OPEN, priority: TicketPriority.MEDIUM, customerName: "Alice Wang", customerEmail: "alice@startup.io" },
    { subject: "Integration with Slack works great", body: "Just wanted to say the Slack integration is fantastic! Our team loves it.", status: TicketStatus.RESOLVED, priority: TicketPriority.LOW, customerName: "Tom Green", customerEmail: "tom@agency.co", resolvedAt: new Date() },
  ];

  for (const ticket of tickets) {
    await prisma.customerTicket.create({
      data: {
        subject: ticket.subject, body: ticket.body, status: ticket.status, priority: ticket.priority,
        customerName: ticket.customerName, customerEmail: ticket.customerEmail,
        assigneeId: demoUser.id, organizationId: demoOrg.id,
        aiReplySuggested: (ticket as any).aiReply ?? null,
        resolvedAt: (ticket as any).resolvedAt ?? null,
      },
    });
  }
  console.log("Demo tickets created");

  // ─── Projects (2) ────────────────────────────────────────
  const proj1 = await prisma.project.create({
    data: {
      name: "AI Founder OS", repoUrl: "https://github.com/demo/ai-founder-os", description: "Main AI Founder OS monorepo", techStack: ["Next.js", "TypeScript", "PostgreSQL", "Prisma", "Tailwind"],
      healthScore: 91, organizationId: demoOrg.id,
      lastAuditAt: new Date(),
      audits: {
        create: {
          status: AuditStatus.COMPLETED, healthScore: 91, summary: "Project is healthy. Minor dependency updates recommended.",
          vulns: {
            create: [
              { title: "lodash", severity: "MEDIUM", cveId: "CVE-2024-1234", description: "Prototype pollution vulnerability in lodash", fix: "Upgrade lodash to 4.17.21+" },
            ],
          },
          deps: {
            create: [
              { name: "next", current: "14.2.3", latest: "14.2.4", severity: "LOW" },
              { name: "prisma", current: "5.22.0", latest: "5.22.0", severity: "NONE" },
            ],
          },
          perf: {
            create: { bundleSize: "432 KB", lcp: "1.8s", tti: "2.1s", lighthouseScore: 92 },
          },
        },
      },
    },
  });

  await prisma.project.create({
    data: {
      name: "Customer Portal", repoUrl: "https://github.com/demo/customer-portal", description: "Customer-facing portal and dashboard", techStack: ["React", "Node.js", "MongoDB", "Express"],
      healthScore: 58, organizationId: demoOrg.id,
      lastAuditAt: new Date(),
      audits: {
        create: {
          status: AuditStatus.COMPLETED, healthScore: 58, summary: "Several critical issues found. Prioritize security fixes.",
          vulns: {
            create: [
              { title: "express", severity: "CRITICAL", cveId: "CVE-2024-5678", description: "Remote code execution in Express", fix: "Upgrade express to 4.18.0+" },
              { title: "axios", severity: "HIGH", cveId: "CVE-2024-9012", description: "Server-side request forgery in axios", fix: "Upgrade axios to 0.28.0+" },
            ],
          },
          deps: {
            create: [
              { name: "react", current: "17.0.2", latest: "18.3.1", severity: "HIGH" },
              { name: "mongoose", current: "6.0.0", latest: "8.8.0", severity: "MEDIUM" },
            ],
          },
          perf: {
            create: { bundleSize: "1.24 MB", lcp: "3.2s", tti: "4.1s", lighthouseScore: 65 },
          },
        },
      },
    },
  });
  console.log("Demo projects created");

  // ─── CTO Session ─────────────────────────────────────────
  const session = await prisma.cTOSession.create({
    data: {
      title: "Architecture Review",
      contextType: "architecture",
      organizationId: demoOrg.id,
      messages: {
        create: [
          { role: ChatRole.USER, content: "Can you review our current microservices architecture? We're using Node.js, PostgreSQL, and Redis across 8 services." },
          { role: ChatRole.AI, content: "I'd be happy to review your architecture. Eight microservices sounds like a reasonable split. Let me start with some key questions:\n\n1. How do services communicate? (HTTP REST, message queue, gRPC?)\n2. Do you have a shared database or per-service databases?\n3. What's your deployment strategy?\n\nThese will help me give you the most relevant advice." },
          { role: ChatRole.USER, content: "We use HTTP REST for sync calls and Redis pub/sub for events. Each service has its own PostgreSQL schema in a shared database. We deploy via Docker Compose on a single VPS." },
          { role: ChatRole.AI, content: "I see several opportunities for improvement:\n\n**1. Database Isolation:** Sharing a database across services defeats the purpose of microservices. Recommend migrating to per-service databases.\n\n**2. Service Mesh:** Consider using a message broker like RabbitMQ or Kafka for event-driven communication instead of Redis pub/sub.\n\n**3. Container Orchestration:** Moving from Docker Compose to Kubernetes would give you better scaling, health checks, and rolling deployments.\n\n**4. API Gateway:** Add an API gateway (Kong, Traefik) to handle auth, rate limiting, and routing centrally.\n\nWould you like me to create a PRD or roadmap for this migration?" },
        ],
      },
    },
  });
  console.log("Demo CTO session created");

  // ─── PRD ──────────────────────────────────────────────────
  await prisma.pRD.create({
    data: {
      title: "AI Agent Marketplace",
      content: "# AI Agent Marketplace\n\n## Executive Summary\nAn open marketplace where users can discover, install, and share AI agent configurations. Enables community-driven agent development.\n\n## Problem Statement\nUsers currently build agents from scratch. A marketplace would accelerate adoption and enable sharing of best practices.\n\n## Target Users\n- Developers looking for pre-built agent templates\n- Teams wanting to standardize agent configurations\n- Power users sharing custom agents\n\n## Core Features\n1. **Agent Discovery** — Browse, search, and filter public agents\n2. **One-click Install** — Install agent configurations with a single click\n3. **Versioning** — Track agent versions and roll back if needed\n4. **Ratings & Reviews** — Community feedback system\n5. **Publisher Dashboard** — Analytics for agent publishers\n\n## Technical Architecture\n- Next.js 14 frontend with server components\n- PostgreSQL for agent metadata and ratings\n- Redis for search indexing and caching\n- Stripe for premium agent payments\n\n## Success Metrics\n- 100+ published agents in first month\n- 50% of users install at least one agent\n- Average rating > 4.0 across all agents",
      organizationId: demoOrg.id,
    },
  });
  console.log("Demo PRD created");

  // ─── Roadmap with 6 Milestones ───────────────────────────
  await prisma.roadmap.create({
    data: {
      title: "Platform Roadmap 2026",
      organizationId: demoOrg.id,
      milestones: {
        create: [
          { title: "Core Platform", description: "Authentication, onboarding, and workspace management", quarter: "Q1 2026", status: "DONE", techTags: ["Next.js", "Clerk"], effort: "XL", order: 0 },
          { title: "Agent Framework", description: "Agent deployment, monitoring, and log management", quarter: "Q1 2026", status: "IN_PROGRESS", techTags: ["Node.js", "Docker"], effort: "XL", order: 1 },
          { title: "Code Review Engine", description: "AI-powered PR review with vulnerability detection", quarter: "Q2 2026", status: "PLANNED", techTags: ["Claude", "GitHub API"], effort: "L", order: 2 },
          { title: "Business Ops", description: "Customer ticket management with AI replies", quarter: "Q2 2026", status: "PLANNED", techTags: ["NLP", "Anthropic"], effort: "L", order: 3 },
          { title: "Project Auditor", description: "Full-stack health reports and security auditing", quarter: "Q3 2026", status: "PLANNED", techTags: ["Python", "OWASP"], effort: "XL", order: 4 },
          { title: "AI CTO Platform", description: "PRD generation and strategic technical planning", quarter: "Q3 2026", status: "PLANNED", techTags: ["Claude", "Vector DB"], effort: "XL", order: 5 },
        ],
      },
    },
  });
  console.log("Demo roadmap created");

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
