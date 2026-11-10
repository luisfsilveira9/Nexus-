# Roster/Squad (Elenco) Screen UI/UX for the Nexus esports manager

Scope: the Elenco tab (player list → player detail → tactics) in `nexus/src/ui/Elenco.tsx`, with patterns from manager games, LoL stat sites, dataviz and mobile UX research.

Research limitation (important for the writer): in this session, web *fetching* was blocked for most domains (sortitoutsi.net, pcgamer.com, fmscout.com, footballmanager.com and mobalytics.gg all failed DNS). Most external findings below therefore come from search-result excerpts, not full-page reads. I mark the weaker claims. No reliable sources turned up for Motorsport Manager, OOTP, NBA 2K MyGM or "Esports Manager 2026" UI specifics; those are listed as gaps.

---

## What are the concrete pain points of the current Elenco UI?

### Takeaway
The current screen shows a lot of raw numbers with little hierarchy. All bars use the same gold styling whatever the value or role, energy and stress bars in the list have no labels, morale and season stats exist in the data model but never appear, and the detail view is one long bottom-sheet scroll that puts the actions at the bottom and offers no way to move to the next player.

### Cited Findings (from reading the code)
- **List row (`Elenco()`):** each row's avatar is the player's *first mastery champion's* portrait, with a small 22px role badge (9px font) on top. Nothing in the row identifies the player himself. — [Elenco.tsx L99–101](../../src/ui/Elenco.tsx)
- **Unlabeled bars:** energy (blue) and stress (red) appear as two bars with no text. They are identified only by an HTML `title` attribute, which does nothing on touch screens, and by a footnote *below* the list ("Barra azul: energia · barra vermelha: estresse…"). The two bars also run in opposite directions: a high energy bar is good, while a high stress bar is bad. — [Elenco.tsx L103, L106](../../src/ui/Elenco.tsx)
- **Trait chips:** `topTraits` merges style aptitudes (`apt`) and tactical attributes (`tac`), sorts them and shows the top 3 as chips such as "Gank 78". The chips have no scale and no indication of whether the trait matters for the player's role. — [Elenco.tsx L8, L104](../../src/ui/Elenco.tsx)
- **Data never shown:** `morale` and `season?: SeasonStats` are defined in the Player type, but the Elenco screen never renders them. — [types.ts L17, L20](../../src/game/types.ts)
- **Player detail (`PlayerSheet`):** opens in a bottom sheet (`ui.openSheet`) and stacks everything in one scroll, in this order:
  1. header with OVR
  2. hidden-trait reads ("Muito consistente", "Sente jogos grandes"…)
  3. 6 core stats as big gold bars
  4. every style aptitude as a mini-bar grid
  5. every tactical attribute as a mini-bar grid
  6. energy and stress
  7. champion mastery grid (3 columns)
  8. 4 action buttons (Treino, Folga, Psicólogo, Stream)

  The actions, which are the main *verbs* on the screen, sit at the very bottom. — [Elenco.tsx L32–58](../../src/ui/Elenco.tsx)
- **No value bands:** core stats always use the same gold gradient. Mini-bars switch to a brighter gold only at 85 or above, so there are no low/average/good/excellent bands. — [Elenco.tsx L36–37](../../src/ui/Elenco.tsx)
- **Two percentages per champion:** each mastery cell shows "mastery %" in gold and "encaixe %" (fit) in 10px muted text. Two percentages with different meanings sit next to each other. — [Elenco.tsx L50–52](../../src/ui/Elenco.tsx)
- **Instant actions:** actions apply immediately and confirm with a toast. There is no preview of the before/after values and no undo. The effects are described in dense text ("+1 rotas, lutas e mecânica · −25 energia · +15 estresse"). — [Elenco.tsx L18–29, L53–57](../../src/ui/Elenco.tsx)
- **Tactics (`Taticas`):**
  - Layout: a summary panel, a 5-column shotcaller picker, then 4 blocks. Each block is a segmented control with 3–4 options plus a description that changes with the choice. — [Elenco.tsx L61–85](../../src/ui/Elenco.tsx)
  - Fit display: the fit appears as small text ("Combina com: Objetivos, cerco e mapa **73**"). A ★ marks the suggested option. Neither tells you how much fit changes if you switch. — [Elenco.tsx L61–85](../../src/ui/Elenco.tsx)
  - Crowding: the "Foco do meio de jogo" control has 4 options ("Objetivos/Equilibrado/Teamfight/Split push") in 12.5px buttons, which is tight at 360px width. — [tactics.ts L4–10](../../src/game/tactics.ts); [index.css L421](../../src/index.css)
- **Budget on the squad tab:** the top tiles show Orçamento, Entrosamento and OVR médio. Budget is a finance value placed on the squad tab. — [Elenco.tsx L93–97](../../src/ui/Elenco.tsx)

### Inferences
- The fastest wins would come from the following, all without new game data:
  - label the list bars or turn them into status icons
  - flip stress into a single "Condição" meter so that bigger always means better
  - show morale
  - move the actions to the top of the detail view or into a sticky footer
- The detail sheet tries to be a full profile page. That is the case NN/g warns against putting in a sheet (see the mobile navigation section).

### Gaps
- No user testing data or analytics exists on how players actually use the Elenco tab.

---

## How do manager games present player cards, attribute groups, overall ratings, condition, and detail pages, and what gets praised or criticized?

### Takeaway
The genre is settling on a two-level model: a compact tile or card that summarizes (OVR, role fit, condition), then an expandable detail grouped into 3–4 attribute families. FM26's move to a tile-and-card UI was the most discussed part of the release. It was criticized mainly for *removing at-a-glance info*, *adding clicks/panels* and *sluggish transitions*, not for using cards as such. Sports Interactive responded with patches (custom attribute colours, option to disable transitions, restored sorting).

### Cited Findings
**Football Manager 26 (Sports Interactive)**
- **Tile → Card model:** FM26's UI is built on a "Tile and Card" system that powers every screen. A tile is a snapshot of key info, and clicking it opens a Card with more detail. — [footballmanager.com: FM26's Reimagined UI](https://www.footballmanager.com/features/total-football-total-control-fm26s-reimagined-user-interface); [FMScout: FM26 reimagined UI](https://www.fmscout.com/a-fm26-reimagined-ui.html)
- **Design principles:** FMScout reports the UI was built on three stated principles: Efficiency (faster access to information), Familiarity (still feels like FM) and Predictability (easy to learn and master). — [FMScout (via search excerpt)](https://www.fmscout.com/a-fm26-tactics-overhaul.html)
- **Profile layout:** a fan blog says the FM26 profile keeps the classic attribute grid but surfaces role fit, happiness, fitness, form and training progress as compact tiles. Fan source, from a search excerpt. — [footballmanagerblog.org](https://www.footballmanagerblog.org/2025/09/fm26-user-interface-reimagined.html.html)
- **Missing information:** Sortitoutsi found that dynamics, playing time and plans are missing from the FM26 player profile compared with FM24. It also judged that the profile shows less than some of the better FM24 skins. — [Sortitoutsi: "a good start but I'm still left scratching my head"](https://sortitoutsi.net/content/74393/fm26-user-interface-a-good-start-but-im-still-left-scratching-my-head)
- **Search screen:** the new player search screen reportedly lacks information that used to be visible at a glance, such as nationality and star rating. — [Digitec: "FM26 is floundering in an interface labyrinth"](https://www.digitec.ch/en/page/football-manager-26-is-floundering-in-an-interface-labyrinth-40507)
- **Navigation:** Digitec called the flow between profile, scout report and transfer screens "a house of cards consisting of panels", made worse by sluggishness. — [Digitec](https://www.digitec.ch/en/page/football-manager-26-is-floundering-in-an-interface-labyrinth-40507)
- **At-a-glance judgment lost:** a PC Gamer reviewer said the old profile screen let them judge a player at a glance. They added that the UI was already overwhelming before and FM26 "doubled down" on it. Steam reviews fell to "Mostly Negative" at launch. — [PC Gamer review](https://www.pcgamer.com/games/sports/football-manager-26-review); [PC Gamer: Steam reviews](https://www.pcgamer.com/games/sim/football-manager-26-launches-straight-into-a-relegation-battle-as-steam-reviews-plummet-to-mostly-negative-been-playing-since-1993-and-this-is-the-worst-one)
- **More clicks:** reviewers said various options require "further clicking and digging to find". FinalBoss summed it up as "best matches yet, worst menus in years". — [FinalBoss](https://finalboss.io/after-70-hours-with-football-manager-26-im); [The Sixth Axis review](https://www.thesixthaxis.com/2025/11/04/football-manager-26-review/)
- **SI's acknowledgement:** SI called the UI "undoubtedly the most prominently discussed topic" and said "there are many adjustments that need to be made". This comes via a search summary of press coverage. — [FRVR](https://frvr.com/blog/news/football-manager-26-alpha-reviews-reveal-the-good-the-bad-and-the-ugly-for-the-first-step-towards-the-future-of-fm)
- **Post-launch patches:**
  - Day-one patch: customizable attribute colours, plus an option to reduce or disable UI transition speed. — [Operation Sports: day-one patch](https://www.operationsports.com/fm26-day-one-patch-drops-with-300-fixes-and-upgrades-patch-notes)
  - Update 26.3: restored sorting options and improved filter memory across screens. — [Operation Sports: 26.3](https://www.operationsports.com/fm26-update-26-3-focuses-on-youth-development-ui-fixes-and-database-changes)
- **FM27 preview:** SI's FM27 preview says FM26 tiles served two purposes at once, presenting information and acting as navigation. It describes tile-swapping (user-customisable screens) as the start of a longer-term project. — [footballmanager.com: FM27 Clearer Interface & Smoother Navigation](https://www.footballmanager.com/node/1099)
- **Classic FM attribute model:**
  - Attributes are rated 1–20 and grouped into Technical (14), Mental (14) and Physical (8). — [Passion4FM: attributes explained](https://www.passion4fm.com/football-manager-player-attributes/)
  - The overview shows an "attribute polygon" (radar), and community mods let it toggle to Pros/Cons with traits. — [FMScout: FM26 player profile polygon](https://www.fmscout.com/a-fm26-player-profile-polygon.html); [FM-Base: Player Profile Polygon](https://fm-base.co.uk/resources/player-profile-polygon.9313)
- **Role suitability:**
  - Shown as 0–5 stars in half-star steps. Hovering gives a word label from "Below Average" to "First-class". The stars represent the coach's opinion of current ability in that role. — [FMScout: guide to role abilities](https://www.fmscout.com/a-guide-to-player-role-abilities-in-football-manager.html)
  - Selecting a role highlights its key attributes in green and preferable ones in blue. — [FMScout: guide to role abilities](https://www.fmscout.com/a-guide-to-player-role-abilities-in-football-manager.html); [SI manual: Players](https://community.sports-interactive.com/manual/football-manager-2021/players-r768)
- **Attribute colour bands:** attribute colours map to low, average, good and excellent bands, and skins let users change the thresholds. One skin replaces numbers with stars so unscouted values look different from genuinely low ones. — [FMScout: A-Star attributes skin](https://www.fmscout.com/a-star-attributes-fm23-skin.html); [FMScout: change attribute colours](https://www.fmscout.com/i-991-How-to-change-player-attribute-colors-in-FM-2011.html)
- **Percentages over stars:** community tools give per-role suitability as a weighted score (/20) and a percentage. They describe this as a finer resolution than in-game stars. — [Passion4FM: attribute analysis spreadsheet](https://www.passion4fm.com/player-attribute-analysis-spreadsheet/)

**EA Sports FC career mode**
- **Dynamic OVR (FC 27):** EA's FC 27 career deep dive lists "Dynamic OVR" driven by Form, Morale and Match Fitness, next to a separate "UI and Transparency" section. The displayed overall therefore reflects the player's current condition. — [EA forums: FC 27 Career deep dive](https://forums.ea.com/blog/ea-sports-fc-game-info-hub-en/ea-sports-fc%E2%84%A2-27--career-deep-dive/13603463); [Red Bull: FC 27 career mode features](https://www.redbull.com/au-en/ea-fc-27-career-mode-new-features)
- **FC 26 reception:** one FC 26 review called the menu UI "clunky, touchscreen-inspired" and said it bogs down Career mode. — [AOL/Engadget-syndicated review](https://www.aol.com/articles/ea-sports-fc-26-review-160000595.html)

**Teamfight Manager 2 (MOBA manager)**
- **Stats:** each player has about 14 trainable stats (last-hitting, skill dodging, skill accuracy, map awareness, focus, mental toughness, judgment…). The stats drive AI decisions rather than raw damage. Fan wiki source. — [teamfight-manager-2.pages.dev](https://teamfight-manager-2.pages.dev/)
- **Reception:** Steam rating is Mixed. An aggregated review summary says players find the stats "not clear" and lacking meaningful impact, and call the development system "unintuitive". This is an auto-generated summary, so weak evidence. — [Steam page](https://store.steampowered.com/app/3009300/Teamfight_Manager%202/); [Vaporlens summary](https://vaporlens.app/app/3009300/teamfight_manager_2)

**LoL Esports Manager (Riot, China-only)**
- Pro player cards show a single rating (e.g., 88 for a top laner), plus levels and a star rating. — [Dotesports](https://dotesports.com/league-of-legends/news/riot-gives-new-look-into-upcoming-league-of-legends-esports-manager-game)

### Inferences
- For Nexus, the FM26 lesson is that a tile/card summary layer is fine. What hurt FM26 was hiding at-a-glance data, adding extra taps or panels and slow transitions. The Elenco list row should keep OVR, role, condition and morale visible without opening anything, and the sheet should open instantly.
- **Proposed attribute groups.** Group the ~30 attributes into 3–4 named families, as FM does with Technical/Mental/Physical:
  - **"Jogo"**: laning, teamfight, map, mechanics, farm
  - **"Cabeça"**: mental, plus the hidden traits as words
  - **"Estilo"**: style aptitudes
  - **"Tático"**: gank, split, roaming, shotcalling…
- **Proposed role-key highlighting.** Borrow FM's role-key-attribute highlighting: for a Jungle, emphasize gank, objectives, map and farm, and fade the rest. That answers "which numbers matter for this player?"
- **Proposed OVR changes.** Consider a FC-27-style "OVR atual" that includes energy/stress/morale, next to the base OVR (e.g., "78 → 74 hoje"). It makes condition legible without extra bars.
- **Proposed fit labels.** Pair FM-style word labels with fit scores (e.g., "Excelente/Bom/Regular/Fraco") so Portuguese-speaking casual players don't have to read the numbers.

### Gaps
- Fetches were blocked, so I could not read the Sortitoutsi, PC Gamer or SI pages in full or confirm exact screenshots of the FM26 profile.
- I found no reliable 2024–2026 sources on how Motorsport Manager, OOTP, NBA 2K MyGM or "Esports Manager 2026" present player detail pages.
- Teamfight Manager 2 has no dedicated UI review. Its reception data is from an auto-generated summary.
- LoL Esports Manager UI details are thin (one Dotesports article, China-only game).

---

## Which patterns show many attributes without overload (groups, radar charts, role-fit summaries, colour scales, compact vs detailed modes, comparison)?

### Takeaway
Use **progressive disclosure**:
1. **Summary:** OVR, a role-fit word or score and 2–3 strengths/weaknesses in words.
2. **Grouped bars:** colour-banded bars inside collapsible groups.
3. **Comparison:** an optional comparison view.

Radar charts are popular in sports games and FM, but dataviz critics consistently say they are hard to read for exact values. Use them only for an overall "shape", with ≤6 axes and a fixed axis order, and keep sorted bars as the precise view.

### Cited Findings
- **Radar criticisms:** radar charts connect unrelated categories with lines that imply relationships, exaggerate differences through area, and change shape with axis order. — [Flourish: radar charts](https://flourish.studio/blog/create-online-radar-spider-charts/); [Scott Logic: a critique of radar charts](https://blog.scottlogic.com/2011/09/23/a-critique-of-radar-charts)
- **Bars recommended:** Observable argues bars, linear or radial, are the better representation, and Carta argues most radar charts "should just be bar charts". — [Observable: avoid radar charts](https://observablehq.com/blog/avoid-radar-charts); [Carta](https://carta.com/data/linkedin-radar-charts-should-be-bar-charts/)
- **Sort the bars:** sorting a bar chart is the easiest way to make it readable, and two aligned horizontal bar plots work well for comparing two entities. — [Gorelik: alternatives to radar charts](https://gorelik.net/2020/11/10/before-and-after-alternatives-to-a-radar-chart-spider-chart)
- **When radar is fine:** defenders say radar charts work for overall profile patterns and for comparing several variables across two or more items. — [Flourish](https://flourish.studio/blog/create-online-radar-spider-charts/); [Deckary](https://deckary.com/blog/radar-chart-powerpoint)
- **Radial bars:** radial bar or "stellar" charts keep the circular look, but because the bars are not connected, metric order doesn't distort the reading. — [Flourish](https://flourish.studio/blog/create-online-radar-spider-charts/)
- **Mobalytics GPI:** play is scored in 8 skill areas on 0–100 and shown as a graph on the profile. Sources disagree on the area names (e.g., Aggression, Consistency, Farming, Fighting, Survivability, Teamplay, Versatility, Vision). — [Mobalytics GPI explained](https://mobalytics.gg/gpi/); [Mobalytics home](https://mobalytics.gg/home-page)
- **FM role-fit as stars:** FM summarises fit for a role as stars with a word label, and highlights key and preferable attributes per role in green/blue. — [FMScout](https://www.fmscout.com/a-guide-to-player-role-abilities-in-football-manager.html)
- **FM colour bands:** FM colour-codes attributes in low/average/good/excellent bands with user-adjustable thresholds, and FM26 added customizable attribute colours after launch feedback. — [FMScout](https://www.fmscout.com/i-991-How-to-change-player-attribute-colors-in-FM-2011.html); [Operation Sports](https://www.operationsports.com/fm26-day-one-patch-drops-with-300-fixes-and-upgrades-patch-notes)
- **Alternative visualizers:** a community "Player Attributes Visualizer" offers radar, bar and bubble modes, which suggests users want to switch between views. — [Sortitoutsi: Player Attributes Visualizer](https://sortitoutsi.net/comments/get/886185)

### Inferences (concrete proposals for Nexus)
- **Level 1, list row (compact):**
  - role icon + nickname
  - OVR (big)
  - one "Condição" indicator that merges energy and inverted stress into a green/yellow/red dot or ring
  - a morale emoji or icon
  - 1–2 *word* strengths (e.g., "Gank forte", "Frio sob pressão") instead of numeric chips

  Do not show bars without labels.
- **Level 2, detail header:**
  - OVR plus a role-fit word label
  - a "Pontos fortes / Pontos fracos" pair built from the highest and lowest attributes relevant to the role
  - the existing `hiddenReads` chips, which already convert numbers to words and are a good pattern to keep
- **Level 3, grouped attributes:** use shadcn `Accordion` or `Tabs` for "Jogo / Estilo / Tático / Campeões". The group most relevant to the role is open by default. Inside each group, sort the bars descending and colour them in 4 bands, with a numeric value plus a band colour, e.g.:

  | Band | Range | Colour |
  |---|---|---|
  | Fraco | <60 | red |
  | Regular | 60–74 | amber |
  | Bom | 75–84 | green |
  | Elite | ≥85 | gold/blue |

- **Optional shape glance:** a 5–6 axis radar (Rotas, Lutas, Mapa, Mental, Mecânica, Farm) is acceptable in the header as an at-a-glance "shape" with a fixed axis order. Never make it the only way to read values. A radial bar chart is a safer alternative.
- **Compact vs detailed toggle:** offer a "Compacto/Detalhado" toggle on the list (persisted in localStorage), as FM players do with skins and views.
- **Comparison:** add a "Comparar" mode with two players side by side using aligned horizontal bars (per Gorelik). This is useful for the transfer and scouting flow too.
- **Fewer numbers, more words:** Portuguese-speaking casual players benefit from word bands ("Bom", "Elite") next to numbers.

### Gaps
- I found no user-research study specifically comparing radar charts and bars in *game* player profiles. The dataviz critiques are general.
- I could not confirm the current Mobalytics GPI axis list because the fetch was blocked and the sources conflict.

---

## How should champion pool and mastery be displayed (LoL client, op.gg, u.gg, Mobalytics)?

### Takeaway
LoL stat sites present a player's pool as a **ranked list of top champions with games, win rate and KDA**, with a separate "Champion Pool" tab for the full list. Mastery is shown as level or points and sorted by usage. For Nexus, each champion should show one primary metric (mastery) and one qualitative tag for fit, rather than two percentages.

### Cited Findings
- **Mobalytics:** the summoner profile's Overview has a "Champion Statistics" quick rundown of the top 5 champions, with separate tabs for Overview, Champion Pool and Matchup Pool. — [Mobalytics: how to use the summoner profile](https://mobalytics.gg/blog/how-to-use-the-mobalytics-summoner-profile-feature/)
- **u.gg:** profiles split into Overview, Champion Stats and Live Game tabs. — [u.gg profile champion stats](https://u.gg/lol/profile/ru/esfyriel-glasc/champion-stats)
- **op.gg:** champion statistics tables use columns for matches played, KDA, win rate, pick rate, ban rate, CS and gold. — [op.gg statistics](https://op.gg/sv/lol/statistics/champions)
- **Mastery tables (Masterychart):** columns are Champion, Level, Points, Rank, Last Played, Seasonal Mastery and Progress. Its charts draw each champion as a bubble sized by mastery points. — [Masterychart changelog](https://masterychart.com/changelog); [Esports News UK: LoL Mastery Chart](https://esports-news.co.uk/?p=53786)
- **LoL client:** the Mastery sort orders champions from most to least played. A UX critique argues the Stats page should sort by points or most played rather than by mastery level, so the most-played champion is easier to find. — [win.gg](https://win.gg/news/how-to-see-most-played-league-of-legends-champions/); [Medium: LoL client heuristic analysis](https://medium.com/@ahhaoah/league-of-legends-ui-ux-heuristic-analysis-review-44e677147b24)

### Inferences (proposals)
- **List rows per champion:** replace the 3-column grid of portrait + mastery % + "encaixe %" with list rows (shadcn-style). Each row shows:
  - portrait (40px)
  - name
  - a mastery bar labelled as a tier, e.g., "Domínio 92%" or a 1–7 mastery-like level
  - one fit tag ("Encaixe: Ótimo / Ok / Ruim") coloured by band

  Sort by mastery descending. Show the top 3 in the detail header ("Pool principal") and the full pool behind "Ver pool completo".
- **Season stats:** once `season` stats are surfaced, add op.gg-style per-champion games, win rate and KDA columns in the season view, which esports fans already know.
- **Fearless warning:** show pool *depth* as a single summary ("Pool: 5 campeões confortáveis"). Tie it to the existing hidden `versatility` read ("Pool curto, sofre no Fearless") with a warning colour, which is relevant to the Fearless draft in the CBLOL 2026 setting.
- **List avatar:** in the roster list, stop using the first mastery champion as the player avatar. Use a role icon or player initials. If a champion is wanted, label it as the "main" (e.g., a small "Main: Ahri" caption).

### Gaps
- I could not fetch op.gg, u.gg or Mobalytics pages to describe their current 2025–2026 layouts in detail. The findings come from search excerpts and an older Mobalytics blog post.
- There are no sources on how pro-esports profile pages (LoL Esports, Leaguepedia) visualise champion pools.

---

## How do manager games make tactical choices understandable (preset cards, map diagrams, fit indicators, before/after)?

### Takeaway
FM26 makes tactics approachable through:
- **named style presets**, each with staff feedback on strengths and weaknesses
- **an assistant who recommends 3 styles that fit the squad**
- **a visual "Visualiser"** showing how the shape moves
- **per-player role suitability** based on attributes and familiarity

Nexus already has suggestion stars and fit numbers. The biggest gaps are a visual map, preset cards and an explicit before/after fit change.

### Cited Findings
- **Presets:** creating a tactic in FM26 starts from tactical style presets (Control Possession, Gegenpress, Tiki-Taka, Vertical Tiki-Taka, Wing Play). Each comes with a pre-set formation and staff feedback on its strengths and weaknesses. The assistant manager also recommends three styles that fit the squad. — [Passion4FM: FM26 tactics creation beginners guide](https://www.passion4fm.com/fm26-tactics-creation-beginners-guide/)
- **Separate views:** FM26 splits tactics into In Possession, Out of Possession, "Both" and "Combined" views. Transitions sit inside the relevant phase screen. — [GamingBolt: FM26 what's new](https://gamingbolt.com/football-manager-26-whats-new-whats-changed-and-what-to-expect); [footballmanager.com: IP/OOP tactical evolution](https://www.footballmanager.com/fm26/features/possession-out-possession-fm26s-new-tactical-evolution)
- **Recommendations from the shape:** after you choose an in-possession formation, the system recommends out-of-possession formations and player roles. Role suitability depends on positional familiarity and the role's key attributes. — [footballmanager.com](https://www.footballmanager.com/fm26/features/possession-out-possession-fm26s-new-tactical-evolution)
- **Visualiser:** guides advise using the in-game Visualiser to check transitions and spot impractical role combinations. — [Passion4FM](https://www.passion4fm.com/fm26-tactics-creation-beginners-guide/)
- **Familiarity:** familiarity grows with matches and tactical training, and the familiarity bar takes weeks to turn fully green. This is a single guide's claim. — [Passion4FM](https://www.passion4fm.com/fm26-tactics-creation-beginners-guide/)
- **Reception:** users reportedly enjoy FM26's new player-role features despite broader UI complaints. — [Ingenuity Fantasy](https://ingenuityfantasy.com/?p=7183)

### Inferences (proposals for `Taticas`)
- **Preset cards first:** above the individual controls, show 3–4 swipeable cards. Each card has a name, a one-line description, a fit score with a word band, and "Por que combina" bullets derived from `TACT_FIT`/`TACT_STAT`. Suggested names, mapped onto existing options:
  - "Early game agressivo" (plan=early, lanes=aggr, jungle=gank)
  - "Escalar para o late" (late, farm, farm)
  - "Controle de objetivos" (bal, bal, mid=macro)
  - "Split push com o topo" (mid=split)

  The current "Usar a sugestão" link becomes the highlighted "Recomendado pela comissão técnica" card. Individual segmented controls move under an "Ajuste fino" (fine-tune) accordion.
- **Rift minimap:** add a simple SVG minimap of Summoner's Rift showing:
  - the selected gank target lane highlighted with an arrow from the jungle
  - the split-push lane (top) highlighted
  - an objectives icon (dragão/barão) when "Objetivos" is chosen

  This mirrors FM's pitch visualiser and turns abstract labels into geography. It is cheap with inline SVG plus Tailwind classes.
- **Before/after fit:** each option button shows its fit delta, not just ★ (e.g., "Teamfight +6", "Split −12"). Alternatively, show "Encaixe do elenco: 71 → 77" when an option is previewed or long-pressed. The summary panel at the top shows overall tactical fit as a meter.
- **Who powers each tactic:** show the 1–2 players and attributes driving each option's fit. For example, "Split push" shows the top laner's portrait and split stat, as the existing `.tc-j` row already does for the jungler. FM ties role suitability to specific players in the same way.
- **Shotcaller picker:** make it a horizontal list of avatars with the shotcalling value colour-banded, with the recommended one badged "Recomendado" instead of ★. Five columns at 360px leave about 60px per button, which crowds nicknames.
- **Crowded controls:** 4-option controls ("Foco do meio de jogo") should wrap into a 2×2 grid, or use a select or radio list with descriptions on narrow screens.

### Gaps
- I found no source on how Teamfight Manager 2 or other MOBA managers explain tactics visually. A fan guide exists ([TFM2 jungle and objective tactics guide](https://dq7-reimagined.pages.dev/teamfight-manager-2/jungle-guide/)) but I could not fetch it.
- I found no source describing "before/after" tactical previews in commercial manager games. The before/after proposal is my inference.

---

## Which mobile navigation patterns fit list → detail → sub-tabs (bottom sheets, segmented controls, swipe between players)?

### Takeaway
NN/g and Material guidance say bottom sheets suit brief, secondary content and actions, but **not full detail pages that branch into sub-views**. A player profile with attribute groups, champions, stats and actions should be a full-screen route or a full-height sheet with its own tabs and a stable back button. Swipe or prev/next between players avoids the close-and-reopen loop.

### Cited Findings
- **NN/g on bottom sheets:** a bottom sheet is an overlay anchored to the bottom edge that shows extra details or actions. It is typically nonmodal when minimized and modal when expanded. — [NN/g: Bottom Sheets – Definition and UX Guidelines](https://www.nngroup.com/articles/bottom-sheet/)
- **NN/g on detail pages:** NN/g advises against putting a product-detail page in a sheet when users may branch to sub-content (reviews, specs), because nested sheets break expected back-navigation. — [NN/g (mirror excerpt)](https://hn.jakechampion.name/reader/https://www.nngroup.com/articles/bottom-sheet)
- **NN/g on accidental dismissal:** NN/g also warns about overlays being dismissed by accident. — [NN/g: accidental overlay dismissal](https://www.nngroup.com/articles/accidental-overlay-dismissal/)
- **Material Design:** partially visible sheets can be dragged to full screen and scroll internally. Tall sheets should not open full-screen because top content goes out of reach. — [Material Design: bottom sheets](https://material.io/components/sheets-bottom)
- **Practitioner guide:** a bottom sheet fits a brief decision about the object on screen. A full screen fits tasks that need sustained attention, several related inputs, or a stable place to return to. Vendor source. — [screensdesign.com](https://screensdesign.com/articles/bottom-sheet-vs-full-screen-mobile-ux/)
- **FM26 parallel:** layering panels on panels was a central FM26 complaint ("house of cards consisting of panels"). — [Digitec](https://www.digitec.ch/en/page/football-manager-26-is-floundering-in-an-interface-labyrinth-40507)

### Inferences (proposed flow for Nexus)
1. **Elenco list:** keep the top `Seg` "Jogadores / Táticas". This is a correct use of a segmented control for two sibling views.
2. **Tap a player:** open a **full-screen player page** (route-like state, header with a back arrow) instead of the current sheet. Alternatively, use a full-height shadcn `Drawer` with snap points, peek → full. Inside the page:
   - **Sticky header:** role, nickname, OVR, condition and morale, plus **‹ › arrows and horizontal swipe** to move to the previous or next of the 5 starters without going back. Only 5 players exist, so a role-strip of 5 avatars at the top (TOP JG MID ADC SUP) can act as a direct switcher.
   - **Sub-tabs:** shadcn `Tabs` with "Resumo · Atributos · Campeões · Temporada".
     - Resumo: strengths/weaknesses words, hidden reads, condition, actions.
     - Atributos: grouped and colour-banded.
     - Campeões: mastery list.
     - Temporada: season stats that are currently unused.
   - **Actions in a sticky bottom bar** (Treinar / Folga / Psicólogo / Stream) with a preview of the effects ("Energia 62 → 37") before confirming, plus an undo in the toast.
3. **Keep bottom sheets for short things:** action confirmations, attribute explanations (tap an attribute name → small sheet explaining what "Map" does in the sim), and the tactics option explainer.
4. **Make tactics reachable from the player page:** for example, the shotcaller badge on the player header links to the Táticas view, so the list → player → tactics flow does not require backtracking.
5. **Touch targets:** the current `.seg button` min-height of 44px is good ([index.css L114](../../src/index.css)). The 22px role badge and 10–11px captions in the row and mastery grid are below comfortable reading size on phones, so set captions to at least 12px.

### Gaps
- I found no 2024–2026 source specifically studying swipe-between-records in sports or manager apps. The swipe and role-strip proposal is an inference from the 5-player constraint and general mobile conventions.
- I could not read the full NN/g article (fetch blocked). Its guidance above comes from an excerpt and mirror.
- No Mobbin or Dribbble roster-card case studies could be retrieved in this session.
