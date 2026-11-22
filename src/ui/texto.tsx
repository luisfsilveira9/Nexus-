// Ajudantes de texto da UI. Os modelos vêm de src/content/; aqui só se trocam os `{campos}`.
import { Fragment, type ReactNode } from 'react';
import { textos } from '../content/textos.ts';

/**
 * Troca `{campo}` por nós React (ex.: um número dentro de <span data-testid>, condição C6).
 * O texto continua puro: o React escapa tudo, nada é interpretado como HTML (RN-019).
 */
export function comNos(modelo: string, valores: Record<string, ReactNode>): ReactNode {
  const partes = modelo.split(/\{(\w+)\}/g);
  return partes.map((p, i) => (
    <Fragment key={i}>{i % 2 === 1 ? (valores[p] ?? `{${p}}`) : p}</Fragment>
  ));
}

const doisDigitos = (n: number) => String(n).padStart(2, '0');

/** "hoje às 14:32" ou "21/11, 14:32" (hora local do aparelho). */
export function quandoFoi(ms: number, agoraMs: number): string {
  const d = new Date(ms);
  const hoje = new Date(agoraMs);
  const hora = `${doisDigitos(d.getHours())}:${doisDigitos(d.getMinutes())}`;
  const mesmoDia =
    d.getFullYear() === hoje.getFullYear() &&
    d.getMonth() === hoje.getMonth() &&
    d.getDate() === hoje.getDate();
  if (mesmoDia) return textos.tempo.hojeAs.replace('{hora}', hora);
  const data = `${doisDigitos(d.getDate())}/${doisDigitos(d.getMonth() + 1)}`;
  return textos.tempo.emData.replace('{data}', data).replace('{hora}', hora);
}

/** "agora", "há 4 s", "há 2 min", "há 3 h". */
export function haQuanto(ms: number, agoraMs: number): string {
  const s = Math.max(0, Math.floor((agoraMs - ms) / 1000));
  if (s < 1) return textos.tempo.agora;
  if (s < 60) return textos.tempo.haSegundos.replace('{n}', String(s));
  if (s < 3600) return textos.tempo.haMinutos.replace('{n}', String(Math.floor(s / 60)));
  return textos.tempo.haHoras.replace('{n}', String(Math.floor(s / 3600)));
}
