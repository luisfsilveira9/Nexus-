#!/usr/bin/env python3
"""Nexus Idle - NX-005 - gerador dos retratos chibi (busto) dos 5 jogadores e da mascote.

Dono: nexus-arte. Todos os desenhos são originais, feitos aqui com formas geométricas.
Uso (na raiz do repositório):  python3 docs/arte/gerar-chibi.py
Gera assets/jogadores/jogador_<nome>_<expressao>.svg e assets/mascote/mascote_dona-cel_<expressao>.svg.

Por que um gerador: a família chibi tem UMA base (cabeça, olhos, ombros, contorno, sombra).
Mudar a base aqui muda todos os personagens juntos, e eles continuam coerentes.

Grade: viewBox 0 0 120 120 (busto). Cabeça = 70 x 68 px (~57% da altura do busto):
num corpo inteiro isso dá ~2,5 cabeças de altura. Contorno 3 px (2,5% da altura).
"""
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
CONTORNO = '#101828'
def traco(w=3):
    return f'stroke="{CONTORNO}" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="round"'


TRACO = traco()
CAMISA = '#1D2A45'        # camisa do clube (noite-800)
CAMISA_SOMBRA = '#141E33'  # 1 tom de sombra (cel shading)
GOLA = '#FF7A2F'           # brasa
BOCHECHA = '#FF8A7A'

# Ícones de função (mesmos traços de assets/funcoes/*.svg), estampados no peito
FUNCAO = {
    'topo': '<path d="M2 20 9 6.5l4.2 7.2 2.6-3.7L22 20z"/>',
    'selva': '<path d="M4 20C4 11 9.5 4 20 4c0 10.5-7 16-16 16zm0 0L15 9"/>',
    'meio': '<path d="M12 2.5 21.5 12 12 21.5 2.5 12z"/>',
    'atirador': '<circle cx="12" cy="12" r="7"/><path d="M12 2.5V7m0 10v4.5M2.5 12H7m10 0h4.5"/>',
    'suporte': '<path d="M12 2.5 20 5.5v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10v-6z"/>',
}


def ombros(cor=CAMISA, sombra=CAMISA_SOMBRA, largura=0):
    """Ombros e camisa. largura > 0 alarga (Pedra é o mais largo)."""
    l, r = 14 - largura, 106 + largura
    return (f'<path fill="{cor}" {TRACO} d="M{l} 121C{l+2} 101 30 92 60 92s{r-62} 9 {r-60} 29z"/>'
            f'<path fill="{sombra}" d="M60 93.5c22 0 {r-62} 8 {r-61.5} 26H74c2-12 0-20-14-26z"/>')


def gola_e_funcao(funcao):
    ic = FUNCAO[funcao]
    return (f'<path fill="none" stroke="{GOLA}" stroke-width="4" stroke-linecap="round" d="M46 93.5q14 10 28 0"/>'
            f'<g transform="translate(76 101) scale(.62)" fill="none" stroke="#FFA06B" stroke-width="3" '
            f'stroke-linecap="round" stroke-linejoin="round">{ic}</g>')


def cabeca(pele, sombra):
    return (f'<rect x="52" y="78" width="16" height="18" rx="4" fill="{sombra}" {TRACO}/>'
            f'<circle cx="25" cy="58" r="7" fill="{pele}" {TRACO}/><circle cx="95" cy="58" r="7" fill="{pele}" {TRACO}/>'
            f'<ellipse cx="60" cy="54" rx="35" ry="34" fill="{pele}" {TRACO}/>'
            # sombra de 1 tom no lado direito e embaixo do queixo (luz vem da esquerda, de cima)
            f'<path fill="{sombra}" d="M88 40c6 14 3 32-10 41-5 3.5-11 5-18 5.4 14-3 25-14 28-46z"/>')


def olhos(iris, expr):
    """Olhos grandes: 13 x 16 px (~19% da largura da cabeça cada)."""
    if expr == 'comemorando':  # olhos fechados de alegria (^ ^)
        return (f'<path fill="none" {traco(3.5)} d="M38.5 60q6.5-8 13 0M68.5 60q6.5-8 13 0"/>')
    ry = 8 if expr != 'focado' else 6
    cy = 58 if expr != 'focado' else 59.5
    s = ''
    for cx in (45, 75):
        s += (f'<ellipse cx="{cx}" cy="{cy}" rx="6.5" ry="{ry}" fill="#1B1530"/>'
              f'<ellipse cx="{cx}" cy="{cy+1.8}" rx="4.4" ry="{ry-2.6}" fill="{iris}"/>'
              f'<ellipse cx="{cx}" cy="{cy+1.2}" rx="2.1" ry="{(ry-2.6)/2:.1f}" fill="#1B1530"/>'
              f'<circle cx="{cx+2.2}" cy="{cy-3.2}" r="2.4" fill="#fff"/><circle cx="{cx-2.4}" cy="{cy+3.4}" r="1.1" fill="#fff"/>')
    if expr == 'focado':  # pálpebra reta por cima: olhar de concentração
        s += f'<path fill="none" {TRACO} d="M37.5 54.5h15M67.5 54.5h15"/>'
    return s


def sobrancelhas(expr, cor):
    d = {
        'feliz': 'M39 46q6-3.5 12-.5M69 45.5q6-3 12 .5',
        'focado': 'M39 45l12 4M81 45l-12 4',
        'comemorando': 'M39 45q6-4.5 12-1.5M69 43.5q6-3 12 1.5',
        'frustrado': 'M39 47.5l12-4M81 47.5l-12-4',
    }[expr]
    return f'<path fill="none" stroke="{cor}" stroke-width="3" stroke-linecap="round" d="{d}"/>'


def boca(expr, sorriso=None):
    if expr == 'feliz':
        return f'<path fill="none" {TRACO} d="{sorriso or "M53 73.5q7 6 14 0"}"/>'
    if expr == 'focado':
        return f'<path fill="none" {TRACO} d="M55.5 75h9"/>'
    if expr == 'comemorando':
        return (f'<path fill="#5A1E2A" {TRACO} d="M50.5 71h19c0 7.5-4.3 11.5-9.5 11.5S50.5 78.5 50.5 71z"/>'
                f'<path fill="#FF8A7A" d="M54.5 79.5q5.5-3.5 11 0-2.5 1.6-5.5 1.6t-5.5-1.6z"/>')
    return f'<path fill="none" {TRACO} d="M52 76.5q2-2.5 4 0t4 0 4 0 4 0"/>'  # frustrado: boca ondulada


def extras(expr):
    if expr == 'bochecha':
        return ''
    s = (f'<ellipse cx="37" cy="68" rx="5" ry="3" fill="{BOCHECHA}" opacity=".45"/>'
         f'<ellipse cx="83" cy="68" rx="5" ry="3" fill="{BOCHECHA}" opacity=".45"/>')
    if expr == 'comemorando':  # faíscas de alegria (motivo da marca)
        for x, y, k in ((10, 22, 1), (106, 18, 1.2), (110, 72, .8)):
            s += (f'<path fill="#FFC83D" transform="translate({x} {y}) scale({k})" '
                  f'd="m0-7 1.8 5.2L7 0 1.8 1.8 0 7-1.8 1.8-7 0-1.8-1.8z"/>')
    if expr == 'frustrado':  # gota de suor
        s += (f'<path fill="#8EC5FF" {traco(2)} d="M87 42c2.6 3.8 3.8 6 3.8 7.6a3.8 3.8 0 0 1-7.6 0c0-1.6 1.2-3.8 3.8-7.6z"/>')
    return s


# ---------------- Personagens (bíblia da lore §6) ----------------
# Cada um tem: pele/sombra, cabelo, íris, cor-assinatura e um acessório que muda a silhueta.

def pedra(expr):
    """Topo. Padeiro, calmo, o mais velho e o mais largo. Assinatura: bandana branca de padeiro com nó."""
    pele, sombra, cab = '#B5764F', '#8F5A3A', '#2B1D16'
    s = ombros(largura=4) + gola_e_funcao('topo') + cabeca(pele, sombra)
    s += f'<path fill="{cab}" {TRACO} d="M25.5 52C23 30 40 17 60 17s37 13 34.5 35c-6-9-17-14-34.5-14S31.5 43 25.5 52z"/>'
    # barba por fazer (sombra de 1 tom)
    s += f'<path fill="{sombra}" opacity=".55" d="M40 76c5 8 12 11 20 11s15-3 20-11c-5 4-12 6-20 6s-15-2-20-6z"/>'
    s += olhos('#6B4A2E', expr) + sobrancelhas(expr, cab) + boca(expr, 'M54 74q6 4 12 0') + extras(expr)
    # bandana (acessório de silhueta: nó com duas pontas à direita)
    s += (f'<path fill="#F5F0E6" {TRACO} d="M24 44C29 24 91 24 96 44l-1.5 7C82 40 38 40 25.5 51z"/>'
          f'<path fill="#D9D1C2" d="M60 38.5c15 0 28 4 34.5 12.5l1-5C88 39 76 37 60 38.5z"/>'
          f'<path fill="#F5F0E6" {TRACO} d="M95 40l16-7-3 12zM95 44l13 9-11 2z"/>'
          f'<circle cx="44" cy="33" r="1.3" fill="#D9D1C2"/><circle cx="70" cy="31" r="1.3" fill="#D9D1C2"/><circle cx="58" cy="35" r="1" fill="#D9D1C2"/>')
    return s


def rastro(expr):
    """Selva. Entregadora de bicicleta, elétrica, grava tudo. Assinatura: boné virado para trás + rabo de cavalo cacheado alto + celular gravando."""
    pele, sombra, cab = '#7A4A2E', '#5E3722', '#1E120C'
    s = (f'<g fill="{cab}" {TRACO}><circle cx="98" cy="22" r="11"/><circle cx="108" cy="32" r="8"/><circle cx="90" cy="12" r="7"/></g>')
    s += ombros() + gola_e_funcao('selva') + cabeca(pele, sombra)
    s += f'<path fill="{cab}" {TRACO} d="M25.5 54C22 31 39 18 60 18s38 13 34.5 36c-3-6-8-9-12-10 2 4 1 6 0 7-4-7-12-10-22-10-11 0-19 4-25 9 0-3 1-5 3-7-6 2-10 6-13 11z"/>'
    s += olhos('#B5761F', expr) + sobrancelhas(expr, cab) + boca(expr, 'M51 72.5q9 9 18 0') + extras(expr)
    # boné virado para trás (verde-grama), aba saindo à esquerda
    s += (f'<path fill="#9CCB5B" {TRACO} d="M28 40c4-16 18-24 33-24s28 7 32 22c-18-6-46-6-65 2z"/>'
          f'<path fill="#6F9A3A" d="M60 17c14 0 26 7 31 19.5-6-1.6-12-2.5-19-2.8 0-7-4-13-12-16.7z"/>'
          f'<path fill="#9CCB5B" {TRACO} d="M30 39.5 9 44c-2 .5-2.5-3-.5-4.5L28 33z"/>')
    # celular gravando (na mão, embaixo à esquerda)
    s += (f'<rect x="8" y="88" width="17" height="27" rx="3" fill="#2B3B5E" {TRACO}/>'
          f'<circle cx="16.5" cy="96" r="3" fill="#FF5D5D"/>'
          f'<path fill="{pele}" {TRACO} d="M6 104c0-4 4-5 6-2l3 4v14H8c-2-4-2-10-2-16z"/>')
    return s


def vulto(expr):
    """Meio. Talentoso, irônico, inseguro. Assinatura: capuz do moletom + franja cobrindo um olho + sorriso de canto."""
    pele, sombra, cab = '#E8B996', '#C7966F', '#15111C'
    # capuz atrás da cabeça (silhueta pontuda)
    s = f'<path fill="#3A4560" {TRACO} d="M14 66C10 34 32 6 60 6s50 28 46 60c-1 12-6 22-12 28H26c-6-6-11-16-12-28z"/>'
    s += ombros(cor='#3A4560', sombra='#2B3348') + gola_e_funcao('meio') + cabeca(pele, sombra)
    s += f'<path fill="{cab}" {TRACO} d="M25 54C22 32 38 18 60 18s38 14 35 36c-4-8-10-13-17-15l-3 6-4-7-9 4-4-5c-11 1-21 7-27 15 4-10 9-15 14-17-9 2-15 8-20 19z"/>'
    s += olhos('#5C7896', expr) + sobrancelhas(expr, cab)
    # sorriso de canto (assinatura) no "feliz"
    s += boca(expr, 'M53 74.5q8 2.5 14-3') + extras(expr)
    # franja longa cobrindo o olho esquerdo (com reflexo azul)
    s += (f'<path fill="{cab}" {TRACO} d="M30 38c8-4 18-4 24 0-2 10-6 18-14 26-1-9-3-16-10-20z"/>'
          f'<path fill="none" stroke="#4DA8F0" stroke-width="2" stroke-linecap="round" d="M37 41q8-1 12 1"/>')
    # borda do capuz por cima
    s += f'<path fill="none" stroke="#2B3348" stroke-width="5" stroke-linecap="round" d="M22 72C19 50 34 28 60 26M98 72c3-22-12-44-38-46"/>'
    return s


def fagulha(expr):
    """Atirador. O caçula, ansioso, perfeccionista, obcecado por números. Assinatura: óculos redondos + topete em forma de faísca."""
    pele, sombra, cab = '#F0C8A0', '#D3A57C', '#1A1A24'
    s = ombros() + gola_e_funcao('atirador') + cabeca(pele, sombra)
    s += f'<path fill="{cab}" {TRACO} d="M25.5 54C22 30 40 18 60 18s38 12 34.5 36c-4-9-9-13-14-14l-2 4-5-5-6 3-5-4-6 4-4-3c-11 2-18 8-22 15z"/>'
    # topete em forma de faísca (silhueta)
    s += f'<path fill="{cab}" {TRACO} d="M58 19 63 3l1 9 9-6-6 14z"/>'
    s += olhos('#3A2A20', expr) + sobrancelhas(expr, cab) + boca(expr, 'M54.5 74q5.5 4 11 0') + extras(expr)
    # óculos redondos
    s += (f'<g fill="#8EC5FF" fill-opacity=".14" {traco(2.5)}><circle cx="45" cy="58" r="10.5"/><circle cx="75" cy="58" r="10.5"/></g>'
          f'<path fill="none" {traco(2.5)} d="M55.5 57q4.5-3 9 0M34.5 56l-9-2M85.5 56l9-2"/>')
    return s


def bussola(expr):
    """Suporte. Organizada, acolhedora, voz de comando. Assinatura: coque cacheado alto + headset com microfone + pingente de bússola."""
    pele, sombra, cab = '#C68B5E', '#A06A42', '#3B2216'
    s = f'<g fill="{cab}" {TRACO}><circle cx="60" cy="13" r="12"/></g><path fill="none" stroke="#5A3626" stroke-width="2" stroke-linecap="round" d="M53 10q4-3 8 0m-4 7q4-3 8 0"/>'
    s += ombros() + gola_e_funcao('suporte') + cabeca(pele, sombra)
    s += f'<path fill="{cab}" {TRACO} d="M25 56c-4-12-1-22 5-28 1 3 2 4 4 4 1-5 4-9 9-11 0 3 1 5 3 6 3-5 8-8 14-8s11 3 14 8c2-1 3-3 3-6 5 2 8 6 9 11 2 0 3-1 4-4 6 6 9 16 5 28-4-9-10-13-16-15-6 3-15 4-23 4s-17-1-23-4c-6 2-12 6-16 15z"/>'
    s += olhos('#4F8A5B', expr) + sobrancelhas(expr, cab) + boca(expr, 'M53 73q7 6.5 14 0') + extras(expr)
    # headset: arco, conchas laranja e microfone
    s += (f'<path fill="none" stroke="#2B3B5E" stroke-width="5" stroke-linecap="round" d="M23 54C21 26 40 13 60 13s39 13 37 41"/>'
          f'<rect x="16" y="48" width="12" height="20" rx="5" fill="#FF7A2F" {TRACO}/><rect x="92" y="48" width="12" height="20" rx="5" fill="#FF7A2F" {TRACO}/>'
          f'<path fill="none" stroke="#2B3B5E" stroke-width="3.5" stroke-linecap="round" d="M22 66c2 10 10 15 22 14"/><circle cx="46" cy="80" r="3.5" fill="#2B3B5E" {traco(2)}/>')
    # pingente de bússola
    s += (f'<path fill="none" stroke="#FFC83D" stroke-width="1.5" d="M50 94q10 10 20 0"/>'
          f'<circle cx="60" cy="106" r="6" fill="#FFC83D" {traco(2)}/><path fill="#FF5D5D" d="m60 101.5 1.6 4.5h-3.2z"/><path fill="#1D2A45" d="m60 110.5 1.6-4.5h-3.2z"/>')
    return s


def dona_cel(expr):
    """Mascote dos avisos. Dona Celina, 63, dona da lan e mentora. Assinatura: coque grisalho + óculos na corrente + apito de técnica de várzea + cardigã cor de Legado."""
    pele, sombra, cab = '#D9A27A', '#B9825C', '#C9CCD6'
    s = f'<g fill="{cab}" {TRACO}><ellipse cx="60" cy="14" rx="15" ry="11"/></g><path fill="none" stroke="#A3A8B8" stroke-width="2" stroke-linecap="round" d="M50 12q10-6 20 0"/>'
    s += ombros(cor='#4FD6C8', sombra='#2FA99C') + f'<path fill="#F5F0E6" {TRACO} d="M47 93l13 14 13-14c-4-1-8-1.5-13-1.5s-9 .5-13 1.5z"/>'
    s += cabeca(pele, sombra)
    s += f'<path fill="{cab}" {TRACO} d="M25 56C21 32 38 19 60 19s39 13 35 37c-3-8-8-13-14-15-6 3-13 4-21 4s-15-1-21-4c-6 2-11 7-14 15z"/>'
    s += f'<path fill="#A3A8B8" d="M60 22c14 0 26 6 32 17-4-3-7-4-11-5-6-2-13-3-21-3z"/>'
    s += olhos('#6B4A2E', expr) + sobrancelhas(expr, '#8A8FA0') + boca(expr) + extras(expr)
    # pés de galinha (idade, com carinho)
    s += f'<path fill="none" stroke="{sombra}" stroke-width="1.8" stroke-linecap="round" d="M31 55l-4-2m4 6h-4.5M89 55l4-2m-4 6h4.5"/>'
    # óculos de leitura na ponta do nariz + corrente
    s += (f'<g fill="#F5F0E6" fill-opacity=".12" {traco(2.2)}><rect x="39" y="63" width="15" height="9" rx="4"/><rect x="66" y="63" width="15" height="9" rx="4"/></g>'
          f'<path fill="none" {traco(2.2)} d="M54 66.5q6-2.5 12 0"/>'
          f'<path fill="none" stroke="#FFC83D" stroke-width="1.5" stroke-dasharray="1.5 2.5" d="M39 67C28 80 30 92 40 100M81 67c11 13 9 25-1 33"/>')
    # apito
    s += (f'<path fill="none" stroke="#FF7A2F" stroke-width="2" d="M52 94q8 9 16 0"/>'
          f'<path fill="#CFD8E8" {traco(2)} d="M56 102h10a4 4 0 0 1 0 8h-6l-4 3z"/>')
    return s


PERSONAGENS = {
    ('jogadores', 'jogador', 'pedra'): (pedra, 'Pedra (Topo)'),
    ('jogadores', 'jogador', 'rastro'): (rastro, 'Rastro (Selva)'),
    ('jogadores', 'jogador', 'vulto'): (vulto, 'Vulto (Meio)'),
    ('jogadores', 'jogador', 'fagulha'): (fagulha, 'Fagulha (Atirador)'),
    ('jogadores', 'jogador', 'bussola'): (bussola, 'Bússola (Suporte)'),
    ('mascote', 'mascote', 'dona-cel'): (dona_cel, 'Dona Cel'),
}
EXPRESSOES = ('feliz', 'focado', 'comemorando', 'frustrado')
NOME_EXPR = {'feliz': 'feliz', 'focado': 'focado', 'comemorando': 'comemorando', 'frustrado': 'frustrado'}


def main():
    total = 0
    for (pasta, cat, nome), (fn, rotulo) in PERSONAGENS.items():
        d = RAIZ / 'assets' / pasta
        d.mkdir(parents=True, exist_ok=True)
        for e in EXPRESSOES:
            svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img" '
                   f'aria-label="{rotulo}, {NOME_EXPR[e]}">{fn(e)}</svg>\n')
            p = d / f'{cat}_{nome}_{e}.svg'
            p.write_text(svg, encoding='utf-8')
            total += 1
    print(f'{total} arquivos gerados em assets/jogadores e assets/mascote')


if __name__ == '__main__':
    main()
