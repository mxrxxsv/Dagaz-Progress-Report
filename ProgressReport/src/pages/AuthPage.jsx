import { useState } from 'react'
import logoSrc from '../assets/dagaz-logo.png'

function AuthPage({ authForm, authError, onChangeField, onSubmit, googleAuthUrl }) {
  const [showEmailForm, setShowEmailForm] = useState(false)

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white/90 p-10 shadow-2xl backdrop-blur">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-[var(--brand-primary-soft)]">
              <img
                src={logoSrc}
                alt="Dagaz logo"
                className="h-12 w-12 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  const sibling = e.currentTarget.nextElementSibling
                  if (sibling) sibling.classList.remove('hidden')
                }}
              />
              <span className="hidden text-lg font-extrabold text-[var(--brand-primary)]">DG</span>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-primary)]">Dagaz Progress Portal</p>
              <h1 className="text-2xl font-semibold text-slate-900">Secure login</h1>
              <p className="mt-1 text-sm text-slate-500">Access your progress report.</p>
            </div>
          </div>
          {/* <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-[var(--brand-primary-soft)] text-center text-lg font-bold text-[var(--brand-primary)] shadow-inner md:flex">
            DP
          </div> */}
        </div>

        <div className="space-y-4">
          <a
            href={googleAuthUrl}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-primary-strong)] focus:outline-none focus:ring focus:ring-[var(--brand-focus)]"
          >
            Continue with Google 
          </a>

          <p className="text-center text-xs text-slate-500">
            Google sign-in redirects to the backend; make sure HTTPS is enabled so the secure session cookie is set.
          </p>

          <div className="text-center">
            <button
              type="button"
              className="text-xs font-semibold text-[var(--brand-primary)] underline"
              onClick={() => setShowEmailForm((v) => !v)}
            >
              {showEmailForm ? 'Hide email/password' : 'Use email/password'}
            </button>
          </div>

          {showEmailForm ? (
            <form className="space-y-5" onSubmit={onSubmit}>
              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="email">
                  Work email
                </label>
                <input
                  id="email"
                  type="email"
                  value={authForm.email}
                  onChange={(e) => onChangeField('email', e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none ring-[var(--brand-primary-soft)] focus:border-[var(--brand-primary)] focus:ring"
                  placeholder="you@company.com"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={authForm.password}
                  onChange={(e) => onChangeField('password', e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none ring-[var(--brand-primary-soft)] focus:border-[var(--brand-primary)] focus:ring"
                  placeholder="••••••••"
                  required
                />
              </div>

              {authError ? <p className="text-sm text-rose-600">{authError}</p> : null}

              <button
                type="submit"
                className="w-full rounded-lg border border-[var(--brand-primary)] px-4 py-3 text-center text-sm font-semibold text-[var(--brand-primary)] transition hover:bg-[var(--brand-primary-soft)] focus:outline-none focus:ring focus:ring-[var(--brand-focus)]"
              >
                Sign in with email
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default AuthPage
