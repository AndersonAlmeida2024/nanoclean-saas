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
        // Supabase costuma colocar tokens na hash da URL (window.location.hash) ou em query params
        // Vamos mesclar ambos para garantir compatibilidade
        const combined = [window.location.search.replace(/^\?/, ''), window.location.hash.replace(/^#/, '')]
            .filter(Boolean)
            .join('&');
        const params = new URLSearchParams(combined);
        const at = params.get('access_token') || params.get('access-token');
        const rt = params.get('refresh_token') || params.get('refresh-token');
        if (!at) {
            // nenhum token encontrado
            setTokensPresent(false);
            setError('Link inválido ou incompleto. Solicite um novo link de recuperação.');
            console.debug('ResetPasswordPage: no access_token found in URL');
            return;
        }

        setTokensPresent(true);

        // tenta setar sessão para permitir updateUser
        (async () => {
            try {
                // @ts-expect-error - setSession may not be typed for the SDK variants
                await supabase.auth.setSession({ access_token: at, refresh_token: rt });
            } catch (e: any) {
                // Log real reason for dev, but show a clean UI message
                console.warn('setSession failed:', e);
                setError('Não foi possível validar o link de redefinição. Você pode solicitar um novo link.');
                setTokensPresent(false);
            }
        })();
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
