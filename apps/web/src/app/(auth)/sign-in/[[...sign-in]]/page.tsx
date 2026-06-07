import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <span className="font-semibold text-lg text-white">AI Founder OS</span>
        </Link>
        <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
        <p className="text-slate-400 text-sm">Sign in to your account</p>
      </div>
      <SignIn />
      <p className="mt-6 text-sm text-slate-400">
        Don&apos;t have an account?{' '}
        <Link href="/sign-up" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign up</Link>
      </p>
    </div>
  )
}
