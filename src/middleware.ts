import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAdmin = token?.role === 'admin'
    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')

    if (isAdminRoute && !isAdmin) {
      return NextResponse.redirect(new URL('/', req.url))
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname
        if (path.startsWith('/admin')) {
          return !!token
        }
        if (path === '/') {
          return true // temporarily allow for testing !!token
        }
        return true
      },
    },
  }
)

export const config = {
  matcher: ['/', '/admin/:path*'],
}
