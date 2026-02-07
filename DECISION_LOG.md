# 📜 Decision Log: NanoClean Core

Este documento registra as decisões de arquitetura e segurança que moldaram o framework. Ele serve como memória técnica para evitar regressões no futuro.

---

### [2026-02-01] Decisão 1: Multi-Tenancy via RLS Nativo
- **Status**: Decidido.
- **Contexto**: Precisávamos de um isolamento blindado que não dependesse de lógica no frontend ou em middlewares intermediários.
- **Decisão**: Usar PostgreSQL Row Level Security (RLS) como única fonte da verdade, filtrando por `company_id`.
- **Consequência**: Qualquer nova tabela PRECISA ter `company_id` e RLS habilitado.

### [2026-02-01] Decisão 2: Defaults Automáticos no Banco
- **Status**: Decidido.
- **Contexto**: Desenvolvedores costumam esquecer de enviar o `company_id` no `INSERT`.
- **Decisão**: Criar a função `get_current_user_company_id()` e usá-la como `DEFAULT` no nível de coluna.
- **Consequência**: O frontend pode fazer `insert({ name: '...' })` sem se preocupar com o ID da empresa. O banco preenche.

### [2026-02-02] Decisão 3: Convites Zero-Trust (Core v2)
- **Status**: Decidido.
- **Contexto**: Transição de 1-user-per-company para multi-user.
- **Decisão**: Sistema de tokens de convite expiráveis. O `handle_new_user` verifica convites antes de criar novas empresas.
- **Consequência**: O fluxo de signup se torna "invite-aware".

### [2026-02-02] Decisão 4: Versionamento de Migrations
- **Status**: Decidido.
- **Contexto**: Necessidade de evolução sem quebrar o Core v1.
- **Decisão**: Adoção de metadados em comentários no topo de cada migration (`DEPENDS_ON`, `SAFE_TO_REAPPLY`).
- **Consequência**: Migrations se tornam idempotentes e fáceis de auditar.
