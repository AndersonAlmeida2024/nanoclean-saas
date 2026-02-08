import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [cooldown, setCooldown] = useState<number>(0);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const timerRef = useRef<number | null>(null);

    // Carregar cooldown do localStorage ao montar
    useEffect(() => {
        const savedCooldown = localStorage.getItem('forgot_password_cooldown');
        if (savedCooldown) {
            const expiryTime = parseInt(savedCooldown, 10);
            const now = Date.now();
            const remaining = Math.ceil((expiryTime - now) / 1000);

            if (remaining > 0) {
                startCooldown(remaining);
            } else {
                localStorage.removeItem('forgot_password_cooldown');
            }
        }

        return () => {
            if (timerRef.current) {
                window.clearInterval(timerRef.current);
            }
        };
    }, []);

    const startCooldown = (seconds: number) => {
        setCooldown(seconds);
        
        // Salvar tempo de expiração no localStorage
        const expiryTime = Date.now() + (seconds * 1000);
        localStorage.setItem('forgot_password_cooldown', expiryTime.toString());

        if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
        }

        timerRef.current = window.setInterval(() => {
            setCooldown((c) => {
                if (c <= 1) {
                    if (timerRef.current) {
                        window.clearInterval(timerRef.current);
                        timerRef.current = null;
                    }
                    localStorage.removeItem('forgot_password_cooldown');
                    return 0;
                }
                return c - 1;
            });
        }, 1000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);

        const cleanEmail = email.trim().toLowerCase();

        if (cooldown > 0) {
            setError(`Aguarde ${cooldown}s antes de solicitar outro link.`);
            return;
        }

        if (!isValidEmail(cleanEmail)) {
            setError('Digite um e-mail válido.');
            return;
        }

        setIsLoading(true);

        try {
            const redirectTo = `${window.location.origin}/reset`;
            
            // Iniciar cooldown preventivo de 60s antes mesmo de chamar, 
            // para evitar spam de cliques
            startCooldown(60);

            const { error: supaError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
                redirectTo,
            });

            if (supaError) {
                console.error('resetPasswordForEmail error:', supaError);
                const msg = supaError.message?.toLowerCase() || '';
                const status = (supaError as any)?.status;

                // Rate limit handling
                if (status === 429 || msg.includes('rate') || msg.includes('too many') || msg.includes('limit')) {
                    setError('Muitas tentativas. Aguarde 3 minutos antes de tentar novamente.');
                    startCooldown(180); // 3 min forced cooldown
                } else if (msg.includes('redirect') || msg.includes('url')) {
                    setError('Erro de configuração de URL no sistema via Supabase.');
                } else {
                    setError('Erro ao enviar e-mail. Tente novamente mais tarde.');
                }
                return;
            }

            setMessage('E-mail de recuperação enviado! Verifique sua caixa de entrada e spam.');
            setEmail('');
        } catch (err: any) {
            console.error('Forgot password unexpected error:', err);
            setError('Erro inesperado. Tente novamente mais tarde.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative">
            <div className="w-full max-w-md">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                    <h2 className="text-2xl font-bold text-white mb-4">Recuperar senha</h2>
                    <p className="text-gray-400 mb-6">Digite seu e-mail e enviaremos um link para redefinir sua senha.</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
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

                        {error && <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">{error}</p>}
                        {message && <p className="text-green-400 text-sm bg-green-500/10 p-3 rounded-lg">{message}</p>}

                        <button
                            type="submit"
                            disabled={isLoading || cooldown > 0}
                            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Enviar link {cooldown > 0 ? `(${cooldown}s)` : ''} <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-gray-400 mt-6">
                        Lembrou a senha?{' '}
                        <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
                            Entrar
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}