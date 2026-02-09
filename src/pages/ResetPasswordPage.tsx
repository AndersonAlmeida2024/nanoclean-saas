import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function ResetPasswordPage() {
    const navigate = useNavigate();
    const [tokensPresent, setTokensPresent] = useState<boolean | null>(null);
    // tokens captured from URL are not stored separately
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Função para extrair tokens tanto de query params (?) quanto de hash (#)
        const getParam = (name: string) => {
            const urlParams = new URLSearchParams(window.location.search);
            const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
            return urlParams.get(name) || hashParams.get(name);
        };

        const at = getParam('access_token');
        const rt = getParam('refresh_token');

        if (!at) {
            setTokensPresent(false);
            setError('Link inválido ou expirado. Solicite um novo link.');
            return;
        }

        setTokensPresent(true);

        // Tenta validar a sessão com os tokens recebidos
        const setupSession = async () => {
            try {
                const { error } = await supabase.auth.setSession({
                    access_token: at,
                    refresh_token: rt || '',
                });
                if (error) throw error;
            } catch (e) {
                console.error('Erro ao validar sessão:', e);
                setError('Sessão expirada. Solicite um novo link de recuperação.');
                setTokensPresent(false);
            }
        };

        setupSession();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setMessage(null);
        try {
            // Se houver sessão (token) configurado, podemos chamar updateUser
            const { error: updateError } = await supabase.auth.updateUser({ password });
            if (updateError) {
                // Log completo para debugging, mas mensagem limpa para o usuário
                console.error('updateUser error:', updateError);
                const msg = (updateError.message || '').toLowerCase();
                if (/expire|expired|invalid|token/i.test(msg)) {
                    setError('Link expirado ou inválido. Solicite um novo link.');
                    // indicar ao usuário a opção de reenviar
                    setTokensPresent(false);
                } else {
                    setError('Não foi possível atualizar a senha. Tente novamente mais tarde.');
                }
            } else {
                setMessage('Senha atualizada com sucesso. Você será redirecionado para entrar.');
                setTimeout(() => navigate('/login'), 2500);
            }
        } catch (err: any) {
            console.error('Reset password unexpected error:', err);
            setError('Erro ao redefinir senha. Tente novamente mais tarde.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative">
            <div className="w-full max-w-md">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                    <h2 className="text-2xl font-bold text-white mb-4">Redefinir senha</h2>

                    {message ? (
                        <p className="text-green-400">{message}</p>
                    ) : (
                        <>
                            <p className="text-gray-400 mb-4">Escolha uma nova senha para sua conta.</p>

                            {tokensPresent === false && (
                                <div className="mb-4 p-3 bg-yellow-700/10 rounded-md text-yellow-300">
                                    Link inválido ou incompleto. <br />
                                    Clique em <a href="/forgot" className="underline">Reenviar e-mail</a> para receber outro link.
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Nova senha</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50"
                                    />
                                </div>

                                {error && <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">{error}</p>}

                                {/* Se o token for inválido/expirado mostramos um botão pra reenviar */}
                                {tokensPresent === false && (
                                    <div className="flex gap-2">
                                        <a href="/forgot" className="text-sm bg-cyan-600/10 text-cyan-300 px-3 py-2 rounded-md">Reenviar e-mail</a>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        'Redefinir senha'
                                    )}
                                </button>
                            </form>

                            <p className="text-center text-gray-400 mt-6">
                                Voltar para{' '}
                                <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">Entrar</Link>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
