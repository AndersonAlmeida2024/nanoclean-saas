# NanoClean SaaS Starter Template - Guia de Uso (v2)

Este template transforma o NanoClean em um Core reutilizável para qualquer SaaS B2B Multi-tenant.

## 🧱 Estrutura do Template
- `/supabase/migrations/`: Migrations versionadas. 
  - `999_golden_master.sql`: Core v1 (Imutável).
  - `20260202_001_v2_multi_user_core.sql`: Core v2 (Roles & Invites).
- `/src/lib/supabase.ts`: Configuração e tipos globais.
- `/src/stores/authStore.ts`: Sistema de bootstrap e bootstrap Multi-tenant.
- `/src/services/userService.ts`: Camada de domínio público.

## 🚀 Como iniciar um novo projeto
1. **Escolha o Nome**: Substitua as referências de "NanoClean" em `index.html` e `PROJECT_OVERVIEW.md`.
2. **Setup Supabase**: 
   - Execute o script `999_golden_master.sql`.
   - Execute a migração v2 `20260202_001_multi_user_core.sql`.
3. **Novas Entidades**: 
   - Ao criar uma nova tabela, adicione sempre a coluna `company_id`.
   - Use o default: `DEFAULT public.get_current_user_company_id()`.
   - Habilite RLS e aplique a política de isolamento padrão:
     ```sql
     CREATE POLICY "isolation_policy" ON public.sua_tabela
     FOR ALL USING (company_id = public.get_current_user_company_id());
     ```

## 🔐 Checklists de Segurança (CTO-Mode)
- [ ] **RLS Nativo**: Verifique se `ENABLE ROW LEVEL SECURITY` foi rodado em toda nova tabela.
- [ ] **Defaults Automáticos**: Teste se o `company_id` é preenchido no INSERT via frontend sem precisar passar o ID explicitamente.
- [ ] **Signup Awareness**: Decida se o seu SaaS permite "Self-Service Company Creation" (padrão v1/v2) ou exige convite.
- [ ] **Testes de Regressão**: Execute o `supabase/tests/rls_test_suite.sql` após qualquer mudança em permissões.

## 🧬 Princípio da Propriedade Intelectual
Este Core v2 é seu ativo de engenharia. Ele isola a complexidade de autenticação e multi-tenancy, permitindo que você foque 100% nas features de produto.
