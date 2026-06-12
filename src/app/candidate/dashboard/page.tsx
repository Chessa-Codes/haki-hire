import { db } from '@/lib/db'
import ApplyButton from '@/components/ApplyButton'

export default async function CandidateDashboard() {
  const jobs = await db.job.findMany({ orderBy: { createdAt: 'desc' } })

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Available Positions</h2>
        <p className="text-sm text-slate-400">Select an opening to trigger your AI screening pipeline.</p>
      </div>

      {jobs.length === 0 ? (
        <div className="p-12 border border-dashed border-slate-800 rounded-xl text-center text-slate-500">
          The job pool is currently quiet. Check back shortly for new listings.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {jobs.map((job) => (
            <div key={job.id} className="p-6 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-500 transition-all">
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-100">{job.title}</h3>
                  <span className="text-xs bg-indigo-950/60 border border-indigo-800/80 text-indigo-300 px-2 py-0.5 rounded-md">
                    {job.domain}
                  </span>
                </div>
                <p className="text-sm text-slate-400 line-clamp-2">{job.description}</p>
              </div>
              <ApplyButton jobId={job.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
