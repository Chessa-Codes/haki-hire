'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { sendInterviewInvitationEmail } from './email'

export async function applyToJob(jobId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const dbUser = await db.user.findUnique({ where: { clerkId: userId } })
  if (!dbUser || dbUser.role !== 'CANDIDATE') throw new Error('Only candidates can submit applications.')

  const existingApp = await db.application.findFirst({
    where: { jobId, candidateId: dbUser.id },
  })
  if (existingApp) return { success: true, applicationId: existingApp.id }

  const job = await db.job.findUnique({ where: { id: jobId } })
  if (!job) throw new Error('Job not found.')

  const newApp = await db.application.create({
    data: {
      jobId,
      candidateId: dbUser.id,
      cvUrl: 'placeholder-cv-url',
      status: 'INTERVIEWING',
      interview: { create: { transcript: [] } },
    },
  })

  const platformHost = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const dynamicInterviewLink = `${platformHost}/interview/${newApp.id}`
  await sendInterviewInvitationEmail(dbUser.email, job.title, dynamicInterviewLink)

  revalidatePath('/candidate/dashboard')
  return { success: true, applicationId: newApp.id }
}
