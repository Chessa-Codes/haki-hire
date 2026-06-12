import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { createJobListing } from '../../actions/jobs'

export default async function RecruiterDashboard() {
  const { userId } = await auth()
  if (!userId) redirect('/')

  const recruiterData = await db.user.findUnique({
    where: { clerkId: userId },
    include: {
      jobs: {
        orderBy: { createdAt: 'desc' },
        include: {
          applications: {
            include: { candidate: true, interview: true },
          },
        },
      },
    },
  })

  if (!recruiterData || recruiterData.role !== 'RECRUITER') redirect('/')

  return (
    <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar Job Posting Form */}
      <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-6 rounded-xl h-fit">
        <h3 className="text-xl font-bold text-purple-400 mb-4">Post a New Role</h3>
        <form action={createJobListing as (formData: FormData) => void} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Job Title</label>
            <input type="text" name="title" required placeholder="e.g., Senior Frontend Engineer" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Domain</label>
            <input type="text" name="domain" required placeholder="e.g., React, Next.js, TypeScript" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Description</label>
            <textarea name="description" required rows={4} placeholder="Outline role responsibilities and expectations..." className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-purple-500 resize-none" />
          </div>
          <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm py-2 px-4 rounded-lg transition-colors">
            Deploy Listing
          </button>
        </form>
      </div>

      {/* Main Stream */}
      <div className="lg:col-span-3 space-y-8">
        <h2 className="text-2xl font-bold tracking-tight">Active Postings & AI Screenings</h2>

        {!recruiterData.jobs.length ? (
          <div className="p-12 border border-dashed border-slate-800 rounded-xl text-center text-slate-500">
            No active positions found. Use the panel to deploy your first listing.
          </div>
        ) : (
          <div className="space-y-6">
            {recruiterData.jobs.map((job) => (
              <div key={job.id} className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-xl font-bold text-slate-100">{job.title}</h4>
                    <span className="text-xs text-purple-400 font-mono">{job.domain}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Candidate Pipeline</h5>
                  {job.applications.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">No applicants registered yet.</p>
                  ) : (
                    job.applications.map((app) => (
                      <div key={app.id} className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-indigo-400">{app.candidate.email}</span>
                          <span className={`text-xs px-2 py-0.5 rounded font-mono ${app.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}`}>
                            {app.status}
                          </span>
                        </div>
                        {app.interview?.aiEvaluation && (
                          <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 text-sm text-slate-300 max-h-60 overflow-y-auto whitespace-pre-wrap font-sans leading-relaxed">
                            {app.interview.aiEvaluation}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
