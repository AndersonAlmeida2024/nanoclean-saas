# ❌ CORE: DO NOT TOUCH

Este arquivo define os componentes de infraestrutura crítica que **NUNCA** devem ser alterados sem uma auditoria completa de segurança. 

Alterar estes itens pode causar vazamento de dados entre empresas (tenants).

---

### 🚫 ZONA PROIBIDA (DO NOT TOUCH) - REGRAS ABSOLUTAS

As seguintes funções e lógicas são o **Core Sagrado** do sistema. Alterações aqui exigem bloqueio imediato e auditoria:

1.  **`public.get_current_user_company_id()`**
    - Única fonte de verdade para isolamento tenant.
2.  **`DEFAULT public.get_current_user_company_id()`**
    - Presença obrigatória em toda tabela tenant-aware para evitar erros de insert.
3.  **Triggers `SECURITY DEFINER`**
    - `handle_new_user` e lógicas de convite. Elas rodam com privilégios de sistema para garantir integridade.
4.  **Sincronização `auth.users` → `public.users`**
    - Se a ponte de identidade quebrar, o RLS falha.
5.  **Princípio da Soberania do Banco**
    - O banco é defensivo. O Frontend nunca dita quem o usuário é.

---

---

### ⚠️ CONSEQUÊNCIAS DE ALTERAÇÃO
Qualquer mudança não autorizada aqui:
- Expõe dados de Clientes para outros usuários.
- Quebra o sistema de convites.
- Invalida a conformidade (compliance) do SaaS.

*Em caso de dúvida, consulte o CTO ou o `SAAS_BASE_INTELIGENCIA.md`.*
