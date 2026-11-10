# Melhorias UI/UX da tela de Partida (live match) — nexus

> Method note: page fetches to most external hosts were blocked in this session (sofascore.com, vaporlens.app, sheepesports.com, technology.inquirer.net, yjleeportfolio.vercel.app, documentation.deltatre.com all failed DNS resolution). External findings below therefore come from **search-result summaries/snippets** of the cited pages, not full reads. Treat exact wording as approximate. Code findings come from reading the repo directly.

## Q0. What exists today and where it hurts (grounding in the code)

### Takeaway
The current screen stacks seven blocks vertically (a fixed 4-row scoreboard, a 312px map with the event card on top of it, a buffs/phase row, two line charts, lineups, filter chips, the log). It shows three overlapping "who's winning" metrics and exposes raw roll numbers at three different points. On a phone, the log (the match story) starts roughly 900px or more below the fold, and the minimap is hidden during most events.

### Cited Findings
- Page order in `Partida()`: `<Score/>`, then `mapbox` (Minimap + Card), then the buffs/phase row, then `LineChart wp` and `LineChart gd` (two separate charts), then `<Lineup/>`, then the "Placar completo" button, then the filter chips, then the log panel, then ActionBar — [Partida.tsx L261-273](nexus/src/ui/Partida.tsx)
- The scoreboard is `position:fixed` under the header and has 4 rows: tags + kills + clock (`sc1`), objective icons + gold diff (`sc2`), domination numbers 0-100 with **play/pause/1×/2×/4×/skip controls squeezed between them** (`hpn`), and the domination bar with dotted "cap" markers (`hp`). A ResizeObserver spacer reserves the same height in the flow — [Partida.tsx L62-90](nexus/src/ui/Partida.tsx); [index.css L361-365, L275-278, L381-385](nexus/src/index.css)
- The domination split (`bs`/`rs`, e.g. "62" vs "38") is printed in 22px bold numerals, the same visual weight as the kill counts. Two 0-100 integers next to two kill integers invite misreading as a score — [Partida.tsx L80-84](nexus/src/ui/Partida.tsx); [index.css L276](nexus/src/index.css)
- Three overlapping advantage metrics appear at once: domination bar (-100..+100), gold diff (header + chart), and win probability (chart). The card result also adds a fourth delta, "+X%" bar change, per event — [Partida.tsx L70, L139, L266](nexus/src/ui/Partida.tsx)
- The event card is absolutely positioned **over** the minimap inside a fixed-height 312px box, so the map (territory, towers, objective timers) is hidden whenever a card is up — [index.css L282, L368-370](nexus/src/index.css)
- Pacing at 1×: tick = 1000 ms, and each event card runs setup 3000 + skills 3000 + result 3000 ms = 9 s per event. Events therefore dominate wall-clock time, and the map is covered most of the match — [session.ts L8-10](nexus/src/game/session.ts)
- The "skills" stage shows each player's nickname, skill label and a rounded skill value. The result stage shows team totals plus "dados X · Y" (dice). Log entries repeat the `TAG total × total TAG` roll line — [Partida.tsx L133-141](nexus/src/ui/Partida.tsx); [match.ts L418, L463-466](nexus/src/game/match.ts)
- The log is newest-first (`unshift`). Every entry gets the same row style (44px time, 28px icon box, 14px text). Only `big` (baron/elder/soul/nexus) changes the text colour. There is no grouping by minute or phase, and no collapsing of minor events (wards, plates, contested gank "nada acontece") — [match.ts L363](nexus/src/game/match.ts); [index.css L251-262](nexus/src/index.css)
- Log text is long inline HTML with up to 6 "·"-separated clauses (title · flavour · roll line · "+X%" · abates · troca · placas · cristal · first blood) — [match.ts L463-466](nexus/src/game/match.ts)
- The charts use SVG viewBox 320×96 with 8-unit font labels, so labels render at about 8-9px on a 360px phone. Hover readout uses pointer move and there is no tap-to-pin. Both charts use the same blue-above/red-below encoding — [Partida.tsx L145-189](nexus/src/ui/Partida.tsx)
- The live Lineup repeats the static pre-match aggregates (Rotas/Luta/Macro) on every frame. The Role Quest status is an 8px rotated square with a `title` tooltip, which is unreachable on touch — [Partida.tsx L192-201](nexus/src/ui/Partida.tsx); [index.css L439-440](nexus/src/index.css)
- Buffs (Barão timer, Alma, Ancião, Larvas) are a 12px plain-text row under the map — [Partida.tsx L260, L264](nexus/src/ui/Partida.tsx)
- The result sheet has a kills header, 3 tiles (ouro/torres/dragões), "firsts" chips and an MVP card. It has no chart, no "momento decisivo" (decisive moment) and no per-player ratings, which live in a separate "Placar" sheet — [Partida.tsx L222-242](nexus/src/ui/Partida.tsx)

### Inferences
- The biggest wins are **removing redundancy** (one advantage metric in the header, one chart with a toggle), **un-covering the map**, and **moving the story (log) up**. Visual restyling matters less.
- Raw numbers ("62 / 38", "dados 14 · 9", per-skill values) are the main "dice overload" source. They should become qualitative visuals by default, with numbers behind a toggle or tap.

### Gaps
- No usage analytics on which blocks players actually look at. Recommendations rely on heuristics plus references, not measured behaviour.

## Q1. How do sports/esports manager games present a live simulated match, and what do players praise or complain about?

### Takeaway
Successful games let the player **choose the density** of what they watch. Football Manager's highlight levels run from "Full Match" to "Only Commentary", with a separate highlight speed. The most common complaints across 2025-2026 titles are slow matches without a skip, and confusing UI around a good engine.

### Cited Findings
- Football Manager offers highlight modes **Full Match, Comprehensive, Extended, Key, Only Commentary**, changeable mid-match (cog icon, top right) or in preferences under "Match". A separate slider sets "Match Speed During Highlights" — [GGRecon FM24 guide](https://ggrecon.com/guides/football-manager-2024-change-highlights); [sortitoutsi FM26 preferences](https://sortitoutsi.net/content/75736/fm26-how-to-set-up-your-preferences); [VideoGamer FM23](https://www.videogamer.com/news/football-manager-2023-fm23-how-to-change-highlight-speed)
- FM26 (Nov 2025): reviewers praised the match engine as "the absolute best thing" but said the new UI causes "frequent disorientation". One review said the substitution screen didn't tell you who was injured if you looked away mid-match. Steam reviews were about 23% positive at launch — [Top Gear review](https://www.topgear.com/car-news/gaming/football-manager-26-review-fantastic-match-engine-tangled-mess-menus); [PC Gamer](https://www.pcgamer.com/games/sim/football-manager-26-launches-straight-into-a-relegation-battle-as-steam-reviews-plummet-to-mostly-negative-been-playing-since-1993-and-this-is-the-worst-one); [FinalBoss](https://finalboss.io/after-70-hours-with-football-manager-26-im); [Galaxus "interface labyrinth"](https://www.galaxus.de/en/page/football-manager-26-is-floundering-in-an-interface-labyrinth-40507)
- FM26 players complained touchline shouts "didn't even accomplish anything" (in-match interventions with no visible feedback) — [Operation Sports](https://www.operationsports.com/fans-are-still-mad-about-there-being-no-touchline-shouts-in-football-manager-26/)
- Esports Manager 2026 (indie.io, July 2026, Steam "Mostly Positive", about 2k reviews): players praise the match sim as "a blast to watch". The aggregated complaints are "match simulation is too slow" and requests for a **"skip to end" button**. One write-up calls the top-down map viewing "the most disappointing aspect" — [Steam page](https://store.steampowered.com/app/2749950/Esports_Manager_2026/); [vaporlens summary (snippet only)](https://vaporlens.app/app/2749950/esports_manager_2026); [Inven Global dev interview](https://www.invenglobal.com/articles/23674/creating-the-football-manager-of-esports-esports-manager-2026)
- Teamfight Manager 2 (Early Access May 2026, Steam "Mixed", about 695 reviews): the player does not control movement or calls during the match, so the match screen works as a viewing/review surface. Aggregated complaints focus on AI, bugs, CPU usage and "lacks polish" — [Steam](https://store.steampowered.com/app/3009300/Teamfight_Manager_2/); [vaporlens (snippet)](https://vaporlens.app/app/3009300/teamfight_manager_2/stats/analysis); [fan guide on match review](https://dq7-reimagined.pages.dev/teamfight-manager-2/match-review-guide/)
- A fan guide recommends reviewing a TFM2 match by checking the draft plan first, then the first major objective, then jungle/objective tactics. It suggests checking whether the draft had a clear win condition before blaming individual players. That is a natural post-match narrative order — [TFM2 match review guide (unofficial)](https://dq7-reimagined.pages.dev/teamfight-manager-2/match-review-guide/)
- Motorsport Manager's interface is praised as "clean and fluid" and as looking "more like business software than a game", with simple black design and tabs. Broadcast-style timing towers sit permanently on one side and show only position/driver/team/tyre — [Stuff review](https://www.stuff.tv/game-reviews/motorsport-manager/review); [Digitally Downloaded](https://www.digitallydownloaded.net/?p=45287); [RaceFans timing tower](https://www.racefans.net/?p=478947)

### Inferences
- **Adopt FM-style "modo de transmissão"** as a ToggleGroup (shadcn `ToggleGroup`) with three levels mapped to the engine's existing data:
  - **Completo**: setup → skills → result card for every event (today's behaviour).
  - **Principais** (default): full card only for kills, objectives, towers, teamfights and *user-relevant* events. Minor events (ward, plates, "nada acontece" ganks, contested) go straight into the log as a 1-line, collapsed entry with no card.
  - **Só resultado**: no skills stage. The result card shows for about 1.2 s and the log updates.
  
  In `session.ts` this is a filter on whether `m.card` is created, plus a per-mode `PACE` table. FM separates "speed during highlights" from "speed between highlights", which maps directly onto `PACE.tick` vs `PACE.setup/skills/result`.
- **Keep "Pular para o fim" and add "Próximo lance importante"** (⏭ jump to next `big`/obj/kill event). Esports Manager 2026 players explicitly ask for skip, and the code has `skipSim` already.
- Apply the FM26 lesson: when anything important happens (player death streak, Role Quest done, Baron, soul), it must be **visible without having been watching**. Use a persistent badge or toast plus a "pinned key moments" strip, not only a transient card.
- Tactical inputs during the match (if added later) need visible feedback in the log ("Tática X aplicada → efeito"), because FM26 shouts were criticised as invisible.

### Gaps
- Could not read actual Steam reviews or Reddit threads (vaporlens and Reddit mirrors blocked or unreadable). No first-hand quotes on Teamfight Manager 1/2 match-screen readability, LoL Esports Manager (Nexon) or "Rift Manager"; I found no reliable sources on the latter two's live-match UI.
- No source confirms whether Esports Manager 2026 added a skip button post-launch.

## Q2. How do official LoL broadcasts and stat sites visualize gold diff, objectives, kill feeds and scoreboards compactly?

### Takeaway
Riot's 2025 HUD moved to a compact **vertical sports-style scoreboard** with an objective widget that **rotates** secondary info (dragon stacks / Feats of Strength). Removing always-visible gold caused a backlash, and Riot answered by rotating gold diff into the lower third. Stat sites use a single gold-diff-over-time graph annotated with events.

### Cited Findings
- First Stand 2025 HUD: the top scoreboard was rearranged into a **vertical layout in the top-left corner**. Dragon stacks became a widget under it that **rotates to show Feats of Strength** — [esports.gg](https://esports.gg/news/league-of-legends/new-lol-esports-hud-debut-first-stand-2025); [Sheep Esports reactions](https://www.sheepesports.com/articles/lol-mixed-reactions-to-new-hud-debut-during-first-stand/en)
- Biggest backlash: removal of champion gold and side portraits/stats. A Riot reply (via Reddit, unverified) said gold difference would **rotate in and out on the lower third**. Day two added smaller health bars, gold-diff indicators and an Atakhan meter. Some viewers liked the "very sports-like" vertical scoreboard. Others asked for **role-vs-role gold diff always visible** — [Esports.net](https://www.esports.net/news/lol/first-stands-controversial-new-overlay/); [Dot Esports](https://vip-develop.dotesports.com/league-of-legends/news/lol-fans-already-cant-stand-watching-riots-new-first-stand-tournament); [Reddit thread mirror](https://lr.in.psf.lt/r/leagueoflegends/comments/1ix5kkl/official_first_stand_news/mejqfij/?context=3)
- MSI 2025 refined the HUD: "not a total overhaul but a significant refinement", with better gold tracking and crisper kill counts on the scoreboard — [Sheep Esports MSI HUD](https://www.sheepesports.com/articles/lol-msi-2025-riot-s-new-hud-launches-on-june-27/en)
- gol.gg exposes a dedicated "Gold Graph" view and dataset filters (Kills, Deaths, K+A, @15 variants) on team pages — [gol.gg team page](https://gol.gg/teams/team-heatmap/1312/split-Summer/tournament-ALL/)
- Riot match-timeline data is per-minute frames plus an event list (kills, objectives). This is the natural shape for "graph + event markers" — [agent-lol timeline API docs](https://www.mintlify.com/mangeloni30/agent-lol/api/timeline)
- A Dribbble concept ("League of Legend Gold Diff Timeline", LOLTV.gg) shows a gold-diff timeline with event markers overlaid — [Dribbble](https://dribbble.com/shots/24169430-League-of-Legend-Gold-Diff-Timeline)
- Pro-stat guides emphasise GD@15 / XPD@15 as the key early-game summary numbers — [RFT.GG stats guide](https://rft.gg/news/league-of-legends-esports-stats-guide)

### Inferences
- **Header = broadcast top bar, 2 rows max (~64px)**:
  - Row 1: `[crest TAG] 7 ⚔ 12:30 ⚔ 4 [TAG crest]`.
  - Row 2: a single thin bar (6-8px), plus objective pips per side (tower count, dragon dots coloured by type, Baron/Herald icons) and gold diff "+2,1k" centred.
  - Drop the 0-100 numbers. Move play/speed controls out of the scoreboard into the ActionBar (thumb zone), where `ActionBar` already exists.
- **Rotate secondary info** like Riot's widget instead of stacking it: a 1-line "ticker" slot under the header cycles (or swaps on events) between `Barão 2:31 · AZL`, `Dragão em 0:45`, `Alma: RED 3/4`, `Quest: Robo 72%`. That replaces the 12px buffs row and the minimap text labels. Riot's lesson applies here: users rejected *removing* gold, so **keep gold diff permanently in the header** and rotate only the timers and buffs.
- **One chart, annotated**: merge the WP and gold charts into one `LineChart` with a shadcn `Tabs`/`ToggleGroup` ("Vitória % | Ouro"). Overlay **event markers on the x-axis**: small team-coloured icons for kills clusters, dragons, Baron, towers, like the LOLTV/Dribbble concept and Riot's timeline frames. Tap a marker to scroll the log to that entry.
- **Role-vs-role gold diff** (requested by LoL viewers) fits naturally into the expanded "Placar" sheet as a 5-row mirrored bar list (Top ↔ Top, etc.), using `csOf`/stats already computed.
- Use LoL-native visual vocabulary that CBLOL viewers already know: dragon-type colours for dragon pips, Baron purple, kill-score "7 ⚔ 4" layout, gold in "k" with comma decimal (pt-BR "2,1k").

### Gaps
- Could not access Riot's official design writeup or screenshots of the 2025/2026 HUD. Details are from news coverage. No access to gol.gg or Oracle's Elixir game pages to confirm their annotation style. The LoL Esports app/watch-page live stats layout is not covered by any source found.

## Q3. Best practices for live event feeds and timelines on mobile (progressive disclosure, grouping, highlighting, pacing, icons, team colours, avoiding number overload)

### Takeaway
Mature live-sports timelines use **icon + short card per key event**, **cluster dense events**, let the user **tap an event to jump/expand**, and separate a "key moments" view from the full feed. User testing shows people find the score instantly but struggle to identify momentum shifts unless these are given extra visual weight.

### Cited Findings
- Deltatre's DIVA interactive timeline shows **icons for key events with a corresponding event card**. It **clusters icons** in fast sports (handball, basketball) where events are too dense, can be fed live, and selecting an icon or card jumps to that moment — [Deltatre docs (snippet)](https://documentation.deltatre.com/docs/Interactive-timeline)
- VCT Sync (Valorant esports companion app case study) A/B tested a **momentum timeline vs a key-moments list**. Participants "immediately located the score but **hesitated when identifying key momentum shifts**" — [VCT Sync case study (snippet)](https://yjleeportfolio.vercel.app/vct-sync/vct-sync.html)
- Stats Perform's momentum feed pairs momentum values with a short list of **key event categories** (goals, cards, missed penalties, substitutions), not every action — [Stats Perform MA27](https://developers.statsperform.com/feed-ma27-match-momentum)
- Typical live-match summary pattern: score + live minute + key events on the main view, with further tabs for lineups, stats, media — [Contra "Matchday" case](https://contra.com/p/FEEeF3Xr-matchday-designing-the-ultimate-football-live-app)
- iOS Live Activities / Android Live Updates put score on the lock screen. This is not directly applicable to web, but it shows the "score always glanceable" priority — [techinterview system design](https://www.techinterview.org/post/3233475320/mobile-system-design-live-sports-scores-streaming/)

### Inferences (concrete patterns for Partida)
1. **Two-tier feed.** The default chip is "Principais" (kills, objectives, towers, quests, phase changes). "Todos" shows everything. Inside "Principais", consecutive minor events are collapsed into one row: `12:00–13:30 · 4 lances sem abate ▸` (shadcn `Collapsible`). This mirrors Deltatre clustering. Engine change: add `minor: boolean` (or `weight: 0|1|2`) to `LogE`.
2. **Group by minute or phase, not just a flat list.** Use sticky subheaders inside the log ("Rotas · 0–14 min", "Meio de jogo", "Fim de jogo"), reusing the existing `PHASE_PT` sys entries as sticky separators (`position: sticky` inside a `ScrollArea`).
3. **3 visual weights only:**
   - **Big**: Baron, Elder, Soul, Nexus, ace/teamfight with 3+ kills, user Role Quest. Shown as a full-width coloured card with a team-colour left border (4px), icon 24px and a 1-line bold title.
   - **Normal**: kills, dragons, towers. Shown as the current row, trimmed to title + victims.
   - **Minor**: muted 13px single line, no icon box, collapsed by default.
4. **One sentence per entry.** Split today's 6-clause HTML into `title` ("Gank no Topo: RED abate Robo"), `detail` (flavour + victims) and `numbers` (roll line, +X%). Show `title` always, `detail` on tap, and `numbers` only when "Mostrar números" is on. This kills the `.roll` line in the default view.
5. **Team colour = left border + icon tint, never full-row fill.** Keep teal/red as is, and keep "você" gold `--me` for the user's own players' names in text. Always pair colour with team TAG text or an ◀/▶ glyph for colour-blind users (current code already does ◀ ▶; keep that).
6. **Key-moments strip ("Momentos")**: a horizontal `chips`-style scroller under the header with up to about 6 pinned big events (icon + time). Tapping one scrolls the log to it. This responds directly to the VCT Sync finding that momentum shifts are hard to find.
7. **Newest-first vs oldest-first**: keep newest-first while live (as now). In the post-match view, flip to chronological (story order). Announce new big events with `aria-live="polite"` on a visually hidden region.
8. **Replace roll numbers with qualitative tug-of-war visuals in the card.** In the skills stage, render each matchup as a mirrored bar (blue fills from left, red from right, centre line) with player names and a skill **icon/label**, and drop the number. The result line says "Vantagem clara / leve / por pouco" based on `total` difference. "Sorte" (dice) becomes a small 🎲 chip that only appears when dice flipped the outcome ("virada na sorte"). Players get the drama without arithmetic. Expose exact numbers behind a `Motor` setting "Mostrar números dos testes" (default off), which the app's existing "Motor" tab suits.
9. **Don't cover the map.** Option A: place the card **below** the minimap in its own fixed-height slot (min-height so the layout doesn't jump), and shrink the minimap to about 180-200px. Option B: render the card as a bottom overlay over only the lower 45% of the map, with the map dimmed and the event location highlighted (pulsing ring on the lane/river coordinate, since `ev.loc` is known). Highlighting *where* on the map is a cheap, strong comprehension aid.
10. **Pacing**: cut the default card time at 1× from 9 s to about 5 s (setup 1.5 s, skills 2 s, result 1.5 s). Let the user tap the card to advance immediately (tap-to-continue, like visual novels). Under `prefers-reduced-motion`, skip the slide animations (already globally disabled in CSS).
11. **Touch-first details**: replace `title=` tooltips (quest dot, objective icons) with shadcn `Popover` on tap, or render inline text. The quest diamond becomes a small progress ring around the champion icon (`Ct`) or a `72%` micro-label.

### Gaps
- Could not read the VCT Sync or Deltatre pages in full, so test sample sizes and final chosen designs are unknown. I found no quantitative study on the optimal number of event "weights" or on card dwell times.

## Q4. How to visualise win probability or momentum in a small space

### Takeaway
Sports apps converged on two compact forms: a **per-minute mirrored momentum bar chart** (Flashscore, Sofascore) and a **single WP line chart** (ESPN, now on-scoreboard during MLB broadcasts). Both are readable at about 60-80px tall if one team sits above the axis and the other below.

### Cited Findings
- Flashscore Match Momentum: **each bar = one minute of play**. Bar height = probability of scoring for the team. Per minute, only the team with the higher value is drawn. A run of tall bars shows dominance. It updates after every minute live, and is built on Opta data — [Flashscore "Introducing Match Momentum"](https://www.flashscore.com/news/momentum/W82o7eCa/); [Flashscore second article](https://www.flashscore.com/news/momentum/YgzwGjeU/)
- Sofascore Attack Momentum: a real-time graph showing which team is attacking and when, built from passes into dangerous areas and shots. Sofascore credits it with changing how fans read matches — [Sofascore news (snippet)](https://www.sofascore.com/news/?p=71501); [Sofascore stats explainer](https://sofascore.com/news/?p=71696)
- Twenty3's momentum visualisations blend 5-minute segments with leading/lagging exponential moving averages to smooth noise — [Twenty3](https://twenty3.sport/?p=7943)
- ESPN put win probability **on the scoreboard** for MLB broadcasts in 2024, shown "100 percent of the time, or 98 percent". WP charts are read as narrative ("held high before collapsing late") — [Awful Announcing](https://awfulannouncing.com/espn/sunday-night-baseball-win-probability.html); [ESPN Front Row](https://www.espnfrontrow.com/?p=137341); [MickeyBlog interview](https://mickeyblog.com/?p=425798)
- Critique: an independent comparison found ESPN's NBA WP "too reactive early" (later partially resolved). Overly jumpy WP lines can mislead — [inpredictable](https://www.inpredictable.com/2018/01/judging-win-probability-models.html?m=0)

### Inferences
- **Header**: show only a single number, "Vitória 62%", next to the bar (ESPN-scoreboard style), *instead of* the 0-100 domination split. Domination (`m.bar`) remains the engine's state but is visualised as the bar fill only (no numerals). The dotted "cap" markers need a label or should be removed: today "torres protegem a base" only appears when paused/over.
- **Momentum strip (new, about 40px)**: per-minute mirrored bars from `m.timeline` deltas of `bar` (blue up, red down; one bar per 60 s point that already exists). Overlay small objective icons at their minute. This is the Flashscore pattern and fits under the header or at the top of the "Gráficos" tab. It answers "who's pressing now?" better than the gold line.
- **Smooth the WP line** (EMA over 2-3 points) or label its jumps by event (marker icons), so a big swing has a visible cause. This addresses the "too reactive" critique.
- Chart readability on phones: render chart text as HTML overlays or raise SVG font to about 11-12px effective (viewBox about 240 wide). Add tap-to-pin crosshair (`onPointerDown` sets hover and keeps it), not just hover. Show the last value as an end-label ("62%") at the line's tip. Follow the repo's `dataviz` skill for palette and axis conventions if implemented.

### Gaps
- FotMob's own momentum implementation and visuals could not be confirmed (no source found). No source on optimal chart height for mobile readability.

## Q5. Speed controls, skip/pause, and post-match summary patterns

### Takeaway
Players expect separate controls for **how much** they see (highlight level) and **how fast** it plays, plus **skip-to-end**. The post-match screen should tell the story in review order (result → how it was won → key moments → players), as TFM2 review guides and live-sports summaries do.

### Cited Findings
- FM keeps highlight level and highlight speed as two separate controls, adjustable mid-match via an in-match settings cog — [GGRecon](https://ggrecon.com/guides/football-manager-2024-change-highlights); [sortitoutsi FM26](https://sortitoutsi.net/content/75736/fm26-how-to-set-up-your-preferences)
- Esports Manager 2026 feedback: sim "too slow", and users want "skip to end" — [vaporlens snippet](https://vaporlens.app/app/2749950/esports_manager_2026)
- TFM2 review order: draft plan → first major objective → jungle/objective tactics. Check the win condition before blaming players — [TFM2 guide](https://dq7-reimagined.pages.dev/teamfight-manager-2/match-review-guide/)
- Summary pattern: score + key events first, with lineups/stats/media in tabs — [Contra Matchday](https://contra.com/p/FEEeF3Xr-matchday-designing-the-ultimate-football-live-app)

### Inferences
- **Controls live in the ActionBar (thumb zone)** while the match runs:
  - `[⏯ grande] [1× 2× 4× segmented] [⏭ próximo lance] [⏩ fim]`, where `[⏩ fim]` uses a long-press or a confirm sheet to avoid accidental skips.
  - Put the "Modo: Principais ▾" selector in a small `DropdownMenu`, or in the Motor tab as a persisted preference (FM persists it in preferences).
  - Removing the controls from the fixed scoreboard saves about 40px of permanent header height.
- **Auto-pause options** (checkbox list in Motor): "Pausar em Barão/Ancião", "Pausar quando meu time sofre ace", "Pausar no fim de cada fase". These are useful if tactical changes are ever allowed mid-match.
- **Post-match screen (ResultSheet → full view)** in this order:
  1. Banner: VITÓRIA/DERROTA, kills, duration, series score.
  2. **Annotated WP chart** with 3 key moments auto-picked as the largest WP swings ("Momento decisivo: 24:30 Barão roubado por RED").
  3. Objective timeline: one row per side with icons at their minute (towers, dragons, Barão).
  4. MVP plus a 10-player rating list (nota coloured, KDA, CS), with your players' names in `--me` gold.
  5. "Draft cumpriu o plano?": reuse the `DraftEval` verdict and compare it with what happened ("Composição early venceu antes dos 25 min ✔"), following the TFM2 review order.
  6. Primary CTA "Próximo jogo".
  
  Use shadcn `Tabs` (Resumo | Placar | Gráficos) to keep the first view short.
- **Mid-match layout proposal (mobile, 360-430px)**:
  - Fixed header, 2 rows: kills/clock/tags, then bar + gold + objective pips.
  - Key-moments chip strip.
  - Event stage: minimap 200px with a location highlight, card below it in a fixed slot.
  - `Tabs`: **Lances** (log, default) | **Gráficos** (WP/Ouro toggle + momentum strip) | **Times** (live lineup: champion, nick, KDA, nota, quest ring; static Rotas/Luta/Macro removed).
  - ActionBar holds the controls.
  
  This puts the story within the first screen and removes about 3 stacked panels.
- Portuguese microcopy suggestions: "Principais lances", "Todos os lances", "Só resultados", "Próximo lance", "Pular para o fim", "Mostrar números dos testes", "Momento decisivo", "Vantagem clara / leve / por pouco", "Virada na sorte".

### Gaps
- No primary source on Motorsport Manager or OOTP live-view speed/skip controls specifically. No usability data on auto-pause adoption. The post-match ordering is inferred from a fan guide and summary-screen case studies, not measured.
