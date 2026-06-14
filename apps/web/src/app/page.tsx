import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sparkles, Bot, Code2, Building2, SearchCheck, Cpu, Check, ArrowRight, Terminal, ChevronDown } from 'lucide-react'

const features = [
  { icon: Bot, title: 'Agent Control Center', desc: 'Deploy and monitor AI agents with Claude, GPT, and Gemini models from a single dashboard.' },
  { icon: Code2, title: 'Code Review Auditor', desc: 'AI-powered PR reviews with automated vulnerability detection and best practice suggestions.' },
  { icon: Building2, title: 'Business Operator', desc: 'AI handles customer support tickets, generates replies, and tracks business metrics.' },
  { icon: SearchCheck, title: 'Project Auditor', desc: 'Full-stack health reports for your projects — security, performance, dependencies, and more.' },
  { icon: Cpu, title: 'AI CTO Platform', desc: 'Strategic technical guidance — generate PRDs, development roadmaps, and architecture plans.' },
]

const pricing = [
  { name: 'Free', price: '$0', desc: 'Perfect for getting started', features: ['3 AI agents', '10K tokens/day', '1 team seat', 'Basic code review', 'Community support'], cta: 'Start Free', href: '/sign-up', popular: false },
  { name: 'Business', price: '$0', desc: 'For growing teams', features: ['50 AI agents', '500K tokens/day', '25 team seats', 'Advanced code review', 'AI CTO platform', 'Priority support', 'Custom integrations'], cta: 'Get Started Free', href: '/sign-up', popular: false },
  { name: 'Enterprise', price: '$0', desc: 'For scaling organizations', features: ['Unlimited agents', 'Unlimited tokens', 'Unlimited team seats', 'All features', 'Custom SLA', 'Dedicated infrastructure', 'White-label option'], cta: 'Get Started Free', href: '/sign-up', popular: false },
]

const faqs = [
  { q: 'Is my code safe?', a: 'Yes. All code is encrypted in transit and at rest. We never store your code on our servers longer than necessary for the review process. Our infrastructure is SOC 2 compliant.' },
  { q: 'Which AI models do you use?', a: 'We support Claude (Opus & Sonnet), GPT-4, GPT-4 Turbo, and Gemini Pro. You can choose which model powers each agent in your workspace.' },
  { q: 'Can I cancel anytime?', a: 'Absolutely. There are no long-term contracts or cancellation fees. Your subscription will remain active until the end of your billing period.' },
  { q: 'Do you support self-hosting?', a: 'Enterprise plan includes dedicated infrastructure and self-hosting options. Contact our sales team for a custom deployment plan.' },
  { q: "What's the difference between plans?", a: 'Free plan is great for exploring the platform. Business adds more agents, tokens, and team seats. Enterprise includes unlimited everything, custom SLA, and dedicated support.' },
]

const companies = ['Vercel', 'Linear', 'Raycast', 'Cal.com', 'Supabase']

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg text-white">AI Founder OS</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" className="text-slate-300 hover:text-white">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button className="bg-indigo-500 hover:bg-indigo-600 text-white">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-700 bg-slate-800/50 text-sm text-slate-300 mb-8">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Now in Public Beta
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
            Your <span className="text-indigo-400">AI-Powered</span>
            <br />Founder OS
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            One platform to manage AI agents, review code, operate your business, audit projects,
            and get CTO-level technical guidance — all powered by Claude AI.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/sign-up">
              <Button size="lg" className="bg-indigo-500 hover:bg-indigo-600 text-white text-base px-8 h-12">
                Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#demo">
              <Button variant="outline" size="lg" className="border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 text-base px-8 h-12">
                View Demo
              </Button>
            </a>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-slate-500 uppercase tracking-wider font-medium">Trusted by founders at</p>
          <div className="flex flex-wrap justify-center gap-8 sm:gap-12">
            {companies.map((name) => (
              <span key={name} className="text-lg font-semibold text-slate-400">{name}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything you need to ship faster</h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">Five powerful modules that work together to supercharge your development workflow.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.slice(0, 3).map((f) => (
            <div key={f.title} className="group p-6 sm:p-8 rounded-2xl border border-slate-800 bg-slate-900/50 hover:border-indigo-500/30 transition-all duration-300">
              <div className="p-3 rounded-xl bg-indigo-500/10 w-fit mb-5 group-hover:bg-indigo-500/20 transition-colors">
                <f.icon className="h-5 w-5 text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2 mt-6">
          {features.slice(3).map((f) => (
            <div key={f.title} className="group p-6 sm:p-8 rounded-2xl border border-slate-800 bg-slate-900/50 hover:border-indigo-500/30 transition-all duration-300">
              <div className="p-3 rounded-xl bg-indigo-500/10 w-fit mb-5 group-hover:bg-indigo-500/20 transition-colors">
                <f.icon className="h-5 w-5 text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simple, transparent pricing</h2>
          <p className="text-slate-400 text-lg">All plans are completely free. No credit card required.</p>
        </div>
        <div className="grid gap-8 lg:grid-cols-3 max-w-5xl mx-auto">
          {pricing.map((plan) => (
            <div key={plan.name} className={`relative rounded-2xl border p-8 ${plan.popular ? 'border-indigo-500 bg-slate-900' : 'border-slate-800 bg-slate-900/50'}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-indigo-500 text-xs font-semibold text-white">
                  Most Popular
                </div>
              )}
              <h3 className="text-lg font-semibold mb-1 text-white">{plan.name}</h3>
              <p className="text-sm text-slate-400 mb-4">{plan.desc}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                <span className="text-slate-400 ml-1">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                    <Check className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={plan.href}>
                <Button className={`w-full h-11 ${plan.popular ? 'bg-indigo-500 hover:bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'}`}>
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section id="demo" className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">See it in action</h2>
          <p className="text-slate-400 text-lg">Watch an AI agent analyze a pull request in real-time.</p>
        </div>
        <div className="max-w-3xl mx-auto rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden mb-12">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 bg-slate-900">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="ml-3 text-xs text-slate-500">AI Agent — Code Review #42</span>
          </div>
          <div className="p-4 sm:p-6 font-mono text-sm space-y-3">
            <p className="text-emerald-400">$ Analyzing pull request #42 — feat/auth-flow</p>
            <p className="text-slate-400">[1/4] Scanning source files...</p>
            <p className="text-slate-400">[2/4] Checking for security vulnerabilities...</p>
            <p className="text-yellow-400">⚠ Found 3 issues</p>
            <p className="text-slate-400">[3/4] Generating fix suggestions...</p>
            <p className="text-emerald-400">✓ Analysis complete</p>
            <p className="text-slate-500">─────────────────────────</p>
            <p className="text-slate-300">CRITICAL: SQL injection in src/auth/login.ts:45</p>
            <p className="text-slate-300">HIGH: Missing input validation in src/api/users.ts:102</p>
            <p className="text-slate-300">LOW: Unused import in src/components/Header.tsx:30</p>
            <p className="text-emerald-400 mt-2">✓ Auto-fix applied for 1 issue</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
          {[
            { step: '01', title: 'Connect', desc: 'Link your GitHub repository and configure your agents.' },
            { step: '02', title: 'Configure', desc: 'Set review rules, choose AI models, and define workflows.' },
            { step: '03', title: 'Deploy', desc: 'Go live — your AI team starts reviewing and reporting instantly.' },
          ].map((s) => (
            <div key={s.step} className="text-center p-6">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-400 font-bold">{s.step}</span>
              </div>
              <h3 className="font-semibold mb-1 text-white">{s.title}</h3>
              <p className="text-sm text-slate-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-14">Frequently asked questions</h2>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <details key={faq.q} className="group rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden">
              <summary className="flex items-center justify-between p-5 cursor-pointer list-none text-white font-medium hover:bg-slate-800/50 transition-colors">
                {faq.q}
                <ChevronDown className="h-4 w-4 text-slate-400 group-open:rotate-180 transition-transform flex-shrink-0" />
              </summary>
              <div className="px-5 pb-5 text-sm text-slate-400 leading-relaxed">{faq.a}</div>
            </details>
          ))}
        </div>
      </section>

      <section className="px-4 sm:px-6 py-20">
        <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-10 sm:p-16 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">Ready to build faster?</h2>
          <p className="text-indigo-200 text-lg mb-8">Start your free trial — no credit card required.</p>
          <Link href="/sign-up">
            <Button size="lg" className="bg-white text-indigo-700 hover:bg-indigo-50 text-base px-10 h-13 font-semibold">
              Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-800 py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-8 md:grid-cols-4 mb-10">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-indigo-500 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <span className="font-semibold text-white">AI Founder OS</span>
              </div>
              <p className="text-sm text-slate-400">The unified AI operating system for modern founders.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><a href="#demo" className="hover:text-white transition-colors">Demo</a></li>
                <li><Link href="/sign-up" className="hover:text-white transition-colors">Get Started</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
                <li><Link href="/cookies" className="hover:text-white transition-colors">Cookies</Link></li>
                <li><Link href="/security" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <p>&copy; 2025 AI Founder OS. All rights reserved.</p>
            <p>Built with Claude AI</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
