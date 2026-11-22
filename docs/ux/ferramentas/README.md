# Ferramentas do UX

Geram e conferem os wireframes de `docs/ux/wireframes/` (NX-004 e NX-009). Foram trazidas de
`/tmp/nxux/` pelo PO em 22/11/2026 para não se perderem.

- `gerar.py`: gera os HTML dos wireframes e o `index.html` (usa `fmt.py` para a RN-017 e `base.css`).
- `check.mjs`: abre cada wireframe no Chrome headless em 360×640 e confere estouro de tela, alvos
  ≥ 48 px, texto ≥ 12 px, cortes e nomes provisórios.

Uso (na raiz do repositório):

```
python3 docs/ux/ferramentas/gerar.py docs/ux/wireframes
node docs/ux/ferramentas/check.mjs docs/ux/wireframes            # opcional: --shots <pasta>
```

Os wireframes apontam para os SVGs de `assets/` por caminho relativo (`../../../assets/`): gere
sempre em `docs/ux/wireframes/`, senão os retratos chibi aparecem quebrados. O `check.mjs` usa o
Playwright global e o Chrome em `/usr/bin/google-chrome`.
