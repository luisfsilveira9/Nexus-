# Sessões na nuvem, testes e deploy

Referência para quem for testar a interface, escrever verificações no teste de ponta a ponta ou mexer no deploy.

## Sessões na nuvem e testes

- **Teste de ponta a ponta (`e2e/e2e.cjs`, `pnpm e2e`):** joga como um usuário em 360×640 e 360×700, nos dois modos (Liga, Elenco, estratégia de picks e bans, draft manual, partida, série com Fearless, Motor, fundar clube, a run com reforço, rodadas, mata-mata MD5, reservas, fim de run e migração de save antigo, loja, coleção, save). São ~870 verificações de fluxo e seleção (um só item marcado, escolhido some da lista, folha abre no topo, "voltar" funciona, desfazer devolve o estado) e uma auditoria de layout por tela (rolagem lateral, elemento para fora, fim do conteúdo atrás das barras fixas). "FALHA" derruba o teste; "aviso" lista texto com reticências, botão coberto e alvo de toque menor que 44 px. Rode antes do merge de qualquer mudança de interface e acrescente verificações quando criar tela ou corrigir defeito de fluxo. `--so 360x640` roda um tamanho só; `--url` usa um servidor já no ar.
- Armadilhas ao escrever verificações: `innerText` devolve o texto já em maiúsculas quando o CSS usa `text-transform` (use `textContent`); logo depois de recarregar, o Chromium pode ignorar a primeira rolagem por script; o primeiro `span` de um botão de campeão é o ícone (`.ct`), não o nome.

- `ddragon.leagueoflegends.com` às vezes abre e às vezes não; a skill `rodar-nexus` simula as imagens (ou use `--imagens-reais`). `github.io` e `docs.github.com` costumam estar bloqueados.
- O usuário está no celular (~360×650–700 visíveis, navegador interno com barra que aparece e some): links `localhost` não abrem para ele. Teste layouts em 360×640 e 360×700 e meça com Playwright (posições, conteúdo cortado, sobreposição com a barra de controles) usando só amostras com a partida rodando; uma amostra do fim do jogo engana.
- Para provar que algo não muda a simulação: semente fixa (`Math.random` semeado) e compare placar/tempo final entre caminhos.
- Scripts temporários de Playwright precisam ficar em `.claude/skills/rodar-nexus/` para achar o `playwright`; apague-os depois.

## Deploy

`.github/workflows/deploy.yml` gera o build com `--base ./` (o site vive em `/Nexus-/`) e publica no GitHub Pages a cada push no `main` ou manualmente pela aba Actions. É gratuito porque o repositório é público e usa o executor padrão `ubuntu-latest`; não troque por executores maiores, que são cobrados.
