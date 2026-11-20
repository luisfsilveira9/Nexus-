# Visual system and information architecture for Nexus (a cleaner, friendlier esports manager)

Research note: many primary hosts could not be fetched from this sandbox (footballmanager.com, realsport101.com, simulationdaily.com, sofascore.com, ui.shadcn.com, w3.org and gamedeveloper.com all failed with DNS errors). For those, the findings below rely on search-result summaries, and each one is marked as such. The shadcn theming doc was read in full from its GitHub source. The codebase audit comes from reading the files directly; the local file paths are given as sources.

## Current state: visual language, inconsistencies and clutter in Nexus today

### Takeaway
Nexus has a coherent idea, "Hextech": near-black blue, thin gold borders, square corners, a Cinzel serif. The way it has been carried out has drifted. There are 20 font sizes and five competing accent hues (gold, teal, red, green, yellow). Red means three different things. The tail of the stylesheet is a patch layer full of `!important` overrides and dead selectors, and there are 102 inline styles. shadcn/ui is installed but not wired up: its CSS variables are never defined and no screen imports it. Some text colors fail contrast.

### Cited Findings
- **Fonts:** three families are loaded through a render-blocking Google Fonts `@import`: Cinzel (display serif), Barlow (body) and Barlow Condensed (numbers). Cinzel is used for headers, sheet titles, team names, OVR values, champion initials and the event card's location and result. — [index.css](../../src/index.css)
- **Type scale:** there are 20 distinct font sizes: 9, 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 15, 16, 17, 18, 20, 22, 26 and 30px. Five of them are half-pixel steps. 11px (13 uses), 12px (19) and 13px (20) dominate, so most text is very small. — counted with grep over [index.css](../../src/index.css)
- **Uppercase everywhere:** uppercase with wide letter-spacing (.06–.12em) is applied to `.cap`, `.btn`, `.tab`, table headers, `.grp-h`, `.phase-b`, `.evcard .kind`, `.d-opt`, `.pm-rec small` and `.lu-h small`. Small, all-caps, tracked-out Portuguese text with accents (e.g. "PRÓXIMO CONFRONTO") is hard to read. — [index.css](../../src/index.css)
- **Palette:** tokens exist in `:root`: `--bg`, `--bg-2`, `--surface`, `--surface-2`, `--line`, gold 5/4/3/1, `--text`, `--muted`, `--dim`, `--blue` (#0AC8B9, which is actually teal), `--blue-deep`, `--red` (#E84057), `--red-deep`, `--me` (#FABE0A) and `--good` (#3CBF6E). Around 35 further hex values and about 14 `rgba()` literals are hard-coded across the file. `--gold-2` is used by `.tchip` but only declared in a late "adições da versão React" block. — [index.css](../../src/index.css)
- **Red is overloaded:** `--red` means the enemy side (`.lu.red`, `.ev.rd`, the "adversário" label), negative values (negative goal difference in the table, losses in the form dots, `fitClr` < 76 "bad fit"), bans (the diagonal slash) and the "live" dot on the Partida tab. `--good` green means wins and good fit. `--blue` teal means "you", the energy bar and allied events. `--me` yellow marks the user's row. — [Liga.tsx](../../src/ui/Liga.tsx), [common.tsx](../../src/ui/common.tsx), [index.css](../../src/index.css)
- **Gold is used for all text:** `--gold-1` (#F0E6D2) colors almost every name, number and heading. `--gold-3`, `--gold-4` and `--gold-5` color borders, buttons, the active tab, chips and section labels. Because gold is everywhere, it no longer marks what is primary. — [index.css](../../src/index.css)
- **Shape:** there are no rounded corners apart from `.tchip` (999px). Hexagonal `clip-path` is used on the primary button and on crests. The primary button's clip-path is removed when it shares the action bar (`.actionbar-in>.btn-primary:not(:only-child){clip-path:none}`), so the same button changes shape depending on context. — [index.css](../../src/index.css)
- **Patch layer:** roughly the last 130 lines of the 455-line stylesheet re-declare earlier rules with `!important`: `.hp` is declared twice, `.score` turns from sticky to fixed, and `.d-top`, `.pool`, `.ban`, `.pc .ct`, `.mapbox` and `.hpn` are all overridden. There is a dead selector from the pre-React build (`#v-partida[hidden] .score`) and an unused `@keyframes cardin2`. `.tabbar-in` declares 3 columns, which App.tsx overrides inline to 4. — [index.css](../../src/index.css), [App.tsx](../../src/App.tsx)
- **Inline styles:** there are 102 `style={{…}}` objects across the screens: Draft 29, Elenco 23, Partida 21, Liga 16, Motor 9 and common 4. Most are ad-hoc flex/gap/fontSize values (e.g. `style={{ fontSize: 18 }}` on `.ovr`, `style={{ display:'flex', gap: 8 }}` button rows). — grep over [nexus/src/ui](../../src/ui/)
- **shadcn is installed but not wired:** `components.json` sets style "default", baseColor slate, cssVariables true, with CSS pointed at `src/index.css`. `tailwind.config.js` maps `background: hsl(var(--background))` and the other standard tokens. However, `index.css` defines none of `--background`, `--foreground`, `--primary`, `--radius` and so on. There are 45 generated components in `src/components/ui` (sheet, drawer, tooltip, sonner, skeleton, tabs, popover and more), and no screen imports any of them. — [tailwind.config.js](../../tailwind.config.js), [components.json](../../components.json), [src/components/ui](../../src/components/ui/)
- **Contrast (WCAG relative luminance, computed locally):**
  - `--dim` #5B5A56 is 2.89:1 on `--bg` and 2.64:1 on `--surface`. It is used for inactive tab labels (11px) and footer text, so it fails the 4.5:1 text minimum.
  - `--red` #E84057 is 4.61:1 on `--surface` and 4.19:1 on `--surface-2`, which is borderline or failing for small text.
  - `--line` #1C2B37 borders are 1.26:1 on `--surface`, which is effectively invisible.
  - `--gold-5` button borders are 2.86:1 on `--surface`.
  - `--muted` #A09B8C (6.57:1) and `--text` (12.47:1) pass.
  - Ratios computed from the token hex values in [index.css](../../src/index.css).
- **Feedback components:**
  - Toast: a single string auto-dismissed after 2.6s, with no `role="status"`/`aria-live` and no action or undo.
  - Sheet: a custom bottom sheet with Escape-to-close and `aria-modal`, but no focus trap and no drag to dismiss.
  - — [App.tsx](../../src/App.tsx), [common.tsx](../../src/ui/common.tsx)
- **Small tap targets:** `.chip` is 36px tall, `.d-opt` 36px, the `.mctl` map controls 38×34px, `.stc-f .linkbtn` 32px and `.pl-r` 34px. Main buttons are 44–48px. — [index.css](../../src/index.css)
- **Motion:** there is a global `prefers-reduced-motion` kill switch, which is good. There is also an infinite `pulse` animation on the current draft pick slot. — [index.css](../../src/index.css)
- **Empty states:** they are plain one-liners ("Nenhum campeão encontrado."). There are no skeleton or loading states. — [Draft.tsx](../../src/ui/Draft.tsx)
- **Liga tab contents:** Liga, the default tab, stacks four things: a "Próximo confronto" hero with MD1/3/5 selector, a second segmented control (Times/Tabela/Jogos/Playoffs), split chips and a long legal disclaimer at the bottom of the page. — [Liga.tsx](../../src/ui/Liga.tsx)
- **Motor tab is jargon:** Motor, one of the four primary tabs, is a dense rules and calibration page. Its rules text includes Fearless, First Selection, Atakhan, Feats of Strength, Role Quests, Crystalline Overgrowth and Dragon Vengeance, with no explanations beyond a sentence each. — [Motor.tsx](../../src/ui/Motor.tsx)

### Inferences
- The clutter mostly comes from too many weights of emphasis: gold on everything, uppercase on everything, borders on everything, five accent hues and 20 sizes. The layout itself is not the main problem. Reducing the token count will clean things up more than restructuring screens.
- Red as "enemy" and red as "bad/negative" is the most damaging ambiguity. A red number in the enemy column cannot be read as good or bad at a glance.
- Cinzel (a Roman capital serif) used for numbers and champion initials is part of what makes the UI feel heavy. LoL's own client keeps its serif (Beaufort) for display text and uses a sans (Spiegel) for UI copy (see the next section).

### Gaps
- No rendered screenshots were taken, so the audit is from code. Visual weight and real contrast over gradients (e.g. the `.btn-primary` gradient, crests) were not measured.

## What visual language do modern esports, gaming and sports apps use, and what makes them feel clean?

### Takeaway
Three models are worth borrowing from. The sports-score apps (FotMob, Sofascore) are clean because of low chrome, a strong list rhythm and a simple bottom bar. Riot's own products keep fantasy serif type for display only and use a neutral sans for UI. FM26's tile/card "Portal" shows how a hub can surface the next action, but it also shows the risk of over-tiling: FM27 reportedly pulled navigation back out of tiles. Nexus should keep a small amount of Hextech flavor (gold as one accent, serif only for big titles) on a quieter, more neutral base.

### Cited Findings
- **LoL client type:** the live client uses Beaufort (display/headers) and Spiegel (body and smaller UI copy). Sources disagree on Beaufort's foundry. — [madegooddesigns](https://madegooddesigns.com/league-of-legends-font/), [fontsinuse](https://fontsinuse.com/uses/26935/league-of-legends-game-and-website) (search summaries)
- **Riot fonts download:** Riot's official "Hextech assets" downloads page lists BeaufortForLoL-OTF.zip and Spiegel-OTF.zip. The license terms were not shown in the search result. — [leagueoflegends.com downloads](https://www.leagueoflegends.com/en-us/league-of-legends-downloads/) (search summary)
- **Riot Client as hub:** Riot positions Riot Client as the single place for updates, patch notes, esports and news. A launcher test routes players through it so game clients stay lightweight. — [Riot Client FAQ](https://support.riotgames.com/riot/client/riot-client-faq), [Spilled.gg](https://spilled.gg/riot-games-league-legends-launcher-change-test-client-overhaul)
- **MSI 2025 broadcast HUD:** the update was described as a cleaner scoreboard with better gold tracking and crisper kill counts. — [Sheep Esports](https://www.sheepesports.com/articles/lol-msi-2025-riot-s-new-hud-launches-on-june-27/en) (search summary)
- **"League Next":** Riot's announced post-2026 overhaul is described as making the client and the game feel like one unified system. No release date or feature list is confirmed. — [LoLNow](https://lolnow.gg/league-next/), [Editorialge](https://editorialge.com/league-of-legends-overhaul-2027/), [PC Gamer](https://www.pcgamer.com/games/moba/a-major-overhaul-of-league-of-legends-is-reportedly-coming-in-2027-once-were-done-it-should-be-the-best-time-ever-to-get-your-friends-into-league)
- **FM26's Portal:** FM26 condenses menus into a "Portal" of tiles. Each tile shows a snapshot and opens into a Card with more detail, and the Portal is described as one streamlined, customizable dashboard. — [footballmanager.com FM26 UI feature](https://www.footballmanager.com/features/total-football-total-control-fm26s-reimagined-user-interface), [FM Scout](https://www.fmscout.com/a-fm26-reimagined-ui.html) (search summaries; the page itself could not be fetched)
- **FM26 reception:** reception was mixed. Cubed3 scored it 5/10, saying the tiles look neatly packaged but the game becomes "moving from match to match". VideoGamer called it iterative, not revolutionary. — [Cubed3](https://www.cubed3.com/games/reviews/pc/football-manager-26), [VideoGamer](https://www.videogamer.com/?p=1343659), [FRVR alpha reviews](https://frvr.com/blog/news/football-manager-26-alpha-reviews-reveal-the-good-the-bad-and-the-ugly-for-the-first-step-towards-the-future-of-fm) (search summaries)
- **FM27 correction:** a September 2026 report says FM27 makes tiles primarily informational and moves main navigation to top menus to reduce clicks. — [Simulation Daily](https://simulationdaily.com/news/football-manager-27-expanded-ui/) (search summary only; not verified against a primary source)
- **FotMob:** it is consistently praised for a neat, clean, easy-to-navigate interface and for its dark mode. — [Pratt IxD critique of FotMob](https://ixd.prattsi.org/2021/09/design-critique-fotmob-android-app/), [PerfectionGeeks review](https://www.perfectiongeeks.com/blogs/fotmob-app-review) (search summaries)
- **Sofascore:** Sofascore is more data-dense, with radar charts and graphical stats. Its new home screen highlights a "clean bottom bar, optimized for daily use". — [Pratt IxD critique of Sofascore (2026)](https://ixd.prattsi.org/2026/09/design-critique-sofascore-ios-app/), [Sofascore news](https://www.sofascore.com/news/sofascores-new-home-screen-a-smarter-faster-way-to-follow-sports) (search summaries)
- **Teamfight Manager 2:** the closest genre peer, a MOBA esports manager in Steam Early Access, has "Mixed" Steam reviews. An aggregator summarizes player complaints that the UI is "poorly designed, unintuitive and confusing" (weak, auto-generated evidence). Press praise centers on the drafting phase. — [Steam](https://store.steampowered.com/app/3009300/Teamfight_Manager%202/), [Vaporlens](https://vaporlens.app/app/3009300/teamfight_manager_2), [Inquirer Tech](https://technology.inquirer.net/147754/teamfight-manager-2-is-football-manager-for-the-moba-fans-who-loves-drafting)
- **Esports app dark mode:** a Blip esports app redesign added dark mode on the premise that gamers usually prefer it. — [Uxcel showcase](https://app.uxcel.com/showcase/blip-esport-app-design-light-dark-ui-290) (search summary)

### Inferences
- **Typography:** I recommend keeping Cinzel only for two or three large display moments (team names in the match hero, result "Vitória/Derrota", screen titles). Body, labels and buttons should use Barlow at sentence case. Numbers should use Barlow Condensed with tabular numerals. Cinzel should not be used for OVR values or champion initials. This mirrors Riot's own display-serif and UI-sans split.
- **Palette:** use a neutral blue-black base, with three surface steps instead of gold-bordered panels everywhere. Gold should be the single brand/primary accent (CTA, active tab, selection). Side colors (blue/red) should appear only where sides matter: draft, match scoreboard and lineups.
- **Density:** FotMob-style lists suit Nexus. That means full-width rows of at least 56px, a crest or champion on the left, the main text, and one right-aligned number, with hairline dividers instead of boxed panels. Save cards for hero or "next action" content.
- **Hub:** take FM26's lesson at face value. A hub of tiles that summarize and link is good. Tiles as the only navigation was criticized, and FM27 reportedly reversed it, so Nexus should keep the bottom bar as navigation and treat hub cards as shortcuts.

### Gaps
- I could not reach any Riot design-team blog or talk on the LoL Esports app or Riot Client visual system for 2024–2026. Searches returned only news about client architecture. No primary source on Riot's current color palette was found.
- Mobbin screenshots of the LoL Esports app, FotMob or Sofascore were not accessible (login-walled or not fetched).
- FM26 typography and colour specifics could not be verified because the official pages were blocked.

## Design-system practices to reduce clutter: tokens, scales, semantics, cards, icons, empty and loading states, motion

### Takeaway
Adopt shadcn's background/foreground token convention as the single source of truth. Add a small set of semantic tokens (side-blue, side-red, positive, negative, warning, "you"), a 4px spacing grid, a 6-step type scale and one consistent card anatomy. Use tone-based surfaces rather than borders for elevation, as Material 3 does. Keep motion short and functional, and keep the existing reduced-motion rule.

### Cited Findings
- **shadcn token convention:** each pair is a surface token plus a `-foreground` token. The standard set is `background`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `chart-1…5`, `sidebar-*` and `radius`. — [shadcn/ui theming docs (GitHub source)](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/content/docs/(root)/theming.mdx)
- **Adding a token:** define it under `:root`/`.dark` and expose it to Tailwind. Their example is `--warning` and `--warning-foreground`, used as `bg-warning text-warning-foreground`. The v4 docs use OKLCH and `@theme inline`. Nexus is on Tailwind 3.4, whose config instead maps `hsl(var(--token))` in `tailwind.config.js`. — [shadcn theming](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/content/docs/(root)/theming.mdx), [tailwind.config.js](../../tailwind.config.js)
- **Material 3 tone-based surfaces:** in M3, elevation +1/+2/+3 become Surface Container Low, Surface Container and Surface Container High, and dark-theme surfaces are slightly darkened. Elevation no longer has to be expressed by shadows or overlays. — [Material blog: tone-based surface color](https://material.io/blog/tone-based-surface-color-m3), [Flutter M3 color roles](https://docs.flutter.dev/release/breaking-changes/new-color-scheme-roles)
- **Material 2 dark theme (legacy):** it recommended a #121212 base, a lighter overlay to show height, and the 200-tone (desaturated) version of the primary colour so text keeps WCAG AA contrast. — [Material 2 dark theme](https://m2.material.io/design/color/dark-theme)
- **Never colour alone:** game accessibility guidance says essential information should not be conveyed by a fixed colour alone. — [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/ensure-no-essential-information-is-conveyed-by-a-fixed-colour-alone/)

### Inferences (concrete proposals)
- **Colour tokens** (dark only; map to shadcn names so the 45 installed components work):
  - `--background` is the current `--bg`.
  - `--card` is `--surface`; `--popover`/sheet is `--surface-2`; a new `--surface-3` covers pressed or selected states.
  - `--foreground` is `--text` (#DCD5C4). This retires `--gold-1` as body text and keeps gold-1 only for emphasis numbers.
  - `--muted-foreground` is `--muted`. Raise `--dim` to at least 4.5:1, or use it only for disabled states.
  - `--primary` is gold-3/4, with a dark `--primary-foreground`.
  - `--border` should be raised from #1C2B37 to something around 1.5–2:1 against card, used sparingly, or dropped in favour of surface steps.
  - `--ring` is gold-3.
  - Add semantic tokens: `--side-blue`, `--side-red`, `--positive` (green), `--negative` and `--warning`. `--negative` should be distinct from `--side-red`, for example orange-red with an icon or minus sign. Add `--you` for the user highlight, either merged into primary gold or kept as a single left stripe.
  - Rule of thumb: one accent (gold) per screen region. Side colors appear only inside match, draft and lineup contexts.
- **Type scale:** six steps instead of 20.
  - 12 for captions and meta only, never below 12.
  - 14 for secondary text and labels.
  - 16 for body and list primary text.
  - 18 for section titles.
  - 22 for screen titles and big numbers.
  - 30 for the hero or score.
  - Use sentence case for labels and buttons. Keep uppercase only for very short tags (MD3, OVR, AO VIVO) at 12px with .04em tracking.
  - All numbers use Barlow Condensed tabular (`tabular-nums`).
- **Spacing:** a 4px grid using Tailwind's default scale (1 = 4px). Card padding is 16, gap inside a card 8–12, gap between sections 24, and list rows at least 56px. That replaces the current mix of 6/8/10/12/14 ad-hoc values.
- **Radius:** pick one, for example `--radius: 10px` for cards and sheets, 8 for buttons and chips, and full for pills and avatars. Drop hexagonal clip-paths on buttons and keep the hex shape only for team crests as a brand motif. Square corners plus thin borders on every element is the main "busy" signal.
- **Card anatomy:** every card has header (title, optional meta or action at right), body, and an optional footer action. There is one card style (surface step, no border, or a 1px subtle border). Cards are not nested inside cards. The current `.panel`, `.panel-gold`, `.tile`, `.lu`, `.pm`, `.stc`, `.tc` and `.plan` variants collapse into `Card`, plus a `variant="highlight"` reserved for the single next-action card per screen.
- **Icons:** lucide at 20px inside 44px targets, with a stroke width of 1.75–2 throughout. Icons pair with labels in navigation and primary actions. Icon-only buttons are acceptable only for universally understood actions (close, back, more) and always need an `aria-label`.
- **Win/loss and good/bad:**
  - Use V/D letters or check/x icons plus colour in the form guide.
  - Prefix signed numbers with + or −.
  - Express fit or quality with a 3-level label ("Ótimo / Bom / Fraco") plus colour, not colour alone.
- **Empty states:** icon, a one-line explanation and one action. Example: "Nenhum campeão com esse nome. Limpar busca".
- **Loading states:** sim steps are synchronous today. If async simulation (e.g. calibration) is added, use shadcn `Skeleton` for list rows and a progress text ("Simulando 1.000 partidas…").
- **Motion:**
  - Durations of 150–250ms for sheets and cards, with ease-out on enter and ease-in on exit.
  - Animate only opacity and transform.
  - No infinite loops. Replace the draft `pulse` with a static highlight ring plus a "Sua vez" label.
  - Keep the global reduced-motion rule, and also use Tailwind `motion-safe:`/`motion-reduce:` variants on new components.
  - The HP/advantage bar width transition (.45s) is fine as functional motion.

### Gaps
- I could not fetch Material 3's or Apple HIG's official motion pages, so the specific duration recommendations above are my standard practice rather than cited figures.
- I found no published design-system specs (token counts, type scales) from FotMob, Sofascore or Riot.

## Onboarding and "friendliness" for non-experts (jargon, first run, contextual help, plain-language numbers)

### Takeaway
The strategy-game consensus (CK3's tutorial refresh and practitioner UX writing) is progressive disclosure:
- short, dismissable, re-openable tooltips;
- an always-available glossary;
- teaching how to start playing, not just what the controls are;
- never locking players into a tutorial.

For Nexus, that means a tappable glossary term component, a three-step first-run, recommended defaults (Automático draft, MD3, recommended tactics) and verdict sentences next to every important number.

### Cited Findings
- **CK3's tutorial refresh:** Paradox rebuilt the CK3 tutorial around progressive disclosure because "it's very easy to get overwhelmed when you start the game for the first time". — [Game Developer deep dive on the CK3 tutorial](https://gamedeveloper.com/design/deep-dive-refreshing-the-crusader-kings-iii-tutorial-mode-through-optimized-ux) (search summary; the page could not be fetched)
- **Progressive disclosure:** reveal information as the player needs it. This is especially useful for complex systems. — [Wayline: UX game tutorials](https://www.wayline.io/blog/ux-game-tutorials-player-retention), [Medium: minimizing cognitive load in game UX](https://medium.com/@coreyhobson/minimizing-cognitive-load-strategies-for-simplifying-complex-systems-in-game-ux-fcc72544c8e3) (practitioner opinion)
- **Tooltips:** keep each one short, covering a single piece of information, and make it dismissable and re-accessible later. — [Wayline](https://www.wayline.io/blog/tutorial-ux-indie-onboarding) (practitioner opinion)
- **Help screens:** games with multiple systems should offer help screens or tooltips as a backup. — [Game Developer: new player experience](https://www.gamedeveloper.com/business/the-importance-of-the-new-player-s-experience) (search summary)
- **What kills strategy onboarding:** it covers the controls but not how to start learning to play. Locking players into a tutorial (e.g. a single unit for 30 minutes) was disliked, and optional or skippable sections are recommended. — [Game-Wisdom: the struggles of onboarding](https://game-wisdom.com/critical/onboarding) (search summary)
- **Where Nexus is today:** jargon appears raw in UI copy. The Partida pre-match button reads "Faça a First Selection primeiro". Motor's rules list Fearless, Atakhan, Feats of Strength, Role Quests, Crystalline Overgrowth and Dragon Vengeance. — [Partida.tsx](../../src/ui/Partida.tsx), [Motor.tsx](../../src/ui/Motor.tsx)
- **Plain-language verdicts already exist:** DraftEval prints sentences such as "Draft equilibrado. As decisões da partida vão definir tudo." — [Partida.tsx](../../src/ui/Partida.tsx)

### Inferences (concrete proposals)
- **`<Termo id="fearless">` component:**
  - Renders a dotted-underline word. Tapping it opens a shadcn `Popover` (or a small Sheet on mobile) with a definition of one or two sentences in Portuguese and a "Ver no glossário" link.
  - Tooltips-on-hover don't work on touch, so use tap popovers.
  - Seed the glossary with: gank, split push, shotcaller, Fearless, First Selection, MD1/MD3/MD5, OVR, entrosamento, sinergia, counter, lado azul/vermelho, Barão, Arauto, Larvas, Dragão Ancião, Role Quest, placas, fit.
  - Example: "Fearless: num confronto MD3/MD5, um campeão escolhido num jogo não pode ser escolhido de novo pelos dois times nos jogos seguintes da série." The exact rule wording must be checked against the game's own implementation.
- **First run (3 steps max, skippable):**
  1. Escolha seu time (team list with OVR and a one-line style description).
  2. Escolha o formato (MD3 recommended, pre-selected).
  3. "Jogar primeiro draft": the draft opens in Automático with a coach-mark on "Assumir controle".
  - Persist the "seen" flag in localStorage.
- **Recommended defaults:** label one option as "Recomendado" in each choice (draft strategy, tactics, format). Default to automatic modes and let experts opt into manual.
- **Numbers in plain language:**
  - Every OVR or fit number gets a word band ("85 · Ótimo").
  - Win-probability or advantage bars get a sentence ("Vantagem leve do seu time (55%)").
  - Event cards keep the outcome word large ("Abate!", "Gank punido") and the dice math ("roll") hidden behind a "Por quê?" disclosure.
- **Progressive disclosure per screen:** the summary is shown first, details sit behind "Ver detalhes" (an Accordion or Sheet), and expert panels (calibration, rule tables) move out of primary navigation.
- **Contextual "?" help:** one small help icon per complex screen (Draft, Táticas) that opens a two-paragraph explainer sheet with an illustration. It should not be a modal tutorial.

### Gaps
- No GDC Vault talk on manager or sim onboarding could be retrieved. I found no primary FM26 source on its onboarding or "assistant" features.
- I found no data on how Brazilian or Portuguese-speaking players handle English LoL jargon. In practice the CBLOL community uses many English terms (gank, split push, Fearless), so the glossary should keep the English term and explain it, not translate it away. This is an inference.

## Information architecture and navigation: tab bar, draft, series status, calendar, home hub

### Takeaway
A bottom bar with 3–5 destinations is right for mobile, but Nexus spends one of its four slots on "Motor" (rules and calibration, which is developer-facing). There is also no "home" that says what to do next: the next-match card is buried at the top of Liga, above three other sub-navigations. I recommend replacing Liga's role as default with an "Início" hub (next match, series state, one primary CTA, inbox-style news). Liga becomes standings, calendar and teams. Partida owns the full pre-match → draft → live → result flow. Motor moves into a "Mais/Config" sheet or a header icon.

### Cited Findings
- **Current tabs:** the tabs are Liga (Trophy), Elenco (Users), Partida (Play) and Motor (Gauge), with Liga as the default. The header always shows the user crest, team name, "CBLOL 2026 · contra {opp}" and a series chip such as "MD3 · 0-0". — [App.tsx](../../src/App.tsx)
- **Liga tab structure:** Liga contains the "Próximo confronto" hero (with team swap and MD selector), then a 4-way segmented control (Times/Tabela/Jogos/Playoffs), split chips, the list, and a legal footer. — [Liga.tsx](../../src/ui/Liga.tsx)
- **Draft placement:** Draft is not a route. It is a state inside the Partida tab (PreMatch, then DraftView when `draftOpen` or the draft is in progress, then match), and the result opens as a sheet ("Vitória"/"Derrota"). — [Partida.tsx](../../src/ui/Partida.tsx)
- **Hidden simulation:** any fixture row's play button in Liga › Jogos simulates that match and jumps to Partida. The user can therefore "play" matches they are not in. — [Liga.tsx](../../src/ui/Liga.tsx)
- **FM26 Portal:** the Portal is the hub of FM26, a dashboard of tiles that open into cards. FM27 reportedly moved main navigation to top menus with tiles kept informational, to reduce clicks. — [footballmanager.com](https://footballmanager.com/fm26/features/fm26s-reimagined-user-interface), [Simulation Daily](https://simulationdaily.com/news/football-manager-27-expanded-ui/) (search summaries)
- **Sofascore:** its new home screen is personalized, with a "clean bottom bar optimized for daily use". — [Sofascore news](https://www.sofascore.com/news/sofascores-new-home-screen-a-smarter-faster-way-to-follow-sports) (search summary)

### Inferences (concrete proposals)
- **Proposed bottom bar (4 tabs):**
  - **Início** (Home): the "what now" hub.
  - **Partida** (Swords/Play): pre-match, draft, live match, result, with a live dot while running.
  - **Elenco** (Users): players and tactics.
  - **Liga** (Trophy): standings, calendar/fixtures, playoffs, teams.
  - Motor/regras/calibração goes to a gear icon in the header, or a "Mais" sheet with Regras do motor, Calibração, Sobre/aviso legal and Glossário.
  - The legal disclaimer moves to "Sobre" plus a one-line link.
- **Início hub anatomy (top to bottom):**
  1. Next-match hero: crests, "Jogo 2 de 3", series score shown as pips (●●○), side (azul/vermelho) and a single primary CTA whose label changes with state: "Fazer draft", "Continuar draft", "Assistir partida", "Ver resultado", "Próximo jogo".
  2. "Pendências" inbox (FM-style). Examples: "Escolha o lado (First Selection)", "Jogador X com energia baixa", "Nova tática recomendada". Each item has one tap to resolve.
  3. Mini standings showing your position, ±2 teams and a link.
  4. Form and last result.
  - This makes the app's state legible without hunting through tabs.
- **Series status:** keep it visible globally, but make it meaningful. The header chip should show "MD3 · 1–0" with side colours and the game number, tap to open a series sheet (games, picks used so far for Fearless, who has First Selection). Hide it when no series is active.
- **Draft:** keep it inside Partida as a full-screen step (hide the bottom bar during the draft to give it space and focus, with a clear "Sair do draft" affordance). Draft is a focused task with its own timer, and a modal full-screen flow suits it better than a tab.
- **Calendar:** Liga › "Calendário" (renamed from "Jogos"), grouped by week/date. Your matches are pinned or highlighted, and other matches are read-only results. Simulating others' matches moves to an explicit "Simular rodada" action, not a play icon on every row.
- **Segmented controls:** limit to one per screen. Liga currently has Seg + chips + Seg (MD), so the MD selector moves into the pre-match flow.

### Gaps
- No usage data exists for which tabs Nexus players use. Mobbin examples of mobile manager hubs (e.g. FM Mobile, Top Eleven, OSM) were not retrieved, so the hub anatomy above is synthesized from FM26/FM27 reporting and sports-app patterns.

## Accessibility on mobile: touch targets, dark-theme contrast, colourblind-safe sides, reduced motion

### Takeaway
Design every control at 44–48px, which satisfies WCAG 2.2 AA (24px), Apple (44pt) and Material (48dp). Fix the failing `--dim`, small-red and border contrasts. Never encode side or outcome by blue/red alone: use labels, positions, icons or patterns, and consider an optional "colour-blind" palette (blue/orange). Nexus's teal-vs-red is already fairly distinguishable by lightness but should not be relied on.

### Cited Findings
- **Touch target sizes:**
  - WCAG 2.2 SC 2.5.8 (AA) requires pointer targets of at least 24×24 CSS px, or 24px spacing, with exceptions such as inline links.
  - SC 2.5.5 (AAA) asks for 44×44.
  - Apple HIG recommends 44×44pt and Material recommends 48×48dp.
  - — [TetraLogical: target size](https://tetralogical.com/blog/2022/12/20/foundations-target-size/), [Ahmad Shadeed: target size](https://ishadeed.com/article/target-size/), [Front-End Checklist](https://frontendchecklist.io/rules/accessibility/touch-targets) (secondary sources; w3.org could not be fetched)
- **Primary colour on dark:** use a desaturated (200-tone) primary in dark themes to keep WCAG AA contrast. — [Material 2 dark theme](https://m2.material.io/design/color/dark-theme)
- **LoL's colourblind settings:** LoL has a red–green colourblind filter, and a "relative team colours" setting that shows allies blue and enemies red regardless of starting side. A player with protanopia reported the filter is "almost completely useless". — [LoL Wiki: Settings](https://wiki.leagueoflegends.com/en-us/Settings?oldid=3766659), [Gamepressure](https://www.gamepressure.com/newsroom/lol-colorblind-mode-is-useles-for-players-suffering-from-actual-c/za2e03), [PC Gamer](https://pcgamer.com/league-of-legends-getting-colourblind-mode-in-upcoming-patch)
- **Safer colour pair:** about 7% of male players can't tell red from green on a minimap. Blue/orange is a safer pair across the three CVD types. — [Abratabia: visual accessibility](https://abratabia.com/game-accessibility/visual-accessibility.php) (search summary)
- **Colour alone:** don't convey essential information by a fixed colour alone. — [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/ensure-no-essential-information-is-conveyed-by-a-fixed-colour-alone/)
- **Nexus contrast measurements:** `--dim` is 2.89:1 on bg, `--red` 4.19:1 on surface-2, `--line` 1.26:1 and gold-5 borders 2.86:1. Tap targets of 32–38px are found on chips, draft options, map controls and inline link buttons. — computed from [index.css](../../src/index.css)

### Inferences (concrete proposals)
- **Minimum sizes:** 44px for every interactive element. Chips and segmented buttons should be at least 40px visible with a 44px hit area (padding or `::after` inset). Map control buttons should be 44×44. Inline `linkbtn` should be at least 44px tall, or a real text link inside a sentence.
- **Text contrast:** all text at least 4.5:1, and large numbers (≥24px) at least 3:1. Raise `--dim` (e.g. towards #8A877E, to be verified) or reserve it for disabled states. For red text on dark surfaces, use a lighter red (around #FF6B7D, to be verified) or put red in fills or icons with neutral text.
- **Sides without colour:**
  - Your side is always on the left (already true in `.vs` and lineups).
  - Label "Você"/"Adversário" or the team tag.
  - Side icon shapes (e.g. a shield for azul, a sword for vermelho), or a striped versus solid HP bar fill.
  - The ban slash plus greyscale already doesn't rely on red, which is good.
- **Colour-blind setting:** an optional "Modo daltônico" in the Mais sheet swaps `--side-red` to orange (and `--negative` to a magenta or orange-plus-icon), using the token layer, so it is a CSS-variable swap.
- **Toasts:** add `role="status"`. Focus-trap and restore focus in sheets (shadcn `Sheet`/`Drawer` via Radix/vaul does this).
- **Respect safe areas:** already done, so keep it.

### Gaps
- No primary W3C, Apple HIG or Material 3 pages could be fetched. Figures come from reputable secondary accessibility sources (TetraLogical, Shadeed) that agree with each other.
- Nexus's palette was not simulated under protanopia or deuteranopia (no tool run). Running the palette through a CVD simulator is a recommended next step.

## Migrating the large custom CSS toward Tailwind tokens and shadcn components incrementally

### Takeaway
Wire the existing custom tokens into shadcn's variable names first. This is a one-time `:root` addition that instantly makes the 45 installed shadcn components render in the Nexus theme. After that, migrate one component at a time: Sheet, Toast, Seg/Tabs, Button, Card, Tooltip/Popover. Delete each CSS block once its last class user is gone, starting with the `!important` patch layer. No rewrite is needed.

### Cited Findings
- **shadcn token convention:** the expected tokens are surface/foreground pairs plus `border`, `input`, `ring` and `radius`, and new semantic tokens are added by defining variables and exposing them to Tailwind. — [shadcn theming](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/content/docs/(root)/theming.mdx)
- **Existing Nexus setup:** Nexus's Tailwind 3 config already maps `hsl(var(--background))` and the other standard tokens, the tailwindcss-animate plugin, and `darkMode: ["class"]`. `components.json` points CSS at `src/index.css` with aliases `@/components/ui` and `@/lib/utils`. — [tailwind.config.js](../../tailwind.config.js), [components.json](../../components.json)
- **Variable format:** the shadcn variables are not defined in `index.css`, and the config uses `hsl(var(--x))`. The variables must therefore hold bare HSL triplets (e.g. `--background: 210 90% 4%;`), not hex values. — [tailwind.config.js](../../tailwind.config.js), [index.css](../../src/index.css)

### Inferences (migration plan)
1. **Bridge tokens (one PR):**
   - In `@layer base`, add `:root { --background: …; --foreground: …; --card: …; --primary: …; --radius: 0.625rem; … }` as HSL triplets converted from the current hex.
   - Redefine the legacy names as aliases (`--bg: hsl(var(--background))`, `--surface: hsl(var(--card))`, …) so old CSS keeps working.
   - Add `.dark`, or put the dark values directly in `:root` since the app is dark-only, and add `class="dark"` on `<html>` for shadcn components that use `dark:`.
   - Extend `tailwind.config.js` with the semantic tokens: `side-blue`, `side-red`, `positive`, `negative`, `warning` and `you`. Also add `fontFamily: { display, sans, num }` and a `fontSize` scale restricted to the six steps.
2. **Swap the plumbing components first:**
   - Replace the custom `Sheet` with shadcn `Drawer` (vaul: drag-to-dismiss, focus trap) or `Sheet side="bottom"`, keeping the same `ui.openSheet(title, body)` API so call sites don't change.
   - Replace the custom toast with `sonner` (`toast()`), keeping `ui.toast(msg)` as a wrapper.
   - These two changes touch only App.tsx and common.tsx.
3. **Wrap, don't rewrite:**
   - Re-implement `Seg` on `ToggleGroup` or `Tabs`, `Bar` on `Progress`, and `.btn` variants as `Button` variants (`default` = gold primary, `secondary`, `ghost`, `side-blue`, `side-red`) via `cva`. The exported React component names stay the same.
4. **Per screen, smallest first:** Motor, then Liga, then Elenco, then Partida, then Draft. On each screen:
   - replace inline `style={{display:'flex',gap:8}}` with `flex gap-2`;
   - replace `.panel` with `Card`;
   - replace `.row` with a shared `ListRow` component (leading, title/subtitle, trailing).
   - Delete the CSS for any class with zero remaining users. `grep -c className` per class is a good CI check.
5. **Retire the patch layer early:** fold each `!important` override (lines ~350–455 of index.css) back into its original rule, and delete dead selectors (`#v-partida[hidden]`, `@keyframes cardin2`). Low risk, immediate clarity.
6. **Keep bespoke CSS where it earns it:** the minimap, HP/advantage bar, event card over the map, ban slash and draft pool grid are game-specific visuals. Keep them as small CSS modules or `@layer components` classes built on the tokens.
7. **Guardrails:**
   - Add an ESLint rule or review checklist: no new hex values outside the token file, no `style={{}}` for layout, font sizes only from the scale.
   - Self-host the fonts with `@fontsource` (or at least `<link rel=preconnect>` in index.html) instead of the CSS `@import`, which blocks rendering.

### Gaps
- Tailwind's official docs (tailwindcss.com) were not fetched. The Tailwind 3 versus 4 differences (OKLCH/`@theme inline` in v4 versus `hsl(var())` in the v3 config) are based on the shadcn v4 doc plus the repo's own config. Whether the generated components in `src/components/ui` were produced for Tailwind v3 (the "default" style) was not checked file by file.
- No published case study of an incremental CSS-to-Tailwind migration was retrieved. The plan above is an engineering inference.
