#!/usr/bin/env python3
"""Gera os wireframes de baixa fidelidade da NX-009 (UX) em docs/ux/wireframes/.
Uso: python3 gerar.py <pasta-de-saida>. Fora do repositório de propósito (é ferramenta do UX)."""
import sys, os, html
sys.path.insert(0, os.path.dirname(__file__))
from fmt import fmt, pct, chance, custo

OUT = sys.argv[1]
CSS = open(os.path.join(os.path.dirname(__file__), 'base.css')).read() + """
.pausa{font-size:12px;line-height:16px;border:1.5px solid #222;border-radius:12px;padding:2px 8px;white-space:nowrap;font-weight:600;background:#fff}
.campo{min-height:48px;border:2px solid #222;border-radius:8px;padding:12px;font-size:16px;line-height:22px;background:#fff;display:flex;align-items:center;justify-content:space-between;gap:8px}
.campo.erro{border-width:3px}
.campo .cursor{display:inline-block;width:2px;height:20px;background:#111;vertical-align:middle}
.msg-erro{font-size:12px;line-height:16px;font-weight:700}
.teclado{position:absolute;left:0;right:0;bottom:0;height:260px;background:#c4c4c4;border-top:2px solid #222;z-index:35;display:flex;align-items:center;justify-content:center;font-size:12px;color:#333}
.rola{overflow:hidden;position:relative}
.rola-ind{font-size:12px;line-height:16px;color:#444;text-align:center}
.pontos{display:flex;gap:4px}.pontos i{width:8px;height:8px;border:1.5px solid #222;border-radius:50%}.pontos i.on{background:#222}
.mono{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;line-height:16px;word-break:break-all}
.grade6{display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px}
.grade6 span{border:1.5px solid #222;border-radius:4px;padding:2px 4px;font-size:12px;line-height:16px;text-align:center;white-space:nowrap}
.grade6 span.atual{background:#222;color:#fff;font-weight:800}
.splitlin{display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px solid #ddd;font-size:12px;line-height:16px}
"""

NOTA_PADRAO = ('Baixa fidelidade, só layout. Moldura = 360×640 px (+2 px de borda). Linha tracejada = metade da tela '
               '(320 px): ações frequentes ficam abaixo dela. Tons de cinza de propósito: cor é do <code>nexus-arte</code> '
               '(NX-005). Nomes são os finais do <code>nexus-lore</code> (NX-003, adotados nas RN v0.2); frases que o lore '
               'ainda não escreveu aparecem como <code>[LORE: sentido]</code>. Números pela RN-017 v0.2. Índice: '
               '<a href="index.html">index.html</a>.')

def pagina(arquivo, titulo, resumo, figuras):
    corpo = ''.join(figuras)
    doc = f'''<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{titulo} — wireframe Nexus Idle</title>
<style>
{CSS}</style></head>
<body>
<header class="doc"><h1>{titulo}</h1><p>{resumo}</p>
<p class="apoio">{NOTA_PADRAO}</p></header>
<main class="grade">
{corpo}</main></body></html>
'''
    with open(os.path.join(OUT, arquivo), 'w') as f:
        f.write(doc)

_n = [0]
def fig(titulo, legenda, conteudo):
    i = _n[0]; _n[0] += 1
    return (f'<figure><figcaption><b>{titulo}</b>{legenda}</figcaption><div class="tela" data-tela="{i}">\n'
            f'{conteudo}\n<div class="guia"><span>320 px</span></div></div></figure>\n')

def reset(): _n[0] = 0

# ---------- peças comuns ----------
ABAS = ['Clube', 'Negócios', 'Elenco', 'Jornada']
def abas(ativa, marc=()):
    out = []
    for a in ABAS:
        rot = a + (' •' if a in marc else '')
        cls = 'aba ativa' if a == ativa else 'aba'
        cur = ' aria-current="page"' if a == ativa else ''
        out.append(f'<button class="{cls}" data-alvo{cur}><span class="ic"></span>{rot}</button>')
    return '<nav class="abas" data-testid="abas">' + ''.join(out) + '</nav>'

def pausa(): return '<span class="pausa" data-testid="pausa">⏸ Partidas em pausa</span>'

def trilha(seq):
    m = {'v': '<span class="casa v">V</span>', 'd': '<span class="casa d">D</span>', 'p': '<span class="casa p"></span>'}
    seq = seq + 'p' * (14 - len(seq))
    return '<div class="trilha" aria-label="trilha do split">' + ''.join(m[c] for c in seq) + '</div>'

def rot_chance(p):
    v = round(p * 100)
    return 'Favorito' if v >= 60 else ('Equilibrado' if v >= 40 else 'Azarão')

VARZEA = ['Unidos da Ladeira', 'Pastel de Feira GG', 'Esquadrão Marmita', 'Bonde do Wi-Fi', 'Lag Zero', 'Turma do Nico', 'Os Sem Ping']
VARZEA_S = ['ULD', 'PFG', 'EQM', 'BWF', 'LGZ', 'TDN', 'OSP']
ACESSO = ['Coruja Noturna', 'Maré Alta', 'Leões do Cais', 'Pixel Rebelde', 'Atlética Ventura', 'Trovão Azul', 'Ferrugem eSports']
ELITE = ['Vértice', 'Carcará', 'Dínamo Austral', 'Hidra', 'Orquídea Negra', 'Capivara Real', 'Guará Vermelho']

def t02(div='Várzea · ×1 renda', legado=None, ouro='1,23 mil', renda='+12,3/s', split=3, placar='6V 3D · faltam 5',
        seq='vvdvvdvdv', rival='Esquadrão Marmita', tempo='0:42', ch=0.7685, meta='Vença 10 para subir: 6/10 · faltam 5 partidas',
        compra=('Patrocínio local', 'tem 1 · +6/s cada', 'prim', 'Comprar', fmt(custo(150, 1), 'cima')), toque='+1,2 por toque',
        marc=(), extra=''):
    leg = f'<span class="chip num">Legado {legado}</span>' if legado else ''
    nome, apoio, tipo, b1, b2 = compra
    return f'''<div class="bloco lin entre" style="height:48px;padding:0 0 0 16px" data-testid="topo">
  <span class="lin"><span class="chip" data-testid="divisao">{div}</span>{leg}</span>
  <button class="btn" style="border:0;background:none" aria-label="Ajustes" data-alvo>⚙</button>
</div>
<div class="bloco" style="height:80px" data-testid="ouro">
  <div class="lin"><span class="icone" style="width:32px;height:32px">ouro</span><span class="heroi num">{ouro}</span></div>
  <div class="rot num" data-testid="renda" style="padding-left:40px">{renda}</div>
</div>
<button class="bloco" style="height:120px;width:100%;background:#f6f6f6;border:0;border-bottom:1px solid #bbb;text-align:left;font:inherit;gap:6px;align-items:stretch" data-alvo data-testid="split">
  <div class="lin entre"><span class="rot">Split {split}</span><span class="rot num" data-testid="placar">{placar}</span></div>
  {trilha(seq)}
  <div class="lin entre"><span class="apoio" style="min-width:0">Próxima: vs {rival}<br>em <b class="num">{tempo}</b></span>
  <span style="text-align:right;flex:none"><span class="sub num" data-testid="chance">Chance {pct(ch)}</span><br><span class="apoio">{rot_chance(ch)} · ver split ›</span></span></div>
</button>
<div class="bloco" style="height:72px" data-testid="meta">
  <span class="apoio">Meta atual</span><span class="rot">{meta}</span>
</div>
<div class="bloco" style="height:80px;border-bottom:0" data-testid="proxima-compra">
  <div class="cartao" style="padding:4px 4px 4px 12px">
    <span class="icone">negócio</span>
    <span style="flex:1;min-width:0"><span class="apoio corta">Próxima compra</span><span class="rot corta">{nome}</span><span class="apoio corta">{apoio}</span></span>
    <button class="btn alto {tipo}" style="width:104px" data-alvo>{b1}<small class='num'>{b2}</small></button>
  </div>
</div>
<div style="height:176px;flex:none;display:flex;align-items:center;justify-content:center" data-testid="zona-toque">
  <button class="toque" data-alvo data-testid="botao-toque">Fazer live<span class="apoio num" style="margin-top:4px">{toque}</span></button>
</div>
{abas('Clube', marc)}
{extra}'''

def barra_baixo(*botoes, h=88):
    if len(botoes) == 1:
        inner = botoes[0]
    else:
        inner = '<div class="par">' + ''.join(botoes) + '</div>'
    return f'<div class="bloco" style="height:{h}px;border-top:1px solid #bbb;border-bottom:0">{inner}</div>'

def btn(txt, tipo='', extra=''):
    return f'<button class="btn alto {tipo}"{extra} data-alvo>{txt}</button>'

def cartao_col(rotulo, *linhas, extra_style=''):
    return (f'<div class="cartao" style="flex-direction:column;align-items:flex-start;gap:2px;{extra_style}"><span class="apoio">{rotulo}</span>'
            + ''.join(linhas) + '</div>')

# =====================================================================
# T00 / T12 — carregar e save
# =====================================================================
reset()
def t00(extra=''):
    return f'''<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px">
<span class="ph" style="width:160px;height:160px">logo [ARTE]</span><span class="rot">Carregando o clube…</span>{extra}</div>'''

figs = [
    fig('T00 — Carregando', 'Logo e texto. Sem barra falsa.', t00()),
    fig('T00 — Carregando &gt; 3 s', 'Texto honesto, sem % inventada.', t00('<span class="apoio">Ainda carregando…</span>')),
    fig('T12a — Cópia válida recuperada', 'RN-015: a cópia atual não confere, a outra é válida. Diz de quando é a cópia carregada. Um botão. Vem antes da T13 (RN-011).',
        t00() + '''<div class="veu"></div><div class="modal" style="bottom:24px" role="alertdialog">
<span class="tit">⚠ Recuperamos seu clube</span>
<span class="rot">Não deu para ler o último save. Carregamos a cópia anterior, de hoje às 14:32 (10 s antes).</span>
<span class="apoio">O que aconteceu nesses 10 s pode ter se perdido. O resto está aqui.</span>
<button class="btn alto prim" data-alvo>Continuar</button></div>'''),
    fig('T12b — Nenhuma cópia válida', 'RN-015: duas opções de mesmo tamanho. O save que não abriu fica guardado e pode ser exportado aqui ou em Ajustes.',
        t00() + '''<div class="veu"></div><div class="modal" style="bottom:24px" role="alertdialog">
<span class="tit">⚠ Não conseguimos abrir seu save</span>
<span class="rot">As duas cópias do save não puderam ser lidas. Nada foi apagado.</span>
<span class="apoio">Tente de novo ou comece um clube novo. O save que não abriu fica guardado para exportar.</span>
<div class="par"><button class="btn alto prim" data-alvo>Tentar de novo</button><button class="btn alto" style="white-space:normal" data-alvo>Começar clube novo</button></div>
<button class="btn" style="border-style:dashed" data-alvo>Exportar o save que não abriu</button></div>'''),
    fig('T12b — Tentou de novo e falhou', 'Mesma tela, com a tentativa contada. Sem culpa, sem código de erro.',
        t00() + '''<div class="veu"></div><div class="modal" style="bottom:24px" role="alertdialog">
<span class="tit">⚠ Ainda não abriu</span>
<span class="rot">Tentamos de novo (2ª vez) e o save continua ilegível. Nada foi apagado.</span>
<span class="apoio">Se quiser pedir ajuda, exporte o save que não abriu.</span>
<div class="par"><button class="btn alto prim" data-alvo>Tentar de novo</button><button class="btn alto" style="white-space:normal" data-alvo>Começar clube novo</button></div>
<button class="btn" style="border-style:dashed" data-alvo>Exportar o save que não abriu</button></div>'''),
    fig('T12c — Confirmar clube novo', 'Confirmação exigida pela RN-015. Cancelar do mesmo tamanho. Depois: prólogo (T01) com o nome padrão.',
        t00() + '''<div class="veu"></div><div class="modal" style="bottom:24px" role="alertdialog">
<span class="tit">Começar um clube novo?</span>
<span class="rot">Você começa na Várzea, com 10 de ouro e Legado 0.</span>
<span class="apoio">O save que não abriu continua guardado. Dá para exportá-lo depois em Ajustes.</span>
<div class="par"><button class="btn alto" data-alvo>Cancelar</button><button class="btn alto prim" style="white-space:normal" data-alvo>Começar clube novo</button></div></div>'''),
    fig('A05 — Sem espaço para salvar', 'RN-015: mantém o último save válido e avisa. Aviso fixo no topo, não cobre ouro nem botões; fecha com ✕ e volta se o problema continuar.',
        t02(extra='''<div class="aviso" style="top:4px;align-items:flex-start" role="alert"><span style="flex:1">⚠ Sem espaço para salvar. Seu último save (há 2 min) está seguro. Libere espaço no aparelho.</span><button class="btn" style="border:0;background:none;margin:-8px -8px 0 0" aria-label="Fechar aviso" data-alvo>✕</button></div>''')),
]
pagina('T00-T12-carregar-e-save.html', 'T00 Carregando e T12 Save (recuperado, ilegível, clube novo)',
       'RN 015 (e 011: o aviso de save vem antes da T13). Fluxo: NX-015. Sem barra de progresso falsa. Nenhum save válido é apagado sem confirmação.', figs)

# =====================================================================
# T01 — Boas-vindas = Prólogo
# =====================================================================
reset()
def capitulo(cab, titulo, bloco, total, texto, botoes, nota='', ilus=True, voltar=False):
    pts = ''.join('<i class="on"></i>' if i < bloco else '<i></i>' for i in range(total))
    vol = '<button class="btn" style="border:0;background:none" aria-label="Fechar capítulo" data-alvo>‹</button>' if voltar else ''
    il = '<div class="ph" style="height:96px;flex:none">ilustração opcional [ARTE]</div>' if ilus else ''
    return f'''<div class="bloco lin entre" style="height:48px;{'padding:0 16px 0 0' if voltar else ''}"><span class="lin" style="min-width:0">{vol}<span class="rot corta">{cab}</span></span>{pausa()}</div>
<div style="padding:12px 16px;flex:1;display:flex;flex-direction:column;gap:8px;min-height:0" data-alvo-texto>
{il}
<p class="tit" style="margin:4px 0 0">{titulo}</p>
<div class="lin entre"><div class="pontos" aria-hidden="true">{pts}</div><span class="apoio num">Bloco {bloco} de {total}</span></div>
<p style="margin:0;font-size:16px;line-height:24px">{texto}</p>
<p class="apoio" style="margin-top:auto">{nota}</p></div>
{barra_baixo(*botoes)}'''

figs = [
    fig('T01 — Prólogo, bloco 1', 'Boas-vindas = prólogo (RN-018), em blocos curtos. Pular e Continuar do mesmo tamanho; tocar no texto também avança. Relógio de partida parado (RN-009).',
        capitulo('Prólogo · Faísca eSports', '[LORE: título do prólogo]', 1, 4,
                 '[LORE: bloco 1 — a Lan do Farol vai fechar; Dona Cel chama a direção para a sala dos fundos.]',
                 [btn('Pular'), btn('Continuar', 'prim')], 'Leitura de ~20 s. Pular conta como visto; dá para reler na Jornada.')),
    fig('T01 — Prólogo, último bloco', 'O último bloco fecha com o convite e diz em 1 frase como se joga. Um botão: Começar. A 1ª partida começa a contar ao tocar aqui.',
        capitulo('Prólogo · Faísca eSports', '[LORE: título do prólogo]', 4, 4,
                 '[LORE: bloco 4 — Dona Cel entrega a chave: “Transforma essa turma num time de verdade.”]<br><br><b>O time joga sozinho. Você cuida dos negócios e do elenco.</b> [LORE]',
                 [btn('Começar', 'prim')], 'O nome do clube pode ser trocado depois, na Jornada.')),
]
pagina('T01-boas-vindas.html', 'T01 — Boas-vindas (prólogo)',
       'RN 009, 016, 018. Fluxos: NX-016, NX-017. Única introdução: o prólogo em 4 blocos, com Pular. Depois dele, só dicas ancoradas (T02).', figs)

# =====================================================================
# T02 — Clube
# =====================================================================
reset()
c_aulas13 = custo(10, 13)
figs = [
    fig('1. Padrão (meio da run)', 'Tudo que importa em 3 s: ouro, renda/s, divisão, placar do split, chance, meta, próxima compra e toque. Custo para cima (173, real 172,5).', t02()),
    fig('2. Primeira vez (D1)', 'Clube novo: 10 de ouro e “Aulas na lan” já visível e comprável (RN-001, RN-003). A dica aponta a compra; não bloqueia.',
        t02(ouro='10', renda='+0/s', split=1, placar='0V 0D · faltam 14', seq='', rival='Unidos da Ladeira', tempo='1:30', ch=chance(50, 60),
            meta='[LORE: Compre aulas na lan e veja o ouro entrar]', compra=('Aulas na lan', 'tem 0 · +0,5/s cada', 'prim', 'Comprar', '10'), toque='+1 por toque',
            extra='<div class="dica" style="left:24px;top:262px">ⓘ [LORE: Compre aulas na lan: elas rendem ouro sozinhas]</div>')),
    fig('3. Depois da 1ª compra (D2)', 'Ouro 0, renda +0,5/s, próximo custo 11,5 (critério NX-010). A dica passa ao botão Fazer live e some no 1º toque.',
        t02(ouro='0', renda='+0,5/s', split=1, placar='0V 0D · faltam 14', seq='', rival='Unidos da Ladeira', tempo='1:27', ch=chance(50, 60),
            meta='[LORE: Faça live para juntar ouro mais rápido]', compra=('Aulas na lan', 'tem 1 · +0,5/s cada', 'off', 'Faltam', fmt(custo(10, 1), 'cima')), toque='+1 por toque',
            extra='<div class="dica" style="left:72px;top:400px">ⓘ [LORE: Faça live para ganhar ouro]</div>')),
    fig('4. Sem ouro + aviso de vitória (A01)', 'Botão com “Faltam X” (não só cinza). A01 cobre só a faixa da meta por 3 s. Prêmio = 60 × renda/s.',
        t02(ouro='135', renda='+12/s', placar='7V 3D · faltam 4', seq='vvdvvdvdvv', rival='Esquadrão Marmita',
            meta='Vença 10 para subir: 7/10 · faltam 4 partidas',
            compra=('Patrocínio local', 'tem 0 · +6/s cada', 'off', 'Faltam', fmt(150 - 135, 'cima')), toque='+1,2 por toque',
            extra='<div class="aviso" style="top:260px" role="status"><span class="marca">V</span>✓ Vitória vs Pastel de Feira GG · <span class="num">+720</span></div>')),
    fig('5. Azarão + meta do elenco + derrota', 'Meta prioriza o elenco quando a chance é baixa e ninguém subiu de nível (NX-012). Custo 61,6 e falta 13,6 para cima.',
        t02(ouro='48', renda='+6,5/s', split=1, placar='0V 1D · faltam 13', seq='d', rival='Pastel de Feira GG', tempo='1:28', ch=chance(50, 60),
            meta='Seu time é azarão. Suba um jogador no Elenco ›',
            compra=('Aulas na lan', 'tem 13 · +0,5/s cada', 'off', 'Faltam', fmt(c_aulas13 - 48, 'cima')), toque='+1 por toque', marc=('Elenco',),
            extra='<div class="aviso" style="top:260px" role="status"><span class="marca">D</span>✕ Derrota vs Unidos da Ladeira · sem prêmio</div>')),
    fig('6. Run avançada com Legado', 'Chip de Legado só com Legado &gt; 0. Notação curta (RN-017).',
        t02(div='Elite · ×8 renda', legado='25', ouro='45,6 bi', renda='+1,23 bi/s', split=41, placar='3V 2D · faltam 9', seq='vdvdv',
            rival='Orquídea Negra', tempo='1:03', ch=0.57, meta='Vença 10 para subir: 3/10 · faltam 9 partidas',
            compra=('Arena do clube', 'tem 51 · +4,32 mi/s cada', 'prim', 'Comprar', fmt(custo(8e6, 51), 'cima')), toque='+123 mi por toque')),
    fig('7. Fala de retorno (A03)', 'Subiu de novo a uma divisão cujo capítulo já foi visto: só 1 linha, some em 4 s, não bloqueia (RN-018).',
        t02(div='Acesso · ×2 renda', legado='10', ouro='2,04 mil', renda='+58,6/s', split=1, placar='0V 0D · faltam 14', seq='',
            rival='Coruja Noturna', tempo='1:30', ch=0.39, meta='Vença 10 para subir: 0/10 · faltam 14 partidas',
            compra=('Camisa oficial', 'tem 0 · +180/s cada', 'prim', 'Comprar', fmt(2000, 'cima')), toque='+5,8 por toque',
            extra='<div class="aviso" style="top:260px" role="status">↑ [LORE: De volta ao Acesso. A gente conhece o caminho.]</div>')),
    fig('8. Refundação disponível (1ª vez)', 'Meta cita a refundação uma única vez; aba Jornada com marcador ponto + texto. Sem contagem nem pisca.',
        t02(div='Ascensão · ×4 renda', ouro='38,1 mil', renda='+412/s', split=1, placar='1V 0D · faltam 13', seq='v',
            rival='Jaguatirica', tempo='1:12', ch=0.21, meta='Refundação disponível na Jornada ›',
            compra=('Canal do clube', 'tem 0 · +2,80 mil/s cada', 'prim', 'Comprar', fmt(30000, 'cima')), toque='+41,2 por toque', marc=('Jornada',))),
]
pagina('T02-principal.html', 'T02 — Clube (tela principal)',
       'RN 001, 002, 003, 005, 006, 008, 009, 010, 013, 017, 018. Fluxos: NX-010, NX-012, NX-016, NX-017. Orçamento vertical: topo 48 · ouro 80 · split 120 · meta 72 (= 320, só leitura) · próxima compra 80 · toque 176 · abas 64 = 640 px, sem rolagem.', figs)

# =====================================================================
# T03 — Negócios
# =====================================================================
reset()
def linha_neg(nome, info, tipo, b1, b2, n50, novo=False):
    pct50 = int(n50 / 50 * 100)
    selo = '<span class="marca">Novo</span> ' if novo else ''
    return f'''<div class="cartao" style="height:96px;flex:none;padding:6px 8px;flex-direction:column;align-items:stretch;gap:4px">
 <div class="lin"><span class="icone" style="width:40px;height:40px">ícone</span>
 <span style="flex:1;min-width:0"><span class="rot corta">{selo}{nome}</span><span class="apoio num corta">{info}</span></span>
 <button class="btn alto {tipo}" style="width:108px;padding:4px 6px" data-alvo>{b1}<small class="num">{b2}</small></button></div>
 <div class="lin"><div class="barra" style="flex:1"><i style="width:{pct50}%"></i></div><span class="apoio num" style="white-space:nowrap">{n50}/50 · faltam {50 - n50} para ×2</span></div></div>'''

def lote(sel):
    return ('<div class="bloco" style="height:64px;border-top:1px solid #bbb;border-bottom:0" data-testid="lote"><div class="seg">'
            + ''.join(f'<button class="btn" aria-pressed="{"true" if s == sel else "false"}" data-alvo>{s}</button>' for s in ['×1', '×10', 'Máx'])
            + '</div></div>')

def t03(cab, linhas, sel, extra='', marc=()):
    return (f'<div class="bloco lin entre" style="height:48px"><span class="tit">Negócios</span><span class="rot num">{cab}</span></div>'
            f'<div class="lista">{linhas}</div>{lote(sel)}{abas("Negócios", marc)}{extra}')

figs = [
    fig('1. Padrão, lote ×10', 'Linha: nome, quantidade, renda, barra do marco de 50 (RN-004), botão com custo do lote (para cima). Negócio recém-visível com selo “Novo” em texto.',
        t03('38,0 mil · +90,5/s',
            linha_neg('Aulas na lan', 'n 37 · +18,5/s', 'prim', 'Comprar ×10', fmt(custo(10, 37, 10), 'cima'), 37)
            + linha_neg('Patrocínio local', 'n 12 · +72/s', 'prim', 'Comprar ×10', fmt(custo(150, 12, 10), 'cima'), 12)
            + linha_neg('Camisa oficial', 'n 0 · +60/s cada', 'off', 'Faltam', fmt(custo(2000, 0, 10) - 38000, 'cima'), 0, novo=True)
            + '<p class="apoio" style="text-align:center;margin:4px 0">Mais negócios aparecem conforme o clube junta ouro.</p>', '×10')),
    fig('2. Início da run + anúncio do Renatão', 'Nunca fica vazia: “Aulas na lan” é visível desde o início (RN-003). O 2º negócio aparece com aviso de 1 linha (≤ 60 caracteres).',
        t03('70,5 · +3/s',
            linha_neg('Aulas na lan', 'n 6 · +3/s', 'prim', 'Comprar ×1', fmt(custo(10, 6), 'cima'), 6)
            + linha_neg('Patrocínio local', 'n 0 · +6/s cada', 'off', 'Faltam', fmt(150 - 70.5, 'cima'), 0, novo=True)
            + '<p class="apoio" style="text-align:center;margin:4px 0">Mais negócios aparecem conforme o clube junta ouro.</p>', '×1',
            extra='<div class="aviso" style="top:56px" role="status">“Fechei com a padaria! Pão e patrocínio!” — Renatão</div>')),
    fig('3. Lote Máx e sem ouro', 'Máx mostra quantas unidades compraria (aqui, 1). Com k = 0: desabilitado com “Faltam X” para cima (RN-006, RN-017).',
        t03('1,23 mil · +90,5/s',
            linha_neg('Aulas na lan', 'n 37 · +18,5/s', 'off', 'Faltam', fmt(custo(10, 37) - 1230, 'cima'), 37)
            + linha_neg('Patrocínio local', 'n 12 · +72/s', 'prim', 'Máx (1)', fmt(custo(150, 12), 'cima'), 12)
            + linha_neg('Camisa oficial', 'n 0 · +60/s cada', 'off', 'Faltam', fmt(2000 - 1230, 'cima'), 0), 'Máx')),
    fig('4. Lote ×10 parcial', 'O ouro paga 4 de 10: ×10 fica desabilitado com “Faltam X” (RN-006). O apoio sugere o Máx, sem comprar sozinho.',
        t03('5,00 mil · +90,5/s',
            linha_neg('Patrocínio local', 'n 12 · +72/s · Máx compraria 4', 'off', 'Faltam', fmt(custo(150, 12, 10) - 5000, 'cima'), 12)
            + linha_neg('Camisa oficial', 'n 0 · +60/s cada', 'off', 'Faltam', fmt(custo(2000, 0, 10) - 5000, 'cima'), 0), '×10')),
    fig('5. Marco de 50 atingido', 'Confirmação em texto por 3 s; barra recomeça.',
        t03('11,2 mil · +122/s',
            linha_neg('Aulas na lan', 'n 50 · +50/s · dobrou!', 'prim', 'Comprar ×1', fmt(custo(10, 50), 'cima'), 0)
            + linha_neg('Patrocínio local', 'n 12 · +72/s', 'prim', 'Comprar ×1', fmt(custo(150, 12), 'cima'), 12), '×1')),
]
pagina('T03-negocios.html', 'T03 — Negócios',
       'RN 001, 002, 003, 004, 006, 017. Fluxo: NX-010. Aba “Negócios” (nome do lore). Lista rolável (única rolagem esperada no loop); seletor de lote e abas fixos na zona do polegar.', figs)

# =====================================================================
# T04 — Elenco
# =====================================================================
reset()
JOG = [('Topo', 'Pedra'), ('Selva', 'Rastro'), ('Meio', 'Vulto'), ('Atirador', 'Fagulha'), ('Suporte', 'Bússola')]
def cartao_jog(funcao, apelido, nivel, tipo, b1, prev):
    poder = fmt(10 * 1.05 ** (nivel - 1))
    return f'''<div class="cartao" style="height:72px;flex:none;padding:4px 4px 4px 8px">
<span class="icone">{funcao}</span>
<span style="flex:1;min-width:0"><span class="rot corta">{apelido}</span><span class="apoio corta">{funcao}</span><span class="apoio num corta">Nv {nivel} · Poder {poder}</span></span>
<button class="btn alto {tipo}" style="width:124px;padding:4px 6px" data-alvo><span>{b1}</span><small class="num">{prev}</small></button></div>'''

def t04(ouro, poder_t, rival, ch, cartoes, faixa='', legado_txt=''):
    lt = f'<span class="apoio">{legado_txt}</span>' if legado_txt else ''
    return f'''<div class="bloco lin entre" style="height:48px"><span class="tit">Elenco</span><span class="rot num">{ouro} de ouro</span></div>
<div class="bloco" style="height:72px"><div class="lin entre"><span><span class="apoio">Poder do time × rival da divisão</span><br><span class="sub num">{poder_t} × {rival}</span>{lt}</span>
<span style="text-align:right"><span class="sub num">Chance {pct(ch)}</span><br><span class="apoio">{rot_chance(ch)}</span></span></div></div>
{faixa}<div class="lista" style="gap:4px;padding:4px 16px">{cartoes}</div>
{abas('Elenco')}'''

c50 = chance(50, 60); c505 = chance(50.5, 60)
prev = f'chance {pct(c50)} → {pct(c505)}'
figs = [
    fig('1. Primeira vez', 'Faixa de explicação fecha com “Entendi”. 5 jogadores no Nv 1: poder 50 × 60 = 27% (Azarão). Poder sem zero final (“10”, não “10,0”).',
        t04('62', '50', '60', c50, ''.join(cartao_jog(f, a, 1, 'prim', 'Subir · <span class="num">50</span>', prev) for f, a in JOG),
            faixa='<div class="bloco" style="height:64px;background:#f2f2f2"><div class="lin entre"><span class="apoio" style="flex:1">ⓘ [LORE: Poder do time contra o rival decide a chance. Vitórias dão ouro e sobem o clube.]</span><button class="btn" data-alvo>Entendi</button></div></div>')),
    fig('2. Sem ouro suficiente', '“Faltam X” para cima; a prévia continua visível para o jogador decidir se vale juntar.',
        t04('36', '50', '60', c50, ''.join(cartao_jog(f, a, 1, 'off', 'Faltam <span class="num">14</span>', prev) for f, a in JOG))),
]
# run avançada: Acesso, Legado 10 (+10% poder)
niveis = [9, 8, 11, 10, 7]
pod = sum(10 * 1.05 ** (n - 1) for n in niveis) * 1.10
ch_now = chance(pod, 220)
def prev_n(i):
    nv = niveis[:]; nv[i] += 1
    p2 = sum(10 * 1.05 ** (n - 1) for n in nv) * 1.10
    return f'chance {pct(ch_now)} → {pct(chance(p2, 220))}'
ouro_av = 280
cards = ''
for i, (f, a) in enumerate(JOG):
    cst = 50 * 1.22 ** (niveis[i] - 1)
    if ouro_av >= cst:
        cards += cartao_jog(f, a, niveis[i], 'prim', f'Subir · <span class="num">{fmt(cst, "cima")}</span>', prev_n(i))
    else:
        cards += cartao_jog(f, a, niveis[i], 'off', f'Faltam <span class="num">{fmt(cst - ouro_av, "cima")}</span>', prev_n(i))
figs.append(fig('3. Meio da run, com Legado', f'Acesso (rival 220), Legado 10: o poder do time já inclui +10% (RN-014). Poder {fmt(pod)} → {pct(ch_now)}.',
                t04(str(ouro_av), fmt(pod), '220', ch_now, cards, legado_txt=' · inclui +10% do Legado')))
pagina('T04-elenco.html', 'T04 — Elenco',
       'RN 001, 007, 008, 009, 014, 017. Fluxo: NX-011. Os 5 jogadores do lore, em ordem fixa Topo → Suporte. Cada botão mostra a prévia da chance (RN-009) com o poder novo.', figs)

# =====================================================================
# T05 / T06 — Split e fim do split
# =====================================================================
reset()
def t05():
    res = 'vvdvvdvdv'
    linhas = ''
    for i in range(14):
        nome = VARZEA[i % 7]; sig = VARZEA_S[i % 7]
        if i < len(res):
            r = '<span class=marca>V</span> ✓ Vitória' if res[i] == 'v' else '<span class=marca>D</span> ✕ Derrota'
        else:
            r = 'a jogar'
        linhas += f'<div class="lin entre" style="height:26px;border-bottom:1px solid #ddd"><span class="apoio num corta">{i + 1}. {sig} · {nome}</span><span class="apoio" style="white-space:nowrap">{r}</span></div>'
    return t02(extra=f'''<div class="veu"></div><div class="painel" style="height:592px" role="dialog" aria-label="Split">
<div class="alca"></div>
<div class="lin entre"><span class="tit">FSC · Split 3 · Várzea</span><span class="rot num">6V 3D</span></div>
<p class="apoio" style="margin:4px 0 8px">Sobe com 10 vitórias ou mais · cai com 3 ou menos (na Várzea ninguém cai) · renda ×1 · rivais com poder 60</p>
<div style="flex:1">{linhas}</div>
<button class="btn alto" style="margin-top:8px" data-alvo>Fechar</button></div>''')

def t06(simbolo, titulo, placar, linhas, apoio, split=3, h=400):
    ps = ''.join(f'<p class="rot" style="margin:4px 0">{l}</p>' for l in linhas)
    return t02(extra=f'''<div class="veu"></div><div class="painel" style="height:{h}px;text-align:center" role="dialog" aria-label="Fim do split">
<div class="alca"></div>
<span class="apoio">Fim do split {split}</span>
<div style="font-size:48px;line-height:56px;font-weight:800" aria-hidden="true">{simbolo}</div>
<span class="tit">{titulo}</span>
<span class="grande num" style="margin:8px 0">{placar}</span>
{ps}<p class="apoio" style="margin:4px 0">{apoio}</p>
<div style="flex:1"></div>
<button class="btn alto prim" data-alvo>Continuar</button></div>''')

figs = [
    fig('T05 — Split (painel)', 'Abre ao tocar no card do split. 14 partidas, 2 contra cada rival, com sigla e nome. V/D por letra + ícone. Sigla do clube no título (RN-019).', t05()),
    fig('T06 — Subiu', 'Multiplicador, rival e chance novos. Celebração curta. Se a divisão é inédita, “Continuar” abre o capítulo (T07); se não, a fala de 1 linha (A03).',
        t06('↑', 'Subiu ao Acesso', '11V 3D', ['Renda ×1 → ×2', f'Rival 60 → 220 · chance 77% → {pct(chance(72, 220))}'], 'Fortaleça o elenco para encarar a nova divisão. O split 4 já começou.')),
    fig('T06 — Manteve (Várzea)', 'Explica a regra que faltou, sem culpa.',
        t06('—', 'Ficou na Várzea', '7V 7D', ['Precisava de 10 vitórias para subir.'], 'Na Várzea ninguém cai. O split 4 já começou.')),
    fig('T06 — Caiu', 'Efeito na renda e chance na divisão nova. Tom do lore: queda não é tragédia.',
        t06('↓', 'Caiu para o Acesso', '3V 11D', ['Renda ×4 → ×2', f'Rival 900 → 220 · chance 21% → 95%'], '“Caiu? Levanta. A gente conhece o caminho.” — Dona Cel')),
    fig('T06 — Manteve (Mundial)', 'No Mundial ninguém sobe; 4 a 9 vitórias mantêm. Diz o que faltou para o título.',
        t06('—', 'Ficou no Mundial', '8V 6D', ['Precisava de 10 vitórias para o título mundial.'], 'O split 9 já começou.', split=8)),
    fig('T06 — Título mundial', 'RN-010: split no Mundial com 10+ vitórias. Estrela + palavra (não só cor). Registrado no histórico. No 1º título, “Continuar” abre o epílogo (T07).',
        t06('★', 'Campeão mundial!', '12V 2D', ['Título registrado no histórico (total: 1)', 'Continua no Mundial · renda ×32'], '“Que campanha, Faísca eSports!” — Zeca Trovão. O split 10 já começou.', split=9)),
]
pagina('T05-split-e-fim.html', 'T05 Split e T06 Fim do split',
       'RN 008, 009, 010, 019. Fluxo: NX-012. “Split” = bloco de 14 partidas (RN-010); “Temporada” só no arco narrativo. Painéis sobre a T02; subiu/manteve/caiu/título diferenciados por símbolo, palavra e frase, não por cor.', figs)

# =====================================================================
# T07 — Capítulo
# =====================================================================
reset()
B4 = ('A Rastro já está gravando.<br>— Gente, gente, olha o torto dessa placa! Isso é patrimônio histórico!<br>'
      'O Pedra endireita a placa com um dedo. Não fala nada. Sorri um pouco.')
B8 = 'Lá fora, alguém grita do outro lado da rua. Depois, o bairro inteiro:<br>— <b>Acende, Faísca eSports!</b>'
figs = [
    fig('1. Capítulo de divisão, no meio', 'Primeira chegada ao Acesso (em qualquer run). Texto em blocos (≤ 280 caracteres); tocar no texto ou em Continuar avança. Pular do mesmo tamanho.',
        capitulo('Capítulo 1 de 5 · Acesso', 'A placa nova', 4, 8, B4, [btn('Pular'), btn('Continuar', 'prim')], 'Leitura de ~45 s.')),
    fig('2. Último bloco', 'Um botão: Fechar. Na 1ª vez, apoio diz que fica salvo. Ao fechar, o relógio de partida volta a contar.',
        capitulo('Capítulo 1 de 5 · Acesso', 'A placa nova', 8, 8, B8, [btn('Fechar', 'prim')], 'Capítulos ficam salvos na Jornada.')),
    fig('3. Releitura (da Jornada)', 'Sem Pular. Anterior/Próximo embaixo; ‹ no topo fecha. O relógio também pausa (RN-018).',
        capitulo('Capítulo 1 · A placa nova', 'A placa nova', 4, 8, B4, [btn('‹ Anterior'), btn('Próximo ›')], 'Releitura.', voltar=True)),
    fig('4. Capítulo da 1ª refundação', 'Abre depois da T11 só na 1ª refundação (RN-018). Nas seguintes, a T11 traz só a frase da Dona Cel.',
        capitulo('Refundação · Várzea', '[LORE: título]', 1, 4, '[LORE: bloco 1 — Dona Cel no balcão vazio: “Refundar não é perder.”]',
                 [btn('Pular'), btn('Continuar', 'prim')], 'Leitura de ~30 s.')),
    fig('5. Epílogo da Temporada 1', 'Abre depois da T06 “Campeão mundial!” (ou da T13) no 1º título mundial. Depois dele o jogo continua igual.',
        capitulo('Epílogo · Temporada 1', '[LORE: título]', 1, 6, '[LORE: bloco 1 do epílogo — a volta ao bairro com o título.]',
                 [btn('Pular'), btn('Continuar', 'prim')], 'Leitura de &lt; 1 min.')),
]
pagina('T07-capitulo.html', 'T07 — Capítulo de história',
       'RN 009, 013, 018. Fluxo: NX-017. Prólogo (T01), 5 capítulos de divisão, 1ª refundação e epílogo usam o mesmo componente. Ver uma vez ou pular = visto; nunca reaparece sozinho. Relógio de partida pausado enquanto aberto.', figs)

# =====================================================================
# T08 — Jornada e prestígio (T09–T11)
# =====================================================================
reset()
DIVS = ['Várzea', 'Acesso', 'Ascensão', 'Elite', 'Continental', 'Mundial']
def grade_div(melhor, atual):
    s = ''
    for i, d in enumerate(DIVS):
        mk = '✓' if i <= melhor else '—'
        cls = ' class="atual"' if i == atual else ''
        s += f'<span{cls}>{mk} {d}</span>'
    return f'<div class="bloco" style="height:84px;gap:4px"><span class="apoio corta" style="flex:none">Desde a última refundação: ✓ alcançada · escura = atual</span><div class="grade6">{s}</div></div>'

def topo_jornada(nome='Faísca eSports', sigla='FSC'):
    return (f'<div class="bloco lin entre" style="height:56px;padding-right:4px"><span style="min-width:0"><span class="apoio">Jornada</span>'
            f'<span class="sub corta">{html.escape(nome)} <span class="chip">{sigla}</span></span></span>'
            f'<button class="btn" style="width:104px" data-alvo>Renomear</button></div>')

def bloco_legado(leg, renda, poder, hist=''):
    h = f'<span class="apoio">{hist}</span>' if hist else ''
    return (f'<div class="bloco" style="height:64px"><div class="lin entre"><span class="lin"><span class="icone" style="width:32px;height:32px">leg.</span>'
            f'<span class="grande num">{leg}</span><span class="rot">Legado</span></span>'
            f'<span class="apoio num" style="text-align:right">renda ×{renda}<br>poder ×{poder}</span></div>{h}</div>')

def card_refundar_travado(melhor):
    return f'''<div style="padding:8px 16px;flex:none"><div class="cartao" style="flex-direction:column;align-items:stretch;gap:4px;border-style:dashed"><span class="sub">Refundar o clube · travado</span>
<span class="rot">🔒 Chegue à Ascensão para liberar</span>
<span class="apoio">Melhor divisão desde a última refundação: {melhor}</span></div></div>'''

def card_refundar_disp(ganho):
    return f'''<div style="padding:8px 16px;flex:none"><div class="cartao" style="flex-direction:column;align-items:stretch;gap:4px"><span class="sub">Refundar o clube</span>
<span class="apoio">Recomece na Várzea com bônus permanente.</span>
<span class="rot num">Você ganha {ganho} de Legado</span>
<button class="btn alto prim" data-alvo>Ver o que muda</button></div></div>'''

def lista_caps(itens, hist=''):
    s = '<span class="rot">Capítulos</span>'
    for t, est in itens:
        if est == 'ler':
            s += f'<div class="cartao" style="min-height:48px;flex:none" data-alvo><span class="rot corta" style="flex:1">{t}</span><span class="apoio">Reler ›</span></div>'
        else:
            s += f'<div class="cartao" style="min-height:48px;flex:none;border-style:dashed"><span class="rot corta" style="flex:1">{t}</span><span class="apoio" style="white-space:nowrap">🔒 {est}</span></div>'
    if hist:
        s += f'<span class="rot" style="margin-top:4px">Histórico</span><span class="apoio">{hist}</span>'
    return f'<div class="lista rola" style="padding-top:0;gap:6px">{s}</div><div class="rola-ind" style="flex:none">↕ rola</div>'

def t09_corpo():
    return f'''<div class="bloco lin entre" style="height:48px;padding:0 16px 0 0"><span class="lin"><button class="btn" style="border:0;background:none" aria-label="Voltar" data-alvo>‹</button><span class="tit">Refundar o clube</span></span></div>
<div style="padding:8px 16px;flex:1;display:flex;flex-direction:column;gap:8px"><span style="align-self:flex-start">{pausa()}</span>
<span class="rot">Você ganha 25 de Legado. Ouro, negócios, níveis e divisão voltam ao começo.</span>
{cartao_col('Você ganha', '<span class="grande num">+25 Legado</span>', '<span class="apoio num">total 0 → 25 · renda ×1 → ×2,25 · poder ×1 → ×1,25</span>')}
{cartao_col('Zera', '<span class="rot num">Ouro (45,6 mi → 10) · 6 negócios · níveis dos 5 jogadores · divisão (volta à Várzea) · split atual (6V 3D)</span>', extra_style='border-width:2.5px')}
{cartao_col('Mantém', '<span class="rot">Legado · capítulos vistos · histórico e títulos · nome do clube · ajustes</span>')}
<span class="apoio">Se subir mais antes: Continental = 45 · Mundial = 80.</span></div>
{barra_baixo(btn('Voltar'), btn('Continuar', 'prim'))}'''

figs = [
    fig('T08 — Começo do jogo', 'Prólogo já visto (lista nunca fica vazia). Refundação travada com cadeado + texto “Chegue à Ascensão” (critério NX-014).',
        topo_jornada() + bloco_legado('0', '1', '1') + grade_div(0, 0) + card_refundar_travado('Várzea')
        + lista_caps([('Prólogo', 'ler'), ('Capítulo 1', 'chegue ao Acesso')]) + abas('Jornada')),
    fig('T08 — Refundação disponível', 'Mostra o Legado que ganharia agora (melhor divisão: Elite). Aba com marcador. Sem pisca-pisca nem contagem.',
        topo_jornada() + bloco_legado('0', '1', '1') + grade_div(3, 3) + card_refundar_disp(25)
        + lista_caps([('Prólogo', 'ler'), ('1 · A placa nova', 'ler'), ('2 · O uniforme dos outros', 'ler'), ('3 · A planilha e o barro', 'ler'), ('Capítulo 4', 'chegue ao Continental')]) + abas('Jornada', ('Jornada',))),
    fig('T09 — Etapa 1: o que muda', 'Texto do lore + ganha / zera (com valores atuais) / mantém. Relógio de partida pausado (RN-013).', t09_corpo()),
    fig('T10 — Etapa 2: confirmação', 'Modal curto, texto do lore. “Agora não” do mesmo tamanho. Toques nos primeiros 500 ms ignorados (anti toque duplo, sem contagem visível).',
        t09_corpo() + '''<div class="veu"></div><div class="modal" style="bottom:24px" role="alertdialog" aria-label="Confirmar refundação">
<span class="tit">Tem certeza?</span>
<span class="rot">O Legado fica para sempre; o resto recomeça na Várzea. Você ganha 25 de Legado.</span>
<span class="apoio">Etapa 2 de 2.</span>
<div class="par"><button class="btn alto" data-alvo>Agora não</button><button class="btn alto perigo" data-alvo>⚠ Refundar</button></div></div>'''),
    fig('T11 — Clube refundado', 'Novo Legado e bônus já ativos. “Começar” leva ao capítulo da 1ª refundação (só na 1ª vez) e depois à T02 na Várzea, com 10 de ouro.',
        f'''<div class="bloco lin" style="height:48px;justify-content:flex-end">{pausa()}</div><div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px 32px;text-align:center">
<span class="icone" style="width:96px;height:96px">ilustração</span>
<span class="tit">[LORE: Clube refundado]</span>
<span class="heroi num">Legado 25</span>
<span class="rot num">renda ×2,25 · poder ×1,25<br>já ativos</span>
<span class="apoio">“Mais uma refundação. O bairro lembra de tudo.” — Dona Cel</span></div>
{barra_baixo(btn('Começar', 'prim'))}'''),
    fig('T08 — Fim da Temporada 1 + nome salvo', 'Legado alto (bônus como multiplicador), todos os capítulos, histórico com títulos mundiais (RN-010). Aviso A04 depois de renomear.',
        topo_jornada('Lan do Farol GG', 'LFG') + bloco_legado('205', '11,25', '3,05') + grade_div(5, 4) + card_refundar_disp(80)
        + lista_caps([('Prólogo', 'ler'), ('1 · A placa nova', 'ler'), ('2 · O uniforme dos outros', 'ler'), ('Refundação · [LORE: título]', 'ler'),
                      ('3 · A planilha e o barro', 'ler'), ('4 · Longe de casa', 'ler'), ('5 · O farol aceso', 'ler'), ('Epílogo · [LORE: título]', 'ler')],
                     hist='Títulos mundiais: 3 · Refundações: 6')
        + abas('Jornada') + '<div class="aviso" style="top:4px" role="status">✓ Nome salvo.</div>'),
]
pagina('T08-jornada-e-prestigio.html', 'T08 Jornada e T09–T11 Refundar o clube',
       'RN 001, 010, 013, 014, 018, 019. Fluxos: NX-014, NX-017, NX-018. Duas etapas em telas diferentes; “Voltar”/“Agora não” do mesmo tamanho que “Continuar”/“Refundar”. A Jornada rola (fora do loop principal).', figs)

# =====================================================================
# T13 — Enquanto você esteve fora
# =====================================================================
reset()
def t13(tempo, tempo_apoio, ouro_total, ouro_det, partidas, splits, fala='', primeira=''):
    ta = f'<span class="apoio">{tempo_apoio}</span>' if tempo_apoio else ''
    f = f'<span class="apoio">{fala}</span>' if fala else ''
    pr = f'<p class="apoio" style="margin:0">{primeira}</p>' if primeira else ''
    sp = ''
    if splits:
        linhas = ''.join(f'<div class="splitlin"><span>{a}</span><span style="text-align:right;font-weight:600">{b}</span></div>' for a, b in splits)
        sp = f'<div class="cartao rola" style="flex-direction:column;align-items:stretch;gap:0;flex:0 1 auto;min-height:0;padding:4px 12px"><span class="apoio">Splits</span>{linhas}</div>'
    return f'''<div class="bloco lin entre" style="height:56px"><span class="tit">Enquanto você esteve fora</span></div>
<div style="padding:4px 16px 0;display:flex;justify-content:space-between;align-items:center">{f}{pausa()}</div>
<div style="padding:8px 16px;flex:1;display:flex;flex-direction:column;gap:8px;min-height:0" data-testid="offline">
<div class="cartao" style="justify-content:space-between"><span class="apoio">Tempo fora</span><span style="text-align:right"><span class="sub num">{tempo}</span>{('<br>' + ta) if ta else ''}</span></div>
<div class="cartao" style="flex-direction:column;align-items:flex-start;gap:0"><span class="apoio">Ouro</span><span class="heroi num">{ouro_total}</span><span class="apoio num">{ouro_det}</span></div>
<div class="cartao" style="justify-content:space-between"><span class="apoio">Partidas</span><span class="rot num" style="text-align:right">{partidas}</span></div>
{sp}{pr}</div>
{barra_baixo(btn('Receber', 'prim'))}'''

figs = [
    fig('1. Primeiro retorno', 'Linha extra explica a regra (só na 1ª vez). Fala de 1 linha da Bússola (lore). Ouro separado em renda fora + prêmios (RN-011).',
        t13('12 min', '', '+' + fmt(12 * 720 * 0.5 + 5 * 720), f'{fmt(12 * 720 * 0.5)} da renda · {fmt(5 * 720)} de prêmios (5 vitórias)', '8 jogadas · <span class="marca">V</span> 5 · <span class="marca">D</span> 3',
            [('Split 3 · em andamento', '8V 4D')], fala='“A gente jogou 5-3 enquanto você esteve fora.” — Bússola',
            primeira='[LORE: Fora do jogo, o clube rende metade e segue jogando até subir ou cair. Conta até 8 h.]')),
    fig('2. Mais de 8 h, subiu (Gherkin NX-013)', 'Renda 100/s: 1,44 mi + 6.000 por vitória. Partidas param no fim do 1º split com subida (RN-011); o próximo começa com o app aberto.',
        t13('10 h 05 min', 'Contamos as 8 h máximas', '+' + fmt(1440000 + 4 * 6000), f'{fmt(1440000)} da renda · {fmt(24000)} de prêmios (4 vitórias)', '5 jogadas · <span class="marca">V</span> 4 · <span class="marca">D</span> 1',
            [('Split 3 · terminou', '10V 4D · ↑ Subiu ao Acesso'), ('Partidas param quando o clube sobe ou cai.', '')])),
    fig('3. Vários splits (Várzea)', '7 h fora com time fraco: 280 partidas. O split do meio vira uma linha-resumo; a lista rola, os totais não. “Receber” é a única ação.',
        t13('7 h', '', '+' + fmt(151200 + 84 * 720), f'{fmt(151200)} da renda · {fmt(84 * 720)} de prêmios (84 vitórias)', '280 jogadas · <span class="marca">V</span> 84 · <span class="marca">D</span> 196',
            [('Split 3 · terminou', '3V 11D · — Ficou na Várzea'), ('Splits 4 a 22 · 19 splits', '80V 186D · — Ficou em todos'), ('Split 23 · em andamento', '3V 6D')])),
    fig('4. Mundial: títulos e queda', 'Títulos mundiais com ★ + palavra. Parou na queda. No 1º título da vida, “Receber” abre o epílogo (T07).',
        t13('6 h 40 min', '', '+' + fmt(2.1e12), f'{fmt(1.2e12)} da renda · {fmt(0.9e12)} de prêmios (91 vitórias)', '168 jogadas · <span class="marca">V</span> 91 · <span class="marca">D</span> 77',
            [('Split 9 · terminou', '11V 3D · ★ Campeão mundial'), ('Splits 10 a 19 · 10 splits', '77V 63D · ★ 2 títulos'), ('Split 20 · terminou', '3V 11D · ↓ Caiu para o Continental')])),
    fig('5. Pouco tempo, sem partidas', 'Entre 60 s e o relógio da próxima partida: só ouro. Abaixo de 60 s esta tela não aparece (crédito direto, RN-011).',
        t13('1 min 12 s', '', '+' + fmt(12 * 72 * 0.5), f'{fmt(12 * 72 * 0.5)} da renda · sem prêmios', 'Nenhuma partida jogada', [])),
]
pagina('T13-offline.html', 'T13 — Enquanto você esteve fora',
       'RN 009, 011, 012, 016, 017. Fluxo: NX-013. Só com t_off ≥ 60 s. Uma tela, uma ação. Nada é creditado antes desta tela; voltar do sistema credita igual a “Receber”. Sem oferta, sem “dobrar”. Relógio de partida pausado.', figs)

# =====================================================================
# T14 — Ajustes, T16 Exportar, T17 Importar
# =====================================================================
reset()
def linha_aj(rot, apoio, botao, w=96, extra=''):
    return (f'<div class="cartao" style="min-height:64px;flex:none{extra}"><span style="flex:1;min-width:0"><span class="rot">{rot}</span><br><span class="apoio">{apoio}</span></span>'
            f'{botao}</div>')
def sw(txt, w=96): return f'<button class="btn" role="switch" aria-checked="false" style="width:{w}px" data-alvo>{txt}</button>'
def t14(ilegivel=False, extra=''):
    il = ''
    if ilegivel:
        il = linha_aj('Save que não abriu', 'Guardado em 19/11, 22:10. Útil para pedir ajuda.', '<button class="btn" style="width:96px" data-alvo>Exportar</button>')
    return f'''<div class="bloco lin" style="height:48px;padding:0"><button class="btn" style="border:0;background:none" aria-label="Voltar" data-alvo>‹</button><span class="tit">Ajustes</span></div>
<div class="lista rola">
{linha_aj('Nome do clube', 'Faísca eSports · FSC', '<button class="btn" style="width:96px" data-alvo>Mudar</button>')}
{linha_aj('Reduzir animações', 'Segue o sistema por padrão', sw('Sistema'))}
{linha_aj('Vibração ao tocar', 'Toque curto no Fazer live', sw('Desligado'))}
{linha_aj('Notificações', 'Desligadas. Só avisamos se você ligar.', sw('Desligado'))}
{linha_aj('Rever dicas', 'Mostra as dicas do começo. Não mexe no progresso.', '<button class="btn" style="width:96px" data-alvo>Rever</button>')}
<div class="cartao" style="flex:none;flex-direction:column;align-items:stretch;gap:6px"><span class="rot">Save</span><span class="apoio">Salvo sozinho. Último save: há 4 s. Exporte de vez em quando: se os dados do navegador forem apagados, é assim que o clube volta.</span>
<div class="par"><button class="btn" data-alvo>Exportar</button><button class="btn" data-alvo>Importar</button></div></div>
{il}<p class="apoio" style="margin:0">Nexus Idle é um projeto de fã, gratuito. Nada aqui é vendido.</p>
</div><div class="rola-ind" style="flex:none;height:20px">↕ rola</div>{extra}'''

SAVE_TXT = 'NXI1.eyJ2IjoxLCJjbHViZSI6IkZhw61zY2EgZVNwb3J0cyIsInNpZ2xhIjoiRlNDIiwiZGl2IjozLCJsZWdhZG8iOjI1fQ.c9a1f0'
def painel(titulo, corpo, h):
    return f'<div class="veu"></div><div class="painel" style="height:{h}px;gap:8px" role="dialog" aria-label="{titulo}"><div class="alca"></div><span class="tit">{titulo}</span>{corpo}</div>'

figs = [
    fig('T14 — Ajustes', 'Nome do clube (leva à T15), save com Exportar/Importar (RN-015). Alvos ≥ 48 px, estado em texto.', t14()),
    fig('T16 — Exportar save (painel)', 'Texto do save + Copiar e Salvar arquivo, do mesmo tamanho. Depois de copiar: aviso “Copiado.”. Não mexe no jogo.',
        t14(extra=painel('Exportar save', f'''<span class="apoio">Guarde este texto fora do jogo (notas, e-mail para você). Com ele, o clube volta mesmo se os dados do navegador forem apagados.</span>
<div class="cartao mono" style="height:72px;overflow:hidden;align-items:flex-start">{SAVE_TXT}</div>
<span class="apoio">Faísca eSports · FSC · Elite · Legado 25 · agora</span>
<div class="par"><button class="btn alto" data-alvo>Copiar texto</button><button class="btn alto" data-alvo>Salvar arquivo</button></div>
<button class="btn alto" data-alvo>Fechar</button>''', 400))),
    fig('T17 — Importar: prévia', 'Colar o texto ou escolher arquivo. O jogo confere o save (checksum) e mostra de quem é antes de qualquer troca.',
        t14(extra=painel('Importar save', f'''<div class="cartao mono" style="height:72px;overflow:hidden;align-items:flex-start">{SAVE_TXT}</div>
<div class="par"><button class="btn" data-alvo>Colar</button><button class="btn" data-alvo>Escolher arquivo</button></div>
{cartao_col('Save encontrado', '<span class="rot">Faísca eSports · FSC</span>', '<span class="apoio num">Elite · Legado 25 · salvo em 18/11, 21:04</span>')}
<div style="flex:1"></div>
<div class="par"><button class="btn alto" data-alvo>Cancelar</button><button class="btn alto prim" data-alvo>Usar este save</button></div>''', 440))),
    fig('T17 — Importar: texto inválido', 'Diz o que aconteceu e o que fazer. Nada foi alterado. Save editado à mão conta como inválido (RN-015).',
        t14(extra=painel('Importar save', '''<div class="cartao mono" style="height:72px;overflow:hidden;align-items:flex-start">NXI1.eyJ2IjoxLCJjbHViZSI6IkZhw61zY2EgZVNwb3J0cyIsInNpZ2xhIjoiRlNDIiwiZGl2Ijo5OTk5fQ.c9a1f0</div>
<div class="par"><button class="btn" data-alvo>Colar</button><button class="btn" data-alvo>Escolher arquivo</button></div>
<div class="cartao" style="flex-direction:column;align-items:flex-start;gap:2px;border-width:3px"><span class="rot">⚠ Esse texto não é um save válido</span><span class="apoio">Ele está incompleto ou foi alterado. Seu clube atual continua igual. Confira se copiou o texto inteiro.</span></div>
<div style="flex:1"></div>
<div class="par"><button class="btn alto" data-alvo>Cancelar</button><button class="btn alto off" data-alvo>Usar este save</button></div>''', 440))),
    fig('T17 — Importar: confirmação', 'RN-015: nunca apaga um save válido sem confirmar. Mostra o que sai e o que entra; oferece exportar o atual antes.',
        t14() + '''<div class="veu"></div><div class="modal" style="bottom:24px" role="alertdialog" aria-label="Trocar de clube">
<span class="tit">Trocar o clube atual?</span>
<span class="rot">Sai: Faísca eSports · Continental · Legado 70.<br>Entra: Faísca eSports · Elite · Legado 25.</span>
<span class="apoio">O clube atual será substituído. Se quiser guardá-lo, exporte antes.</span>
<button class="btn" style="border-style:dashed" data-alvo>Exportar o atual primeiro</button>
<div class="par"><button class="btn alto" data-alvo>Cancelar</button><button class="btn alto prim" data-alvo>Trocar clube</button></div></div>'''),
    fig('T14 — Com save ilegível guardado', 'Depois de “Começar clube novo” na T12c: a linha extra permite exportar o save que não abriu (RN-015). A lista rola.',
        t14(ilegivel=True)),
]
pagina('T14-ajustes.html', 'T14 Ajustes, T16 Exportar save e T17 Importar save',
       'RN 013 (configurações e nome mantidos), 015, 016, 019. Fluxos: NX-015, NX-016, NX-018. O tamanho do texto segue a fonte do sistema (sem ajuste próprio no MVP).', figs)

# =====================================================================
# T15 — Nome do clube (NX-018)
# =====================================================================
reset()
def t15(nome, cont, sigla, erro_nome='', erro_sigla='', salvar='prim', teclado=False, foco='nome', previa=True):
    def campo(valor, f, erro, w=''):
        cur = '<span class="cursor"></span>' if f else ''
        cls = 'campo erro' if erro else 'campo'
        return f'<div class="{cls}" style="{w}" data-alvo><span class="corta">{html.escape(valor)}{cur}</span></div>'
    en = f'<span class="msg-erro">⚠ {erro_nome}</span>' if erro_nome else ''
    es = f'<span class="msg-erro">⚠ {erro_sigla}</span>' if erro_sigla else '<span class="apoio">3 letras de A a Z. Não pode repetir a de um rival.</span>'
    pv = ''
    if previa and not teclado:
        pv = f'''<div class="cartao" style="flex-direction:column;align-items:flex-start;gap:2px"><span class="apoio">Como aparece</span>
<span class="rot corta" style="max-width:100%">{html.escape(nome) if nome.strip() else '—'}</span><span class="apoio num">{html.escape(sigla) or '—'} · Split 3 · Várzea</span><span class="apoio">“Acende, {html.escape(nome) if nome.strip() else '…'}!”</span></div>'''
    kb = '<div class="teclado">teclado do sistema</div>' if teclado else ''
    bar_style = 'position:absolute;left:0;right:0;bottom:260px;background:#fff;z-index:36' if teclado else ''
    s_btn = btn('Salvar', salvar)
    bar = f'<div class="bloco" style="height:72px;border-top:1px solid #bbb;border-bottom:0;{bar_style}"><div class="par">{btn("Cancelar")}{s_btn}</div></div>'
    return f'''<div class="bloco lin" style="height:48px;padding:0"><button class="btn" style="border:0;background:none" aria-label="Voltar" data-alvo>‹</button><span class="tit">Nome do clube</span></div>
<div style="padding:12px 16px;flex:1;display:flex;flex-direction:column;gap:6px;min-height:0">
<div class="lin entre"><span class="rot">Nome</span><span class="apoio num">{cont}/20</span></div>
{campo(nome, foco == 'nome', erro_nome)}{en}
<span class="rot" style="margin-top:8px">Sigla</span>
{campo(sigla, foco == 'sigla', erro_sigla, 'width:120px')}{es}
{pv}</div>
{bar}{kb}'''

figs = [
    fig('1. Padrão', 'Abre pela Jornada (“Renomear”) ou por Ajustes. Valores atuais preenchidos; contador visível; prévia de como aparece.',
        t15('Faísca eSports', 14, 'FSC', foco='')),
    fig('2. Digitando (teclado aberto)', 'Campos e botões ficam acima do teclado; a prévia some para dar espaço. A tecla “Concluir” do teclado = Salvar.',
        t15('Lan do Farol GG', 15, 'FSC', teclado=True)),
    fig('3. Erros de nome e sigla', 'Mensagem perto do campo, com o que fazer. Salvar desabilitado enquanto houver erro. Sigla de rival: diz de quem é.',
        t15('', 0, 'VTX', erro_nome='Dê um nome ao clube.', erro_sigla='VTX já é a sigla da Vértice. Escolha outra.', salvar='off', foco='')),
    fig('4. Sigla inválida e nome no limite', 'Letras viram maiúsculas sozinhas. Número, acento ou símbolo não entram e mostram “Só letras de A a Z, sem acento nem número.” Com 20/20, o campo não aceita mais (colar texto maior corta e avisa).',
        t15('Faísca da Lan do Far', len('Faísca da Lan do Far'), 'FS', erro_nome='', erro_sigla='A sigla precisa de 3 letras. Falta 1.', salvar='off', foco='sigla')),
    fig('5. Texto com &lt;script&gt;', 'RN-019: texto puro. O nome aparece literal na prévia e em todo o jogo; nada é interpretado.',
        t15('<script>', 8, 'XSS', foco='')),
]
pagina('T15-nome-do-clube.html', 'T15 — Nome do clube (NX-018)',
       'RN 013 (nome mantido na refundação), 015 (salva ao confirmar), 019. Fluxo: NX-018. Padrão: Faísca eSports / FSC.', figs)

# =====================================================================
# índice
# =====================================================================
itens = [
    ('T00-T12-carregar-e-save.html', 'T00 Carregando · T12a/b/c Save (recuperado, ilegível, clube novo) · A05 Sem espaço'),
    ('T01-boas-vindas.html', 'T01 Boas-vindas (prólogo)'),
    ('T02-principal.html', 'T02 Clube (principal) + A01 resultado + A02 dicas + A03 fala de retorno'),
    ('T03-negocios.html', 'T03 Negócios'),
    ('T04-elenco.html', 'T04 Elenco'),
    ('T05-split-e-fim.html', 'T05 Split · T06 Fim do split (com título mundial)'),
    ('T07-capitulo.html', 'T07 Capítulo (divisão, releitura, 1ª refundação, epílogo)'),
    ('T08-jornada-e-prestigio.html', 'T08 Jornada · T09–T11 Refundar o clube · A04'),
    ('T13-offline.html', 'T13 Enquanto você esteve fora (vários splits)'),
    ('T14-ajustes.html', 'T14 Ajustes · T16 Exportar save · T17 Importar save'),
    ('T15-nome-do-clube.html', 'T15 Nome do clube (NX-018)'),
]
li = ''.join(f'<li><a href="{a}">{t}</a></li>' for a, t in itens)
idx = f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Wireframes — Nexus Idle</title>
<style>body{{font-family:system-ui,sans-serif;max-width:640px;margin:24px auto;padding:0 16px;line-height:1.5}} li{{margin:8px 0}} a{{display:inline-block;min-height:48px;line-height:48px}}</style></head>
<body><h1>Wireframes de baixa fidelidade — v0.2 (NX-004, NX-009)</h1><p>360×640 retrato. RN v0.2 e nomes finais do lore. Mapa: <code>docs/ux/mapa-de-telas.md</code>. Fluxos: <code>docs/ux/fluxos/</code>.</p><ul>{li}</ul></body></html>
'''
with open(os.path.join(OUT, 'index.html'), 'w') as f:
    f.write(idx)
print('ok')
