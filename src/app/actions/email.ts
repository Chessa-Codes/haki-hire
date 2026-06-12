'use server'

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendInterviewInvitationEmail(
  candidateEmail: string,
  jobTitle: string,
  interviewUrl: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Haki Hire <onboarding@resend.dev>',
      to: [candidateEmail],
      subject: `🚨 Action Required: Your AI Interview for ${jobTitle} is Ready`,
      html: `
        <div style="font-family: sans-serif; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 12px; max-width: 600px;">
          <h2 style="color: #818cf8;">Your Live Interview Session is Configured</h2>
          <p style="font-size: 14px; color: #cbd5e1;">Thank you for applying for the position of <strong>${jobTitle}</strong>.</p>
          <div style="background-color: #1e293b; padding: 16px; border-radius: 8px; border: 1px solid #334155; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #a78bfa;">Session Guidelines:</h4>
            <ul style="font-size: 13px; color: #94a3b8; padding-left: 20px;">
              <li>Total Duration: 20-minute countdown timer.</li>
              <li>Phase 1 (10 Mins): Domain-specific Technical Competency.</li>
              <li>Phase 2 (10 Mins): Situational Leadership & Personality.</li>
              <li>Hardware Check: Ensure webcam and microphone are unlocked.</li>
            </ul>
          </div>
          <a href="${interviewUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 12px 24px; font-weight: 600; font-size: 14px; border-radius: 8px; text-decoration: none; margin-top: 10px;">
            Enter AI Streaming Room
          </a>
          <p style="font-size: 11px; color: #64748b; margin-top: 30px;">This link is unique to your application profile token. Do not share this email.</p>
        </div>
      `,
    })

    if (error) {
      console.error('[RESEND_DISPATCH_ERROR]:', error)
      return { success: false }
    }

    return { success: true, id: data?.id }
  } catch (err) {
    console.error('Email pipeline crash:', err)
    return { success: false }
  }
}
