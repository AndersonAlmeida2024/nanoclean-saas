import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';

export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const setUser = useAuthStore((state) => state.setUser);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Autenticação real com Supabase
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                if (authError.message.includes('Invalid login credentials')) {
                    setError('E-mail ou senha incorretos.');
                } else if (authError.message.includes('Email not confirmed')) {
                    setError('Confirme seu e-mail antes de fazer login.');
                } else {
                    setError(authError.message);
                }
                return;
            }

            if (data.user) {
                setUser(data.user);
                navigate('/');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Erro ao fazer login. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-900/10 blur-[120px]" />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <Sparkles className="text-cyan-400" size={32} />
                        <span className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                            NanoClean
                        </span>
                    </div>
                    <p className="text-gray-400">Gerencie seu negócio de limpeza com inteligência</p>
                </div>

                {/* Login Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                    <h2 className="text-2xl font-bold text-white mb-6">Entrar na conta</h2>

                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">E-mail</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    required
                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-12 pr-12 text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">{error}</p>
                        )}

                        {/* Forgot Password */}
                        <div className="text-right">
                            <Link to="/forgot" className="text-sm text-cyan-400 hover:text-cyan-300">
                                Esqueceu a senha?
                            </Link>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Entrar <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-gray-500 text-sm">ou</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Register Link */}
                    <p className="text-center text-gray-400">
                        Não tem conta?{' '}
                        <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-medium">
                            Criar conta grátis
                        </Link>
                    </p>
                </div>

                {/* Footer */}
                <p className="text-center text-gray-600 text-sm mt-6">
                    © 2026 NanoClean. Todos os direitos reservados.
                </p>
            </div>
        </div>
    );
}
