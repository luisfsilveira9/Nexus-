// Raiz da UI: lê a vista do jogo com useSyncExternalStore (ADR-002) e escolhe a tela.
// Ordem da RN-018/RN-011: avisos de save (T12) vêm antes de qualquer outra tela.
import { useSyncExternalStore } from 'react';
import type { Jogo } from '../app/jogo.ts';
import {
  AvisoSemEspaco,
  Carregando,
  ConfirmarClubeNovo,
  SaveIlegivel,
  SaveRecuperado,
} from './Telas.tsx';
import { TelaJogo } from './TelaJogo.tsx';

export function App({ jogo }: { jogo: Jogo }) {
  const vista = useSyncExternalStore(jogo.assinar, jogo.vista, jogo.vista);
  return (
    <>
      {vista.avisoSemEspaco && <AvisoSemEspaco jogo={jogo} vista={vista} />}
      {vista.tela === 'carregando' && <Carregando />}
      {vista.tela === 'recuperado' && <SaveRecuperado jogo={jogo} vista={vista} />}
      {vista.tela === 'nenhumValido' && <SaveIlegivel jogo={jogo} vista={vista} />}
      {vista.tela === 'confirmarNovo' && <ConfirmarClubeNovo jogo={jogo} />}
      {vista.tela === 'jogo' && vista.estado && (
        <TelaJogo jogo={jogo} estado={vista.estado} anuncio={vista.anuncios[0] ?? null} />
      )}
    </>
  );
}
