---
name: rodar-nexus
description: Sobe o Nexus no servidor do Vite e joga uma partida inteira num Chromium headless de celular (390×844), salvando uma captura de cada tela (Liga, Elenco, ficha, draft, partida, resultado, Motor). Use para ver uma mudança de interface funcionando, comparar antes/depois ou confirmar que nada quebrou antes de comitar.
---

# Rodar o Nexus e capturar as telas

## 1. Subir o servidor

```bash
pnpm install --frozen-lockfile   # o hook de SessionStart já faz isso na nuvem
lsof -ti:5173 -sTCP:LISTEN | xargs -r kill
nohup ./node_modules/.bin/vite --port 5173 --strictPort > /tmp/vite.log 2>&1 &
timeout 30 bash -c 'until curl -sf http://localhost:5173 >/dev/null; do sleep 1; done'
```

Para parar: `lsof -ti:5173 -sTCP:LISTEN | xargs -r kill`. Não use `pkill -f` com padrão amplo.

## 2. Dirigir e capturar

```bash
node .claude/skills/rodar-nexus/capturar.cjs http://localhost:5173/ <pasta-de-saida>
```

O script segue o caminho de um jogador: Liga → Elenco → ficha do primeiro titular → First Selection (1º pick) → draft automático → partida ao vivo → "Pular para o fim" → resultado → Motor. Salva `1-liga.png` … `9-motor.png` e sai com código 1 se a página lançar erro ou se algum botão esperado não aparecer.

- **Sorteios fixos:** `Math.random` é semeado, então duas execuções produzem a mesma partida. Rode antes e depois de uma mudança e compare as imagens de mesmo número.
- **Imagens dos campeões:** nas sessões na nuvem o `ddragon.leagueoflegends.com` costuma estar bloqueado, então o script responde com quadrados coloridos no lugar das artes. Passe `--imagens-reais` quando a rede liberar o host. Se aparecerem iniciais em vez dos quadrados, a URL montada em `src/game/ddragon.ts` está errada.
- **Olhe as capturas** com a ferramenta de leitura de imagens antes de declarar que funcionou. Tela em branco é falha.

## 3. Comparar antes/depois

Faça as capturas de "antes" com o código atual **antes** de editar, guarde numa pasta separada, aplique a mudança e capture de novo. Mostre ao usuário os pares das telas afetadas.

## Problemas comuns

- `Draft completo` não aparece em 60 s: o draft travou; veja erros no console com `page.on('console')`.
- A ficha não abre: o seletor `.row` do Elenco mudou; ajuste o clique em `capturar.cjs`.
- O Vite avisa sobre `__dirname` no `vite.config.ts` (`configLoader: 'native'`): é só aviso.
