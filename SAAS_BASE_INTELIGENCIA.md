# NanoClean - SaaS Base de Inteligência (CTO-Level)

Este documento guarda os princípios e regras de ouro para o desenvolvimento e escala do NanoClean.

## 🧱 Arquitetura e Stack
- **Padrão**: Clean Architecture-lite.
- **Frontend**: React + TypeScript + Vite.
- **Backend**: Supabase (PostgreSQL + RLS).
- **Princípio**: O Frontend NUNCA decide quem o usuário é. O Banco decide via RLS.

## 🧬 Versionamento do Golden Master
- **v1_core**: Isolamento tenant básico (1 user = 1 company). [IMUTÁVEL]
- **v2_multi_user**: Convites, roles e múltiplos usuários por tenant. [ESTÁVEL]
- **v3_billing**: Planos, limites e gateways de pagamento. [EM EVOLUÇÃO]

## 💎 Regras do "Core Imutável" (O que NÃO pode mudar)
1. **Schema do company_id**: Toda tabela tenant-aware deve manter o nome `company_id`.
2. **Função RLS SSOT**: `public.get_current_user_company_id()` é a única fonte da verdade.
3. **Triggers de Signup**: Devem sempre garantir um tenant válido para o usuário.

## 🛡️ Regras de Ouro de Segurança (RLS)
1. **Filtro Nativo**: Toda tabela de negócio possui `company_id`.
2. **Contexto de Segurança**: A função `public.get_current_user_company_id()` é a única fonte da verdade para isolamento.
3. **Defaults Automáticos**: `company_id` deve ter `DEFAULT public.get_current_user_company_id()` para evitar falhas no INSERT.
4. **Audit Log**: Futura implementação obrigatória para ações críticas.

## ⚡ Performance em Escala
1. **Lazy Everywhere**: Rotas principais devem ser carregadas sob demanda.
2. **Bundle Target**: < 500kb (Gzipped) para o chunk inicial.
3. **Database Indexes**: Toda coluna usada em filtros de RLS (`company_id`, `user_id`) deve possuir índice.

## 📦 Padrão de Organização
- `modules/`: Lógica de domínio e componentes específicos.
- `services/`: Apenas chamadas ao Supabase. Sem lógica de UI aqui.
- `stores/`: Estado global mínimo (Auth, Config).

## 🚀 Checklist de Release
- [ ] RLS Enable em 100% das tabelas.
- [ ] Políticas SELECT/INSERT/UPDATE/DELETE testadas.
- [ ] Build verificado (Bundle Analysis).
- [ ] Erros de TS zerados.
