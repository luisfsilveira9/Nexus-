# Segurança — modelo de ameaças do MVP

> Dono: `nexus-qa`. NX-006, v0.1 (20/11/2026). Stack ainda em aberto (ADR-002): o que depende dela
> está marcado com **[stack]**.
> Referência: OWASP MASVS v2 (grupos STORAGE, CRYPTO, AUTH, NETWORK, PLATFORM, CODE, RESILIENCE,
> PRIVACY). Conferir o texto dos controles na versão vigente em mas.owasp.org antes do primeiro
> relatório formal.

## 1. Contexto e o que proteger

Jogo de uso pessoal, gratuito, **sem servidor, sem conta, sem compra e sem dados pessoais**. Roda
no Android do dono, instalado fora de loja (ADR-001 item 6). Isso reduz muito a superfície de ataque.
O que vale proteger, em ordem:

| Ativo | Por quê |
|---|---|
| **Progresso (save)** | Perder o save é o pior defeito do produto (marco MVP) |
| **Integridade do app instalado** | O dono instala por fora da loja: um pacote trocado roda com as permissões que tiver |
| **Conta do GitHub e segredos do repositório** | Chave de assinatura do APK, tokens de CI |
| **Aparelho do dono** | O app não pode ser a porta de entrada (permissões, conteúdo remoto) |

**Quem pode atacar ou errar:** (1) o próprio jogador, editando save ou relógio — prejudica só a
própria experiência; (2) dependência de terceiros comprometida (supply chain); (3) quem troca o
link ou o arquivo de instalação; (4) erro do próprio time (segredo commitado, save mal gravado).

**Fora do escopo:** anti-trapaça forte (não há ranking nem dinheiro), autenticação, servidor.

## 2. Ameaças, controles e verificação

| # | Ameaça | Impacto | Controle proposto | Verificação | MASVS |
|---|---|---|---|---|---|
| A1 | **Save corrompido** (queda de energia, app morto no meio da escrita, armazenamento cheio) | S1 — perde progresso | Escrita atômica (grava em temporário e troca), 2 cópias rotativas, versão e verificação de integridade (hash) no save; nunca apagar sem confirmação | CT-504 a CT-513 | STORAGE-1, CODE-4 |
| A2 | **Adulteração do save** pelo jogador (editar ouro, Legado) | Baixo — só afeta o próprio jogo | Validação de esquema e de faixas ao carregar (sem negativo, `NaN`, infinito, nível 0, divisão fora da tabela); hash detecta edição acidental. **Não** usar criptografia como "anti-trapaça": a chave ficaria no app e não protege nada. Aceitar ou recusar save editado é decisão do PO (pedido QA-14) | CT-508, CT-509 | CODE-4; RESILIENCE-2 **não aplicado** de propósito |
| A3 | **Save malicioso** que injeta conteúdo (texto do save renderizado como HTML) | Médio — execução de script na WebView | Nunca renderizar dado do save ou do conteúdo como HTML cru (`innerHTML`, `dangerouslySetInnerHTML`, `v-html`); só texto. Regra Semgrep bloqueando esses padrões | Semgrep no PR; CT-509 com strings `<img onerror>` | CODE-4, PLATFORM-2 |
| A4 | **Manipulação do relógio** (adiantar, atrasar, fuso) | Baixo a médio — ganho indevido ou perda | Offline limitado a 8 h; t_off < 0 vira 0; horário em epoch UTC; renda online pelo relógio **monotônico**; ciclo adiantar/atrasar a decidir (pedido QA-11) | CT-013, CT-320 a CT-326 | (sem controle MASVS direto; regra de negócio) |
| A5 | **Dependência vulnerável ou maliciosa** | Médio a alto | Lockfile versionado; instalação "frozen" na CI; auditoria de dependências (npm audit ou OSV-Scanner) com gate em `high`/`critical`; Dependabot; poucas dependências em produção | Pipeline PR e noturna | CODE-3 |
| A6 | **SDK de anúncio, pagamento ou rastreio** entrando por dependência | Alto para o produto (RN-016) e para a privacidade | Lista proibida verificada no PR: pacotes de anúncio (ex.: AdMob, Unity Ads, AppLovin), pagamento (Play Billing, Stripe, RevenueCat) e analytics/rastreio (Firebase Analytics, Sentry com PII, Amplitude, Mixpanel). Exceção só por ADR | CT-621 | PRIVACY-1, PRIVACY-2 |
| A7 | **Segredo no repositório** (token, chave de assinatura, `.env`) | Alto | gitleaks em todo PR e no histórico completo na noturna; `.gitignore` com `.env*`, `*.keystore`, `*.jks`; chave de assinatura só como secret do GitHub (ou fora da CI) | Pipeline PR e noturna | STORAGE-2, CRYPTO-2 |
| A8 | **Segredo no bundle** (chave de API, URL interna) | Médio | O MVP não precisa de nenhuma chave; varredura do build final com gitleaks/regex | Job "segredos no build" no PR | STORAGE-2 |
| A9 | **Conteúdo remoto na WebView** [stack: híbrida/PWA] | Alto se ocorrer | Tudo empacotado localmente (fontes, imagens, textos); nenhuma URL remota carregada; CSP `default-src 'self'`; sem `eval`; em Capacitor/Cordova, sem `server.url` em produção e sem navegação externa liberada | Semgrep + teste E2E que bloqueia toda rede externa e falha se houver pedido | NETWORK-1, PLATFORM-2 |
| A10 | **Pacote de instalação trocado** (APK ou link adulterado) | Alto | Build feito só pela CI a partir da `main`; APK assinado com chave fora do repositório; SHA-256 publicado no release; o dono instala só do release do próprio repositório. Se for PWA: só HTTPS do próprio domínio [stack] | Checklist de release | CODE-1, RESILIENCE-2 (parcial: assinatura) |
| A11 | **Permissões demais** | Médio | Manifest sem permissões além das necessárias. Esperado no MVP: nenhuma permissão perigosa; `INTERNET` só se a stack exigir; notificação só após o jogador ativar (RN-016) | CT-623, CT-624; leitura do manifest na CI [stack] | PLATFORM-1, PRIVACY-1 |
| A12 | **Backup automático do Android** expõe o save | Baixo (save sem dado pessoal) | Permitir backup é **positivo** para a RN-015 (não perder progresso). Registrar a escolha no ADR-002 | Revisão do manifest | STORAGE-2 |
| A13 | **Logs com dados** | Baixo | Sem log de save completo em produção; sem envio de log para fora | Semgrep (`console.log` do estado) | STORAGE-2 |
| A14 | **Workflow da CI abusado** (PR de fork rodando com segredo, action comprometida) | Alto | `permissions: contents: read` por padrão; nunca `pull_request_target` com checkout do código do PR; actions fixadas por SHA; segredos só em jobs da `main` | Revisão de `.github/workflows/` + Semgrep regras de GitHub Actions | CODE-3 |

## 3. Mapeamento MASVS do MVP

| Grupo | Aplica? | Como |
|---|---|---|
| MASVS-STORAGE | Sim | A1, A7, A8, A12, A13. O save não tem dado sensível; o foco é integridade e não vazar segredos |
| MASVS-CRYPTO | Parcial | Só a chave de assinatura do APK (A7, A10). Sem criptografia no app |
| MASVS-AUTH | Não | Sem conta nem login |
| MASVS-NETWORK | Mínimo | O app não deve fazer chamada de rede no MVP (A9). Se passar a fazer, HTTPS obrigatório |
| MASVS-PLATFORM | Sim | WebView sem conteúdo remoto (A3, A9), permissões mínimas (A11) |
| MASVS-CODE | Sim | Dependências (A5), validação de entrada do save (A2, A3), atualização segura (A10) |
| MASVS-RESILIENCE | Não, por decisão | Anti-tampering, anti-debug e detecção de root não fazem sentido num jogo pessoal sem economia real. Só assinatura do pacote (A10) |
| MASVS-PRIVACY | Sim | Nenhum dado pessoal, nenhum rastreio (A6, A11) |

## 4. Ferramentas propostas

| Ferramenta | Para quê | Quando |
|---|---|---|
| gitleaks | Segredos no diff (PR) e no histórico inteiro (noturna) | PR, noturna |
| Semgrep (regras públicas de JS/TS ou da linguagem escolhida, GitHub Actions, e regras próprias para A3, A9, A13) | Análise estática | PR |
| npm audit **ou** OSV-Scanner (independe da linguagem) | Dependências vulneráveis | PR (gate `high`), noturna (relatório completo) |
| Verificação da lista proibida (A6) | Script simples sobre o lockfile e o bundle | PR |
| MobSF (análise estática do APK) [stack: Android] | Manifest, permissões, segredos no APK | Noturna ou por release |

## 5. Checklist de release (manual, a cada versão instalada no celular)

1. APK/PWA gerado pela CI a partir de um commit da `main` com pipeline verde.
2. SHA-256 do arquivo conferido com o publicado.
3. Instalar por cima da versão anterior e confirmar que o save continuou (CT-517).
4. Permissões pedidas na instalação = esperadas (CT-624).
5. Modo avião: o jogo abre e funciona igual (A9).
