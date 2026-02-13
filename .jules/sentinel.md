# Sentinel 🛡️ - Diário de Segurança

## 2026-02-13 - [HARDENING] Vulnerabilidade de Search Path Hijacking em Funções SECURITY DEFINER

**Vulnerability:** Diversas funções no banco de dados utilizavam `SECURITY DEFINER` sem restringir o `search_path`. Isso permite que um atacante com permissão de criação de objetos em outros schemas sequestre o contexto de execução da função (Privilege Escalation).
**Learning:** Em projetos Supabase, é comum focar apenas em RLS e esquecer do endurecimento de funções que rodam com privilégios de sistema. A ausência de `SET search_path = public` é um gap recorrente quando as migrações são geradas manualmente ou sem linting de SQL.
**Prevention:** Sempre incluir `SET search_path = public` (ou o schema apropriado) na definição de funções `SECURITY DEFINER`. Utilizar `ALTER FUNCTION ... SET search_path = public` para endurecer funções existentes sem redefinir seus corpos.
