import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import InterviewRoom from '@/components/InterviewRoom'

export default async function InterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) redirect('/')

  const { id: applicationId } = await params

  const application = await db.application.findUnique({
    where: { id: applicationId },
    include: { interview: true },
  })

  if (!application || !application.interview) redirect('/candidate/dashboard')

  const generatedQuestions = (application.interview.transcript as unknown as object[]) || []

  return (
    <div className="py-8 min-h-[calc(100vh-70px)] bg-slate-950">
      <InterviewRoom initialQuestions={generatedQuestions as Parameters<typeof InterviewRoom>[0]['initialQuestions']} applicationId={applicationId} />
    </div>
  )
}
