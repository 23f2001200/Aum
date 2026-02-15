
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Implement actual login logic
        console.log('Login:', { email, password });
        navigate('/');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
            <div className="max-w-md w-full p-8">
                {/* Logo Area */}
                <div className="flex justify-center mb-8">
                    <img src="/Aum.png" alt="Aum" className="h-12 object-contain" />
                </div>

                <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
                        <p className="text-sm text-gray-500 mt-2">Sign in to your Aum account</p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Email</label>
                            <div className="relative">
                                <Mail className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                                <input
                                    type="email"
                                    required
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg text-gray-900 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all sm:text-sm"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Password</label>
                                <a href="#" className="text-xs text-orange-600 hover:text-orange-700 font-medium">Forgot password?</a>
                            </div>
                            <div className="relative">
                                <Lock className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                                <input
                                    type="password"
                                    required
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg text-gray-900 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all sm:text-sm"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all transform hover:scale-[1.02]"
                        >
                            Sign in
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-50 text-center">
                        <p className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <Link to="/register" className="font-medium text-orange-600 hover:text-orange-500">
                                Create free account
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
