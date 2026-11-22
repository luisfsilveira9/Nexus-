// Telas da NX-015: T00 (carregando), T12a (save recuperado), T12b (nenhum save válido),
// T12c (confirmar clube novo), A05 (sem espaço) e a tela principal mínima. A T02 completa vem na
// NX-010. Textos de src/content/; números pela RN-017 (src/engine/formato.ts), todos com data-testid.
import { useEffect, useState } from 'react';
import escudo from '../../assets/marca/escudo_faisca_padrao.svg';
import botaoLive from '../../assets/interface/botao_fazer-live_cor.svg';
import moeda from '../../assets/recursos/recurso_ouro_cor.svg';
import { textos } from '../content/textos.ts';
import { formatar } from '../engine/formato.ts';
import {
  type Estado,
  custoNegocio,
  faltam,
  ouroPorToque,
  podePagar,
  renda,
  rendaNegocio,
} from '../engine/motor.ts';
import { DIVISOES, NEGOCIOS, OURO_INICIAL } from '../engine/regras.ts';
import type { Jogo, Vista } from '../app/jogo.ts';
import { comNos, haQuanto, quandoFoi } from './texto.tsx';
import css from './telas.module.css';

const cls = (...nomes: (string | false | undefined)[]) => nomes.filter(Boolean).join(' ');

export function Carregando() {
  const [demorado, setDemorado] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setDemorado(true), 3000);
    return () => clearTimeout(id);
  }, []);
  return (
    <main className={cls(css.tela, css.centro)} data-testid="carregando-tela">
      <img className={css.escudo} src={escudo} alt="" />
      <p className={css.corpo}>{textos.carregando.titulo}</p>
      {demorado && <p className={css.apoio}>{textos.carregando.demorado}</p>}
    </main>
  );
}

export function SaveRecuperado({ jogo, vista }: { jogo: Jogo; vista: Vista }) {
  const t = textos.recuperado;
  const quando = vista.recuperadoSalvoEm ?? vista.paredeMs;
  return (
    <main className={cls(css.tela, css.centro)} data-testid="save-recuperado">
      <img className={css.escudo} src={escudo} alt="" />
      <section className={css.painel} role="alertdialog" aria-labelledby="t12a-titulo">
        <h1 className={cls(css.titulo, css.aviso)} id="t12a-titulo">
          <span aria-hidden="true">⚠ </span>
          {t.titulo}
        </h1>
        <p className={css.corpo}>
          {comNos(t.corpo, {
            quando: (
              <span className={css.numero} data-testid="save-recuperado-quando">
                {quandoFoi(quando, vista.paredeMs)}
              </span>
            ),
          })}
        </p>
        <p className={css.apoio}>{t.perda}</p>
        <div className={css.acoes}>
          <button
            type="button"
            className={cls(css.botao, css.primario)}
            data-testid="save-recuperado-continuar"
            onClick={() => jogo.continuar()}
          >
            {t.continuar}
          </button>
        </div>
      </section>
    </main>
  );
}

export function SaveIlegivel({ jogo, vista }: { jogo: Jogo; vista: Vista }) {
  const t = textos.ilegivel;
  const deNovo = vista.tentativas > 1;
  return (
    <main className={cls(css.tela, css.centro)} data-testid="save-ilegivel">
      <img className={css.escudo} src={escudo} alt="" />
      <section className={css.painel} role="alertdialog" aria-labelledby="t12b-titulo">
        <h1 className={cls(css.titulo, css.aviso)} id="t12b-titulo">
          <span aria-hidden="true">⚠ </span>
          {deNovo ? t.tituloDeNovo : t.titulo}
        </h1>
        <p className={css.corpo}>
          {deNovo
            ? comNos(t.corpoDeNovo, {
                n: (
                  <span className={css.numero} data-testid="save-ilegivel-tentativa">
                    {vista.tentativas}
                  </span>
                ),
              })
            : t.corpo}
        </p>
        {!deNovo && <p className={css.apoio}>{t.apoio}</p>}
        <div className={css.acoes}>
          <button
            type="button"
            className={cls(css.botao, css.secundario)}
            data-testid="save-ilegivel-tentar"
            onClick={() => jogo.tentarDeNovo()}
          >
            {t.tentarDeNovo}
          </button>
          <button
            type="button"
            className={cls(css.botao, css.secundario)}
            data-testid="save-ilegivel-novo"
            onClick={() => jogo.pedirClubeNovo()}
          >
            {t.comecarNovo}
          </button>
        </div>
        <button
          type="button"
          className={cls(css.botao, css.secundario, css.pequeno)}
          data-testid="save-ilegivel-exportar"
          onClick={() => jogo.abrirExportarIlegivel()}
        >
          {t.exportar}
        </button>
        {vista.exportarTexto !== null && (
          <>
            <label className={css.apoio} htmlFor="t12b-texto">
              {t.exportarRotulo}
            </label>
            <textarea
              id="t12b-texto"
              className={css.textoExportar}
              data-testid="save-ilegivel-texto"
              readOnly
              value={vista.exportarTexto}
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              type="button"
              className={cls(css.botao, css.secundario, css.pequeno)}
              data-testid="save-ilegivel-fechar-texto"
              onClick={() => jogo.fecharExportar()}
            >
              {t.fecharExportar}
            </button>
          </>
        )}
      </section>
    </main>
  );
}

export function ConfirmarClubeNovo({ jogo }: { jogo: Jogo }) {
  const t = textos.confirmarNovo;
  return (
    <main className={cls(css.tela, css.centro)} data-testid="save-novo">
      <section className={css.painel} role="alertdialog" aria-labelledby="t12c-titulo">
        <h1 className={css.titulo} id="t12c-titulo">
          {t.titulo}
        </h1>
        <p className={css.corpo}>
          {comNos(t.corpo, {
            ouro: (
              <span className={css.numero} data-testid="save-novo-ouro">
                {formatar(OURO_INICIAL, 'baixo')}
              </span>
            ),
            legado: (
              <span className={css.numero} data-testid="save-novo-legado">
                {formatar(0, 'baixo')}
              </span>
            ),
          })}
        </p>
        <p className={css.apoio}>{t.apoio}</p>
        <div className={css.acoes}>
          <button
            type="button"
            className={cls(css.botao, css.secundario)}
            data-testid="save-novo-cancelar"
            onClick={() => jogo.cancelarClubeNovo()}
          >
            {t.cancelar}
          </button>
          <button
            type="button"
            className={cls(css.botao, css.primario)}
            data-testid="save-novo-confirmar"
            onClick={() => jogo.confirmarClubeNovo()}
          >
            {t.confirmar}
          </button>
        </div>
      </section>
    </main>
  );
}

export function AvisoSemEspaco({ jogo, vista }: { jogo: Jogo; vista: Vista }) {
  const t = textos.semEspaco;
  const quando = vista.ultimoSaveEm === null ? '' : haQuanto(vista.ultimoSaveEm, vista.paredeMs);
  return (
    <div className={css.faixaAviso} role="alert" data-testid="aviso-sem-espaco">
      <span aria-hidden="true" className={css.aviso}>
        ⚠
      </span>
      <p>
        {comNos(t.texto, {
          quando: <span data-testid="aviso-sem-espaco-quando">{quando}</span>,
        })}
      </p>
      <button
        type="button"
        className={css.fechar}
        aria-label={t.fechar}
        data-testid="aviso-sem-espaco-fechar"
        onClick={() => jogo.fecharAvisoSemEspaco()}
      >
        ✕
      </button>
    </div>
  );
}

/** Tela principal mínima: ouro, renda/s, a compra de "Aulas na lan" e o "Fazer live". */
export function Principal({ jogo, estado }: { jogo: Jogo; estado: Estado }) {
  const t = textos.principal;
  const i = 0; // "Aulas na lan" (RN-003: visível desde o início)
  const id = NEGOCIOS[i].id;
  const custo = custoNegocio(estado, i);
  const pode = podePagar(estado.ouro, custo);
  const rendaUnidade = rendaNegocio(i, 1) * DIVISOES[estado.div].mult;
  return (
    <main className={cls(css.tela, css.principal)} data-testid="principal-tela">
      <header className={css.topo}>
        <div className={css.ouro}>
          <img className={css.moeda} src={moeda} alt={t.ouro} />
          <span className={css.numero} data-testid="principal-ouro">
            {formatar(estado.ouro, 'baixo')}
          </span>
        </div>
        <div className={css.renda}>
          {comNos(t.renda, {
            valor: (
              <span className={css.numero} data-testid="principal-renda">
                {formatar(renda(estado), 'baixo')}
              </span>
            ),
          })}
        </div>
      </header>

      <section className={css.cartao} aria-label={t.proximaCompra}>
        <div className={css.cartaoTexto}>
          <span className={css.apoio}>{t.proximaCompra}</span>
          <span className={css.subtitulo}>{textos.negocios[i]}</span>
          <span className={css.apoio}>
            {comNos(t.tem, {
              n: (
                <span className={css.numero} data-testid={`negocio-${id}-quantidade`}>
                  {estado.negocios[i]}
                </span>
              ),
              renda: (
                <span className={css.numero} data-testid={`negocio-${id}-renda`}>
                  {formatar(rendaUnidade, 'baixo')}
                </span>
              ),
            })}
          </span>
        </div>
        <button
          type="button"
          className={cls(css.botao, css.botaoCompra, pode ? css.primario : css.desabilitado)}
          data-testid={`negocio-${id}-comprar`}
          aria-disabled={!pode}
          onClick={() => pode && jogo.comprarNegocio(i, 1)}
        >
          {pode ? (
            <>
              {t.comprar}{' '}
              <span className={css.numero} data-testid={`negocio-${id}-custo`}>
                {formatar(custo, 'cima')}
              </span>
            </>
          ) : (
            comNos(t.faltam, {
              valor: (
                <span className={css.numero} data-testid={`negocio-${id}-faltam`}>
                  {formatar(faltam(estado.ouro, custo), 'cima')}
                </span>
              ),
            })
          )}
        </button>
      </section>

      <section className={css.areaToque}>
        <button
          type="button"
          className={css.toque}
          data-testid="principal-fazer-live"
          aria-label={t.fazerLive}
          onClick={() => jogo.tocar()}
        >
          <img src={botaoLive} alt="" />
        </button>
        <span className={css.rotuloToque}>{t.fazerLive}</span>
        <span className={css.apoio}>
          {comNos(t.porToque, {
            valor: (
              <span className={css.numero} data-testid="principal-por-toque">
                {formatar(ouroPorToque(estado), 'baixo')}
              </span>
            ),
          })}
        </span>
      </section>
    </main>
  );
}
