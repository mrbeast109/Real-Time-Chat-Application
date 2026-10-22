import React, { useState, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

const BG =
  'https://images.unsplash.com/photo-1471922694854-ff1b63b20054?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8YmVhY2glMjB3YWxscGFwZXJ8ZW58MHx8MHx8fDA%3D'

const API = import.meta.env.VITE_BACKEND_URL
  ? `${import.meta.env.VITE_BACKEND_URL}/api`
  : '/api'

export default function Signup() {
  const navigate = useNavigate()

  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [showCf,   setShowCf]   = useState(false)
  const [picFile,  setPicFile]  = useState(null)
  const [preview,  setPreview]  = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPicFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('name',     name)
      formData.append('email',    email)
      formData.append('password', password)
      if (picFile) formData.append('pic', picFile)

      const res = await fetch(`${API}/user`, {
        method: 'POST',
        body:   formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed')
      }

      localStorage.setItem('userInfo', JSON.stringify(data))
      navigate('/chats')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const EyeIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  )
  const EyeOffIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
  const UploadIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  )

  return (
    <>
      <style>{`
        @keyframes sgUp {
          from { opacity:0; transform:translateY(24px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .sg-input { box-sizing: border-box; }
        .sg-input::placeholder { color: rgba(255,255,255,0.38); }
        .sg-input:focus { outline: none; border-color: rgba(96,239,255,0.8); background: rgba(179,203,255,0.13); }
        .pic-drop:hover { border-color: rgba(96,239,255,0.7); background: rgba(179,203,255,0.12); }
      `}</style>

      <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url('${BG}')` }}>
        <div className="absolute inset-0 z-0 bg-black/40" />

        <div
          className="relative z-10 w-full max-w-[440px] mx-6 p-10 rounded-3xl border border-white/25 [animation:sgUp_0.5s_ease_both]"
          style={{ background: 'rgba(255,255,255,0.13)', backdropFilter: 'blur(24px) saturate(1.6)', WebkitBackdropFilter: 'blur(24px) saturate(1.6)', boxShadow: '0 8px 48px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.28)' }}
        >
          <h1 className="text-[28px] font-bold text-white leading-tight tracking-tight">Create account</h1>
          <p className="text-[14px] text-white/60 leading-relaxed mt-2 mb-8">Join MyChat and start chatting today.</p>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl text-[13px] text-red-200 border border-red-400/40" style={{ background: 'rgba(220,38,38,0.18)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-white/70">Profile Picture <span className="normal-case font-normal text-white/40">(optional)</span></label>
              <div
                className="pic-drop flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/30 py-5 cursor-pointer transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.07)' }}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const file = e.dataTransfer.files[0]
                  if (file && file.type.startsWith('image/')) {
                    setPicFile(file)
                    setPreview(URL.createObjectURL(file))
                  }
                }}
              >
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-20 h-20 rounded-full object-cover border-2 border-white/30 shadow-lg"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-dashed border-white/30 text-white/40">
                    <UploadIcon />
                  </div>
                )}
                <p className="text-[13px] text-white/50 text-center">
                  {preview ? <span className="text-[#60efff]">Change photo</span> : <>Click or drag &amp; drop an image</>}
                </p>
              </div>
              <input
                ref={fileInputRef}
                id="sg-pic"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="sg-name" className="text-[11px] font-semibold uppercase tracking-widest text-white/70">Full Name</label>
              <input id="sg-name" type="text" placeholder="John Doe" autoComplete="name" value={name} onChange={e => setName(e.target.value)} required className="sg-input w-full rounded-xl border border-white/20 text-[15px] text-white px-4 py-[13px] transition-all duration-200" style={{ background: 'rgba(255,255,255,0.10)' }} />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="sg-email" className="text-[11px] font-semibold uppercase tracking-widest text-white/70">Email</label>
              <input id="sg-email" type="email" placeholder="you@example.com" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required className="sg-input w-full rounded-xl border border-white/20 text-[15px] text-white px-4 py-[13px] transition-all duration-200" style={{ background: 'rgba(255,255,255,0.10)' }} />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="sg-pw" className="text-[11px] font-semibold uppercase tracking-widest text-white/70">Password</label>
              <div className="relative">
                <input id="sg-pw" type={showPw ? 'text' : 'password'} placeholder="••••••••" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} required className="sg-input w-full rounded-xl border border-white/20 text-[15px] text-white px-4 py-[13px] pr-12 transition-all duration-200" style={{ background: 'rgba(255,255,255,0.10)' }} />
                <button type="button" onClick={() => setShowPw(v => !v)} aria-label="Toggle" className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0 border-none bg-transparent cursor-pointer text-white/45 hover:text-white/90 transition-colors duration-200">
                  {showPw ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="sg-cf" className="text-[11px] font-semibold uppercase tracking-widest text-white/70">Confirm Password</label>
              <div className="relative">
                <input id="sg-cf" type={showCf ? 'text' : 'password'} placeholder="••••••••" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} required className="sg-input w-full rounded-xl border border-white/20 text-[15px] text-white px-4 py-[13px] pr-12 transition-all duration-200" style={{ background: 'rgba(255,255,255,0.10)' }} />
                <button type="button" onClick={() => setShowCf(v => !v)} aria-label="Toggle" className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0 border-none bg-transparent cursor-pointer text-white/45 hover:text-white/90 transition-colors duration-200">
                  {showCf ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-[14px] rounded-2xl border-none cursor-pointer text-white text-[16px] font-semibold tracking-wide hover:-translate-y-0.5 active:translate-y-0 transition-transform duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: 'rgba(255,255,255,0.22)' }}
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-[14px] text-white/50 mt-6">
            Already have an account?{' '}
            <NavLink to="/login" className="text-[#60c0ff] font-semibold no-underline hover:opacity-70 transition-opacity duration-200">Sign in</NavLink>
          </p>
        </div>
      </div>
    </>
  )
}
