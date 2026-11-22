// Ponto de entrada (NX-015). Cria o jogo com os relógios reais e o localStorage, liga o loop de 1 Hz
// e o ciclo de vida da página, e pede armazenamento persistente.
// Tempo acelerado e console de debug só no build de teste (C3): no build do jogador a condição vira
// `false` e o `import()` de debug.ts some do pacote (conferido por tools/checar-build-jogador.ts).
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './ui/fontes.css';
import './ui/tokens/tokens.css';
import './ui/global.css';
import { criarJogo } from './app/jogo.ts';
import { ligarNavegador } from './app/navegador.ts';
import { relogioReal } from './app/relogio.ts';
import { armazenamentoLocal } from './save/armazenamento.ts';
import { pedirPersistencia } from './save/persistencia.ts';
import { App } from './ui/App.tsx';

async function iniciar() {
  let relogio = relogioReal();
  const armazenamento = armazenamentoLocal(window.localStorage);
  if (import.meta.env.MODE === 'test') {
    const debug = await import('./app/debug.ts');
    relogio = debug.relogioDeTeste(relogio, new URLSearchParams(window.location.search));
  }
  const jogo = criarJogo({ relogio, armazenamento });
  if (import.meta.env.MODE === 'test') {
    const debug = await import('./app/debug.ts');
    debug.instalarConsole(jogo, window as unknown as Record<string, unknown>, window.localStorage);
  }

  createRoot(document.getElementById('raiz')!).render(
    <StrictMode>
      <App jogo={jogo} />
    </StrictMode>,
  );
  jogo.iniciar();
  ligarNavegador(jogo);
  void pedirPersistencia(navigator.storage).then((p) => jogo.definirPersistencia(p));
}

void iniciar();
