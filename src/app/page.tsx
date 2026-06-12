'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { onboardUser } from './actions/onboarding'
import { Role } from '@prisma/client'

export default function Home() {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleRoleSelection = async (role: Role) => {
    setLoading(true)
    try {
      const res = await onboardUser(role)
      if (res.success) {
        router.push(role === 'RECRUITER' ? '/recruiter/dashboard' : '/candidate/dashboard')
      }
    } catch (err) {
      console.error('Failed to sync profile:', err)
      alert('Something went wrong setting up your workspace.')
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded) return <div className="p-8 text-center text-slate-400">Loading platform assets...</div>

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-70px)] px-4">
      <div className="max-w-3xl text-center space-y-6">
        <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          The AI-Driven Interview Engine
        </h2>
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto">
          Automated job indexing, lightning-fast application matching, and an immersive 20-minute autonomous AI video interview pipeline.
        </p>

        {!isSignedIn ? (
          <div className="pt-6">
            <p className="text-sm text-slate-500 mb-2">Sign up or sign in via the header to begin</p>
            <div className="inline-flex h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
          </div>
        ) : (
          <div className="pt-8 space-y-4">
            <h3 className="text-xl font-medium text-slate-200">Choose your workspace:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
              <button
                disabled={loading}
                onClick={() => handleRoleSelection('CANDIDATE')}
                className="p-6 bg-slate-900 border border-slate-800 rounded-xl hover:border-indigo-500 hover:bg-slate-900/80 transition-all text-left group"
              >
                <div className="text-indigo-400 font-semibold mb-1 group-hover:text-indigo-300">I am a Candidate</div>
                <div className="text-xs text-slate-400">Apply to jobs, upload your resume, and take AI video interviews.</div>
              </button>

              <button
                disabled={loading}
                onClick={() => handleRoleSelection('RECRUITER')}
                className="p-6 bg-slate-900 border border-slate-800 rounded-xl hover:border-purple-500 hover:bg-slate-900/80 transition-all text-left group"
              >
                <div className="text-purple-400 font-semibold mb-1 group-hover:text-purple-300">I am a Recruiter</div>
                <div className="text-xs text-slate-400">Post open opportunities and let AI score and screen applicants.</div>
              </button>
            </div>
            {loading && <p className="text-sm text-slate-500 animate-pulse">Setting up your workspace...</p>}
          </div>
        )}
      </div>
    </div>
  )
}
