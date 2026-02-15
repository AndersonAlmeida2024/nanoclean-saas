import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail, Lock, Eye, EyeOff, ArrowRight, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function RegisterPage() {
    const [name, setName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // navigate and setUser intentionally unused after disabling auto-login

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Validação básica
        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            setIsLoading(false);
            return;
        }

        try {
            // Registro real com Supabase
            const { data, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                        name: name,
                        company_name: companyName || 'Minha Empresa',
                    },
                },
            });

            if (authError) {
                console.error('Register error:', authError);
                if (authError.message.includes('already registered')) {
                    setError('Este e-mail já está cadastrado. Faça login para continuar.');
                } else if (authError.message.includes('rate limit')) {
                    setError('Muitas tentativas em pouco tempo. Aguarde 1 minuto e tente novamente.');
                } else if (authError.message.includes('Database error')) {
                    setError('Erro ao configurar sua empresa. Por favor, tente novamente ou entre em contato com o suporte.');
                } else if (authError.message.includes('Password should be')) {
                    setError('A senha não atende aos requisitos de segurança. Tente uma senha mais forte.');
                } else {
                    setError(authError.message);
                }
                return;
            }

            if (data.user) {
                // Por segurança, não realizar auto-login automático aqui.
                // Mesmo que o SDK retorne session (ex.: confirmação desabilitada),
                // preferimos que o usuário confirme o e-mail ou realize login explícito.
                setSuccess(true);
            }
        } catch (err) {
            console.error('Register error:', err);
            setError('Erro ao criar conta. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
                <div className="w-full max-w-md text-center">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8">
                        <Sparkles className="text-green-400 mx-auto mb-4" size={48} />
                        <h2 className="text-2xl font-bold text-white mb-4">Conta criada!</h2>
                        <p className="text-gray-400 mb-6">
                            Enviamos um link de confirmação para <strong className="text-white">{email}</strong>.
                            Verifique sua caixa de entrada.
                        </p>
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
                        >
                            Ir para o login <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

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
                    <p className="text-gray-400">Comece a profissionalizar seu negócio hoje</p>
                </div>

                {/* Register Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                    <h2 className="text-2xl font-bold text-white mb-6">Criar nova conta</h2>

                    <form onSubmit={handleRegister} className="space-y-5">
                        {/* Name */}
                        <div>
                            <label htmlFor="register-name" className="sr-only">Nome Completo</label>
                            <label className="block text-sm text-gray-400 mb-2">Nome Completo</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    id="register-name"
                                    name="full_name"
                                    required
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Seu nome"
                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50"
                                />
                            </div>
                        </div>

                        {/* Company Name */}
                        <div>
                            <label htmlFor="register-company" className="sr-only">Nome da Empresa</label>
                            <label className="block text-sm text-gray-400 mb-2">Nome da Empresa</label>
                            <div className="relative">
                                <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="4" y="2" width="16" height="20" rx="2" />
                                    <path d="M9 6h6" />
                                    <path d="M9 10h6" />
                                    <path d="M9 14h6" />
                                    <path d="M9 18h6" />
                                </svg>
                                <input
                                    id="register-company"
                                    name="company_name"
                                    required
                                    type="text"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    placeholder="Nome da sua empresa"
                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="register-email" className="sr-only">E-mail</label>
                            <label className="block text-sm text-gray-400 mb-2">E-mail</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    id="register-email"
                                    name="email"
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="register-password" title="Senha" className="sr-only">Senha (mínimo 6 caracteres)</label>
                            <label className="block text-sm text-gray-400 mb-2">Senha (mínimo 6 caracteres)</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    id="register-password"
                                    name="password"
                                    required
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-12 pr-12 text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 focus:outline-none focus:text-cyan-400"
                                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">{error}</p>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Criar Conta <ArrowRight size={18} />
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

                    {/* Login Link */}
                    <p className="text-center text-gray-400">
                        Já tem conta?{' '}
                        <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
                            Fazer login
                        </Link>
                    </p>
                </div>

                {/* Footer */}
                <p className="text-center text-gray-400 text-sm mt-6">
                    Ao se cadastrar, você concorda com nossos Termos e Privacidade.
                </p>
            </div>
        </div>
    );
}
