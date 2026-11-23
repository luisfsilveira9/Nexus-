// T02 "Clube" (NX-010): wireframe docs/ux/wireframes/T02-principal.html e mockup da arte.
// Orçamento vertical: topo 48 · ouro 80 · split 120 · meta 72 · próxima compra 80 · toque 176
// (+ abas 64, em Abas.tsx) = 640 px. Números pela RN-017 (src/engine/formato.ts), cada um com
// data-testid (C6). A parte de partidas (trilha, nº do split, rival) e a meta vêm na NX-012/NX-016:
// aqui só o que o estado já tem (placar, chance, tempo até a próxima partida).
import { type MouseEvent, useRef, useState } from 'react';
import moeda from '../../assets/recursos/recurso_ouro_cor.svg';
import botaoLive from '../../assets/interface/botao_fazer-live_cor.svg';
import rastro from '../../assets/jogadores/jogador_rastro_feliz.svg';
import divVarzea from '../../assets/divisoes/divisao_varzea_emblema.svg';
import divAcesso from '../../assets/divisoes/divisao_acesso_emblema.svg';
import divAscensao from '../../assets/divisoes/divisao_ascensao_emblema.svg';
import divElite from '../../assets/divisoes/divisao_elite_emblema.svg';
import divContinental from '../../assets/divisoes/divisao_continental_emblema.svg';
import divMundial from '../../assets/divisoes/divisao_mundial_emblema.svg';
import { textosNegocios } from '../content/negocios.ts';
import { textosPrincipal } from '../content/principal.ts';
import {
  formatar,
  formatarMultiplicador,
  formatarPct,
  formatarRelogio,
  pctInteiro,
} from '../engine/formato.ts';
import {
  type Estado,
  ouroPorToque,
  partidasRestantes,
  pVitoriaAtual,
  renda,
} from '../engine/motor.ts';
import { oferta, proximaCompra, rendaPorUnidade } from '../engine/negocios.ts';
import { DIVISOES, NEGOCIOS } from '../engine/regras.ts';
import type { Jogo } from '../app/jogo.ts';
import { ALVO_MOEDA, voarMoeda } from './efeitos.ts';
import { ICONES_NEGOCIO } from './icones.ts';
import { Icone } from './Icone.tsx';
import { comNos } from './texto.tsx';
import css from './jogo.module.css';

const EMBLEMAS = [divVarzea, divAcesso, divAscensao, divElite, divContinental, divMundial];
const COR_DIVISAO = DIVISOES.map((d) => `var(--cor-divisao-${d.id})`);

const cls = (...nomes: (string | false | undefined)[]) => nomes.filter(Boolean).join(' ');

/** Faixas de rótulo da chance (proposta do UX, tokens.md §5): ≥ 60, 40–59, < 40. */
function rotuloChance(p: number) {
  const pct = pctInteiro(p);
  const t = textosPrincipal.split;
  if (pct >= 60) return { texto: t.favorito, classe: css.favorito };
  if (pct >= 40) return { texto: t.equilibrado, classe: css.equilibrado };
  return { texto: t.azarao, classe: css.azarao };
}

/** "+X" que sobe do ponto tocado (guia visual §9). */
interface Flutuante {
  id: number;
  x: number;
  y: number;
  texto: string;
}

export function Principal({
  jogo,
  estado,
  reduzir,
  pulso,
  aoComprar,
}: {
  jogo: Jogo;
  estado: Estado;
  reduzir: boolean;
  /** Muda a cada compra: o ouro e a renda dão um pulso (guia visual §9). */
  pulso: number;
  aoComprar: () => void;
}) {
  const t = textosPrincipal;
  const div = DIVISOES[estado.div];
  const r = renda(estado);
  const porToque = formatar(ouroPorToque(estado), 'baixo');
  const p = pVitoriaAtual(estado);
  const chance = rotuloChance(p);
  return (
    <main className={css.principal} data-testid="principal-tela">
      <div className={css.topo} data-testid="topo">
        <span
          className={css.chip}
          data-testid="divisao"
          style={{ borderColor: COR_DIVISAO[estado.div] }}
        >
          <img src={EMBLEMAS[estado.div]} alt="" aria-hidden="true" />
          {comNos(t.divisao, {
            divisao: <span data-testid="divisao-nome">{t.divisoes[estado.div]}</span>,
            mult: (
              <span className={css.numero} data-testid="divisao-mult">
                {formatarMultiplicador(div.mult)}
              </span>
            ),
          })}
        </span>
        {estado.legado > 0 && (
          <span className={css.chip} data-testid="legado-chip">
            {comNos(t.legado, {
              valor: (
                <span className={css.numero} data-testid="legado">
                  {formatar(estado.legado, 'baixo')}
                </span>
              ),
            })}
          </span>
        )}
      </div>

      <div className={css.blocoOuro}>
        <div className={css.linhaOuro}>
          <img className={css.moeda} src={moeda} alt={t.ouro} {...{ [ALVO_MOEDA]: '' }} />
          <span
            key={pulso}
            className={cls(css.heroi, css.numero, pulso > 0 && !reduzir && css.pulso)}
            data-testid="ouro"
          >
            {formatar(estado.ouro, 'baixo')}
          </span>
        </div>
        <span
          key={`r${pulso}`}
          className={cls(css.rendaLinha, css.numero, pulso > 0 && !reduzir && css.destaque)}
          data-testid="renda"
        >
          {comNos(t.renda, { valor: formatar(r, 'baixo') })}
        </span>
      </div>

      <section className={css.split} data-testid="split" aria-label={t.split.titulo}>
        <span className={css.entre}>
          <span className={css.rotulo}>{t.split.titulo}</span>
          <span className={cls(css.rotulo, css.numero)} data-testid="placar">
            {comNos(t.split.placar, {
              v: <span data-testid="placar-v">{estado.vitorias}</span>,
              d: <span data-testid="placar-d">{estado.derrotas}</span>,
              p: <span data-testid="placar-faltam">{partidasRestantes(estado)}</span>,
            })}
          </span>
        </span>
        <span className={css.entre}>
          <span className={css.apoio}>
            {comNos(t.split.proxima, {
              tempo: (
                <b className={css.numero} data-testid="proxima-partida">
                  {formatarRelogio(estado.proxPartida)}
                </b>
              ),
            })}
          </span>
          <span className={css.chanceBloco}>
            <span className={cls(css.chance, css.numero)} data-testid="chance">
              {comNos(t.split.chance, { pct: formatarPct(p) })}
            </span>
            <span className={cls(css.apoio, chance.classe)} data-testid="chance-rotulo">
              {chance.texto}
            </span>
          </span>
        </span>
      </section>

      {/* Meta atual: regras de prioridade na NX-012 e dicas na NX-016. Espaço reservado (72 px). */}
      <div className={css.meta} data-testid="meta" />

      <ProximaCompra jogo={jogo} estado={estado} reduzir={reduzir} aoComprar={aoComprar} />

      <ZonaToque jogo={jogo} porToque={porToque} reduzir={reduzir} />
    </main>
  );
}

function ProximaCompra({
  jogo,
  estado,
  reduzir,
  aoComprar,
}: {
  jogo: Jogo;
  estado: Estado;
  reduzir: boolean;
  aoComprar: () => void;
}) {
  const t = textosNegocios;
  const i = proximaCompra(estado);
  const o = oferta(estado, i, 'x1'); // a T02 compra sempre ×1 (fluxo NX-010)
  return (
    <div className={css.compra} data-testid="proxima-compra" data-negocio={NEGOCIOS[i].id}>
      <div className={css.cartao}>
        <span className={css.azulejo}>
          <Icone src={ICONES_NEGOCIO[i]} tamanho={28} />
        </span>
        <span className={css.cartaoTexto}>
          <span className={cls(css.apoio, css.corta)}>{t.proxima.rotulo}</span>
          <span className={cls(css.rotulo, css.corta)} data-testid="proxima-compra-nome">
            {t.nomes[i]}
          </span>
          <span className={cls(css.apoio, css.corta)}>
            {comNos(t.proxima.tem, {
              n: (
                <span className={css.numero} data-testid="proxima-compra-quantidade">
                  {formatar(estado.negocios[i], 'baixo')}
                </span>
              ),
              renda: (
                <span className={css.numero} data-testid="proxima-compra-renda">
                  {formatar(rendaPorUnidade(estado, i), 'baixo')}
                </span>
              ),
            })}
          </span>
        </span>
        <button
          type="button"
          className={cls(css.botaoCompra, o.pode ? css.primario : css.desabilitado)}
          data-testid="proxima-compra-comprar"
          aria-disabled={!o.pode}
          onClick={(ev) => {
            if (!o.pode) return;
            const alvo = ev.currentTarget;
            if (jogo.comprarNegocio(i, 1)) {
              voarMoeda(alvo, moeda, reduzir);
              aoComprar();
            }
          }}
        >
          {o.pode ? (
            <>
              <span>{t.proxima.comprar}</span>
              <small className={css.numero}>
                <img src={moeda} alt="" aria-hidden="true" />
                <span data-testid="proxima-compra-custo">{formatar(o.custo, 'cima')}</span>
              </small>
            </>
          ) : (
            <>
              <span>{t.botao.faltam}</span>
              <small className={css.numero}>
                <span data-testid="proxima-compra-faltam">{formatar(o.faltam, 'cima')}</span>
              </small>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function ZonaToque({
  jogo,
  porToque,
  reduzir,
}: {
  jogo: Jogo;
  porToque: string;
  reduzir: boolean;
}) {
  const t = textosPrincipal.toque;
  const zona = useRef<HTMLDivElement>(null);
  const proximoId = useRef(0);
  const [flutuantes, setFlutuantes] = useState<Flutuante[]>([]);

  const tocar = (ev: MouseEvent<HTMLButtonElement>) => {
    const r = jogo.tocar();
    // RN-005: toque ignorado não mostra nada (nem "+X", nem erro).
    if (!r?.aceito || reduzir || !zona.current) return;
    const caixa = zona.current.getBoundingClientRect();
    const botao = ev.currentTarget.getBoundingClientRect();
    // Teclado (detail 0) ou toque sem coordenadas: sai do topo do botão.
    const doPonto = ev.detail > 0 && (ev.clientX !== 0 || ev.clientY !== 0);
    const x = (doPonto ? ev.clientX : botao.left + botao.width / 2) - caixa.left;
    const y = (doPonto ? ev.clientY : botao.top + 24) - caixa.top;
    const id = ++proximoId.current;
    const texto = t.ganho.replace('{valor}', formatar(r.ouro, 'baixo'));
    setFlutuantes((f) => [...f, { id, x, y, texto }]);
  };

  return (
    <div className={css.zona} data-testid="zona-toque" ref={zona}>
      <span className={css.destaqueChibi} aria-hidden="true" data-testid="chibi-destaque">
        <img src={rastro} alt="" />
        <span className={css.chibiNome}>{textosPrincipal.destaque}</span>
      </span>
      <button
        type="button"
        className={css.toque}
        data-testid="botao-toque"
        aria-label={t.acessivel.replace('{valor}', porToque)}
        onClick={tocar}
      >
        <img src={botaoLive} alt="" aria-hidden="true" />
        <span className={css.toqueNome}>{t.rotulo}</span>
        <span className={cls(css.toquePor, css.numero)}>
          {comNos(t.porToque, { valor: <span data-testid="por-toque">{porToque}</span> })}
        </span>
      </button>
      {flutuantes.map((f) => (
        <span
          key={f.id}
          className={cls(css.flutua, css.numero)}
          style={{ left: f.x, top: f.y }}
          aria-hidden="true"
          data-testid="toque-ganho"
          onAnimationEnd={() => setFlutuantes((l) => l.filter((x) => x.id !== f.id))}
        >
          <img src={moeda} alt="" />
          {f.texto}
        </span>
      ))}
    </div>
  );
}
