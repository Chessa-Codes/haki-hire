import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    const { applicationId } = await req.json()

    const application = await db.application.findUnique({
      where: { id: applicationId },
      include: { job: true },
    })
    if (!application) return new NextResponse('Application record not found.', { status: 404 })

    const systemPrompt = `
You are an expert AI Technical Recruiter. Generate a structured 20-minute interview script split into two phases.
Phase 1: Domain Knowledge & Deep Technical Competency (based on job domain).
Phase 2: Core Behavioral Questions focused on personality, leadership, and personal relations.

Respond STRICTLY with a JSON object. No markdown, no extra text outside the JSON.
Expected Schema:
{
  "questions": [
    {"id": 1, "phase": "TECHNICAL", "question": "text"},
    {"id": 4, "phase": "BEHAVIORAL", "question": "text"}
  ]
}
    `

    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Generate 3 technical and 3 behavioral questions for:
Title: ${application.job.title}
Domain: ${application.job.domain}
Context: ${application.job.description}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    const rawContent = aiResponse.choices[0]?.message?.content
    if (!rawContent) throw new Error('AI Engine failed to return content.')

    const parsed = JSON.parse(rawContent)

    await db.interview.update({
      where: { applicationId },
      data: { transcript: parsed.questions },
    })

    return NextResponse.json({ success: true, questions: parsed.questions })
  } catch (error) {
    console.error('[INTERVIEW_GENERATION_FAILURE]:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
