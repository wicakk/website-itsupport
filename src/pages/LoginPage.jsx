import { useState } from 'react'
import { Shield, Mail, Lock, Loader } from 'lucide-react'
import { T, inputStyle, labelStyle } from '../theme'
import { useAuth } from '../context/AppContext'

const LoginPage = () => {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!email || !pass) {
      setError('Email dan password wajib diisi.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      })

      const data = await res.json()

      if (!res.ok) {
        // Handle Laravel validation / auth errors
        let msg = 'Login gagal.'
        if (data.errors) {
          msg = Object.values(data.errors).flat().join(' ')
        } else if (data.message) {
          msg = data.message
        }
        setError(msg)
        return
      }

      // Berhasil → simpan user + token di context
      login(data.user, data.token)
    } catch (err) {
      setError('Tidak dapat terhubung ke server. Periksa koneksi Anda.')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Quick login demo
  const quickLogin = (em) => {
    setEmail(em)
    setPass('password')
    setError('')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: T.bg,
        padding: 16,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Glows */}
      <div
        style={{
          position: 'absolute',
          top: '18%',
          left: '12%',
          width: 420,
          height: 420,
          background: `radial-gradient(circle,${T.accent}10 0%,transparent 68%)`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '18%',
          right: '12%',
          width: 320,
          height: 320,
          background: `radial-gradient(circle,${T.purple}18 0%,transparent 68%)`,
          pointerEvents: 'none',
        }}
      />

      <div style={{ width: '100%', maxWidth: 380, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: `linear-gradient(135deg,${T.accent},${T.accentDark})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: `0 8px 28px ${T.accentGlow}`,
            }}
          >
            <Shield size={22} color="#fff" />
          </div>
          <h1 style={{ color: T.text, fontWeight: 800, fontSize: 22 }}>IT Support System</h1>
          <p style={{ color: T.textMuted, fontSize: 12, marginTop: 5 }}>
            Enterprise Management Platform
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 20,
            padding: 28,
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          }}
        >
          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={13}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: T.textDim,
                  pointerEvents: 'none',
                }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError('')
                }}
                placeholder="nama@perusahaan.com"
                disabled={loading}
                style={{ ...inputStyle, paddingLeft: 36, opacity: loading ? 0.6 : 1 }}
                onFocus={(e) => (e.target.style.borderColor = T.accent)}
                onBlur={(e) => (e.target.style.borderColor = T.border)}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={13}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: T.textDim,
                  pointerEvents: 'none',
                }}
              />
              <input
                type="password"
                value={pass}
                onChange={(e) => {
                  setPass(e.target.value)
                  setError('')
                }}
                placeholder="••••••••"
                disabled={loading}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                style={{ ...inputStyle, paddingLeft: 36, opacity: loading ? 0.6 : 1 }}
                onFocus={(e) => (e.target.style.borderColor = T.accent)}
                onBlur={(e) => (e.target.style.borderColor = T.border)}
              />
            </div>
          </div>

          {/* Options */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
              fontSize: 12,
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: T.textMuted,
                cursor: 'pointer',
              }}
            >
              <input type="checkbox" style={{ accentColor: T.accent }} /> Ingat saya
            </label>
            <button
              style={{
                color: T.accent,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              Lupa password?
            </button>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                background: `${T.danger}10`,
                border: `1px solid ${T.danger}25`,
                borderRadius: 8,
                padding: '8px 12px',
                color: T.danger,
                fontSize: 12,
                marginBottom: 14,
              }}
            >
              {error}
            </div>
          )}

          {/* Button Login */}
          <button
            onClick={submit}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: `linear-gradient(135deg,${T.accent},${T.accentDark})`,
              border: 'none',
              borderRadius: 11,
              color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontWeight: 700,
              boxShadow: `0 6px 20px ${T.accentGlow}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: loading ? 0.8 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {loading ? (
              <>
                <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Memproses...
              </>
            ) : (
              'Masuk'
            )}
          </button>

          <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>

          {/* Quick login demo */}
          <div style={{ marginTop: 14 }}>
            <p style={{ color: T.textDim, fontSize: 10, textAlign: 'center', marginBottom: 8 }}>
              Akses cepat demo
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                ['IT Support', 'rizky@company.com'],
                ['Manager', 'manager@company.com'],
                ['User', 'user@company.com'],
              ].map(([role, em]) => (
                <button
                  key={role}
                  onClick={() => quickLogin(em)}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '6px 4px',
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${T.border}`,
                    borderRadius: 8,
                    color: T.textDim,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: 10,
                    fontWeight: 600,
                    transition: 'all .2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = T.accentSoft
                    e.currentTarget.style.color = T.accent
                    e.currentTarget.style.borderColor = T.borderAccent
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                    e.currentTarget.style.color = T.textDim
                    e.currentTarget.style.borderColor = T.border
                  }}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: T.textDim, fontSize: 11, marginTop: 20 }}>
          PT Perusahaan Indonesia · v2.1.0
        </p>
      </div>
    </div>
  )
}

export default LoginPage