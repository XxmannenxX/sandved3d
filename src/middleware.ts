import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  
  // Debug Log
  if (path.startsWith('/admin')) {
    console.log(`[MW] 🚀 Request: ${request.method} ${path}`)
    
    // Check Env Vars
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    console.log(`[MW] 🗝️ Env Check - URL: ${url ? 'Present' : 'MISSING'}, Key: ${key ? 'Present' : 'MISSING'}`)
    if (url) console.log(`[MW] 🔍 URL Value (first 10): ${url.substring(0, 10)}...`)
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: 'sb-auth-token',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      },
      cookies: {
        getAll() {
          const cookies = request.cookies.getAll()
          if (path.startsWith('/admin')) {
             const authCookies = cookies.filter(c => c.name === 'sb-auth-token')
             if (authCookies.length > 0) {
                console.log(`[MW] 🍪 Auth Cookies Found: ${authCookies.map(c => c.name).join(', ')}`)
             } else {
                console.log(`[MW] ⚠️ No Supabase Auth cookies found.`)
             }
          }
          return cookies
        },
        setAll(cookiesToSet) {
          if (path.startsWith('/admin')) {
             console.log(`[MW] 🔄 Setting Cookies: ${cookiesToSet.map(c => c.name).join(', ')}`)
          }
          
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (path.startsWith('/admin')) {
    if (error) console.error(`[MW] ❌ Auth Error: ${error.message}`)
    
    if (!user) {
      console.warn(`[MW] ⛔ Access Denied. Redirecting to /login.`)
      return NextResponse.redirect(new URL('/login', request.url))
    } else {
      console.log(`[MW] ✅ Access Granted for User: ${user.id}`)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
