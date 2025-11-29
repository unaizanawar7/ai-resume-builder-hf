import React, { useState } from 'react';
import { LogIn, Mail, Lock, AlertCircle, Loader, UserPlus } from 'lucide-react';
import { authAPI } from './services/api';

function Login({ onLogin, onSwitchToSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await authAPI.login(email, password);
      
      if (response.success) {
        // Store user data
        localStorage.setItem('user', JSON.stringify(response.data.user));
        onLogin(response.data.user);
      } else {
        setError(response.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Unable to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen animated-gradient flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 mesh-background opacity-30"></div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      
      <div className="max-w-md w-full glass-strong rounded-3xl shadow-2xl p-8 backdrop-blur-xl border border-white/30 slide-in-up relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl mb-4 shadow-lg float">
            <LogIn className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text">Welcome Back!</span>
          </h1>
          <p className="text-white/80 text-lg">Sign in to continue building amazing resumes</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 glass-dark rounded-xl flex items-start gap-3 slide-in-down border border-red-400/30">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-200 font-medium">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div className="group">
            <label htmlFor="email" className="block text-sm font-semibold text-white/90 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 group-focus-within:text-cyan-400 transition-colors" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full pl-12 pr-4 py-4 glass rounded-xl text-white placeholder-white/50 outline-none focus:ring-2 focus:ring-cyan-400/50 focus:scale-[1.02] transition-all duration-300"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="group">
            <label htmlFor="password" className="block text-sm font-semibold text-white/90 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 group-focus-within:text-cyan-400 transition-colors" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-4 glass rounded-xl text-white placeholder-white/50 outline-none focus:ring-2 focus:ring-cyan-400/50 focus:scale-[1.02] transition-all duration-300"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 btn-premium text-white font-bold rounded-xl shadow-lg glow-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
          >
            {loading ? (
              <>
                <Loader className="w-6 h-6 animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                <LogIn className="w-6 h-6" />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="mt-8 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/20"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 glass text-white/80 rounded-full">Don't have an account?</span>
          </div>
        </div>

        {/* Switch to Signup */}
        <button
          onClick={onSwitchToSignup}
          className="mt-8 w-full py-4 glass-dark text-white font-bold rounded-xl border-2 border-cyan-400/50 hover:border-cyan-400 hover:bg-white/10 transition-all flex items-center justify-center gap-3 text-lg hover-lift"
        >
          <UserPlus className="w-6 h-6" />
          Create New Account
        </button>
      </div>
    </div>
  );
}

export default Login;

