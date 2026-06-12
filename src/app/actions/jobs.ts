'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function createJobListing(formData: FormData) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const domain = formData.get('domain') as string

  if (!title || !description || !domain) throw new Error('All form fields are strictly required.')

  const dbUser = await db.user.findUnique({ where: { clerkId: userId } })
  if (!dbUser || dbUser.role !== 'RECRUITER') throw new Error('Only registered recruiters can dispatch listings.')

  await db.job.create({ data: { title, description, domain, recruiterId: dbUser.id } })

  revalidatePath('/recruiter/dashboard')
  return { success: true }
}
