'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Building2, Mail, Lock, User, Loader2 } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { CONFIG, cn } from '@/components';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (password.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres');
        }
        await register(email, password, nombre || undefined);
      }
      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_90%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-[#141414] border border-[#262626] rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-6 text-center border-b border-[#262626]">
            <div className="inline-flex p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl mb-4">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              BVC TERMINAL
            </h1>
            <p className="text-slate-500 text-sm mt-1">Bolsa de Valores de Caracas</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#262626]">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors",
                mode === 'login'
                  ? 'bg-[#0a0a0a] text-emerald-400 border-b-2 border-emerald-500'
                  : 'text-slate-500 hover:text-slate-300'
              )}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); }}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors",
                mode === 'register'
                  ? 'bg-[#0a0a0a] text-emerald-400 border-b-2 border-emerald-500'
                  : 'text-slate-500 hover:text-slate-300'
              )}
            >
              Registrarse
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-xs text-slate-400 mb-2 font-mono uppercase">Nombre (opcional)</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Tu nombre"
                    className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-400 mb-2 font-mono uppercase">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-2 font-mono uppercase">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={mode === 'register' ? 6 : 1}
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              {mode === 'register' && (
                <p className="text-xs text-slate-500 mt-1">Mínimo 6 caracteres</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-lg font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-xs mt-4">
          Tus datos están seguros. El portafolio es privado y solo tú puedes verlo.
        </p>
      </motion.div>
    </div>
  );
}
