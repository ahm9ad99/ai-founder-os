'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, ArrowLeft, ArrowRight, Check, X, Sparkles } from 'lucide-react'
import Link from 'next/link'

const roles = ['Founder', 'CTO', 'Developer', 'Product Manager', 'Other'] as const
const companySizes = ['Solo', '2-10', '11-50', '51-200', '200+'] as const
const useCaseOptions = [
  'AI Agents', 'Code Review', 'Customer Support',
  'Project Auditing', 'Technical Advisory', 'All of the above',
] as const

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useUser()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    fullName: user?.fullName ?? '',
    role: '',
    companyName: '',
    companySize: '',
    useCases: [] as string[],
    workspaceName: '',
    teammates: [] as string[],
    teammateInput: '',
    githubRepo: '',
  })

  const update = (field: string, value: any) => setFormData((prev) => ({ ...prev, [field]: value }))

  const addTeammate = () => {
    const email = formData.teammateInput.trim()
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !formData.teammates.includes(email)) {
      update('teammates', [...formData.teammates, email])
      update('teammateInput', '')
    }
  }

  const removeTeammate = (email: string) => {
    update('teammates', formData.teammates.filter((t) => t !== email))
  }

  const toggleUseCase = (uc: string) => {
    const current = formData.useCases
    if (uc === 'All of the above') {
      update('useCases', current.includes('All of the above') ? [] : ['All of the above'])
    } else {
      const filtered = current.filter((c) => c !== 'All of the above')
      update('useCases', filtered.includes(uc) ? filtered.filter((c) => c !== uc) : [...filtered, uc])
    }
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to complete onboarding')
      }
      router.push('/dashboard')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const canContinueStep1 = formData.fullName.trim() && formData.role && formData.companyName.trim() && formData.companySize
  const canContinueStep2 = formData.useCases.length > 0
  const canContinueStep3 = formData.workspaceName.trim()

  const progressPercent = (step / 3) * 100

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col">
      <header className="border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-indigo-500 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-white text-sm">AI Founder OS</span>
        </Link>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          <div className="mb-8">
            <div className="flex justify-between text-sm text-slate-400 mb-2">
              <span>Step {step} of 3</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white">Tell us about yourself</h2>
                <p className="text-sm text-slate-400 mt-1">Help us personalize your experience.</p>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Full Name</Label>
                <Input value={formData.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder="Jane Doe" className="bg-slate-900 border-slate-700 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Role</Label>
                <div className="flex flex-wrap gap-2">
                  {roles.map((r) => (
                    <button key={r} type="button" onClick={() => update('role', r)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formData.role === r ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}>{r}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Company Name</Label>
                <Input value={formData.companyName} onChange={(e) => update('companyName', e.target.value)} placeholder="Acme Inc." className="bg-slate-900 border-slate-700 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Company Size</Label>
                <div className="flex flex-wrap gap-2">
                  {companySizes.map((s) => (
                    <button key={s} type="button" onClick={() => update('companySize', s)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formData.companySize === s ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white">What will you use it for?</h2>
                <p className="text-sm text-slate-400 mt-1">Select all that apply.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {useCaseOptions.map((uc) => {
                  const selected = formData.useCases.includes(uc)
                  return (
                    <button key={uc} type="button" onClick={() => toggleUseCase(uc)} className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${selected ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}>
                      {selected && <Check className="h-3.5 w-3.5" />}
                      {uc}
                    </button>
                  )
                })}
              </div>
              {formData.useCases.length === 0 && <p className="text-xs text-amber-400">Please select at least one use case.</p>}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white">Set up your workspace</h2>
                <p className="text-sm text-slate-400 mt-1">Name your workspace and invite your team.</p>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Workspace Name</Label>
                <Input value={formData.workspaceName} onChange={(e) => update('workspaceName', e.target.value)} placeholder="My Startup" className="bg-slate-900 border-slate-700 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Invite Teammates (optional)</Label>
                <div className="flex gap-2">
                  <Input value={formData.teammateInput} onChange={(e) => update('teammateInput', e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTeammate() } }} placeholder="colleague@company.com" className="bg-slate-900 border-slate-700 text-white flex-1" />
                  <Button type="button" variant="outline" onClick={addTeammate} className="border-slate-700 text-slate-300">Add</Button>
                </div>
                {formData.teammates.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.teammates.map((email) => (
                      <span key={email} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-sm text-slate-300">
                        {email}
                        <button type="button" onClick={() => removeTeammate(email)} className="hover:text-white"><X className="h-3 w-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">GitHub Repo URL (optional)</Label>
                <Input value={formData.githubRepo} onChange={(e) => update('githubRepo', e.target.value)} placeholder="https://github.com/user/repo" className="bg-slate-900 border-slate-700 text-white" />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-400 mt-4">{error}</p>}

          <div className="flex items-center justify-between mt-8">
            {step > 1 ? (
              <Button variant="ghost" onClick={() => setStep(step - 1)} className="text-slate-400 hover:text-white">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
            ) : (
              <div />
            )}
            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)} disabled={step === 1 ? !canContinueStep1 : !canContinueStep2} className="bg-indigo-500 hover:bg-indigo-600 text-white">
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting || !canContinueStep3} className="bg-indigo-500 hover:bg-indigo-600 text-white gap-2">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {submitting ? 'Setting up...' : 'Launch Dashboard'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
