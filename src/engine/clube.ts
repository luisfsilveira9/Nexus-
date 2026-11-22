// RN-019 v0.3.1: nome e sigla do clube, como funções puras (NX-015; a tela de renomear é a NX-018).
// - Nome: 1 a 20 caracteres contados como o jogador vê (grafemas). Permitido: letras (com ou sem
//   acento, incluindo "ç"), números, espaço entre palavras e `- . ' &`. Recusado: emoji e qualquer
//   outro símbolo, quebra de linha e caracteres de controle. Espaços do começo e do fim saem e
//   espaços seguidos viram um só; nome só de espaços é recusado.
// - Texto colado: corta em 20 (com aviso) e remove os caracteres proibidos (com aviso).
// - Sigla: exatamente 3 letras de A a Z; minúsculas viram maiúsculas; acento, "ç" e números são
//   recusados (sem converter "Ç" em "C"); não pode repetir nenhuma sigla de rival.
// O texto é sempre texto puro: a validação só olha caracteres, nunca interpreta HTML.

import { NOME_MAX, SIGLA_TAMANHO } from './regras.ts';

/**
 * Um "caractere do nome": letra ou número (com acentos combinados), ou um sinal permitido.
 * As marcas aceitas excluem os seletores de variação (U+FE00–FE0F) e as marcas que envolvem
 * (U+20E3 etc.), que transformam "1" em emoji de tecla "1️⃣".
 */
const MARCAS = String.raw`(?:(?![︀-️])[\p{Mn}\p{Mc}])*`;
const UNIDADE = String.raw`[\p{L}\p{Nd}]${MARCAS}|[ \-.'&]`;
const UNIDADE_PERMITIDA = new RegExp(UNIDADE, 'gu');
const NOME_SO_PERMITIDOS = new RegExp(`^(?:${UNIDADE})*$`, 'u');

/** QA-30 (decisão do PO): o apóstrofo tipográfico ’ (teclado do iPhone) vira ' antes de validar. */
export const converterApostrofo = (texto: string) => texto.replace(/\u2019/g, "'");

const segmentador = new Intl.Segmenter('pt-BR', { granularity: 'grapheme' });

/** Quantos caracteres o jogador vê (grafemas). "Faísca" = 6, mesmo com o acento combinado. */
export const contarCaracteres = (texto: string) => [...segmentador.segment(texto)].length;

/** Junta espaços seguidos e tira os das pontas, em forma NFC (acentos compostos). */
export const normalizarEspacos = (texto: string) =>
  texto.normalize('NFC').replace(/ {2,}/g, ' ').trim();

/** Um caractere digitado pode entrar no campo do nome? (o campo recusa o resto, sem aceitar) */
export const caracterePermitidoNoNome = (caractere: string) =>
  caractere.length > 0 && NOME_SO_PERMITIDOS.test(converterApostrofo(caractere).normalize('NFC'));

export type MotivoNome = 'vazio' | 'caractere' | 'longo';

export type ResultadoNome = { ok: true; nome: string } | { ok: false; motivo: MotivoNome };

/** Valida o nome final (depois de normalizar os espaços). */
export function validarNome(texto: string): ResultadoNome {
  if (typeof texto !== 'string') return { ok: false, motivo: 'caractere' };
  const nfc = converterApostrofo(texto).normalize('NFC');
  if (!NOME_SO_PERMITIDOS.test(nfc)) return { ok: false, motivo: 'caractere' };
  const nome = normalizarEspacos(nfc);
  if (nome.length === 0) return { ok: false, motivo: 'vazio' };
  if (contarCaracteres(nome) > NOME_MAX) return { ok: false, motivo: 'longo' };
  return { ok: true, nome };
}

export interface NomeColado {
  /** Texto que vai para o campo (ainda pode ter espaços nas pontas, que saem ao confirmar). */
  texto: string;
  /** Havia caracteres proibidos, que foram removidos (mostrar aviso). */
  removeu: boolean;
  /** Passava de 20 caracteres e foi cortado em 20 (mostrar aviso). */
  cortou: boolean;
}

/**
 * RN-019: texto colado. Ordem (QA-30): converte ’ em ', remove os proibidos, junta os espaços e corta
 * em 20 caracteres, avisando cada caso. A conversão do ’ não conta como remoção.
 */
export function limparNomeColado(colado: string): NomeColado {
  const nfc = converterApostrofo(colado).normalize('NFC');
  const permitidos = (nfc.match(UNIDADE_PERMITIDA) ?? []).join('');
  const removeu = permitidos !== nfc;
  const juntos = permitidos.replace(/ {2,}/g, ' ');
  const grafemas = [...segmentador.segment(juntos)].map((s) => s.segment);
  const cortou = grafemas.length > NOME_MAX;
  return { texto: cortou ? grafemas.slice(0, NOME_MAX).join('') : juntos, removeu, cortou };
}

export type MotivoSigla = 'tamanho' | 'caractere' | 'rival';

export type ResultadoSigla = { ok: true; sigla: string } | { ok: false; motivo: MotivoSigla };

/** Sigla: minúsculas a–z viram maiúsculas; o resultado tem de ser A–Z × 3 e não ser de rival. */
export function validarSigla(texto: string, siglasProibidas: readonly string[]): ResultadoSigla {
  if (typeof texto !== 'string') return { ok: false, motivo: 'caractere' };
  const sigla = texto.replace(/[a-z]/g, (c) => c.toUpperCase());
  if (!/^[A-Z]*$/.test(sigla)) return { ok: false, motivo: 'caractere' };
  if (sigla.length !== SIGLA_TAMANHO) return { ok: false, motivo: 'tamanho' };
  if (siglasProibidas.includes(sigla)) return { ok: false, motivo: 'rival' };
  return { ok: true, sigla };
}
