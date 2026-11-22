// SÓ NO BUILD DE TESTE (C3 do ADR-002). Este módulo é carregado por `import()` dentro de
// `if (import.meta.env.MODE === 'test')`; no build do jogador o Vite troca a condição por `false` e o
// arquivo nem é gerado. `tools/checar-build-jogador.ts` falha o `npm run build` se algo daqui vazar.
//
// - Tempo acelerado: `?acelerar=N` (N de 1 a 100) multiplica o relógio monotônico. A renda, os
//   toques e o relógio de partida andam N vezes mais rápido. O relógio de parede não muda (para o
//   offline, o E2E usa o relógio falso do Playwright).
// - Console de debug: `window.__nexusDebug` com a vista, o estado, os saves e atalhos.

import { passo } from '../engine/motor.ts';
import type { Jogo } from './jogo.ts';
import type { Relogio } from './relogio.ts';

export const MARCA_DEBUG = '__nexusDebug';
export const ACELERAR_MAX = 100;

export function relogioDeTeste(base: Relogio, busca: URLSearchParams): Relogio {
  const n = Number(busca.get('acelerar') ?? '1');
  const fator = Number.isFinite(n) ? Math.min(ACELERAR_MAX, Math.max(1, n)) : 1;
  if (fator === 1) return base;
  const t0 = base.monotonicoMs();
  return {
    paredeMs: () => base.paredeMs(),
    monotonicoMs: () => t0 + (base.monotonicoMs() - t0) * fator,
  };
}

export function instalarConsole(jogo: Jogo, alvo: Record<string, unknown>, storage: Storage) {
  alvo[MARCA_DEBUG] = {
    jogo,
    vista: () => jogo.vista(),
    estado: () => jogo.vista().estado,
    passo,
    /** QA-28 d: injeta um estado qualquer (ex.: nome com <script>) sem a validação da RN-019. */
    injetarEstado: (estado: Parameters<Jogo['substituirEstadoSemValidar']>[0]) =>
      jogo.substituirEstadoSemValidar(estado),
    saves: () => ({
      A: storage.getItem('nexus-idle:save:A'),
      B: storage.getItem('nexus-idle:save:B'),
      ilegivel: storage.getItem('nexus-idle:save:ilegivel'),
    }),
  };
}
