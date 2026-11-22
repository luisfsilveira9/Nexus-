# Segurança — modelo de ameaças do MVP

> Dono: `nexus-qa`. **v0.2** (NX-009, 20/11/2026); v0.1 era da NX-006.
> Stack: PWA (TypeScript + React 19 + Vite) publicado no GitHub Pages, repositório **público**
> (ADR-002, QA-19). APK com Capacitor só na fase 2, com gatilho; se entrar, este documento ganha as
> ameaças de Android (manifest, backup, assinatura).
> Referência: OWASP MASVS v2 (grupos STORAGE, CRYPTO, AUTH, NETWORK, PLATFORM, CODE, RESILIENCE,
> PRIVACY), aplicado ao PWA no que couber. Conferir o texto dos controles na versão vigente em
> mas.owasp.org antes do primeiro relatório formal.
> O que mudou da v0.1: stack decidida (A9–A12 reescritas para PWA); relógio **mitigado** pela RN-012
> v0.2 (QA-11 não foi aceito como risco); decisões do save (QA-14); nome do clube como nova entrada do
> jogador (RN-019); repositório público e ruleset `pr-ok` (A14); nova ameaça A15 (dados do navegador
> apagados).

## 1. Contexto e o que proteger

Jogo de fã, gratuito, **sem servidor, sem conta, sem compra e sem dados pessoais**. Roda no navegador
do celular do dono, instalado como PWA a partir de um endereço público do GitHub Pages. O que vale
proteger, em ordem:

| Ativo | Por quê |
|---|---|
| **Progresso (save)** | Perder o save é o pior defeito do produto (marco MVP) |
| **Integridade do site publicado** | Cada merge na `main` vira deploy e chega sozinho ao celular do dono |
| **Conta do GitHub, workflows e histórico público** | Quem controla a `main` ou o deploy controla o que roda no celular; o histórico é público para sempre |
| **Aparelho do dono** | O app não pode ser porta de entrada (permissões, conteúdo remoto, script injetado) |

**Quem pode atacar ou errar:** (1) o próprio jogador, editando save, relógio ou nome do clube —
prejudica só a própria experiência; (2) dependência de terceiros comprometida (supply chain);
(3) contribuição externa por PR de fork (repositório público); (4) erro do próprio time (segredo
commitado, save mal gravado, HTML cru).

**Fora do escopo:** anti-trapaça forte (não há ranking nem dinheiro), autenticação, servidor.

## 2. Ameaças, controles e verificação

| # | Ameaça | Impacto | Controle | Verificação | MASVS |
|---|---|---|---|---|---|
| A1 | **Save corrompido** (aba descartada no meio da escrita, armazenamento cheio) | S1 — perde progresso | **Decidido (RN-015 v0.2, ADR-002):** 2 cópias alternadas (slots A/B) com checksum FNV-1a; vale a válida mais nova; sem espaço mantém o último válido e avisa; nunca apaga um save válido sem confirmação; se nenhuma é válida, guarda as cópias para exportar | CT-504 a CT-524 | STORAGE-1, CODE-4 |
| A2 | **Adulteração do save** pelo jogador | Baixo — só afeta o próprio jogo | Save editado que não confere = **corrompido** (QA-14). Validação de esquema e de faixas ao carregar e ao importar. O FNV-1a detecta edição acidental, não intencional: quem refaz o checksum consegue editar valores e o `maior` do relógio. **Aceito** (jogo pessoal, sem ranking); criptografia como anti-trapaça não protege nada, porque a chave fica no bundle público. Valores impossíveis com checksum certo: pedido QA-27a | CT-508, CT-509 | CODE-4; RESILIENCE **não aplicado** de propósito |
| A3 | **Injeção de HTML/script** pelo texto do jogador (nome e sigla do clube, RN-019), por save importado ou pelo conteúdo do lore | Médio — script rodando na origem do jogo, com acesso ao save | RN-019: texto sempre puro. React escapa texto por padrão; **proibido** `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write` e montagem de `href` com texto do jogador. Interpolação de `{clube}` no conteúdo também como texto. Regras Semgrep no PR | CT-807 a CT-810, CT-812; Semgrep | CODE-4, PLATFORM-2 |
| A4 | **Manipulação do relógio** (adiantar, atrasar, fuso, ciclos) | Baixo a médio — ganho indevido ou perda | **Mitigado (QA-11, RN-012 v0.2), não aceito:** o save guarda o `maior` horário visto; `t_off = max(0, agora − maior)`; offline limitado a 8 h; adiantar dá no máximo 8 h **uma vez**; atrasar não tira nada; horários em epoch UTC; renda e partidas com o app aberto pelo relógio **monotônico**. Resíduo aceito: edição do save com checksum refeito (A2) | CT-013, CT-320 a CT-329, CT-339, CT-417 | (sem controle MASVS direto; regra de negócio) |
| A5 | **Dependência vulnerável ou maliciosa** | Médio a alto | `package-lock.json` versionado; `npm ci` na CI; `npm audit` com gate em `high`/`critical` de produção; OSV-Scanner na noturna; Dependabot; poucas dependências de produção (React, ReactDOM, plugin de PWA) | Pipeline PR e noturna | CODE-3 |
| A6 | **SDK de anúncio, pagamento ou rastreio** entrando por dependência | Alto para o produto (RN-016) e a privacidade | Lista proibida verificada no PR (lockfile e bundle): anúncio (AdMob, Unity Ads, AppLovin, AdSense), pagamento (Play Billing, Stripe, RevenueCat, PayPal), analytics/rastreio (Google Analytics/gtag, Firebase Analytics, Sentry com PII, Amplitude, Mixpanel, Hotjar). Exceção só por ADR | CT-621 | PRIVACY-1, PRIVACY-2 |
| A7 | **Segredo no repositório público** (token, `.env`) | Alto — fica público para sempre | gitleaks em todo PR e no histórico completo na noturna; `.gitignore` com `.env*`; o MVP não usa nenhum segredo próprio (o deploy usa o token temporário do Actions). Recomendado: *secret scanning* com *push protection* ligado pelo dono | Pipeline PR e noturna | STORAGE-2, CRYPTO-2 |
| A8 | **Segredo no bundle** (chave de API, URL interna) | Médio | O MVP não precisa de chave; varredura do `dist/` com gitleaks/regex no job `build` | Job `build` no PR | STORAGE-2 |
| A9 | **Conteúdo remoto** carregado pelo PWA | Alto se ocorrer | Tudo empacotado (fontes, imagens, textos); nenhuma origem externa (C9); CSP `default-src 'self'` (meta tag, já que o Pages não deixa configurar cabeçalhos); sem `eval`/`new Function`; service worker só faz cache da própria origem | E2E com bloqueio de origens externas e modo avião (CT-538); Semgrep | NETWORK-1, PLATFORM-2 |
| A10 | **Site publicado adulterado** | Alto | Deploy só pelo job `deploy` da `main`, depois da pipeline verde; ruleset `pr-ok` na `main` (bloqueia push direto e merge sem checagem, A14); só HTTPS do endereço do Pages; SHA-256 do build registrado como artefato | Checklist de release (§5) | CODE-1 |
| A11 | **Permissões demais** | Médio | Nenhuma permissão além de notificação, e só depois de o jogador ativar (RN-016); sem geolocalização, câmera, microfone, contatos, área de transferência automática | CT-623, CT-624 | PLATFORM-1, PRIVACY-1 |
| A12 | **Logs com dados** | Baixo | Sem log do save completo em produção; nenhum envio de log para fora | Semgrep (`console.log` do estado) | STORAGE-2 |
| A13 | **Modo de teste no build do jogador** (tempo acelerado, console de debug) | Médio — trapaça fácil e superfície extra | Só com o modo de teste do Vite; eliminado do build de produção (C3) | CT-532 | CODE-4 |
| A14 | **Workflow da CI abusado** (PR de fork, action comprometida, merge sem checagem) | Alto | `permissions: contents: read` por padrão; nunca `pull_request_target` com checkout do PR; actions fixadas por SHA; escrita (`pages`, `id-token`) só no job de deploy da `main`. **Ruleset `pr-ok`** com origem GitHub Actions, criado pelo dono e **desativado** até a pipeline existir: até a ativação, o bloqueio do merge depende só do procedimento do PO (risco aberto). Bypass vazio (`pipeline.md` §2) | Revisão de `.github/workflows/` + regras Semgrep de GitHub Actions; PR de teste depois de ativar | CODE-3 |
| A15 | **Dados do navegador apagados** (limpeza pelo jogador, falta de espaço, WebKit após 7 dias sem uso no iOS) | S1 — perde progresso | `navigator.storage.persist()` e aviso se negado; exportar/importar como texto (RN-015); o import valida o texto e não substitui um save válido sem confirmação (QA-27b) | CT-520 a CT-524, CT-540; EX-08 | STORAGE-1 |

## 3. Mapeamento MASVS do MVP (PWA)

| Grupo | Aplica? | Como |
|---|---|---|
| MASVS-STORAGE | Sim | A1, A7, A8, A12, A15. O save não tem dado sensível; o foco é integridade e não vazar segredos |
| MASVS-CRYPTO | Não no MVP | Sem criptografia no app; checksum não é controle de segurança (A2). Volta a aplicar se houver APK assinado (fase 2) |
| MASVS-AUTH | Não | Sem conta nem login |
| MASVS-NETWORK | Mínimo | Só a própria origem, por HTTPS (A9) |
| MASVS-PLATFORM | Sim | Sem conteúdo remoto nem HTML injetado (A3, A9); permissões mínimas (A11) |
| MASVS-CODE | Sim | Dependências (A5), validação do save, do import e do nome (A2, A3), modo de teste fora do build (A13), atualização segura (A10) |
| MASVS-RESILIENCE | Não, por decisão | Anti-tampering e anti-debug não fazem sentido num jogo pessoal sem economia real |
| MASVS-PRIVACY | Sim | Nenhum dado pessoal, nenhum rastreio (A6, A11) |

## 4. Ferramentas

| Ferramenta | Para quê | Quando |
|---|---|---|
| gitleaks | Segredos no diff (PR), no `dist/` (PR) e no histórico inteiro (noturna) | PR, noturna |
| Semgrep (regras públicas de TypeScript, React e GitHub Actions, mais regras próprias para A3, A9, A12) | Análise estática | PR |
| `npm audit` (PR, gate `high`) e OSV-Scanner (noturna) | Dependências vulneráveis | PR, noturna |
| Script da lista proibida (A6) | Lockfile e bundle | PR |
| Playwright com bloqueio de rede | Nenhum pedido externo; modo avião (C9) | PR |

MobSF sai da lista: só volta se a fase 2 (APK) acontecer.

## 5. Checklist de release (manual, a cada deploy que o dono for usar)

1. Deploy feito pelo job `deploy` a partir de um commit da `main` com pipeline verde.
2. SHA-256 do build no artefato do run confere com o publicado.
3. Abrir o PWA instalado e confirmar que ele atualizou e que o save continuou (CT-517).
4. Nenhum pedido de permissão inesperado (CT-624).
5. Modo avião: o jogo abre e funciona igual (A9, CT-538).
6. Exportar o save e guardar o texto antes de qualquer atualização grande (A15).
