# Requisitos de testabilidade para a stack (insumo do ADR-002)

> Dono: `nexus-qa`. NX-006, v0.1 (20/11/2026). Para o PO e o `nexus-tech` avaliarem as opções do
> ADR-002. O QA assina a parte de testabilidade do ADR (critério da NX-002).
> **O** = obrigatório (sem isso o QA não assina) · **D** = desejável (pesa na comparação).

## Requisitos

| ID | Requisito | Tipo | Por quê | Como conferir no ADR |
|---|---|---|---|---|
| R-01 | **Lógica do jogo pura e separada da UI**: fórmulas, motor de partidas, offline, prestígio, save e formatação num módulo sem dependência de tela, navegador ou SO | O | ~70% dos testes são unitários/propriedade e precisam rodar em milissegundos, sem emulador | O ADR mostra a estrutura de pastas com o núcleo isolado |
| R-02 | **Estado serializável e imutável por passo**: `estado' = passo(estado, ação, agora)` | O | Permite propriedades (CT-004), determinismo (CT-206) e ida-e-volta do save (CT-514) | Esboço da API do núcleo |
| R-03 | **Relógio injetável**, com dois relógios separados: parede (epoch UTC, para offline) e monotônico (para renda online e partidas) | O | Offline, fuso, relógio adiantado/atrasado (CT-013, CT-320 a CT-326) sem esperar tempo real | Interface de relógio no núcleo |
| R-04 | **Sorteio (RNG) injetável e com semente**, com o estado do RNG salvo no save | O | RN-009 exige o mesmo resultado para o mesmo save; testes estatísticos (CT-208) | Gerador próprio com semente (não `Math.random` direto) |
| R-05 | **Modo de tempo acelerado só para teste** (ex.: ×10 a ×100), desligado e ausente no build do jogador | O | NX-016 pede "2ª temporada em até 5 min de partida acelerada" (CT-703); E2E sem esperar 90 s por partida | Flag de build ou parâmetro de teste; teste de que o build de produção não aceita |
| R-06 | **Constantes da economia numa config única** (tabelas das RN) lida pelo jogo, pelo simulador da NX-007 e pelos testes | O | Quando a NX-007 mudar números, testes e simulador acompanham sem editar dezenas de arquivos | Arquivo de config citado no ADR |
| R-07 | **E2E headless na CI gratuita** (`ubuntu-latest`) com perfil de celular: 360×640, 360×700 e pelo menos um Android e um iPhone emulados | O | Pipeline de PR ≤ 10 min e regressão dos fluxos (legado testava assim) | Ferramenta de E2E nomeada e tempo estimado do smoke |
| R-08 | **Seletores estáveis** (`data-testid` ou equivalente de acessibilidade/semântica) em toda ação e todo número da tela, que não mudam com texto do lore | O | Testes não quebram quando o lore troca nomes | Convenção de nomes no ADR ou no guia do UX |
| R-09 | **Testes unitários e de integração rodando sem emulador** e em < 1 min no total no início | O | Gate de PR rápido | Ferramenta de teste nomeada |
| R-10 | **Cobertura de código** mensurável por pasta (para o gate só na lógica do jogo) | O | Gate de 90% linhas / 85% ramos | Ferramenta de cobertura nomeada |
| R-11 | **Persistência atrás de uma interface** (adaptador), com implementação em memória para testes e falhas simuláveis (corrompido, cota cheia, falha no meio da escrita) | O | CT-506 a CT-513 sem mexer no aparelho | Interface de armazenamento no esboço |
| R-12 | **Ciclo de vida do app observável** (ir para 2º plano, voltar, encerrar) e disparável no E2E | O | Save ao minimizar (CT-503), offline (CT-315, CT-316) | Eventos citados e como simular no E2E |
| R-13 | **Números do jogo em representação que aguente > 1e15 e até ~1e300** sem `Infinity`/`NaN`, com formatação testável | O | RN-017 e risco 2 das RN (CT-605, CT-609) | Tipo numérico escolhido e limite documentado |
| R-14 | **Build reproduzível e instalável no Android sem loja**, gerado pela CI | O | Marco MVP e checklist de release (`seguranca.md`) | Comando de build e formato do pacote |
| R-15 | **Nenhuma chamada de rede obrigatória**; o app funciona em modo avião | O | Segurança (A9) e testes determinísticos | Confirmação no ADR |
| R-16 | **Auditoria de dependências** e análise estática disponíveis para a linguagem (npm audit/OSV-Scanner, Semgrep) | O | Gate de segurança no PR | Ferramentas nomeadas |
| R-17 | **Acessibilidade verificável automaticamente** (axe-core ou scanner equivalente) | D | CT-705, contraste AA e alvo de 44 px | Ferramenta nomeada |
| R-18 | **Regressão visual** com screenshots estáveis (fontes empacotadas, animações desligáveis em teste) | D | CT-706 | Ferramenta e como desligar animação |
| R-19 | **Hot reload / servidor de dev** para testes exploratórios rápidos e acesso ao estado por console de debug só em dev | D | Charters EX-01 a EX-06 | — |
| R-20 | **Teste de mutação** disponível para a linguagem | D | Qualidade dos testes da lógica do jogo | Ferramenta nomeada |
| R-21 | **Tempo de pipeline do PR ≤ 10 min** com a stack escolhida | D | Fluxo de merge automático do dono | Estimativa no ADR |

## Grade de avaliação sugerida para o ADR-002

Para cada opção de stack, marcar cada requisito **O** como Atende / Atende com custo / Não atende.
Uma opção com qualquer **O** em "Não atende" fica fora, salvo decisão explícita do PO em ADR.
Os **D** entram como pontuação (1 ponto cada) para desempatar.

| Requisito | Opção A | Opção B | Opção C |
|---|---|---|---|
| R-01 … R-16 (O) | | | |
| R-17 … R-21 (D) | | | |
| **Assinatura do QA** | | | |

## Observações para o tech

- R-01 a R-06 independem da stack: dá para escrever o núcleo (e os testes das tabelas deste plano)
  antes de decidir a UI, inclusive reaproveitando o simulador da NX-007 como primeiro consumidor.
- Comparações de dinheiro com ponto flutuante precisam de uma regra única (pedido QA-4): ou tolerância
  relativa, ou representação decimal. Isso entra no desenho do núcleo, não na UI.
  **Decidido (RN v0.2):** tolerância relativa de 10⁻⁹ e `ouro = max(0, ouro − custo)`. Se a mesma
  tolerância vale para o arredondamento da tela está no pedido QA-22.
