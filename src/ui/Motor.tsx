import { useState } from 'react';
import { runCalibration, TARGETS, type CalibResult } from '@/game/calibrate';
import { Seg } from './common';
import { Ic } from './icons';

const RULES: [string, string][] = [
  ['Draft', 'Fearless em todas as séries; First Selection: quem tem prioridade escolhe lado ou ordem de pick (jogo 1: melhor semente; depois, quem perdeu).'],
  ['Objetivos', 'Sem Atakhan e sem Feats of Strength. Barão às 20:00 (850 de ouro no total, buff de cerco), Ancião 850. Dragão 75 de ouro + Dragon Vengeance (15/30/45%) para quem está atrás.'],
  ['Torres', 'Placas permanentes nas torres externas, internas e do inibidor (120 cada). Primeira torre +300. Crystalline Overgrowth: torre sem defensor toma dano extra.'],
  ['Abates', '300 de ouro, First Blood +100. Abate repetido na mesma vítima vale menos; sequências viram recompensa.'],
  ['Role Quests', 'Topo nível 20 + TP potencializado · Selva Smite evoluído · Meio botas T3 e recall rápido · Atirador +300 e 7º slot · Suporte control wards guardadas.'],
  ['Ganks', 'Trilha do caçador até 15:00: 3 a 5 ganks por caçador. Resultado: abate, Flash queimado, pressão, nada ou gank punido; counter-gank mais provável no meio e na janela dos buffs.'],
  ['Mapa', 'Lado azul +1 nas disputas de Barão, Arauto e Larvas; lado vermelho +1 no Dragão. Spawns de dragão (5:00), Larvas (8:00) e Arauto (15:00) não confirmados em fonte primária.'],
];

export function Motor() {
  const [n, setN] = useState(500);
  const [res, setRes] = useState<CalibResult | null>(null);
  const [busy, setBusy] = useState(false);
  const run = () => { setBusy(true); setTimeout(() => { setRes(runCalibration(n)); setBusy(false); }, 30); };
  const ok = res ? TARGETS.filter(t => res.values[t.key] >= t.lo && res.values[t.key] <= t.hi).length : 0;
  return <>
    <div className="panel-gold" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="sec-h"><h2>Calibração do motor</h2><span className="cap gold">Splits 1 e 2 · 2026</span></div>
      <p className="tc-d" style={{ margin: 0 }}>Roda partidas completas entre times do CBLOL, sem interface, e compara com o competitivo de 2026 (gol.gg, Oracle's Elixir/LPL, LoL Esports). A faixa verde é o alvo; o traço é o valor simulado.</p>
      <Seg value={n} opts={[[200, '200 jogos'], [500, '500 jogos'], [1500, '1.500 jogos']]} onChange={setN} />
      <button className="btn btn-primary" style={{ flex: 'none' }} disabled={busy} onClick={run}><Ic n="Gauge" /> {busy ? 'Simulando…' : res ? 'Rodar de novo' : 'Rodar calibração'}</button>
      {res && <span className="cap" style={{ textAlign: 'center' }}>{ok} de {TARGETS.length} métricas dentro do alvo · {res.n} partidas</span>}
    </div>
    {res && <div className="panel">{TARGETS.map(t => {
      const v = res.values[t.key], lo = Math.min(t.lo, v) * 0.85, hi = Math.max(t.hi, v) * 1.1, pos = (x: number) => `${100 * (x - lo) / (hi - lo)}%`;
      const inT = v >= t.lo && v <= t.hi;
      return <div className="calrow" key={t.key}>
        <span>{t.label}</span><b style={{ color: inT ? 'var(--gold-1)' : 'var(--red)' }}>{v.toFixed(t.unit === '%' ? 0 : 1).replace('.', ',')}{t.unit === '%' ? '%' : t.unit ? ' ' + t.unit : ''}</b>
        <div className="calbar"><span className="zone" style={{ left: pos(t.lo), width: `calc(${pos(t.hi)} - ${pos(t.lo)})` }} /><span className="pin" style={{ left: pos(v) }} /></div>
        <small>{inT ? '✓ ' : '✗ fora · '}alvo {t.lo}–{t.hi}{t.unit === '%' ? '%' : ''} · {t.src}</small>
      </div>; })}</div>}
    <div className="panel" style={{ padding: '12px 14px' }}>
      <div className="sec-h" style={{ marginBottom: 6 }}><h2 style={{ fontSize: 15 }}>Regras de 2026 no motor</h2><span className="cap">Patch 26.1</span></div>
      <ul className="rules" style={{ margin: 0, paddingLeft: 18 }}>{RULES.map(([k, v]) => <li key={k}><b>{k}.</b> {v}</li>)}</ul>
    </div>
    <p className="foot">Ganks não aparecem em nenhuma estatística pública do competitivo; a âncora é a análise de playoffs da LPL (~3,5 ganks por jogo, 43,6% com abate). Os demais alvos vêm dos dados de 2026.</p>
  </>;
}
