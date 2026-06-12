import { ClerkProvider, SignInButton, SignIn, SignUp, UserButton } from '@clerk/nextjs'
import './globals.css'

export const metadata = {
  title: 'Haki Hire | AI Interview Platform',
  description: 'AI-driven end-to-end interview platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="bg-slate-950 text-slate-50 antialiased" suppressHydrationWarning>
          <header className="flex justify-between items-center p-4 border-b border-slate-800">
            <h1 className="text-xl font-bold tracking-wider text-indigo-400">Haki.Hire</h1>
            <div className="flex items-center gap-3">
              <SignInButton mode="modal" />
              <UserButton />
            </div>
          </header>
          <main className="min-h-screen">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  )
}
