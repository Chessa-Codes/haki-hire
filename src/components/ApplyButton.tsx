'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { applyToJob } from '@/app/actions/applications'

export default function ApplyButton({ jobId }: { jobId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleApplicationStart = async () => {
    setLoading(true)
    try {
      const res = await applyToJob(jobId)
      if (res.success) {
        const aiSetup = await fetch('/api/interview/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applicationId: res.applicationId }),
        })

        if (aiSetup.ok) {
          router.push(`/interview/${res.applicationId}`)
        } else {
          alert('AI question generation failed. Please try again.')
        }
      }
    } catch (err) {
      console.error(err)
      alert('Failed to initialize your session.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      disabled={loading}
      onClick={handleApplicationStart}
      className="whitespace-nowrap bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800/50 text-white font-medium text-sm py-2 px-4 rounded-lg transition-colors self-start sm:self-center"
    >
      {loading ? 'Structuring Pipeline...' : 'Apply & Start Interview'}
    </button>
  )
}
