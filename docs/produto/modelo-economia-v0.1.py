"""Modelo de economia do Nexus Idle v0.1 (estimativa do PO para as RN-002 a RN-014; a NX-007 valida com o simulador oficial).

Rodar: python3 modelo-economia-v0.1.py  (~1 min, 20 jogadores simulados por perfil)
"""
import math, random, sys

GER = [  # nome, custo base, renda/s por unidade
    ("Live do time", 10, 0.5),
    ("Patrocínio local", 150, 6),
    ("Loja de camisas", 2_000, 60),
    ("Canal de conteúdo", 30_000, 700),
    ("Fan fest", 500_000, 9_000),
    ("Arena própria", 8_000_000, 120_000),
]
G_CRESC = 1.15
MARCO = 50            # a cada 50 unidades, renda do gerador x2
J_BASE, J_CRESC = 50, 1.22      # custo de nível do jogador
P_BASE, P_CRESC = 10, 1.05      # poder por jogador
DIV = [  # nome, poder médio do rival, multiplicador de renda
    ("Amadora", 60, 1), ("Desafiante", 220, 2), ("Academy", 900, 4), ("Liga", 20_000, 8), ("Internacional", 170_000, 16), ("Mundial", 1_500_000, 32)]
TOP = 5
INTERVALO = 90        # s entre partidas (online)
PARTIDAS = 14; SOBE = 10; DESCE = 3
OFF_EFIC, OFF_LIM = 0.5, 8 * 3600
LEG_DIV = {2: 10, 3: 25, 4: 45, 5: 80}; LEG_R = 0.05; LEG_P = 0.01; PREST_MIN_DIV = 2
TOQUE = 0.1           # toque = 10% da renda/s (mín 1), até 5 toques/s
PREMIO_VIT = 60       # segundos de renda por vitória

def pwin(P, Padv):
    return min(0.95, max(0.05, 1 / (1 + math.exp(-6 * (P / Padv - 1)))))

class S:
    def __init__(s, legado=0):
        s.ouro = 10.0; s.n = [0] * len(GER); s.niv = [1] * 5; s.div = 0
        s.v = s.d = 0; s.jogos = 0; s.legado = legado; s.total = 0.0; s.maxdiv = 0; s.semsubir = 0
    def renda(s):
        r = sum(GER[i][2] * s.n[i] * 2 ** (s.n[i] // MARCO) for i in range(len(GER)))
        return r * DIV[s.div][2] * (1 + LEG_R * s.legado)
    def poder(s): return sum(P_BASE * P_CRESC ** (k - 1) for k in s.niv) * (1 + LEG_P * s.legado)
    def custo_g(s, i): return GER[i][1] * G_CRESC ** s.n[i]
    def custo_j(s, j): return J_BASE * J_CRESC ** (s.niv[j] - 1)
    def ganha(s, x): s.ouro += x; s.total += x
    def compra(s):
        while True:
            Padv = DIV[min(s.div + 1, TOP)][1] if s.v >= 0 else 0
            precisa = pwin(s.poder(), DIV[s.div][1]) < 0.78 and s.div < TOP
            j = min(range(5), key=s.custo_j)
            dr = [(GER[i][2] * 2 ** (s.n[i] // MARCO)) / s.custo_g(i) for i in range(len(GER))]
            i = max(range(len(GER)), key=lambda k: dr[k])
            if precisa and s.ouro >= s.custo_j(j): s.ouro -= s.custo_j(j); s.niv[j] += 1; continue
            if not precisa and s.custo_j(j) < s.custo_g(i) and s.ouro >= s.custo_j(j) and pwin(s.poder(), DIV[min(s.div+1,4)][1]) < 0.78:
                s.ouro -= s.custo_j(j); s.niv[j] += 1; continue
            if s.ouro >= s.custo_g(i) and not (precisa and s.custo_j(j) < s.custo_g(i) * 3):
                s.ouro -= s.custo_g(i); s.n[i] += 1; continue
            break
    def partida(s, rng):
        if rng.random() < pwin(s.poder(), DIV[s.div][1]): s.v += 1; s.ganha(PREMIO_VIT * s.renda())
        else: s.d += 1
        s.jogos += 1
        if s.v + s.d == PARTIDAS:
            antes = s.maxdiv
            if s.v >= SOBE and s.div < TOP: s.div += 1
            elif s.v <= DESCE and s.div > 0: s.div -= 1
            s.maxdiv = max(s.maxdiv, s.div); s.v = s.d = 0
            s.semsubir = 0 if s.maxdiv > antes else s.semsubir + 1

def roda(perfil, dias=7, seed=1, prestigia=True):
    rng = random.Random(seed); s = S(); t = 0; marcos = {}; prest = 0
    def marca(k):
        if k not in marcos: marcos[k] = t
    # perfil: lista de (online_s, offline_s) repetida
    def online(dur):
        nonlocal t, s, prest
        prox = INTERVALO
        for _ in range(int(dur)):
            t += 1; r = s.renda(); s.ganha(r + 5 * max(1, TOQUE * r) * (t < 600))
            prox -= 1
            if prox <= 0: s.partida(rng); prox = INTERVALO
            if t % 5 == 0: s.compra()
            for d in range(1, TOP + 1):
                if s.div >= d: marca(f"div{d}:{DIV[d][0]}")
            ganho = LEG_DIV.get(s.maxdiv, 0)
            if prestigia and s.maxdiv >= PREST_MIN_DIV and s.semsubir >= 3 and s.div < TOP:
                marca(f"prestigio{prest+1}"); prest += 1
                s = S(s.legado + ganho)
    def offline(dur):
        nonlocal t
        ef = min(dur, OFF_LIM); s.ganha(s.renda() * ef * OFF_EFIC)
        resta = PARTIDAS - (s.v + s.d)
        for _ in range(min(resta, int(ef // INTERVALO))): s.partida(rng)
        t += dur; s.compra()
    fim = dias * 86400
    for on, off in perfil(fim):
        if t >= fim: break
        online(on); offline(off)
        for k, v in [(7200, "2h"), (86400, "1d"), (7 * 86400, "1sem")]:
            if t >= k and f"estado_{v}" not in marcos:
                marcos[f"estado_{v}"] = (DIV[s.div][0], round(s.renda()), s.legado, prest, round(s.poder()))
    return marcos

def continuo(fim):
    while True: yield (3600, 0)
def tipico(fim):  # dia 1: 2 h seguidas; depois 6 sessões de 3 min por dia (a cada ~4 h, 8 h de sono)
    yield (7200, 3600 * 3)
    while True:
        for _ in range(5): yield (180, 3 * 3600)
        yield (180, 8 * 3600)

def fmt(x):
    if isinstance(x, tuple): return x
    h = x / 3600
    return f"{h*60:.0f} min" if h < 1 else (f"{h:.1f} h" if h < 48 else f"{h/24:.1f} d")

if __name__ == "__main__":
    for nome, p in [("contínuo", continuo), ("típico", tipico)]:
        res = [roda(p, seed=k) for k in range(20)]
        chaves = sorted({k for r in res for k in r}, key=lambda k: (not k.startswith("div"), k))
        print(f"== perfil {nome}")
        for k in chaves:
            vals = [r[k] for r in res if k in r]
            if isinstance(vals[0], tuple): print(f"  {k}: {vals[len(vals)//2]}  ({len(vals)}/20)")
            else: vals.sort(); print(f"  {k}: mediana {fmt(vals[len(vals)//2])}  ({len(vals)}/20 chegaram)")
