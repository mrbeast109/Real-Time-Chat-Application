import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const BG =
  'https://images.unsplash.com/photo-1471922694854-ff1b63b20054?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8YmVhY2glMjB3YWxscGFwZXJ8ZW58MHx8MHx8fDA%3D'

function Home() {
  const navigate = useNavigate()

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('userInfo'))
    if (user) navigate('/chats')
  }, [navigate])

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .home-btn {
          padding: 14px 36px;
          border-radius: 999px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.18s, opacity 0.18s, box-shadow 0.18s;
          letter-spacing: 0.3px;
        }
        .home-btn:hover { transform: translateY(-2px); opacity: 0.92; }
        .home-btn:active { transform: translateY(0); }
      `}</style>

      <div
        style={{
          minHeight: '100vh', width: '100%',
          backgroundImage: `url('${BG}')`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.48)' }} />

        <div
          style={{
            position: 'relative', zIndex: 1,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 28, textAlign: 'center', padding: '56px 48px',
            background: 'rgba(255,255,255,0.10)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.22)', borderRadius: 28,
            boxShadow: '0 8px 48px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.2)',
            animation: 'fadeUp 0.5s ease both',
            maxWidth: 480, width: '90%',
          }}
        >
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(255,255,255,0.18)',
            border: '1.5px solid rgba(255,255,255,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="30" height="30" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>

          <div>
            <h1 style={{ margin: 0, fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.5px' }}>
              Hello There!
            </h1>
            <p style={{ margin: '10px 0 0', fontSize: 16, color: 'rgba(255,255,255,0.62)', lineHeight: 1.6 }}>
              Connect instantly. Chat effortlessly.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              className="home-btn"
              onClick={() => navigate('/login')}
              style={{
                background: 'rgba(255,255,255,0.22)',
                color: '#fff',
                border: '1.5px solid rgba(255,255,255,0.35)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
              }}
            >
              Login
            </button>
            <button
              className="home-btn"
              onClick={() => navigate('/signup')}
              style={{
                background: '#fff',
                color: '#111',
                border: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.22)',
              }}
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default Home