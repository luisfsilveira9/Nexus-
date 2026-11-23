// T03 "Negócios" (NX-010): wireframe docs/ux/wireframes/T03-negocios.html.
// Cabeçalho 48 · lista rolável (única rolagem do loop) · seletor de lote fixo 64 · abas 64.
// Só os negócios visíveis aparecem (RN-003). Botão segue o valor real (Convenções), nunca o exibido.
import { useState } from 'react';
import moeda from '../../assets/recursos/recurso_ouro_cor.svg';
import { textosNegocios } from '../content/negocios.ts';
import { textosPrincipal } from '../content/principal.ts';
import { formatar } from '../engine/formato.ts';
import { type Estado, renda } from '../engine/motor.ts';
import {
  type Lote,
  QUANTIDADE_DO_LOTE,
  negociosVisiveis,
  oferta,
  progressoMarco,
  rendaDoNegocio,
  rendaPorUnidade,
} from '../engine/negocios.ts';
import { MARCO_NEGOCIO, NEGOCIOS } from '../engine/regras.ts';
import type { Jogo } from '../app/jogo.ts';
import { ALVO_MOEDA, voarMoeda } from './efeitos.ts';
import { ICONES_NEGOCIO } from './icones.ts';
import { Icone } from './Icone.tsx';
import { comNos } from './texto.tsx';
import css from './jogo.module.css';

const cls = (...nomes: (string | false | undefined)[]) => nomes.filter(Boolean).join(' ');

/** "dobrou!" fica 3 s na linha (fluxo NX-010, "Marco de 50"). */
export const DOBROU_MS = 3000;

export function Negocios({
  jogo,
  estado,
  lote,
  aoMudarLote,
  novos,
  reduzir,
  pulso,
  aoComprar,
}: {
  jogo: Jogo;
  estado: Estado;
  lote: Lote;
  aoMudarLote: (l: Lote) => void;
  /** Índices com selo "Novo" nesta visita à aba. */
  novos: ReadonlySet<number>;
  reduzir: boolean;
  pulso: number;
  aoComprar: () => void;
}) {
  const t = textosNegocios;
  const visiveis = negociosVisiveis(estado);
  const [dobrou, setDobrou] = useState<ReadonlySet<number>>(new Set());

  const marcarDobrou = (i: number) => {
    setDobrou((s) => new Set(s).add(i));
    setTimeout(
      () =>
        setDobrou((s) => {
          const n = new Set(s);
          n.delete(i);
          return n;
        }),
      DOBROU_MS,
    );
  };

  return (
    <main className={css.negocios} data-testid="negocios-tela">
      <header className={css.cabecalho}>
        <h1 className={css.titulo}>{t.tela.titulo}</h1>
        <span className={cls(css.rotulo, css.numero, css.resumo)}>
          <img className={css.moedaPequena} src={moeda} alt="" {...{ [ALVO_MOEDA]: '' }} />
          {comNos(t.tela.resumo, {
            ouro: (
              <span
                key={pulso}
                className={cls(pulso > 0 && !reduzir && css.pulso)}
                data-testid="ouro"
              >
                {formatar(estado.ouro, 'baixo')}
              </span>
            ),
            renda: (
              <span data-testid="renda">
                {comNos(textosPrincipal.renda, { valor: formatar(renda(estado), 'baixo') })}
              </span>
            ),
          })}
        </span>
      </header>

      <div className={css.lista} data-testid="negocios-lista">
        {visiveis.map((i) => (
          <LinhaNegocio
            key={NEGOCIOS[i].id}
            jogo={jogo}
            estado={estado}
            i={i}
            lote={lote}
            novo={novos.has(i)}
            dobrou={dobrou.has(i)}
            reduzir={reduzir}
            aoComprar={(marcos) => {
              if (marcos > 0) marcarDobrou(i);
              aoComprar();
            }}
          />
        ))}
        {visiveis.length < NEGOCIOS.length && (
          <p className={cls(css.apoio, css.maisNegocios)} data-testid="negocios-mais">
            {t.tela.maisNegocios}
          </p>
        )}
      </div>

      <div className={css.lote} data-testid="lote" role="group" aria-label={t.lote.rotulo}>
        {(['x1', 'x10', 'max'] as const).map((l) => (
          <button
            key={l}
            type="button"
            className={cls(css.segmento, l === lote && css.segmentoAtivo)}
            aria-pressed={l === lote}
            data-testid={`lote-${l}`}
            onClick={() => aoMudarLote(l)}
          >
            {t.lote[l]}
          </button>
        ))}
      </div>
    </main>
  );
}

function LinhaNegocio({
  jogo,
  estado,
  i,
  lote,
  novo,
  dobrou,
  reduzir,
  aoComprar,
}: {
  jogo: Jogo;
  estado: Estado;
  i: number;
  lote: Lote;
  novo: boolean;
  dobrou: boolean;
  reduzir: boolean;
  aoComprar: (marcos: number) => void;
}) {
  const t = textosNegocios;
  const id = NEGOCIOS[i].id;
  const n = estado.negocios[i];
  const o = oferta(estado, i, lote);
  const marco = progressoMarco(n);
  const tid = (s: string) => `negocio-${id}-${s}`;
  const rotuloBotao =
    lote === 'max'
      ? comNos(t.botao.max, { k: <span data-testid={tid('max-k')}>{o.quantidade}</span> })
      : t.botao[lote];

  return (
    <article className={css.linha} data-testid={`negocio-${id}`} aria-label={t.nomes[i]}>
      <div className={css.linhaTopo}>
        <span className={cls(css.azulejo, css.azulejoPequeno, dobrou && css.anel)}>
          <Icone src={ICONES_NEGOCIO[i]} tamanho={24} />
          {novo && (
            <span className={css.selo} data-testid={tid('novo')}>
              {t.tela.novo}
            </span>
          )}
        </span>
        <span className={css.cartaoTexto}>
          <span className={cls(css.rotulo, css.corta)} data-testid={tid('nome')}>
            {t.nomes[i]}
          </span>
          {/* Sem corte: "Máx compraria k" e "dobrou!" quebram para a 2ª linha (fluxo NX-010). */}
          <span className={cls(css.apoio, css.numero)}>
            {comNos(n > 0 ? t.tela.linha : t.tela.linhaZero, {
              n: <span data-testid={tid('quantidade')}>{formatar(n, 'baixo')}</span>,
              renda: (
                <span data-testid={tid('renda')}>
                  {formatar(
                    n > 0 ? rendaDoNegocio(estado, i) : rendaPorUnidade(estado, i),
                    'baixo',
                  )}
                </span>
              ),
            })}
            {o.maxCompraria > 0 &&
              comNos(t.tela.maxCompraria, {
                k: <span data-testid={tid('max-compraria')}>{o.maxCompraria}</span>,
              })}
            {dobrou && (
              <span className={css.dobrou} data-testid={tid('dobrou')}>
                {t.tela.dobrou}
              </span>
            )}
          </span>
        </span>
        <button
          type="button"
          className={cls(css.botaoCompra, css.botaoLinha, o.pode ? css.primario : css.desabilitado)}
          data-testid={tid('comprar')}
          aria-disabled={!o.pode}
          onClick={(ev) => {
            if (!o.pode) return;
            const alvo = ev.currentTarget;
            const r = jogo.comprarNegocio(i, QUANTIDADE_DO_LOTE[lote]);
            if (!r) return;
            voarMoeda(alvo, moeda, reduzir);
            aoComprar(r.marcos);
          }}
        >
          {o.pode ? (
            <>
              <span>{rotuloBotao}</span>
              <small className={css.numero}>
                <img src={moeda} alt="" aria-hidden="true" />
                <span data-testid={tid('custo')}>{formatar(o.custo, 'cima')}</span>
              </small>
            </>
          ) : (
            <>
              <span>{t.botao.faltam}</span>
              <small className={css.numero}>
                <span data-testid={tid('faltam')}>{formatar(o.faltam, 'cima')}</span>
              </small>
            </>
          )}
        </button>
      </div>
      <div className={css.linhaMarco}>
        <span
          className={css.barra}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={MARCO_NEGOCIO}
          aria-valuenow={marco.feitos}
        >
          <i style={{ transform: `scaleX(${marco.fracao})` }} />
        </span>
        <span className={cls(css.apoio, css.numero)} data-testid={tid('marco')}>
          {comNos(t.tela.marco, {
            feitos: <span data-testid={tid('marco-feitos')}>{marco.feitos}</span>,
            faltam: <span data-testid={tid('marco-faltam')}>{marco.faltam}</span>,
          })}
        </span>
      </div>
    </article>
  );
}
