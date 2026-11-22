// Liga o jogo ao navegador: loop de 1 Hz (RN-002: renda creditada no mínimo a cada 1 s) e ciclo de
// vida da página (RN-011: segundo plano = offline; RN-015: salva ao sair ou minimizar).

import type { Jogo } from './jogo.ts';

export const INTERVALO_LOOP_MS = 1000;

export function ligarNavegador(jogo: Jogo, doc: Document = document, win: Window = window) {
  const aoMudarVisibilidade = () => {
    if (doc.visibilityState === 'hidden') jogo.aoOcultar();
    else jogo.aoMostrar();
  };
  const aoSair = () => jogo.aoOcultar();
  // Volta do bfcache (voltar/avançar do navegador): a página não recarrega, mas esteve fora.
  const aoVoltarDoCache = (e: PageTransitionEvent) => {
    if (e.persisted) jogo.aoMostrar();
  };

  const id = win.setInterval(() => jogo.tique(), INTERVALO_LOOP_MS);
  doc.addEventListener('visibilitychange', aoMudarVisibilidade);
  win.addEventListener('pagehide', aoSair);
  win.addEventListener('pageshow', aoVoltarDoCache);
  if (doc.visibilityState === 'hidden') jogo.aoOcultar();

  return () => {
    win.clearInterval(id);
    doc.removeEventListener('visibilitychange', aoMudarVisibilidade);
    win.removeEventListener('pagehide', aoSair);
    win.removeEventListener('pageshow', aoVoltarDoCache);
  };
}
