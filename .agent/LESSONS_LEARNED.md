# Lições Aprendidas e Melhoria Contínua (Kaizen)

Este documento serve como a memória evolutiva do projeto. Sempre que encontrarmos um erro, uma ineficiência ou definirmos uma nova preferência, ela será registrada aqui para evitar repetições.

## 🧠 Preferências do Usuário
* [ ] (Adicionar preferências conforme surgirem)

## 🐛 Erros Encontrados e Soluções (Poka-Yoke)
* [ ] (Adicionar erros e correções definitivas)

## 🔨 Padrões de Código Adotados
* [x] Usar `.editorconfig` para manter consistência de indentação (2 espaços) em todos os editores.
* [x] Manter um `CHANGELOG.md` no formato "Keep a Changelog" para rastrear a evolução do projeto.
* [x] Usar `.gitignore` padrão para Node.js/Mac.

### Arquitetura Supabase Multi-Tenant (2026-02-01)
* [x] **Separação de Camadas**: `auth.users` (autenticação) ≠ `public.users` (domínio/negócio)
* [x] **Sincronização Automática**: Trigger `on_auth_user_created` cria registro em `public.users` no signup
* [x] **Multi-tenant Ready**: Campo `company_id` em `public.users` para isolamento por empresa
* [x] **RLS Pattern**: Todas as tabelas de negócio usam `company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())`
* [x] **Documentação**: Ver `docs/DATABASE_ARCHITECTURE.md` e `supabase/migrations/`

## 🚀 Melhorias Futuras (Backlog)
* [ ] (Ideias de melhoria para quando tivermos tempo)
