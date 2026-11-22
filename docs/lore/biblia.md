# Bíblia da lore — Nexus Idle v0.2

> Dono: `nexus-lore`. História NX-003. Fonte para todo texto do jogo.
> Antes de criar algo, confira aqui. Ao mudar um fato, atualize este arquivo e liste o impacto no
> fim (seção "Registro de mudanças").
> Nomes finais de divisões, rivais, geradores, botão e prestígio: `nomes-do-jogo.md`.
> Universo **100% fictício** (ADR-001): nenhum jogador, time, caster, liga ou campeão real.

---

## 1. Premissa

A **Lan do Farol**, no bairro do Farol, na cidade fictícia de **Porto Ventura**, vai fechar. Dona
Celina, a dona, tem dívidas, computadores velhos e cinco clientes fiéis que jogam LoL ali todas as
noites. Em vez de vender as máquinas, ela entrega a sala dos fundos para **você**, com um pedido:
"Transforma essa turma num time de verdade."

Você vira a direção da **Faísca eSports** (nome sugerido; o jogador pode renomear). O clube começa na
**Várzea**, o circuito amador dos bairros, e sobe pela **Pirâmide** (o sistema de divisões) até o
**Mundial**. O dinheiro vem dos negócios do clube; a força vem dos cinco jogadores. Quando o clube
chega longe o bastante, dá para **refundar**: voltar ao bairro e recomeçar com tudo o que se
aprendeu. É isso que vira **Legado**.

**Tema central:** de onde a gente vem não é um peso, é um ponto de partida. Cada recomeço deixa
o clube mais forte.

**Em uma frase:** "De uma lan house que ia fechar até o palco do Mundial, quantas vezes for preciso."

## 2. Tom de voz

**Várzea com coração, competitivo com cabeça.** Calor de bairro, humor leve e respeito pelo jogo.

| Faça | Evite |
|---|---|
| Frases curtas, verbos de ação, português do dia a dia | Textão, jargão corporativo, inglês desnecessário |
| Humor leve e carinhoso com o próprio clube | Ironia com o jogador, deboche de rival, humilhação |
| Celebrar o progresso, mesmo pequeno | Pressão para voltar, culpa, contagem regressiva, "não perca!" |
| Falar com "você", sem marcar gênero do jogador ("a direção", "você") | "Diretor", "bem-vindo" (use "Boas-vindas", "Que bom te ver") |
| Termos genéricos de LoL: rota, Barão, Dragão, gank, farm, torre, Nexus | Nomes de campeões, jogadores, times, ligas ou casters reais |
| Números exatos quando ajudam a decidir | Números que podem mudar no balanceamento dentro de capítulos |
| Derrota tratada como aprendizado | Derrota tratada como fracasso do jogador |

### Exemplos

| Situação | Boa | Ruim | Por quê |
|---|---|---|---|
| Toque no botão | "Mais uma live no ar." | "CLIQUE MAIS PARA GANHAR MAIS OURO!!!" | Grito e pressão |
| Gerador liberado | "A padaria da esquina quer estampar a camisa." | "Novo gerador desbloqueado: Patrocínio local (tier 2)." | Fala de sistema, não de mundo |
| Derrota | "Perdemos essa. A Bússola já está revendo a partida." | "Você perdeu. Seu time é fraco." | Culpa o jogador |
| Volta do offline | "Enquanto você esteve fora, o clube rendeu 1,23 mil de ouro." | "Você ficou fora 8 h e perdeu 4 h de ganho! Volte mais vezes!" | Pressão (RN-016) |
| Sem ouro | "Faltam 12 de ouro. A renda chega lá em instantes." | "Ouro insuficiente." | Não diz o que fazer |
| Rebaixamento | "Caímos para o Acesso. A gente já conhece o caminho de volta." | "REBAIXADO. Que vergonha." | Humilha |
| Erro de save | "Não deu para ler o último save. Carregamos o anterior, de 10 s atrás." | "Erro 0x34: save corrupted." | Técnico e sem saída |

### Regras de escrita
- Microcopy: até o limite do componente combinado com o `nexus-ux`; se não couber, corte adjetivo,
  nunca a instrução.
- Mensagem de erro sempre diz **o que aconteceu** e **o que fazer**.
- Nome do clube é variável (`{clube}`) e pode ser masculino ou feminino: escreva sem artigo
  ("{clube} subiu para o Acesso", "a torcida de {clube}"), nunca "o {clube}".
- Capítulo: até 180 palavras (menos de 1 min de leitura no celular), até 8 blocos de até 280
  caracteres (RN-020). Prólogo e capítulo da refundação: até 4 blocos. Os limites valem com `{clube}`
  trocado por um nome de 20 caracteres. O lore mira em **até 170 palavras** para deixar folga a nomes
  com muitas palavras.
- Nada de número que depende da economia (multiplicador, renda, Legado, tempo) em capítulo ou fala.
  Se precisar, use variável (`{mult}`) e avise o `nexus-tech`. Regras fixas de competição (10 vitórias
  para subir, 14 partidas no split) podem aparecer.
- Sem palavrão. Gíria de bairro e de LoL, sim, com moderação (no máximo uma por fala).

## 3. Glossário

| Termo no jogo | O que é | Regra |
|---|---|---|
| **Ouro** | Dinheiro do clube | RN-001 |
| **Legado** | História acumulada do clube; bônus permanente de renda e poder | RN-001, RN-014 |
| **Renda** | Ouro por segundo ("renda/s") | RN-002 |
| **Negócios** | Nome da aba dos geradores na tela (sugestão para o UX) | RN-003 |
| **Fazer live** | Botão de toque | RN-005 |
| **Elenco** | Os 5 jogadores do clube | RN-007 |
| **Nível** | Forma e entrosamento do jogador no projeto atual (não é talento) | RN-007 |
| **Poder** | Força em partida; do jogador e do time | RN-007, RN-008 |
| **Pirâmide** | O sistema de 6 divisões, da Várzea ao Mundial | RN-008 |
| **Divisão** | Degrau da Pirâmide | RN-008 |
| **Partida** | Jogo automático a cada 90 s | RN-009 |
| **Chance de vitória** | P(vitória) mostrada antes da partida | RN-009 |
| **Split** | Bloco de 14 partidas | RN-010 |
| **Subir / Manter / Cair** | Resultado do split | RN-010 |
| **Refundar o clube** | Prestígio | RN-013 |
| **Capítulo** | Cena curta da história, aberta por marco (prólogo, divisões, 1ª refundação, epílogo) | RN-018, RN-020 |
| **Fala de 1 linha** | Frase curta (até 60 caracteres) ao subir de novo a uma divisão já vista ou do 2º título em diante | RN-018 |
| **Título mundial** | Split no Mundial com 10 ou mais vitórias | RN-010 |
| **Temporada (narrativa)** | Arco da história em capítulos (arquivos `temporadas/T##.md`) | — |
| **Run** | Termo interno (docs). Na tela: "projeto atual" ou "desde a última refundação" | — |

**Termos de LoL permitidos (genéricos):** Topo, Selva, Meio, Atirador, Suporte, rota, gank, farm,
torre, inibidor, Nexus, Barão, Dragão, Arauto, ward, visão, teamfight, split push, draft (só como
palavra), elo, fila, patch.
**Proibidos:** qualquer nome de campeão, item com nome próprio, jogador, time, liga, evento,
caster ou organizadora reais.

## 4. Cenário

- **Porto Ventura:** cidade portuária fictícia, grande, no litoral brasileiro. Morros, cais,
  feira de domingo, ônibus lotado.
- **Bairro do Farol:** bairro antigo perto do cais, com um farol desativado que é o símbolo do
  clube. Tem a Padaria Estrela, a quadra de terra do antigo Farol FC e a **Lan do Farol**.
- **Lan do Farol:** 12 máquinas, ventilador de teto, balcão com salgado e um quadro de cortiça com
  fotos de 20 anos de clientes. A sala dos fundos vira a sede do clube.
- **A Pirâmide:** organizada pelo **Conselho do Circuito** (entidade fictícia). Seis divisões
  (nomes em `nomes-do-jogo.md`). As três primeiras são regionais, a quarta é a liga nacional de
  elite, a quinta reúne o continente e a sexta é o Mundial.
- **Regiões do mundo (fictícias):** Boreal, Oriente, Meridião e Ocidente, além do continente da
  Faísca. Servem para dar origem aos rivais do Mundial sem citar ligas reais.

## 5. O clube do jogador

- **Nome sugerido:** Faísca eSports. **Sigla:** FSC. Nome renomeável (até 20 caracteres) e sigla
  (3 letras), a definir com o `nexus-ux`.
- **Símbolo:** o farol do bairro soltando uma faísca (pedido de arte vai para a NX-005).
- **Cores sugeridas para a arte:** laranja brasa e azul noite do cais (decisão final do `nexus-arte`).
- **Grito da torcida:** "Acende, Faísca!" (com nome renomeado: "Acende, {clube}!").
- **Por que "Faísca":** todo idle começa pequeno. Uma faísca vira fogueira se alguém cuidar.

## 6. Os 5 jogadores

Os cinco são fixos (RN-007). O **nível** de cada um é a forma no projeto atual: ao refundar, a forma
volta ao começo, mas a experiência fica no Legado (+1% de poder por ponto). Assim a história continua
coerente depois de cada refundação.

### Aparência (ADR-003, `docs/arte/folha-referencia-chibi.png`)

Fonte da verdade visual: a folha chibi e o gerador `docs/arte/gerar-chibi.py`. Texto e arte não
podem se contradizer: um capítulo só cita um acessório ou uma roupa que está na tabela abaixo. Se o
texto precisar de algo novo (um boné, uma cicatriz), o lore abre pedido para a arte antes.

**Base comum (todos):** chibi de cerca de 2,5 cabeças, olhos grandes, contorno escuro e sombra de
1 tom; camisa do clube **azul noite** com gola **laranja brasa** e o ícone da função estampado no
peito. Quatro expressões: feliz, focado, comemorando e frustrado (gota de suor).

| Quem | Acessório (assinatura) | Silhueta (o que se reconhece só pela sombra) | Cor-assinatura | Outros traços |
|---|---|---|---|---|
| **Pedra** (Topo) | Bandana branca de padeiro, com nó de duas pontas do lado direito | Ombros mais largos do elenco; pontas da bandana saindo da cabeça | Barro | Pele morena, cabelo escuro curto, barba por fazer, olhos castanhos. Ícone de Topo (montanha) no peito |
| **Rastro** (Selva) | Boné verde virado para trás (aba para a esquerda) e celular gravando na mão, com a luz vermelha acesa | Rabo de cavalo cacheado e alto, em tufos; aba do boné; celular | Grama | Pele negra, cabelo preto cacheado, olhos âmbar. Ícone de Selva (folha) |
| **Vulto** (Meio) | Capuz do moletom sempre na cabeça; franja longa que cobre o olho esquerdo, com reflexo azul | Cabeça toda envolvida pelo capuz, forma arredondada e lisa | Mar | Pele clara, olhos azul-acinzentados, sorriso de canto. É o único que usa **moletom cinza-azulado** por cima da camisa. Ícone de Meio (losango) |
| **Fagulha** (Atirador) | Óculos redondos | Topete em forma de faísca, apontando para cima | Céu | Pele clara, cabelo preto, olhos castanho-escuros; o mais novo e o de rosto mais redondo. Ícone de Atirador (mira) |
| **Bússola** (Suporte) | Headset com conchas laranja e microfone; pingente de bússola dourado | Coque cacheado alto no topo da cabeça; arco do headset | Ouro | Pele morena, cabelo castanho-escuro cacheado, olhos verdes. Ícone de Suporte (escudo) |
| **Dona Cel** (mascote dos avisos) | Óculos de leitura na ponta do nariz, presos numa corrente dourada; apito de técnica de várzea num cordão laranja | Coque grisalho no topo da cabeça | Turquesa (a cor do Legado) | Cabelo grisalho, pés de galinha, olhos castanhos. Usa **cardigã turquesa** sobre gola branca, não a camisa do clube |

Regras de uso no texto:
- "A Rastro está gravando" = o celular da arte. "O Vulto mexe no capuz", "a Bússola fala no fone",
  "o Fagulha ajeita os óculos", "o Pedra amarra a bandana", "Dona Cel sopra o apito" ou "tira algo do
  bolso do cardigã" são gestos coerentes com a folha.
- A cor-assinatura serve para a arte e a interface identificarem o jogador; o texto não precisa
  citá-la.
- Dona Cel é a **mascote dos avisos** (dicas, avisos de save e capítulos, ADR-003). A voz dela nesses
  avisos segue o §7: carinhosa, curta e sem pressão.

### Topo — Rafael "Pedra" Nunes
- **Idade:** 26. Padeiro na Padaria Estrela, chega à lan com cheiro de pão às 22 h.
- **Personalidade:** calmo, paciente, fala pouco, humor seco. Aguenta pressão na rota sem reclamar.
  É o mais velho e o mais subestimado.
- **Motivação:** provar que dá para começar tarde. Desistiu de jogar a sério aos 18 para ajudar a mãe
  na padaria.
- **Arco (T01):** de "só tô aqui ajudando a turma" a capitão que fala no vestiário do Mundial.
- **Jeito de falar:** frases de 3 a 6 palavras, sem gíria, metáforas de padaria e de obra.
  - "Massa boa precisa descansar."
  - "Segura. Eu seguro."
  - "Perdemos. Amanhã tem fornada."
- **Nunca diz:** discursos longos (até o capítulo do Mundial, que é o arco dele).

### Selva — Tainá "Rastro" Duarte
- **Idade:** 19. Entregadora de bicicleta; conhece cada beco de Porto Ventura.
- **Personalidade:** elétrica, impulsiva, engraçada, fala rápido. Grava tudo para as redes. Lê o
  mapa como ninguém, mas quer agir antes da hora.
- **Motivação:** ser vista. Quer que o bairro inteiro saiba o nome dela e quer uma bolsa de estudo
  de design.
- **Arco (T01):** aprende a esperar o momento certo. Do gank apressado ao "agora não; daqui a 20 s".
- **Jeito de falar:** gírias, exclamação, repete palavras, chama todos de "gente".
  - "Gente, gente, GENTE, o Dragão tá livre!"
  - "Eu ia, eu juro que eu ia."
  - "Calma, Rastro. Calma. Tá. Agora!"

### Meio — Caio "Vulto" Arantes
- **Idade:** 21. Ex-jogador da base da Vértice (rival principal da T01), dispensado aos 18 por
  "falta de perfil de equipe".
- **Personalidade:** talentoso, orgulhoso, irônico. Por baixo, inseguro e com medo de ser
  descartado de novo.
- **Motivação:** provar que a Vértice errou.
- **Arco (T01):** troca "provar para eles" por "jogar com a gente". Enfrenta o passado na Elite.
- **Jeito de falar:** seco, frases curtas e cortantes, ironia; no fim, frases com "a gente".
  - "Então a gente fica melhor."
  - "Já vi esse jogo. Já sei como acaba."
  - (no fim do arco) "Joguei pra vocês. Foi melhor assim."

### Atirador — Leonardo "Fagulha" Okada
- **Idade:** 17, o caçula. Sobrinho-neto da Dona Celina. Ainda no ensino médio.
- **Personalidade:** educado, ansioso, perfeccionista, obcecado por números e tabelas. Treme nas
  partidas grandes, mas não erra o farm.
- **Motivação:** mostrar ao pai, que acha videogame perda de tempo, que isso é coisa séria.
- **Arco (T01):** da ansiedade à confiança. O pai aparece na arquibancada do Mundial.
- **Jeito de falar:** "tipo", hesitações, perguntas, números (sempre aproximados, para não envelhecer
  com o balanceamento).
  - "Tipo… a chance tá boa, né? Tá boa."
  - "Eu fiz a conta três vezes."
  - "Desculpa. Não, pera, não foi culpa minha. Foi?"

### Suporte — Marta "Bússola" Ferraz
- **Idade:** 23. Estuda psicologia à noite. Já jogou em times tóxicos de fila e saiu.
- **Personalidade:** organizada, acolhedora e firme. É a voz de comando do time e a ponte com a
  direção (com você).
- **Motivação:** construir um time onde ninguém fica para trás.
- **Arco (T01):** aprende a pedir ajuda; cuida de todos e esquece de si até o Continental.
- **Jeito de falar:** "a gente", frases calmas e diretas, perguntas que organizam.
  - "Respira. Qual é o próximo objetivo?"
  - "A gente topa. Mas quem decide é a direção."
  - "Ninguém joga sozinho aqui."

## 7. Staff e mentores

### Dona Celina "Cel" Barros — mentora e dona da Lan do Farol
- **Idade:** 63. Fundou o Farol FC, time de futebol de várzea que ela "refundou" quatro vezes em 30
  anos. Cada volta, o time voltava melhor.
- **Papel no jogo:** apresenta o jogo, explica o prestígio ("Refundar o clube") e o Legado. É a
  mascote dos avisos (ADR-003). Aparência no §6.
- **Motivação:** não deixar o bairro perder mais um lugar de encontro.
- **Arco:** de dona da lan endividada a presidente de honra do clube.
- **Jeito de falar:** ditados de várzea, carinhosa e mandona, chama todos de "menino" e "menina" e
  chama você de "direção".
  - "Time bom se faz no barro."
  - "Refundar não é perder. É lembrar com mais força."
  - "Gaste com cabeça, que o bairro está olhando."

### Renato "Renatão" Saraiva — comercial
- **Idade:** 45. Sobrinho da Dona Cel, vendedor de tudo (já vendeu consórcio, churrasqueira e rifa).
- **Papel:** a voz dos **negócios** (geradores). Anuncia cada negócio novo.
- **Motivação:** finalmente acertar um projeto.
- **Jeito de falar:** exagerado, otimista, vendedor.
  - "Direção, fechei com a padaria! Contrato de pão e de camisa!"
  - "Isso aqui é ouro. Literalmente."

### Otávio "Prof" Lemes — técnico (entra no capítulo 2)
- **Idade:** 38. Ex-jogador profissional de uma geração antiga da Pirâmide; perdeu uma final por uma
  decisão dele e largou tudo. Dá aula de matemática.
- **Papel:** explica elenco e poder ("o time ganha pela força, não pelo dinheiro").
- **Motivação:** voltar a acreditar que ainda tem algo a ensinar.
- **Jeito de falar:** didático, calmo, analogias com sala de aula.
  - "Revisão: quem é mais forte, ganha mais vezes. Não sempre."
  - "Ninguém aprende sem errar a primeira prova."

### Beatriz "Bia" Kondo — analista de dados (entra no capítulo 3)
- **Idade:** 27. Saiu da área de dados da Vértice por discordar do Heitor.
- **Papel:** explica chance de vitória e números.
- **Jeito de falar:** precisa, frases com números, ceticismo bem-humorado.
  - "Os dados não mentem. Mas também não contam tudo."
  - "Setenta e sete por cento. Ótimo. Não é cem."

### Casters (fictícios, para narração futura, NX-022)
- **Zeca Trovão:** narrador. Emocionado, bordões curtos ("Acendeu!"). Nunca debocha de quem perde.
- **Lia Moraes:** comentarista. Analítica, explica o porquê do lance.

## 8. Rivais

- **Rival principal da T01: Vértice** (Elite) e seu time de base, **Vértice Base** (Ascensão).
  - **Heitor Valadares**, 50, CEO. Frio, educado, acredita em dinheiro e planilha. Não é vilão
    caricato: respeita resultado. Fala formal: "Números, senhores. Só números."
  - **Dante "Coroa" Lacerda**, 22, meio da Vértice, ex-colega de base do Vulto. Arrogante em
    público, leal em particular.
  - Arco: da indiferença ("um time de lan house") ao respeito ("Vocês jogam como quem não tem medo
    de cair. Isso não se compra.").
- **Chefão do Mundial: Dinastia Jade** (região Oriente). Atual campeã. Capitã **Lumen**, silenciosa,
  que só fala com a Faísca depois da final.
- **Rivais da Várzea:** sempre com humor (nunca deboche): times de bairro, lanchonete, wi-fi ruim.
- Todos os 42 rivais e siglas estão em `nomes-do-jogo.md`.

## 9. Linha do tempo (relativa ao início do jogo, "Ano 0")

| Quando | Fato |
|---|---|
| Ano −30 | Dona Cel funda o Farol FC na quadra de terra do bairro. |
| Ano −30 a −10 | O Farol FC acaba e é refundado quatro vezes. Na quarta, ganha a Copa do Bairro. |
| Ano −20 | Dona Cel abre a Lan do Farol. |
| Ano −12 | Prof Lemes perde a final da liga nacional da Pirâmide e se aposenta. |
| Ano −3 | Vulto é dispensado da base da Vértice. |
| Ano −1 | Os cinco viram os clientes fixos da lan; jogam juntos na fila sem nome de time. |
| Ano 0 | A lan vai fechar. Dona Cel entrega a sala dos fundos à direção. Nasce a Faísca eSports na Várzea. (Início do jogo) |
| T01 | Da Várzea ao Mundial (ver `temporadas/T01.md`). |

**Regra de tempo:** a história não cita anos reais, patches reais nem eventos reais.

## 10. Regras de coerência com as RN

1. **Refundar (RN-013):** na ficção, a direção escolhe voltar à Várzea para reconstruir com
   estrutura nova. Os negócios são vendidos (ouro e geradores zeram), os jogadores voltam à "forma
   de pré-temporada" (níveis zeram), o clube recomeça na Várzea. Fica o Legado: a história, a torcida
   e a experiência.
2. **Capítulos andam por marco, não por run:** a história avança uma vez só. Depois de refundar, os
   capítulos vistos não voltam (NX-017); a história continua do ponto em que parou.
3. **Rebaixamento:** nunca é tratado como tragédia; frase curta e próxima meta.
4. **Números nos capítulos:** evitar valores que o balanceamento (NX-007) possa mudar. Se precisar,
   usar variável e avisar o `nexus-tech`.

## Registro de mudanças
| Versão | Data | Mudança | Impacto |
|---|---|---|---|
| v0.1 | 20/11/2026 | Primeira versão (NX-003) | Nomes finais para RN-003, 005, 008, 013; pedidos 1 a 4 em `docs/produto/pedidos.md` |
| v0.2 | 22/11/2026 | NX-019: aparência dos 5 jogadores e da Dona Cel (§6, folha chibi do ADR-003); Dona Cel como mascote dos avisos (§7); glossário com split decidido, fala de 1 linha e título mundial; regras de limite (RN-020) e de números no §2 | Capítulo 1 reescrito para caber em 180 palavras e sem "a renda dobra" (`temporadas/T01.md`). Textos novos em `textos-mvp.md`. Nenhuma mudança de nome. Arte: nenhum asset novo pedido |
