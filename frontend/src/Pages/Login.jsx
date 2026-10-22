import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

const BG =
  'https://images.unsplash.com/photo-1471922694854-ff1b63b20054?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8YmVhY2glMjB3YWxscGFwZXJ8ZW58MHx8MHx8fDA%3D'

export default function Login() {
  const navigate = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/user/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Login failed')
      }

      localStorage.setItem('userInfo', JSON.stringify(data))
      navigate('/chats')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @keyframes lgUp {
          from { opacity:0; transform:translateY(24px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .lg-input { box-sizing: border-box; }
        .lg-input::placeholder { color: rgba(255,255,255,0.38); }
        .lg-input:focus { outline: none; border-color: rgba(96,239,255,0.8); background: rgba(179,203,255,0.13); }
      `}</style>

      <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url('${BG}')` }}>
        <div className="absolute inset-0 z-0 bg-black/40" />

        <div
          className="relative z-10 w-full max-w-[440px] mx-6 p-10 rounded-3xl border border-white/25 [animation:lgUp_0.5s_ease_both]"
          style={{ background: 'rgba(255,255,255,0.13)', backdropFilter: 'blur(24px) saturate(1.6)', WebkitBackdropFilter: 'blur(24px) saturate(1.6)', boxShadow: '0 8px 48px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.28)' }}
        >
          <h1 className="text-[28px] font-bold text-white leading-tight tracking-tight">Welcome back</h1>
          <p className="text-[14px] text-white/60 leading-relaxed mt-2 mb-8">Sign in to continue your conversations.</p>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl text-[13px] text-red-200 border border-red-400/40" style={{ background: 'rgba(220,38,38,0.18)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

            <div className="flex flex-col gap-2">
              <label htmlFor="lg-email" className="text-[11px] font-semibold uppercase tracking-widest text-white/70">Email</label>
              <input id="lg-email" type="email" placeholder="you@example.com" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required className="lg-input w-full rounded-xl border border-white/20 text-[15px] text-white px-4 py-[13px] transition-all duration-200" style={{ background: 'rgba(255,255,255,0.10)' }} />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="lg-pw" className="text-[11px] font-semibold uppercase tracking-widest text-white/70">Password</label>
              <div className="relative">
                <input id="lg-pw" type={showPw ? 'text' : 'password'} placeholder="••••••••" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required className="lg-input w-full rounded-xl border border-white/20 text-[15px] text-white px-4 py-[13px] pr-12 transition-all duration-200" style={{ background: 'rgba(255,255,255,0.10)' }} />
                <button type="button" onClick={() => setShowPw(v => !v)} aria-label="Toggle password" className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0 border-none bg-transparent cursor-pointer text-white/45 hover:text-white/90 transition-colors duration-200">
                  {showPw
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            <div className="flex justify-end -mt-2">
              <NavLink to="/forgot-password" className="text-[13px] text-white/50 no-underline hover:text-[#60efff] transition-colors duration-200">Forgot password?</NavLink>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-[14px] rounded-2xl border-none cursor-pointer text-white text-[16px] font-semibold tracking-wide hover:-translate-y-0.5 active:translate-y-0 transition-transform duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: 'rgba(255,255,255,0.22)' }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-[14px] text-white/50 mt-6">
            Don&apos;t have an account?{' '}
            <NavLink to="/signup" className="text-[#60c0ff] font-semibold no-underline hover:opacity-70 transition-opacity duration-200">Create one</NavLink>
          </p>
        </div>
      </div>
    </>
  )
}
