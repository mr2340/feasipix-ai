import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { GithubIcon, GoogleIcon } from './IconComponents';
import Loader from './Loader';

interface AuthProps {
  onAuthenticated: () => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthenticated }) => {
  const [view, setView] = useState<'signIn' | 'signUp'>('signIn');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const { error } = view === 'signUp'
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
    } else {
      if (view === 'signUp') {
        setMessage('Check your email for the confirmation link!');
      } else {
        onAuthenticated();
      }
    }
    setLoading(false);
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) {
      setError(error.message);
    }
  };
  
  const toggleView = () => {
    setView(view === 'signIn' ? 'signUp' : 'signIn');
    setError('');
    setMessage('');
  };

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-slate-50 dark:bg-slate-800/50 p-8 rounded-lg shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {view === 'signIn' ? 'Sign in to your account' : 'Create a new account'}
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
            Or{' '}
            <button onClick={toggleView} className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">
              {view === 'signIn' ? 'create an account' : 'sign in instead'}
            </button>
          </p>
        </div>

        <div className="space-y-4">
            <button
              onClick={() => handleOAuth('google')}
              className="w-full inline-flex justify-center items-center gap-2 py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 text-sm font-medium text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-600"
            >
              <GoogleIcon className="w-5 h-5" />
              Continue with Google
            </button>
            <button
              onClick={() => handleOAuth('github')}
              className="w-full inline-flex justify-center items-center gap-2 py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 text-sm font-medium text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-600"
            >
              <GithubIcon className="w-5 h-5" />
              Continue with GitHub
            </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-300 dark:border-slate-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-slate-50 dark:bg-slate-800 px-2 text-slate-500 dark:text-slate-400">Or continue with email</span>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full appearance-none rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password-sr" className="sr-only">Password</label>
              <input
                id="password-sr"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full appearance-none rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-800 disabled:bg-slate-500"
            >
              {loading ? <Loader /> : view === 'signIn' ? 'Sign in' : 'Sign up'}
            </button>
          </div>
        </form>
        {error && <p className="text-sm text-center text-red-500 dark:text-red-400">{error}</p>}
        {message && <p className="text-sm text-center text-green-500 dark:text-green-400">{message}</p>}
      </div>
    </div>
  );
};

export default Auth;