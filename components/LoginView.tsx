
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email.trim() || !password.trim()) {
      setError('Preencha todos os campos.');
      setIsLoading(false);
      return;
    }

    try {
      if (isRegistering) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        alert('Cadastro realizado! Verifique seu e-mail ou faça login.');
        setIsRegistering(false);
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        // O App.tsx via onAuthStateChange cuidará de setar o usuário
      }
    } catch (e: any) {
      setError(e.message || 'Erro ao processar solicitação.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full border border-indigo-100 animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-4.514A9.01 9.01 0 0012 21a9.003 9.003 0 008.384-5.762M9 9a3 3 0 116 0 3 3 0 01-6 0zm6 3.32V1c0-.552-.448-1-1-1H7c-.552 0-1 .448-1 1v11.32c0 .552.448 1 1 1h7c.552 0 1-.448 1-1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">
            {isRegistering ? 'Criar Conta' : 'Acesso Nuvem'}
          </h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">
            Estudo Ciclo Pro Cloud
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-indigo-500 outline-none transition-all font-bold"
              placeholder="exemplo@email.com"
              autoComplete="email"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-indigo-500 outline-none transition-all font-bold"
              placeholder="••••••••"
              autoComplete={isRegistering ? "new-password" : "current-password"}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="text-red-500 text-[10px] font-black uppercase text-center bg-red-50 py-2 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-xl shadow-lg shadow-indigo-100 active:scale-95 transition-all uppercase text-xs disabled:opacity-50"
          >
            {isLoading ? 'Aguarde...' : (isRegistering ? 'Finalizar Cadastro' : 'Entrar na Conta')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
            }}
            className="text-indigo-400 hover:text-indigo-600 text-[10px] font-black uppercase tracking-widest transition-colors"
          >
            {isRegistering ? 'Já tenho conta? Acessar' : 'Não tem conta nuvem? Criar agora'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
