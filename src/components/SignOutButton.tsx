'use client'

import { signOut } from 'next-auth/react'

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/auth/signin' })}
      className="rounded-full border border-white/20 px-4 py-1.5 text-sm font-medium hover:bg-white/10"
    >
      Sign Out
    </button>
  )
}
