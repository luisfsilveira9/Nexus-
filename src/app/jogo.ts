// Ligação motor ↔ save ↔ tela (NX-015). Guarda a "vista" (o que a tela mostra) numa store mínima
// para `useSyncExternalStore` (ADR-002) e decide quando salvar (RN-015):
// - a cada 10 s (AUTOSAVE_S, medido no relógio monotônico);
// - a cada compra (antes de a tela mostrar o resultado);
// - ao fim de cada partida;
// - ao sair ou minimizar (`aoOcultar`, chamado em `visibilitychange`→hidden e em `pagehide`).
// Segundo plano conta como offline (RN-011): ao ocultar, credita o online até agora, salva e para
// de creditar; ao voltar, o motor aplica o offline a partir de `maior` (RN-012).
// Não toca DOM: o navegador é ligado em `navegador.ts`. Assim dá para testar no Node.

import {
  type Agora,
  type Estado,
  type ModoRelogio,
  type Quantidade,
  novoEstado,
  passoDetalhado,
} from '../engine/motor.ts';
import { AUTOSAVE_S } from '../engine/regras.ts';
import type { ArmazenamentoSave } from '../save/armazenamento.ts';
import {
  type CopiasCruas,
  type GerenciadorSave,
  type ResultadoCarga,
  criarGerenciadorSave,
} from '../save/gerenciador.ts';
import type { EstadoPersistencia } from '../save/persistencia.ts';
import type { Relogio } from './relogio.ts';

/** Telas desta história (T00, T12a, T12b, T12c e a tela mínima do jogo). */
export type Tela = 'carregando' | 'recuperado' | 'nenhumValido' | 'confirmarNovo' | 'jogo';

export interface Vista {
  tela: Tela;
  estado: Estado | null;
  /** T12a: quando a cópia carregada foi salva (ms de parede). */
  recuperadoSalvoEm: number | null;
  /** T12b: 1 na primeira vez; 2, 3… depois de "Tentar de novo". */
  tentativas: number;
  /** T12b: cópias cruas que não abriram. */
  ilegivel: CopiasCruas | null;
  /** T12b: alguma cópia é de uma versão mais nova do jogo. */
  versaoFutura: boolean;
  /** Painel de exportar o save que não abriu (texto), ou null se fechado. */
  exportarTexto: string | null;
  /** A05: a última tentativa de salvar falhou (sem espaço). */
  avisoSemEspaco: boolean;
  /** Último save gravado com sucesso (ms de parede). */
  ultimoSaveEm: number | null;
  persistencia: EstadoPersistencia | null;
  /** Relógio de parede na última mudança da vista (para "hoje às…" e "há 2 min", sem ler o relógio na tela). */
  paredeMs: number;
}

export interface Jogo {
  vista(): Vista;
  assinar(ouvinte: () => void): () => void;
  iniciar(): void;
  tique(): void;
  tocar(): void;
  comprarNegocio(indice: number, quantidade: Quantidade): void;
  continuar(): void;
  tentarDeNovo(): void;
  pedirClubeNovo(): void;
  cancelarClubeNovo(): void;
  confirmarClubeNovo(): void;
  abrirExportarIlegivel(): void;
  fecharExportar(): void;
  fecharAvisoSemEspaco(): void;
  aoOcultar(): void;
  aoMostrar(): void;
  definirPersistencia(p: EstadoPersistencia): void;
  /**
   * Troca o estado em memória SEM validar (QA-28 d: provar que a tela não interpreta HTML). Só é
   * alcançável pelo console do build de teste (src/app/debug.ts); o jogo nunca chama.
   */
  substituirEstadoSemValidar(estado: Estado): void;
  /** Acesso para testes e para o console de debug do build de teste. */
  readonly save: GerenciadorSave;
}

export interface DependenciasJogo {
  relogio: Relogio;
  armazenamento: ArmazenamentoSave;
  /** Semente do sorteio de um clube novo (RN-009). Padrão: `crypto.getRandomValues`. */
  novaSemente?: () => number;
}

const sementeAleatoria = () => crypto.getRandomValues(new Uint32Array(1))[0];

export function criarJogo(deps: DependenciasJogo): Jogo {
  const { relogio } = deps;
  const save = criarGerenciadorSave(deps.armazenamento);
  const novaSemente = deps.novaSemente ?? sementeAleatoria;
  const ouvintes = new Set<() => void>();

  let vista: Vista = {
    tela: 'carregando',
    estado: null,
    recuperadoSalvoEm: null,
    tentativas: 0,
    ilegivel: null,
    versaoFutura: false,
    exportarTexto: null,
    avisoSemEspaco: false,
    ultimoSaveEm: null,
    persistencia: null,
    paredeMs: relogio.paredeMs(),
  };
  let emPrimeiroPlano = true;
  let ultimoSaveMono = 0;

  const agora = (): Agora => ({ paredeMs: relogio.paredeMs(), monoMs: relogio.monotonicoMs() });

  const mudar = (parcial: Partial<Vista>) => {
    vista = { ...vista, ...parcial, paredeMs: relogio.paredeMs() };
    for (const o of ouvintes) o();
  };

  /** Grava o estado atual. Devolve o estado com `maior` atualizado (RN-012). */
  const salvarEstado = (estado: Estado): Partial<Vista> => {
    ultimoSaveMono = relogio.monotonicoMs();
    const r = save.salvar(estado, relogio.paredeMs());
    if (r.ok) return { estado: r.estado, avisoSemEspaco: false, ultimoSaveEm: r.salvoEm };
    if (r.motivo === 'bloqueado') return { estado: r.estado };
    return { estado: r.estado, avisoSemEspaco: true };
  };

  const modo = (): ModoRelogio => (vista.tela === 'jogo' ? 'emJogo' : 'pausado');

  /** Credita o tempo online até agora. Devolve o novo estado e se alguma partida terminou. */
  const creditarOnline = (estado: Estado) => {
    const r = passoDetalhado(estado, { tipo: 'tique', modo: modo() }, agora());
    return { estado: r.estado, partida: r.eventos.some((e) => e.tipo === 'partida') };
  };

  const abrirEstado = (estado: Estado) => passoDetalhado(estado, { tipo: 'abrir' }, agora()).estado;

  const aplicarCarga = (r: ResultadoCarga) => {
    ultimoSaveMono = relogio.monotonicoMs();
    const ultimoSaveEm = save.ultimoSalvoEm();
    switch (r.tipo) {
      case 'novo': {
        const e = abrirEstado(novoEstado(novaSemente(), relogio.paredeMs() / 1000));
        mudar({ tela: 'jogo', ilegivel: null, versaoFutura: false, ...salvarEstado(e) });
        return;
      }
      case 'ok':
        mudar({ tela: 'jogo', estado: abrirEstado(r.estado), ilegivel: null, ultimoSaveEm });
        return;
      case 'recuperado':
        mudar({
          tela: 'recuperado',
          estado: abrirEstado(r.estado),
          recuperadoSalvoEm: r.salvoEm,
          ilegivel: null,
          ultimoSaveEm,
        });
        return;
      case 'nenhumValido':
        mudar({
          tela: 'nenhumValido',
          estado: null,
          ilegivel: r.copias,
          versaoFutura: r.versaoFutura,
          tentativas: vista.tentativas + 1,
        });
        return;
    }
  };

  return {
    save,
    vista: () => vista,
    assinar(ouvinte) {
      ouvintes.add(ouvinte);
      return () => ouvintes.delete(ouvinte);
    },

    iniciar() {
      aplicarCarga(save.carregar());
    },

    tique() {
      if (!vista.estado || !emPrimeiroPlano) return;
      const { estado, partida } = creditarOnline(vista.estado);
      const venceu = relogio.monotonicoMs() - ultimoSaveMono >= AUTOSAVE_S * 1000;
      if (partida || venceu) mudar(salvarEstado(estado));
      else if (estado !== vista.estado) mudar({ estado });
    },

    tocar() {
      if (!vista.estado || vista.tela !== 'jogo') return;
      const r = passoDetalhado(vista.estado, { tipo: 'toque' }, agora());
      if (r.estado !== vista.estado) mudar({ estado: r.estado });
    },

    comprarNegocio(indice, quantidade) {
      if (!vista.estado || vista.tela !== 'jogo') return;
      const r = passoDetalhado(
        vista.estado,
        { tipo: 'comprarNegocio', indice, quantidade },
        agora(),
      );
      if (r.estado !== vista.estado) mudar(salvarEstado(r.estado)); // salva antes de mostrar
    },

    continuar() {
      if (vista.tela === 'recuperado') mudar({ tela: 'jogo', recuperadoSalvoEm: null });
    },

    tentarDeNovo() {
      if (vista.tela === 'nenhumValido') aplicarCarga(save.carregar());
    },

    pedirClubeNovo() {
      if (vista.tela === 'nenhumValido') mudar({ tela: 'confirmarNovo', exportarTexto: null });
    },

    cancelarClubeNovo() {
      if (vista.tela === 'confirmarNovo') mudar({ tela: 'nenhumValido' });
    },

    confirmarClubeNovo() {
      if (vista.tela !== 'confirmarNovo') return;
      if (!save.descartarIlegiveis()) {
        mudar({ avisoSemEspaco: true });
        return;
      }
      aplicarCarga({ tipo: 'novo' });
    },

    abrirExportarIlegivel() {
      if (!vista.ilegivel) return;
      mudar({ exportarTexto: save.exportarIlegiveis(vista.ilegivel, relogio.paredeMs()) });
    },

    fecharExportar() {
      mudar({ exportarTexto: null });
    },

    fecharAvisoSemEspaco() {
      mudar({ avisoSemEspaco: false });
    },

    aoOcultar() {
      if (vista.estado && emPrimeiroPlano) {
        const { estado } = creditarOnline(vista.estado);
        emPrimeiroPlano = false;
        mudar(salvarEstado(estado));
        return;
      }
      emPrimeiroPlano = false;
      if (vista.estado) mudar(salvarEstado(vista.estado));
    },

    aoMostrar() {
      if (emPrimeiroPlano) return;
      emPrimeiroPlano = true;
      if (vista.estado) mudar({ estado: abrirEstado(vista.estado) });
    },

    definirPersistencia(p) {
      mudar({ persistencia: p });
    },

    substituirEstadoSemValidar(estado) {
      mudar({ estado, tela: 'jogo' });
    },
  };
}
