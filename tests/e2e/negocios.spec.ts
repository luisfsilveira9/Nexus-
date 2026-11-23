// Nexus Idle — NX-010 (negócios e toque) — E2E. Dono: nexus-qa.
// RN-001 a RN-006 e RN-017. Gherkin da NX-010 (docs/produto/backlog.md) e casos E2E de
// docs/qa/casos/economia-renda.md e exibicao-e-honestidade.md. O nome de cada teste começa pelo ID.
//
// Telas: T02 (Clube) e T03 (Negócios) dos wireframes do UX. Seletores e montagem do save em
// tests/e2e/apoio/negocios.ts (nomes que não estão nos wireframes: pedido QA-31).
// @smoke = roda no PR (360×640); o resto roda na main, nos 4 perfis.
// Relógio: quando o ouro tem de ficar exato entre dois passos, o cenário abre com o relógio do
// Playwright parado (`relogio: 'parado'`), senão a renda anda e o teste fica instável em aparelho lento.
//
// ATIVAÇÃO: o spec foi escrito antes da implementação (shift-left) e ficou em "fixme" até a NX-010
// entrar. Desde 22/11 (NX-010 entregue) NX010_ENTREGUE = true e ele roda por padrão no PR e na main.
import { expect, test } from './rede.ts';
import {
  AULAS,
  IDS,
  PATROCINIO,
  TID,
  abrirClubeNovoParado,
  abrirCom,
  esperarDesabilitado,
  esperarNumero,
  escolherLote,
  esperarAnuncioSumir,
  irParaClube,
  irParaNegocios,
  alinharNoTique,
  lerSave,
  numeroEm,
  paraNumero,
} from './apoio/negocios.ts';

const NX010_ENTREGUE = true; // ligado em 22/11: NX-010 entregue (docs/tech/nx-010-relatorio.md)
const ATIVO = NX010_ENTREGUE || process.env.E2E_NX010 === '1';

test.describe('NX-010 negócios e toque', () => {
  test.fixme(!ATIVO, 'A NX-010 ainda não entrou (ver ATIVAÇÃO no topo do arquivo).');

  // ---------- Compra do 1º negócio ----------

  test('CT-070 compra o 1º "Aulas na lan": ouro 0, renda 0,5/s e próximo custo 11,5 @smoke', async ({
    page,
  }) => {
    // Relógio parado: o Gherkin fala do instante da compra (depois dela a renda de 0,5/s anda).
    await abrirClubeNovoParado(page);
    await esperarNumero(page.getByTestId(TID.ouro), '10', 'clube novo com 10 de ouro (CT-007)');
    await irParaNegocios(page);
    await escolherLote(page, '1');
    await expect(page.getByTestId(TID.quantidade(AULAS))).toHaveText('0');
    await esperarNumero(page.getByTestId(TID.custo(AULAS)), '10');

    await page.getByTestId(TID.comprar(AULAS)).tap();

    await expect(page.getByTestId(TID.quantidade(AULAS))).toHaveText('1');
    // Com ouro 0 o botão fica desabilitado e mostra "Faltam 11,5" (= 11,5 − 0); com ouro, "11,5".
    const custoOuFaltam = page
      .getByTestId(TID.custo(AULAS))
      .or(page.getByTestId(TID.faltam(AULAS)));
    await esperarNumero(custoOuFaltam, '11,5', 'próximo custo exibido 11,5 (10 × 1,15)');
    await irParaClube(page);
    await esperarNumero(page.getByTestId(TID.ouro), '0');
    await esperarNumero(page.getByTestId(TID.renda), '0,5');
    await expect(page.getByTestId(TID.renda)).toContainText('/s');
  });

  test('CT-020 com ouro sobrando, o botão mostra o custo 11,5 da 2ª unidade', async ({
    context,
  }) => {
    const page = await abrirCom(context, { ouro: 20, negocios: [1, 0, 0, 0, 0, 0] });
    await irParaNegocios(page);
    await escolherLote(page, '1');
    await esperarDesabilitado(page.getByTestId(TID.comprar(AULAS)), false);
    await esperarNumero(page.getByTestId(TID.custo(AULAS)), '11,5');
  });

  test('CT-615 o botão segue o valor real: 11,49 não compra; 11,49999999885 mostra 11,5 e compra', async ({
    context,
  }) => {
    // Relógio parado: com 1 unidade a renda é 0,5/s e o ouro andaria durante o teste.
    let page = await abrirCom(
      context,
      { ouro: 11.49, negocios: [1, 0, 0, 0, 0, 0] },
      { relogio: 'parado' },
    );
    await esperarNumero(page.getByTestId(TID.ouro), '11,4');
    await irParaNegocios(page);
    await escolherLote(page, '1');
    await esperarDesabilitado(page.getByTestId(TID.comprar(AULAS)), true);

    page = await abrirCom(
      context,
      { ouro: 11.5 * (1 - 1e-10), negocios: [1, 0, 0, 0, 0, 0] },
      { relogio: 'parado' },
    );
    await esperarNumero(page.getByTestId(TID.ouro), '11,5');
    await irParaNegocios(page);
    await escolherLote(page, '1');
    await esperarDesabilitado(page.getByTestId(TID.comprar(AULAS)), false);
    await page.getByTestId(TID.comprar(AULAS)).tap();
    await expect(page.getByTestId(TID.quantidade(AULAS))).toHaveText('2');
    await irParaClube(page);
    await esperarNumero(page.getByTestId(TID.ouro), '0');
  });

  test('CT-060 dois toques seguidos no ×1 compram 1 só e o ouro não fica negativo @smoke', async ({
    context,
  }) => {
    // Clube novo (10 de ouro), relógio parado para o save lido abaixo ser o da compra.
    const page = await abrirCom(context, {}, { relogio: 'parado' });
    await irParaNegocios(page);
    await escolherLote(page, '1');
    // Dois cliques no mesmo quadro, antes de o React redesenhar o botão.
    await page.getByTestId(TID.comprar(AULAS)).evaluate((b: HTMLElement) => {
      b.click();
      b.click();
    });
    await expect(page.getByTestId(TID.quantidade(AULAS))).toHaveText('1');
    const { estado } = await lerSave(page);
    expect(estado.ouro).toBe(0);
    expect((estado.negocios as number[])[0]).toBe(1);
  });

  // ---------- Toque limitado (RN-005) ----------

  // Renda 100/s: 20 "Aulas na lan" (10/s) + 15 "Patrocínio local" (90/s). Toque = 10% = 10.
  const RENDA_100 = { ouro: 0, negocios: [20, 15, 0, 0, 0, 0], ouroRun: 500 };

  test('CT-043 CT-071 8 toques com o relógio parado: só 5 contam, +50 de ouro @smoke', async ({
    context,
  }) => {
    const page = await abrirCom(context, RENDA_100, { relogio: true });
    await esperarNumero(page.getByTestId(TID.renda), '100');
    // Relógio parado: nenhuma renda passiva entra durante os toques (renda isolada, CT-043).
    await page.clock.pauseAt(Date.now() + 2_000);
    await page.waitForTimeout(300); // tempo real, para a tela redesenhar com o relógio parado
    const ouro = page.getByTestId(TID.ouro);
    const antes = paraNumero((await numeroEm(ouro))!);
    for (let i = 0; i < 8; i++) await page.getByTestId(TID.botaoToque).tap();
    // Abaixo de 1.000 o ouro aparece inteiro e para baixo: a diferença é exata.
    await expect
      .poll(async () => paraNumero((await numeroEm(ouro))!) - antes, {
        message: '5 toques × 10; o 6º, o 7º e o 8º são ignorados',
      })
      .toBe(50);
  });

  test('NX-010 Gherkin "toque limitado": 8 toques em 1 s, a cada 125 ms, só 5 contam @smoke', async ({
    context,
  }) => {
    const page = await abrirCom(context, RENDA_100, { relogio: true });
    await esperarNumero(page.getByTestId(TID.renda), '100');
    await page.clock.pauseAt(Date.now() + 2_000);
    const ouro = page.getByTestId(TID.ouro);
    // Isola a renda passiva: começa logo depois de um tique do loop de 1 s, para os 875 ms dos
    // toques caberem antes do tique seguinte.
    await alinharNoTique(page, ouro);
    const antes = paraNumero((await numeroEm(ouro))!);
    for (let i = 0; i < 8; i++) {
      if (i > 0) await page.clock.runFor(125);
      await page.getByTestId(TID.botaoToque).tap();
    }
    await page.waitForTimeout(300); // tempo real, para a tela redesenhar (o relógio do jogo está parado)
    const ganho = paraNumero((await numeroEm(ouro))!) - antes;
    // Toque não credita a renda passiva (hoje): ganho 50. Se passar a creditar antes do toque, entram
    // ~0,9 s de renda (87,5 a 90): ganho 137 a 140. Sem o limite seria 80 ou 167 a 170.
    expect(
      ganho === 50 || (ganho >= 137 && ganho <= 140),
      `ganho ${ganho}: esperado 50 dos toques (5 × 10), mais a renda passiva se houver`,
    ).toBe(true);
  });

  test('CT-044 toque além do limite não mostra aviso, erro nem vibração @smoke', async ({
    context,
  }) => {
    const page = await abrirCom(context, RENDA_100, { relogio: true, espiarVibracao: true });
    const dialogos: string[] = [];
    page.on('dialog', (d) => {
      dialogos.push(d.message());
      void d.dismiss();
    });
    await page.clock.pauseAt(Date.now() + 2_000);
    for (let i = 0; i < 6; i++) await page.getByTestId(TID.botaoToque).tap();
    expect(dialogos).toEqual([]);
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    expect(
      await page.evaluate(() => (window as unknown as { __qaVibrou: unknown[] }).__qaVibrou),
    ).toEqual([]);
  });

  // ---------- Máx e ×10 sem ouro (RN-006, RN-017) ----------

  test('CT-056 CT-072 Máx com ouro 5: desabilitado e "Faltam 5"; tocar não compra @smoke', async ({
    context,
  }) => {
    const page = await abrirCom(context, { ouro: 5 });
    await irParaNegocios(page);
    await escolherLote(page, 'max');
    const botao = page.getByTestId(TID.comprar(AULAS));
    await esperarDesabilitado(botao, true);
    await expect(botao).toContainText(/Faltam/i);
    await esperarNumero(page.getByTestId(TID.faltam(AULAS)), '5');
    await botao.tap({ force: true });
    await expect(page.getByTestId(TID.quantidade(AULAS))).toHaveText('0');
  });

  for (const [ouro, falta] of [
    [9.4, '0,6'],
    [9.94, '0,1'],
    [9.99, '0,1'],
  ] as const) {
    test(`CT-057 Máx com ouro ${ouro}: "Faltam ${falta}", para cima e nunca "Faltam 0" @smoke`, async ({
      context,
    }) => {
      const page = await abrirCom(context, { ouro });
      await irParaNegocios(page);
      await escolherLote(page, 'max');
      await esperarDesabilitado(page.getByTestId(TID.comprar(AULAS)), true);
      await esperarNumero(page.getByTestId(TID.faltam(AULAS)), falta);
    });
  }

  test('CT-058 ×10 com ouro 150: desabilitado, "Faltam 53,1", não compra; Máx compra 8', async ({
    context,
  }) => {
    const page = await abrirCom(context, { ouro: 150 });
    await irParaNegocios(page);
    await escolherLote(page, '10');
    const botao = page.getByTestId(TID.comprar(AULAS));
    await esperarDesabilitado(botao, true);
    await esperarNumero(page.getByTestId(TID.faltam(AULAS)), '53,1');
    await botao.tap({ force: true });
    await expect(page.getByTestId(TID.quantidade(AULAS))).toHaveText('0');

    await escolherLote(page, 'max');
    await esperarDesabilitado(botao, false);
    await botao.tap();
    await expect(page.getByTestId(TID.quantidade(AULAS))).toHaveText('8');
  });

  test('CT-061 ×10 na fronteira: com 203 "Faltam 0,1"; com 203,0371823805271 compra e zera', async ({
    context,
  }) => {
    let page = await abrirCom(context, { ouro: 203 });
    await irParaNegocios(page);
    await escolherLote(page, '10');
    await esperarDesabilitado(page.getByTestId(TID.comprar(AULAS)), true);
    await esperarNumero(page.getByTestId(TID.faltam(AULAS)), '0,1');

    page = await abrirCom(context, { ouro: 203.0371823805271 }, { relogio: 'parado' });
    await irParaNegocios(page);
    await escolherLote(page, '10');
    await page.getByTestId(TID.comprar(AULAS)).tap();
    await expect(page.getByTestId(TID.quantidade(AULAS))).toHaveText('10');
    const { estado } = await lerSave(page);
    expect(estado.ouro as number).toBeGreaterThanOrEqual(0);
    expect(estado.ouro as number).toBeLessThan(1e-9);
  });

  test('CT-053 Máx com ouro 100 compra 6 e sobra 12,4', async ({ context }) => {
    const page = await abrirCom(context, { ouro: 100 }, { relogio: 'parado' });
    await irParaNegocios(page);
    await escolherLote(page, 'max');
    await page.getByTestId(TID.comprar(AULAS)).tap();
    await expect(page.getByTestId(TID.quantidade(AULAS))).toHaveText('6');
    const { estado } = await lerSave(page);
    expect(estado.ouro as number).toBeCloseTo(12.4626156, 6);
  });

  // ---------- Visibilidade pelo ouro ganho na run (RN-003) ----------

  test('CT-025 clube novo: só "Aulas na lan" aparece como comprável @smoke', async ({ page }) => {
    await page.goto('./');
    await irParaNegocios(page);
    await expect(page.getByTestId(TID.comprar(AULAS))).toBeVisible();
    for (const id of IDS.slice(1)) await expect(page.getByTestId(TID.comprar(id))).toHaveCount(0);
  });

  test('CT-022 "Patrocínio local" aparece quando o ouro ganho na run chega a 75 @smoke', async ({
    context,
  }) => {
    // Renda 0 (nenhum negócio): cada toque dá exatamente 1 (mínimo da RN-005).
    const page = await abrirCom(context, { ouro: 84, ouroRun: 74 }, { relogio: 'parado' });
    await irParaNegocios(page);
    await expect(page.getByTestId(TID.comprar(PATROCINIO))).toHaveCount(0);
    await irParaClube(page);
    await page.getByTestId(TID.botaoToque).tap(); // ganho na run: 74 → 75
    await irParaNegocios(page);
    await expect(page.getByTestId(TID.comprar(PATROCINIO))).toBeVisible();
  });

  test('CT-022 com 74,99 de ouro ganho na run, "Patrocínio local" continua oculto', async ({
    context,
  }) => {
    const page = await abrirCom(context, { ouro: 83.99, ouroRun: 73.99 }, { relogio: 'parado' });
    await page.getByTestId(TID.botaoToque).tap(); // 73,99 → 74,99
    await irParaNegocios(page);
    await expect(page.getByTestId(TID.comprar(PATROCINIO))).toHaveCount(0);
  });

  test('CT-022 ouro em caixa não conta: 75 em caixa com 65 ganhos não mostra o Patrocínio', async ({
    context,
  }) => {
    const page = await abrirCom(context, { ouro: 75, ouroRun: 65 }, { relogio: 'parado' });
    await irParaNegocios(page);
    await expect(page.getByTestId(TID.comprar(PATROCINIO))).toHaveCount(0);
  });

  test('CT-027 gastar não reduz o acumulado: ouro baixo, 75 ganhos, Patrocínio visível', async ({
    context,
  }) => {
    const page = await abrirCom(context, { ouro: 10, ouroRun: 74 }, { relogio: 'parado' });
    await page.getByTestId(TID.botaoToque).tap(); // ganho na run 75, ouro em caixa 11
    await irParaNegocios(page);
    await expect(page.getByTestId(TID.comprar(PATROCINIO))).toBeVisible();
    // CT-023: visível, mas não comprável (150 > 11).
    await escolherLote(page, '1');
    await esperarDesabilitado(page.getByTestId(TID.comprar(PATROCINIO)), true);
  });

  // ---------- Marco de 50 (RN-004) ----------

  test('CT-032 marco de 50: "faltam" vai de 1 para 50 e a renda de 24,5/s para 50/s', async ({
    context,
  }) => {
    const page = await abrirCom(
      context,
      { ouro: 10_000, negocios: [49, 0, 0, 0, 0, 0] },
      { relogio: 'parado' },
    );
    await esperarNumero(page.getByTestId(TID.renda), '24,5');
    await irParaNegocios(page);
    await escolherLote(page, '1');
    await esperarNumero(page.getByTestId(TID.marcoFaltam(AULAS)), '1');
    await page.getByTestId(TID.comprar(AULAS)).tap();
    await expect(page.getByTestId(TID.quantidade(AULAS))).toHaveText('50');
    await esperarNumero(page.getByTestId(TID.marcoFaltam(AULAS)), '50');
    await irParaClube(page);
    await esperarNumero(page.getByTestId(TID.renda), '50');
  });

  // ---------- Persistência (RN-015 aplicada às compras da NX-010) ----------

  test('CT-504 compras ×1 e ×10 continuam depois de recarregar @smoke', async ({ context }) => {
    const page = await abrirCom(context, { ouro: 300 });
    await irParaNegocios(page);
    await escolherLote(page, '1');
    await page.getByTestId(TID.comprar(AULAS)).tap(); // 10 → n = 1, ouro 290
    await escolherLote(page, '10');
    await page.getByTestId(TID.comprar(AULAS)).tap(); // 233,49 → n = 11, ouro 56,51
    await expect(page.getByTestId(TID.quantidade(AULAS))).toHaveText('11');
    // CT-501: a compra grava na hora, antes de qualquer evento de saída.
    expect(((await lerSave(page)).estado.negocios as number[])[0]).toBe(11);

    await page.reload();
    await expect(page.getByTestId(TID.botaoToque)).toBeVisible();
    // Renda 5,5/s: o ouro só pode ter subido desde a compra (no máximo uns segundos de renda).
    const ouro = paraNumero((await numeroEm(page.getByTestId(TID.ouro)))!);
    expect(ouro).toBeGreaterThanOrEqual(56.5);
    expect(ouro).toBeLessThan(56.5 + 5.5 * 60);
    await esperarNumero(page.getByTestId(TID.renda), '5,5');
    await irParaNegocios(page);
    await expect(page.getByTestId(TID.quantidade(AULAS))).toHaveText('11');
  });

  test('CT-023 negócio que ficou visível continua visível depois de gastar e recarregar', async ({
    context,
  }) => {
    const page = await abrirCom(context, { ouro: 11, ouroRun: 74 });
    await page.getByTestId(TID.botaoToque).tap(); // ganho na run 75: Patrocínio aparece
    await irParaNegocios(page);
    await escolherLote(page, '1');
    await esperarAnuncioSumir(page); // a fala cobria o botão do 1º negócio (BUG-001)
    await page.getByTestId(TID.comprar(AULAS)).tap(); // gasta 10 (ouro 2)
    await expect(page.getByTestId(TID.comprar(PATROCINIO))).toBeVisible();
    await page.reload();
    await irParaNegocios(page);
    await expect(page.getByTestId(TID.comprar(PATROCINIO))).toBeVisible();
    await expect(page.getByTestId(TID.quantidade(AULAS))).toHaveText('1');
  });
});
