# NanoClean SaaS - Contexto para ChatGPT

Este documento fornece um resumo técnico e arquitetural do projeto **NanoClean**, um SaaS para gerenciamento de serviços de limpeza profissional, otimizado para o mercado brasileiro.

## 🚀 Tecnologias
- **Frontend**: React 18 + Vite + TypeScript.
- **Estilização**: CSS Moderno (Vanilla) com foco em estética premium e dark mode.
- **Backend/DB**: Supabase (PostgreSQL + Auth + Storage).
- **Gerenciamento de Estado**: Zustand (Auth Store persistente).
- **Animações**: Framer Motion + Lucide React para ícones.

## 🏗️ Arquitetura Multi-Tenant
O projeto utiliza um modelo de isolamento de dados via **Row Level Security (RLS)** do PostgreSQL.
- **Isolamento**: Todos os dados de negócio (`clients`, `appointments`, `transactions`) possuem uma coluna `company_id`.
- **Sincronização de Usuários**: Implementado um trigger `on_auth_user_created` que sincroniza usuários do `auth.users` do Supabase com a tabela `public.users` (contendo metadados de domínio).
- **Empresas**: Tabela `companies` gerencia os tenants.
- **Defaults**: O banco está configurado com funções SQL (`public.get_current_user_company_id()`) para preencher automaticamente o `company_id` em novos registros baseado no usuário logado.

## 🔒 Segurança e Autenticação
- **Real Auth**: Autenticação real implementada via Supabase Auth (Signup/Login/Session).
- **Store Segura**: `authStore.ts` gerencia o estado do usuário e o `companyId` de forma persistente.
- **RLS Blindado**: Políticas de segurança ativas impedem que um usuário acesse dados de outra empresa mesmo que tente injetar IDs via API.

## 📂 Estrutura de Pastas Principal
- `/src/modules`: Lógica de domínio (CRM, Financeiro, Agenda).
- `/src/services`: Camada de API (integração com Supabase).
- `/src/stores`: Estado global (Zustand).
- `/src/pages`: Componentes de página.
- `/supabase/migrations`: Scripts de evolução do banco de dados.

## 🛠️ Refactor Recente (Realizado)
- Remoção de todos os "mocks" de dados e funções simuladas.
- Implementação de fluxo de registro e login com Supabase Real.
- Correção de bugs de RLS e unificação da tabela de empresas (`companies`).
- Adição de animações premium (Framer Motion) no feedback de cadastro de clientes.

---
**Instruções para o ChatGPT**: Use este contexto para entender como o sistema de multitenancy funciona e como os serviços interagem com o Supabase antes de sugerir novas features ou correções.
