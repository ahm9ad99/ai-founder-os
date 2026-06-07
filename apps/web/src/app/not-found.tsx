import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="text-center relative z-10">
        <div className="inline-flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-white">AI Founder OS</span>
        </div>
        <h1 className="text-8xl sm:text-9xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent">404</h1>
        <h2 className="text-2xl font-bold text-white mb-2">Page not found</h2>
        <p className="text-slate-400 mb-8 max-w-md mx-auto">The page you&apos;re looking for doesn&apos;t exist or was moved.</p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/">
            <Button variant="outline" className="border-slate-700 text-slate-300 hover:text-white">Go Home</Button>
          </Link>
          <Link href="/dashboard">
            <Button className="bg-indigo-500 hover:bg-indigo-600 text-white">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
