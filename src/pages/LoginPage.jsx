import { useState } from 'react'
import { Shield, Mail, Lock, Loader } from 'lucide-react'
import { useAuth } from '../context/AppContext'

const LoginPage = () => {
  const { login } = useAuth()
  const [email,   setEmail]   = useState('')
  const [pass,    setPass]    = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!email || !pass) { setError('Email dan password wajib diisi.'); return }
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      })
      const data = await res.json()
      if (!res.ok) {
        let msg = 'Login gagal.'
        if (data.errors)        msg = Object.values(data.errors).flat().join(' ')
        else if (data.message)  msg = data.message
        setError(msg); return
      }
      login(data.user, data.token)
    } catch (err) {
      setError('Tidak dapat terhubung ke server. Periksa koneksi Anda.')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = (em) => { setEmail(em); setPass('password'); setError('') }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4 py-8 relative overflow-hidden">

      {/* Background glows */}
      <div className="absolute top-[18%] left-[12%] w-[420px] h-[420px] rounded-full bg-[radial-gradient(circle,rgba(59,139,255,0.06)_0%,transparent_68%)] pointer-events-none" />
      <div className="absolute bottom-[18%] right-[12%] w-[320px] h-[320px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.1)_0%,transparent_68%)] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">

        {/* ── Logo ── */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mb-4 shadow-[0_8px_28px_rgba(59,139,255,0.35)]">
            <Shield size={22} className="text-white" />
          </div>
          <h1 className="text-gray-100 font-extrabold text-[22px]">IT Support System</h1>
          <p className="text-gray-500 text-xs mt-1">Enterprise Management Platform</p>
        </div>

        {/* ── Card ── */}
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 sm:p-7 shadow-[0_24px_64px_rgba(0,0,0,0.5)]">

          {/* Email */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="nama@perusahaan.com"
                disabled={loading}
                onKeyDown={e => e.key === 'Enter' && submit()}
                className="w-full bg-white/5 border border-gray-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500 transition disabled:opacity-60"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                type="password"
                value={pass}
                onChange={e => { setPass(e.target.value); setError('') }}
                placeholder="••••••••"
                disabled={loading}
                onKeyDown={e => e.key === 'Enter' && submit()}
                className="w-full bg-white/5 border border-gray-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500 transition disabled:opacity-60"
              />
            </div>
          </div>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between mb-4 text-xs">
            <label className="flex items-center gap-1.5 text-gray-500 cursor-pointer select-none">
              <input type="checkbox" className="accent-blue-500 cursor-pointer" /> Ingat saya
            </label>
            <button className="text-blue-400 hover:text-blue-300 transition bg-transparent border-none cursor-pointer text-xs">
              Lupa password?
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2 text-red-400 text-xs mb-4">
              {error}
            </div>
          )}

          {/* Login button */}
          <button
            onClick={submit}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(59,139,255,0.35)] hover:brightness-110 disabled:opacity-80 disabled:cursor-not-allowed transition"
          >
            {loading ? (
              <><Loader size={15} className="animate-spin" /> Memproses...</>
            ) : 'Masuk'}
          </button>

          {/* Quick login demo */}
          <div className="mt-5">
            <p className="text-gray-600 text-[10px] text-center mb-2">Akses cepat demo</p>
            <div className="flex gap-1.5">
              {[
                ['IT Support', 'rizky@company.com'],
                ['Manager',    'manager@company.com'],
                ['User',       'eko@company.com'],
              ].map(([role, em]) => (
                <button
                  key={role}
                  onClick={() => quickLogin(em)}
                  disabled={loading}
                  className="flex-1 py-1.5 px-1 bg-white/[0.03] border border-gray-700 rounded-lg text-gray-500 text-[10px] font-semibold hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/30 disabled:cursor-not-allowed transition"
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-[11px] mt-5">
          PT Perusahaan Indonesia · v2.1.0
        </p>
      </div>
    </div>
  )
}

export default LoginPage