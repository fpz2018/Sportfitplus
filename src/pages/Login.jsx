import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { Dumbbell, Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [mode, setMode] = useState('password'); // 'password' | 'magic'

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: err } = await supabase.auth.signInWithPassword({ email, password });

    if (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'E-mailadres of wachtwoord onjuist.'
        : err.message);
      setLoading(false);
      return;
    }

    navigate('/');
  }

  async function handleMagicLink(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + '/' },
    });

    setLoading(false);
    if (err) { setError(err.message); return; }
    setMagicSent(true);
  }

  async function handleForgotPassword() {
    if (!email) {
      setError('Vul eerst je e-mailadres in.');
      return;
    }
    setError('');
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    });
    setLoading(false);
    setResetSent(true);
  }

  if (resetSent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center bg-card border border-border rounded-2xl p-8">
          <div className="text-4xl mb-4">📬</div>
          <h2 className="text-xl font-bold text-foreground mb-2">Check je e-mail</h2>
          <p className="text-muted-foreground text-sm">
            We hebben een herstelmail gestuurd naar <span className="text-foreground font-medium">{email}</span>.
            Klik op de link om een nieuw wachtwoord in te stellen.
          </p>
          <button onClick={() => setResetSent(false)}
            className="mt-6 text-sm text-primary hover:underline">
            Terug naar inloggen
          </button>
        </div>
      </div>
    );
  }

  if (magicSent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center bg-card border border-border rounded-2xl p-8">
          <div className="text-4xl mb-4">📬</div>
          <h2 className="text-xl font-bold text-foreground mb-2">Check je e-mail</h2>
          <p className="text-muted-foreground text-sm">
            We hebben een inloglink gestuurd naar <span className="text-foreground font-medium">{email}</span>.
            Klik op de link om in te loggen.
          </p>
          <button onClick={() => setMagicSent(false)}
            className="mt-6 text-sm text-primary hover:underline">
            Andere methode proberen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">Sportfit Plus</span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-7">
          <h1 className="text-xl font-bold text-foreground mb-1">Inloggen</h1>
          <p className="text-muted-foreground text-sm mb-6">Welkom terug</p>

          {/* Mode toggle */}
          <div className="flex gap-2 mb-5">
            {[
              { v: 'password', l: 'Wachtwoord' },
              { v: 'magic', l: 'Magic link' },
            ].map(({ v, l }) => (
              <button key={v} type="button" onClick={() => { setMode(v); setError(''); }}
                className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${
                  mode === v ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
                }`}>
                {l}
              </button>
            ))}
          </div>

          <form onSubmit={mode === 'password' ? handleLogin : handleMagicLink} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">E-mailadres</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="jouw@email.nl"
                  className="w-full bg-input border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Wachtwoord (alleen bij password-mode) */}
            {mode === 'password' && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Wachtwoord</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-input border border-border rounded-xl pl-10 pr-10 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition-all disabled:opacity-60">
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Even wachten...</>
                : mode === 'password' ? 'Inloggen' : 'Magic link versturen'}
            </button>
          </form>

          {mode === 'password' && (
            <button
              type="button"
              onClick={handleForgotPassword}
              className="w-full text-center text-xs text-muted-foreground hover:text-primary mt-3 transition-colors"
            >
              Wachtwoord vergeten?
            </button>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Nog geen account?{' '}
          <Link to="/onboarding" className="text-primary hover:underline font-medium">
            Gratis registreren
          </Link>
        </p>
      </div>
    </div>
  );
}
