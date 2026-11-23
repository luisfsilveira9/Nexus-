// Ícones de linha da arte usados nas telas da NX-010 (assets/negocios/, assets/interface/).
import aulas from '../../assets/negocios/negocio_aulas-na-lan_linha.svg';
import patrocinio from '../../assets/negocios/negocio_patrocinio-local_linha.svg';
import camisa from '../../assets/negocios/negocio_camisa-oficial_linha.svg';
import canal from '../../assets/negocios/negocio_canal-do-clube_linha.svg';
import festa from '../../assets/negocios/negocio_festa-da-torcida_linha.svg';
import arena from '../../assets/negocios/negocio_arena-do-clube_linha.svg';
import abaClube from '../../assets/interface/aba_clube_linha.svg';
import abaNegocios from '../../assets/interface/aba_negocios_linha.svg';
import abaElenco from '../../assets/interface/aba_elenco_linha.svg';
import abaJornada from '../../assets/interface/aba_jornada_linha.svg';

/** Na ordem da tabela da RN-003. */
export const ICONES_NEGOCIO: readonly string[] = [aulas, patrocinio, camisa, canal, festa, arena];

export const ICONES_ABA = {
  clube: abaClube,
  negocios: abaNegocios,
  elenco: abaElenco,
  jornada: abaJornada,
} as const;
