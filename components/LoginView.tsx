
import React, { useState } from 'react';
import { supabase } from '../lib/supabase.ts';
import { User } from '../types.ts';

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

    try {
      if (isRegistering) {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        alert('Cadastro realizado! Faça login.');
        setIsRegistering(false);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (e: any) {
      setError(e.message || 'Erro ao processar solicitação.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full border border-indigo-100">
        <h1 className="text-2xl font-black text-center text-gray-800 uppercase mb-8">Ciclo Pro Cloud</h1>
        <form onSubmit={handleAuth} className="space-y-4">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl outline-none focus:border-indigo-500 font-bold" placeholder="E-mail" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl outline-none focus:border-indigo-500 font-bold" placeholder="Senha" />
          {error && <div className="text-red-500 text-[10px] font-black uppercase text-center bg-red-50 py-2 rounded-lg">{error}</div>}
          <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl uppercase text-xs">{isLoading ? 'Processando...' : (isRegistering ? 'Cadastrar' : 'Entrar')}</button>
        </form>
        <button onClick={() => setIsRegistering(!isRegistering)} className="w-full mt-6 text-indigo-400 text-[10px] font-black uppercase tracking-widest">{isRegistering ? 'Já tem conta? Entrar' : 'Novo por aqui? Criar conta'}</button>
      </div>
    </div>
  );
};

export default LoginView;
