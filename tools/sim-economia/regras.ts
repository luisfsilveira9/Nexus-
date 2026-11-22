// Constantes das regras de negócio (RN v0.2, docs/produto/regras-de-negocio.md) num arquivo único.
// NX-008, condição C4 do ADR-002: motor, simulador e testes leem daqui. Na NX-015 este arquivo vai
// para `src/engine/regras.ts` sem mudanças.
// Só números e ids. Os textos que o jogador vê (nomes de divisões, negócios, jogadores) ficam em
// `src/content/` (lore); os ids abaixo seguem os nomes finais de docs/lore/nomes-do-jogo.md.

// ---------- Convenções ----------

/** "ouro ≥ custo" significa ouro ≥ custo × (1 − 10⁻⁹). */
export const TOLERANCIA_DINHEIRO = 1e-9;

// ---------- RN-001 ----------

/** Ouro de um clube novo e depois de cada refundação. */
export const OURO_INICIAL = 10;

// ---------- RN-002 a RN-006: negócios, toque, compra em lote ----------

/** RN-003. Ordem fixa: o índice é o número do negócio menos 1. */
export const NEGOCIOS = [
  { id: 'aulas-na-lan', custoBase: 10, rendaBase: 0.5 },
  { id: 'patrocinio-local', custoBase: 150, rendaBase: 6 },
  { id: 'camisa-oficial', custoBase: 2_000, rendaBase: 60 },
  { id: 'canal-do-clube', custoBase: 30_000, rendaBase: 700 },
  { id: 'festa-da-torcida', custoBase: 500_000, rendaBase: 9_000 },
  { id: 'arena-do-clube', custoBase: 8_000_000, rendaBase: 120_000 },
] as const;
export const CRESC_NEGOCIO = 1.15; // RN-003
/** RN-003: fica visível quando o ouro acumulado na run chega a esta fração do custo base. */
export const VISIVEL_FRACAO = 0.5;
/** RN-003: negócios visíveis desde o início (só "Aulas na lan"). */
export const VISIVEIS_DE_INICIO: readonly number[] = [0];
export const MARCO_NEGOCIO = 50; // RN-004

export const TOQUE_FRACAO = 0.1; // RN-005
export const TOQUE_MIN = 1;
export const TOQUES_MAX_JANELA = 5;
export const TOQUE_JANELA_S = 1;

export const LOTE_10 = 10; // RN-006

// ---------- RN-007 e RN-008: elenco, poder e divisões ----------

export const JOGADORES = ['pedra', 'rastro', 'vulto', 'fagulha', 'bussola'] as const; // RN-007
export const NIVEL_INICIAL = 1;
export const NIVEL_CUSTO_BASE = 50;
export const NIVEL_CRESC = 1.22;
export const PODER_BASE = 10;
export const PODER_CRESC = 1.05;

/** RN-008 */
export const DIVISOES = [
  { id: 'varzea', rival: 60, mult: 1 },
  { id: 'acesso', rival: 220, mult: 2 },
  { id: 'ascensao', rival: 900, mult: 4 },
  { id: 'elite', rival: 20_000, mult: 8 },
  { id: 'continental', rival: 170_000, mult: 16 },
  { id: 'mundial', rival: 1_500_000, mult: 32 },
] as const;
export const DIV_TOPO = DIVISOES.length - 1;

// ---------- RN-009 e RN-010: partida e split ----------

export const INTERVALO_PARTIDA = 90;
export const P_MIN = 0.05;
export const P_MAX = 0.95;
export const P_INCLINACAO = 6; // o "6" de e^(−6x)
export const PREMIO_VITORIA_S = 60;
export const PARTIDAS_SPLIT = 14;
export const VITORIAS_SOBE = 10;
export const VITORIAS_CAI = 3;
/** RN-010: título mundial = split no Mundial com pelo menos esta quantidade de vitórias. */
export const VITORIAS_TITULO = 10;

// ---------- RN-011 e RN-012: offline e relógio ----------

export const OFFLINE_EFIC = 0.5;
export const OFFLINE_LIMITE_S = 8 * 3600;
/** RN-011: a tela "Enquanto você esteve fora" só aparece com t_off ≥ este valor. */
export const OFFLINE_TELA_MIN_S = 60;

// ---------- RN-013 e RN-014: refundação e Legado ----------

export const DIV_MIN_REFUNDACAO = 2; // Ascensão
/** Legado ganho por melhor divisão da run (índice = divisão). */
export const LEGADO_POR_DIV: readonly number[] = [0, 0, 10, 25, 45, 80];
export const LEGADO_RENDA = 0.05;
export const LEGADO_PODER = 0.01;

// ---------- RN-015 ----------

export const AUTOSAVE_S = 10;
