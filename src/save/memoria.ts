// C8 do ADR-002: armazenamento em memória com falhas simuláveis, para os testes (CT-506 a CT-513)
// e para o console de debug do build de teste.

import { type ArmazenamentoSave, ErroArmazenamento, ErroSemEspaco } from './armazenamento.ts';

export type Corrupcao = 'truncar' | 'lixo' | 'vazio' | 'byte';

export interface FalhasSimuladas {
  /** Toda gravação lança `ErroSemEspaco` sem mudar nada (QuotaExceededError). */
  cotaCheia: boolean;
  /** A próxima gravação escreve só metade do texto e lança erro (falha no meio da escrita). */
  falharNoMeio: boolean;
  /** Toda leitura lança `ErroArmazenamento` (armazenamento inacessível). */
  leituraFalha: boolean;
}

export class ArmazenamentoMemoria implements ArmazenamentoSave {
  readonly dados = new Map<string, string>();
  readonly falhas: FalhasSimuladas = { cotaCheia: false, falharNoMeio: false, leituraFalha: false };
  /** Quantas gravações completas aconteceram, por chave (para conferir slots alternados). */
  readonly gravacoes: string[] = [];

  constructor(inicial: Record<string, string> = {}) {
    for (const [k, v] of Object.entries(inicial)) this.dados.set(k, v);
  }

  ler(chave: string): string | null {
    if (this.falhas.leituraFalha) throw new ErroArmazenamento('leitura falhou (simulado)');
    return this.dados.get(chave) ?? null;
  }

  gravar(chave: string, valor: string): void {
    if (this.falhas.cotaCheia) throw new ErroSemEspaco();
    if (this.falhas.falharNoMeio) {
      this.falhas.falharNoMeio = false;
      this.dados.set(chave, valor.slice(0, Math.floor(valor.length / 2)));
      throw new ErroArmazenamento('gravação interrompida (simulado)');
    }
    this.dados.set(chave, valor);
    this.gravacoes.push(chave);
  }

  /** Estraga o conteúdo de uma chave do jeito pedido. */
  corromper(chave: string, modo: Corrupcao): void {
    const v = this.dados.get(chave) ?? '';
    if (modo === 'vazio') this.dados.set(chave, '');
    else if (modo === 'truncar') this.dados.set(chave, v.slice(0, Math.floor(v.length / 2)));
    else if (modo === 'lixo') this.dados.set(chave, '\u0000ÿ%%nao-e-json%%\u0007');
    else {
      // Troca 1 dígito do campo de ouro sem refazer o checksum (CT-508).
      const i = v.indexOf('"ouro":') + '"ouro":'.length;
      const c = v[i];
      this.dados.set(chave, v.slice(0, i) + (c === '9' ? '8' : '9') + v.slice(i + 1));
    }
  }
}
