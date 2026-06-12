'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface ResponsePayload {
  questionId: number
  phase: 'TECHNICAL' | 'BEHAVIORAL'
  question: string
  candidateAnswer: string
}

export async function submitInterviewAnswers(applicationId: string, responses: ResponsePayload[]) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const application = await db.application.findUnique({
    where: { id: applicationId },
    include: { job: true },
  })
  if (!application) throw new Error('Target application not found.')

  const systemPrompt = `
You are an expert executive talent evaluator. Review the following interview transcript for the position: "${application.job.title}" (${application.job.domain}).

Provide an analytical scorecard:
1. Technical Competency Score (0-100) and rationale.
2. Behavioral, Leadership & Communication Score (0-100) and rationale.
3. Key Highlights (strengths discovered).
4. Green Flags & Red Flags (if any).
5. Final Verdict (Strongly Recommend / Proceed with Caution / Reject).

Format using structured Markdown headers. Be objective, direct, and constructive.
  `

  const aiResponse = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Review the applicant's interview transcript:\n${JSON.stringify(responses, null, 2)}` },
    ],
    temperature: 0.5,
  })

  const evaluationReport = aiResponse.choices[0]?.message?.content || 'Evaluation generation timed out.'

  await db.$transaction([
    db.interview.update({ where: { applicationId }, data: { aiEvaluation: evaluationReport } }),
    db.application.update({ where: { id: applicationId }, data: { status: 'COMPLETED' } }),
  ])

  revalidatePath('/recruiter/dashboard')
  return { success: true }
}
