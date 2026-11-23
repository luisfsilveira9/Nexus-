// Feedback visual da NX-010 (guia visual §8 e §9): "Reduzir animações" e o voo da moeda na compra.
// Só `transform` e `opacity` (ADR-002, 60 fps). O crédito já aconteceu antes de qualquer animação.
import { useSyncExternalStore } from 'react';

const CONSULTA = '(prefers-reduced-motion: reduce)';

function assinarMovimento(aviso: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const mq = window.matchMedia(CONSULTA);
  mq.addEventListener('change', aviso);
  return () => mq.removeEventListener('change', aviso);
}

const reduzAgora = () =>
  typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(CONSULTA).matches;

/**
 * "Reduzir animações" segue `prefers-reduced-motion` do sistema (tokens.md §7). O ajuste próprio da
 * T14 entra quando a T14 existir.
 */
export function useReduzirAnimacoes(): boolean {
  return useSyncExternalStore(assinarMovimento, reduzAgora, () => false);
}

/** Alvo do voo da moeda: o ícone de ouro da tela aberta (T02 ou T03). */
export const ALVO_MOEDA = 'data-alvo-moeda';

/**
 * Compra (guia visual §9): a moeda sai do botão e "voa" até o ouro em `duracao.media` (200 ms).
 * Com "Reduzir animações", não faz nada (o número muda direto).
 */
export function voarMoeda(origem: Element, imagem: string, reduzir: boolean) {
  if (reduzir || typeof document === 'undefined') return;
  const alvo = document.querySelector(`[${ALVO_MOEDA}]`);
  if (!alvo || typeof (origem as HTMLElement).animate !== 'function') return;
  const a = origem.getBoundingClientRect();
  const b = alvo.getBoundingClientRect();
  const tamanho = 20;
  const moeda = document.createElement('img');
  moeda.src = imagem;
  moeda.alt = '';
  moeda.setAttribute('aria-hidden', 'true');
  Object.assign(moeda.style, {
    position: 'fixed',
    left: `${a.left + a.width / 2 - tamanho / 2}px`,
    top: `${a.top + a.height / 2 - tamanho / 2}px`,
    width: `${tamanho}px`,
    height: `${tamanho}px`,
    pointerEvents: 'none',
    zIndex: 'var(--camada-aviso)',
  });
  document.body.appendChild(moeda);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const duracao =
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--duracao-media')) ||
    200;
  const anim = moeda.animate(
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.8)`, opacity: 0.6 },
    ],
    { duration: duracao, easing: 'cubic-bezier(0.4, 0, 1, 1)' },
  );
  const fim = () => moeda.remove();
  anim.onfinish = fim;
  anim.oncancel = fim;
}
