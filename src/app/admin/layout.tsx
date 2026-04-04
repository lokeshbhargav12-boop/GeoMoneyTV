'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect } from 'react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
    if (session && (session.user as any).role !== 'admin') {
      router.push('/')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-geo-dark">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!session || (session.user as any).role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-geo-dark text-white">
      <nav className="border-b border-white/10 bg-black/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-geo-gold to-yellow-600" />
                <span className="text-xl font-bold">Admin Panel</span>
              </div>
              <div className="flex gap-4 flex-wrap">
                <Link href="/admin" className="hover:text-geo-gold">Dashboard</Link>
                <Link href="/admin/articles" className="hover:text-geo-gold">Articles</Link>
                <Link href="/admin/videos" className="hover:text-geo-gold">Videos</Link>
                <Link href="/admin/rare-earth" className="hover:text-geo-gold">Rare Earth</Link>
                <Link href="/admin/newsletters" className="hover:text-geo-gold">Newsletters</Link>
                <Link href="/admin/homepage" className="hover:text-geo-gold">Homepage</Link>
                <Link href="/admin/energy" className="hover:text-geo-gold">Energy</Link>
                <Link href="/admin/users" className="hover:text-geo-gold">Users</Link>
                <Link href="/admin/settings" className="hover:text-geo-gold">Settings</Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">{session.user?.email}</span>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="rounded-md bg-red-500/10 px-3 py-1.5 text-sm text-red-500 hover:bg-red-500/20"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
