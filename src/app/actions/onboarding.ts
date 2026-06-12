'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { Role } from '@prisma/client'

export async function onboardUser(selectedRole: Role) {
  const { userId } = await auth()
  const user = await currentUser()

  if (!userId || !user) throw new Error('Unauthorized profile sync attempt.')

  const email = user.emailAddresses[0]?.emailAddress
  if (!email) throw new Error('No valid email found on Clerk profile.')

  // Upsert: create if new, update role if returning user picks a different workspace
  const dbUser = await db.user.upsert({
    where: { clerkId: userId },
    update: { role: selectedRole },
    create: { clerkId: userId, email, role: selectedRole },
  })

  return { success: true, role: dbUser.role }
}
