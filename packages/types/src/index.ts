// ──────────────────────────────────────────────
// Shared TypeScript Types for AI Founder OS
// ──────────────────────────────────────────────

// Re-export Prisma-generated types
export type {
  User,
  Organization,
  OrganizationMember,
  Subscription,
  Plan,
  Agent,
  AgentLog,
  CodeReview,
  CodeIssue,
  Project,
  Audit,
  Vulnerability,
  Dependency,
  PerfMetric,
  BusinessTask,
  CustomerTicket,
  EmailThread,
  CTOSession,
  CTOMessage,
  PRD,
  Roadmap,
  Milestone,
  AuditLog,
  Notification,
  ApiKey,
} from "@prisma/client";

export type {
  UserRole,
  PlanType,
  SubscriptionStatus,
  AgentStatus,
  AgentModel,
  Severity,
  ReviewStatus,
  TaskStatus,
  TicketStatus,
  AuditStatus,
  ChatRole,
  NotificationType,
} from "@prisma/client";

// ─── API Response Types ───────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// ─── Dashboard Types ──────────────────────────

export interface DashboardMetrics {
  totalAgents: number;
  activeAgents: number;
  totalReviews: number;
  openIssues: number;
  mrr: number;
  subscriptionPlan: string;
  tokensUsedToday: number;
  tokenLimit: number;
  teamMembers: number;
  activeProjects: number;
  pendingTickets: number;
}

export interface ActivityFeedItem {
  id: string;
  action: string;
  resource: string;
  description: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  createdAt: string;
}

export interface TokenUsageChart {
  date: string;
  tokens: number;
  cost: number;
}

export interface ModuleStatus {
  id: string;
  name: string;
  icon: string;
  status: "healthy" | "warning" | "error" | "inactive";
  description: string;
  href: string;
}

// ─── Agent Types ──────────────────────────────

export interface AgentWithMetrics {
  id: string;
  name: string;
  description: string | null;
  model: string;
  status: string;
  tokensUsed: number;
  totalCost: number;
  lastUsedAt: string | null;
  createdAt: string;
  logsCount: number;
}

export interface CreateAgentInput {
  name: string;
  description?: string;
  model: string;
  temperature?: number;
  systemPrompt?: string;
  tools?: string[];
  configuration?: Record<string, unknown>;
}

// ─── Code Review Types ────────────────────────

export interface CodeReviewWithIssues {
  id: string;
  prTitle: string | null;
  prUrl: string | null;
  repo: string | null;
  branch: string | null;
  status: string;
  qualityScore: number | null;
  summary: string | null;
  createdAt: string;
  issues: CodeIssueData[];
}

export interface CodeIssueData {
  id: string;
  file: string | null;
  line: number | null;
  severity: string;
  category: string | null;
  title: string;
  description: string | null;
  suggestion: string | null;
  code: string | null;
  isFixed: boolean;
}

// ─── Business Types ───────────────────────────

export interface TicketWithThreads {
  id: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  customerName: string | null;
  customerEmail: string | null;
  aiReplySuggested: string | null;
  createdAt: string;
  emailThreads: EmailThreadData[];
}

export interface EmailThreadData {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  isAiGenerated: boolean;
  createdAt: string;
}

// ─── Project Audit Types ──────────────────────

export interface ProjectAuditResult {
  id: string;
  projectId: string;
  status: string;
  uxScore: number | null;
  performanceScore: number | null;
  accessibilityScore: number | null;
  seoScore: number | null;
  bestPracticesScore: number | null;
  overallScore: number | null;
  summary: string | null;
  issues: AuditIssueData[];
}

export interface AuditIssueData {
  id: string;
  category: string;
  severity: string;
  title: string;
  description: string | null;
  suggestion: string | null;
  isFixed: boolean;
}

// ─── CTO Types ────────────────────────────────

export interface CtoSessionWithDetails {
  id: string;
  title: string;
  description: string | null;
  idea: string | null;
  targetUsers: string | null;
  budget: number | null;
  status: string;
  prds: PRDData[];
  roadmaps: RoadmapData[];
  backlogItems: BacklogItemData[];
}

export interface PRDData {
  id: string;
  content: Record<string, unknown>;
  markdown: string | null;
  version: number;
}

export interface RoadmapData {
  id: string;
  title: string | null;
  phases: unknown[];
  timeline: Record<string, unknown>;
  version: number;
}

export interface BacklogItemData {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  storyPoints: number | null;
  order: number;
}

// ─── Subscription Types ───────────────────────

export interface PlanWithLimits {
  id: string;
  type: string;
  name: string;
  description: string;
  price: number;
  interval: string;
  maxAgents: number;
  maxTokensPerDay: number;
  maxTeamSeats: number;
  maxProjects: number;
  features: string[];
}

// ─── Settings Types ───────────────────────────

export interface OrganizationSettings {
  name: string;
  slug: string;
  logoUrl: string | null;
}

export interface TeamMember {
  id: string;
  userId: string;
  role: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  joinedAt: string;
}
