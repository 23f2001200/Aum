
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Video, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();
    const { signUp } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const { error } = await signUp(email, password, name);
            
            if (error) {
                setError(error.message);
            } else {
                setSuccess(true);
                // Redirect to login after 2 seconds
                setTimeout(() => navigate('/login'), 2000);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 font-sans relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[10%] left-[20%] w-[50vh] h-[50vh] rounded-full bg-purple-900/20 blur-[120px]"></div>
                <div className="absolute bottom-[20%] right-[20%] w-[60vh] h-[60vh] rounded-full bg-blue-900/10 blur-[100px]"></div>
            </div>

            <div className="max-w-md w-full p-8 relative z-10">
                {/* Logo Area */}
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-2">
                        <div className="bg-gradient-to-tr from-purple-600 to-pink-600 p-2.5 rounded-xl shadow-lg shadow-purple-900/20">
                            <Video className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                            Aum
                        </span>
                    </div>
                </div>

                <div className="glass rounded-2xl p-8 border border-white/10 shadow-2xl backdrop-blur-xl">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-white tracking-tight">Create an account</h2>
                        <p className="text-sm text-zinc-400 mt-2">Start your 14-day free trial</p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                        {success && (
                            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">
                                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                <span>Account created! Check your email to confirm. Redirecting to login...</span>
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 ml-1">Full Name</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl text-zinc-100 bg-black/20 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-black/40 transition-all sm:text-sm"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 ml-1">Email</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl text-zinc-100 bg-black/20 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-black/40 transition-all sm:text-sm"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl text-zinc-100 bg-black/20 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-black/40 transition-all sm:text-sm"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || success}
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-purple-900/20 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-purple-500 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Create Account
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/10 text-center">
                        <p className="text-sm text-zinc-400">
                            Already have an account?{' '}
                            <Link to="/login" className="font-medium text-purple-400 hover:text-purple-300 transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
