// Casca do jogo (NX-010): aba aberta (T02 "Clube" ou T03 "Negócios"), seletor de lote, barra de
// abas e anúncio do Renatão. A barra de abas visível é o que faz o relógio de partida contar
// (RN-009); por isso ela aparece nas duas abas. Elenco e Jornada chegam na NX-011 e na NX-014.
import { useEffect, useState } from 'react';
import { textosNegocios } from '../content/negocios.ts';
import { textosPrincipal } from '../content/principal.ts';
import type { Estado } from '../engine/motor.ts';
import { type Lote, haNegocioNovo, negocioNovo } from '../engine/negocios.ts';
import { NEGOCIOS } from '../engine/regras.ts';
import type { Jogo } from '../app/jogo.ts';
import { useReduzirAnimacoes } from './efeitos.ts';
import { ICONES_ABA } from './icones.ts';
import { Icone } from './Icone.tsx';
import { Negocios } from './Negocios.tsx';
import { Principal } from './Principal.tsx';
import css from './jogo.module.css';

export type Aba = 'clube' | 'negocios';

/** Anúncio de negócio novo fica 3 s (fluxo NX-010; tokens.md §10). */
export const ANUNCIO_MS = 3000;

const cls = (...nomes: (string | false | undefined)[]) => nomes.filter(Boolean).join(' ');

export function TelaJogo({
  jogo,
  estado,
  anuncio,
}: {
  jogo: Jogo;
  estado: Estado;
  anuncio: number | null;
}) {
  const reduzir = useReduzirAnimacoes();
  const [aba, setAba] = useState<Aba>('clube');
  const [lote, setLote] = useState<Lote>('x1');
  const [pulso, setPulso] = useState(0);
  // Selo "Novo" desta visita à aba: os que eram novos ao abrir e os que aparecerem enquanto ela
  // estiver aberta. Abrir a aba tira o selo das próximas visitas (fluxo NX-010).
  const [novosDaVisita, setNovosDaVisita] = useState<ReadonlySet<number>>(new Set());

  const novosAgora = NEGOCIOS.map((_, i) => i).filter((i) => negocioNovo(estado, i));
  const novos = new Set([...novosDaVisita, ...novosAgora]);

  const irPara = (destino: Aba) => {
    if (destino === aba) return;
    if (destino === 'negocios') setNovosDaVisita(new Set(novosAgora));
    else setNovosDaVisita(new Set());
    jogo.verNegocios(); // ao entrar e ao sair da aba Negócios
    setPulso(0); // o pulso da compra não se repete ao trocar de aba
    setAba(destino);
  };

  const aoComprar = () => setPulso((p) => p + 1);

  return (
    <div className={css.jogo}>
      {aba === 'clube' ? (
        <Principal
          jogo={jogo}
          estado={estado}
          reduzir={reduzir}
          pulso={pulso}
          aoComprar={aoComprar}
        />
      ) : (
        <Negocios
          jogo={jogo}
          estado={estado}
          lote={lote}
          aoMudarLote={setLote}
          novos={novos}
          reduzir={reduzir}
          pulso={pulso}
          aoComprar={aoComprar}
        />
      )}
      <Abas aba={aba} irPara={irPara} novidade={aba !== 'negocios' && haNegocioNovo(estado)} />
      {anuncio !== null && (
        <Anuncio
          key={`${anuncio}-${estado.visiveis.filter(Boolean).length}`}
          indice={anuncio}
          emNegocios={aba === 'negocios'}
          aoFechar={jogo.fecharAnuncio}
        />
      )}
    </div>
  );
}

function Abas({
  aba,
  irPara,
  novidade,
}: {
  aba: Aba;
  irPara: (a: Aba) => void;
  novidade: boolean;
}) {
  const t = textosPrincipal.abas;
  const itens = [
    { id: 'clube', ativo: true },
    { id: 'negocios', ativo: true },
    { id: 'elenco', ativo: false }, // NX-011
    { id: 'jornada', ativo: false }, // NX-014
  ] as const;
  return (
    <nav className={css.abas} data-testid="abas" aria-label={t.rotulo}>
      {itens.map(({ id, ativo }) => {
        const atual = id === aba;
        const comNovidade = id === 'negocios' && novidade;
        return (
          <button
            key={id}
            type="button"
            className={cls(css.aba, atual && css.abaAtiva, !ativo && css.abaInativa)}
            data-testid={`aba-${id}`}
            aria-current={atual ? 'page' : undefined}
            aria-disabled={!ativo || undefined}
            aria-label={comNovidade ? t.novidadeAcessivel.replace('{aba}', t[id]) : undefined}
            onClick={() => {
              if (ativo) irPara(id);
            }}
          >
            <Icone src={ICONES_ABA[id]} />
            <span>
              {t[id]}
              {comNovidade && (
                <span className={css.novidade} data-testid="aba-negocios-novo" aria-hidden="true">
                  {' '}
                  {t.novidade}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

/** Aviso de 1 linha do Renatão quando um negócio fica visível (RN-003), por 3 s. */
function Anuncio({
  indice,
  emNegocios,
  aoFechar,
}: {
  indice: number;
  emNegocios: boolean;
  aoFechar: () => void;
}) {
  useEffect(() => {
    const id = setTimeout(aoFechar, ANUNCIO_MS);
    return () => clearTimeout(id);
  }, [aoFechar]);
  const t = textosNegocios;
  return (
    <div
      className={cls(css.anuncio, emNegocios ? css.anuncioNegocios : css.anuncioClube)}
      role="status"
      data-testid="anuncio-negocio"
      data-negocio={NEGOCIOS[indice].id}
      onClick={aoFechar} // some em 3 s ou com um toque
    >
      {t.anuncio.replace('{fala}', t.anuncios[indice])}
    </div>
  );
}
