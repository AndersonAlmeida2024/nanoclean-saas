import { Sparkles, CheckCircle, Calendar, DollarSign, MessageCircle, Zap, ArrowRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';


const FEATURES = [
    {
        icon: Calendar,
        title: 'Agenda Inteligente',
        description: 'Gerencie seus agendamentos com calendário visual e lembretes automáticos.',
        gradient: 'from-cyan-500 to-blue-500',
    },
    {
        icon: MessageCircle,
        title: 'Chat Unificado',
        description: 'Receba mensagens do WhatsApp, Instagram e Facebook em um só lugar.',
        gradient: 'from-green-500 to-emerald-500',
    },
    {
        icon: DollarSign,
        title: 'Controle Financeiro',
        description: 'Acompanhe receitas, despesas e lucro em tempo real com gráficos claros.',
        gradient: 'from-yellow-500 to-orange-500',
    },
    {
        icon: Sparkles,
        title: 'AI Studio',
        description: 'Crie legendas profissionais para suas redes sociais em segundos.',
        gradient: 'from-purple-500 to-pink-500',
    },
];

const TESTIMONIALS = [
    {
        name: 'Carlos Mendes',
        company: 'Higiene Premium',
        text: 'Dobrei meu faturamento em 3 meses. O AI Studio me economiza 2 horas por dia.',
        rating: 5,
        avatar: 'CM',
    },
    {
        name: 'Ana Beatriz',
        company: 'Clean Plus',
        text: 'Finalmente sei exatamente quanto lucro por serviço. Ferramenta indispensável!',
        rating: 5,
        avatar: 'AB',
    },
];



export function LandingPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden relative">
            {/* Background Orbs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="orb orb-purple w-[800px] h-[800px] -top-[400px] -left-[200px] animate-orb" />
                <div className="orb orb-cyan w-[600px] h-[600px] top-[20%] -right-[200px] animate-orb" style={{ animationDelay: '-5s' }} />
            </div>
            <nav className="relative z-10 flex items-center justify-between px-6 lg:px-20 py-6">
                <div className="flex items-center gap-2">
                    <Sparkles className="text-cyan-400" size={28} />
                    <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                        NanoClean
                    </span>
                </div>

                <div className="hidden md:flex items-center gap-8">
                    <a href="#features" className="text-gray-400 hover:text-white transition-colors">Recursos</a>
                    <a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Preços</a>
                    <a href="#testimonials" className="text-gray-400 hover:text-white transition-colors">Depoimentos</a>
                </div>

                <Link
                    to="/login"
                    className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 px-6 py-2 rounded-full font-medium transition-all"
                >
                    Entrar
                </Link>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 px-6 lg:px-20 pt-20 pb-32 text-center">
                <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-8">
                    <Zap className="text-yellow-400" size={16} />
                    <span className="text-sm text-gray-300">IA integrada para marketing automático</span>
                </div>

                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold max-w-4xl mx-auto leading-tight mb-6">
                    Gerencie seu negócio de{' '}
                    <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                        limpeza profissional
                    </span>
                </h1>

                <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
                    Agenda, financeiro, clientes e marketing em uma única plataforma.
                    Feito por higienizadores, para higienizadores.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        to="/register"
                        className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 px-8 py-4 rounded-full font-semibold text-lg transition-all shadow-lg shadow-purple-900/30"
                    >
                        Começar Grátis <ArrowRight size={20} />
                    </Link>
                    <button className="px-8 py-4 border border-white/20 rounded-full font-medium hover:bg-white/5 transition-colors">
                        Ver Demonstração
                    </button>
                </div>

                <p className="text-sm text-gray-500 mt-6">
                    ✓ 14 dias grátis  ✓ Sem cartão de crédito  ✓ Cancele quando quiser
                </p>
            </section>

            {/* Features Section */}
            <section id="features" className="relative z-10 px-6 lg:px-20 py-24 bg-white/[0.02]">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Tudo que você precisa em um só lugar</h2>
                    <p className="text-gray-400 max-w-xl mx-auto">
                        Pare de usar 10 apps diferentes. O NanoClean centraliza toda a gestão do seu negócio.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                    {FEATURES.map((feature, index) => (
                        <div
                            key={index}
                            className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.08] transition-all hover:-translate-y-1"
                        >
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                                <feature.icon className="text-cyan-400" size={24} />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                            <p className="text-gray-400 text-sm">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="relative z-10 px-6 lg:px-20 py-24">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Preço simples e justo</h2>
                    <p className="text-gray-400">Comece grátis e evolua conforme seu negócio cresce.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {/* Free Plan */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                        <h3 className="text-xl font-semibold mb-2">Starter</h3>
                        <p className="text-gray-400 text-sm mb-6">Para quem está começando</p>
                        <div className="mb-6">
                            <span className="text-4xl font-bold">Grátis</span>
                        </div>
                        <ul className="space-y-3 mb-8">
                            {['Até 30 clientes', 'Agenda básica', 'Relatórios simples'].map((item, i) => (
                                <li key={i} className="flex items-center gap-2 text-gray-300">
                                    <CheckCircle className="text-green-400" size={16} />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <button className="w-full py-3 border border-white/20 rounded-xl font-medium hover:bg-white/5 transition-colors">
                            Começar Grátis
                        </button>
                    </div>

                    {/* Pro Plan */}
                    <div className="bg-gradient-to-b from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-2xl p-8 relative">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-purple-500 px-4 py-1 rounded-full text-xs font-semibold">
                            MAIS POPULAR
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Profissional</h3>
                        <p className="text-gray-400 text-sm mb-6">Para negócios em crescimento</p>
                        <div className="mb-6">
                            <span className="text-4xl font-bold">R$ 97</span>
                            <span className="text-gray-400">/mês</span>
                        </div>
                        <ul className="space-y-3 mb-8">
                            {['Clientes ilimitados', 'AI Studio completo', 'Financeiro avançado', 'Integrações Meta', 'Suporte prioritário'].map((item, i) => (
                                <li key={i} className="flex items-center gap-2 text-gray-300">
                                    <CheckCircle className="text-cyan-400" size={16} />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <button className="w-full py-3 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-xl font-semibold hover:from-cyan-500 hover:to-purple-500 transition-all">
                            Assinar Agora
                        </button>
                    </div>

                    {/* Enterprise Plan */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                        <h3 className="text-xl font-semibold mb-2">Enterprise</h3>
                        <p className="text-gray-400 text-sm mb-6">Para equipes e franquias</p>
                        <div className="mb-6">
                            <span className="text-4xl font-bold">Sob consulta</span>
                        </div>
                        <ul className="space-y-3 mb-8">
                            {['Múltiplos usuários', 'API personalizada', 'White-label', 'Gerente dedicado'].map((item, i) => (
                                <li key={i} className="flex items-center gap-2 text-gray-300">
                                    <CheckCircle className="text-green-400" size={16} />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <button className="w-full py-3 border border-white/20 rounded-xl font-medium hover:bg-white/5 transition-colors">
                            Falar com Vendas
                        </button>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section id="testimonials" className="relative z-10 px-6 lg:px-20 py-24 bg-white/[0.02]">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">O que nossos clientes dizem</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {TESTIMONIALS.map((testimonial, index) => (
                        <div key={index} className="bg-white/5 border border-white/10 rounded-2xl p-8">
                            <div className="flex gap-1 mb-4">
                                {Array.from({ length: testimonial.rating }).map((_, i) => (
                                    <Star key={i} className="text-yellow-400 fill-yellow-400" size={18} />
                                ))}
                            </div>
                            <p className="text-gray-300 mb-6">"{testimonial.text}"</p>
                            <div>
                                <p className="font-semibold">{testimonial.name}</p>
                                <p className="text-sm text-gray-500">{testimonial.company}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative z-10 px-6 lg:px-20 py-24 text-center">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">
                    Pronto para profissionalizar seu negócio?
                </h2>
                <p className="text-gray-400 mb-10 max-w-2xl mx-auto">
                    Junte-se a centenas de higienizadores que já transformaram sua operação com o NanoClean.
                </p>
                <Link
                    to="/register"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 px-8 py-4 rounded-full font-semibold text-lg transition-all shadow-lg shadow-purple-900/30"
                >
                    Começar Agora <ArrowRight size={20} />
                </Link>
            </section>

            {/* Footer */}
            <footer className="relative z-10 px-6 lg:px-20 py-12 border-t border-white/10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <Sparkles className="text-cyan-400" size={24} />
                        <span className="text-xl font-bold">NanoClean</span>
                    </div>
                    <p className="text-gray-500 text-sm">© 2024 NanoClean. Todos os direitos reservados.</p>
                    <div className="flex gap-6 text-gray-400 text-sm">
                        <a href="#" className="hover:text-white transition-colors">Termos</a>
                        <a href="#" className="hover:text-white transition-colors">Privacidade</a>
                        <a href="#" className="hover:text-white transition-colors">Contato</a>
                    </div>
                </div>
            </footer>
        </div >
    );
}
