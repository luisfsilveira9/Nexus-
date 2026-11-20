# Nexus Idle — visão do produto (v0, hipóteses para o PO validar)

## Fantasia do jogador
Você é o diretor de uma organização de LoL no cenário brasileiro. Seu time treina, faz scrims e joga
partidas oficiais sozinho, inclusive com o app fechado. Você volta, colhe os resultados, investe e
leva a organização da gaming house ao título mundial.

## O que já existe no Nexus eSports Manager e pode ser reaproveitado
- Motor de partida por eventos calibrado nas regras de 2026 (draft Fearless, objetivos, ganks,
  teamfights), rodando sem interface.
- Jogadores com skills: fase de rotas, mid game, teamfight, controle de objetivos e macro game.
- Moedas por partida conforme o desempenho e caixas que trazem novos jogadores (gacha).
- Estratégias por fase de jogo, calendário de temporada e narração de lances.
- Visual Hextech em React + TypeScript.

## Loop idle proposto
1. **Gerar:** o time joga partidas simuladas continuamente e rende moedas por segundo (mais em
   vitórias e com bom desempenho).
2. **Investir:** centro de treinamento (sobe as 5 skills), staff (treinador, analista, psicólogo),
   estrutura (gaming house, bootcamp) e caixas de jogadores.
3. **Progredir:** subir de divisão → Split 1 → Split 2 → Mundial.
4. **Prestígio:** fechar a temporada reinicia parte do progresso em troca de **Legado**, um bônus
   permanente, e abre um novo capítulo da história.

## Restrições
- Uso pessoal: sem compras com dinheiro real e sem anúncios.
- Sessões de 1 a 3 minutos; ganho offline com limite de tempo.

## Perguntas em aberto para o PO
- Plataforma alvo do MVP: só Android, ou Android e iOS?
- O jogador escolhe draft e estratégia, ou isso vira um upgrade automatizado (estilo idle)?
- Limite inicial de ganho offline (ex.: 8 h) e como ele cresce.
- Modo de partida assistida (ver uma partida acelerada) como recompensa extra?
