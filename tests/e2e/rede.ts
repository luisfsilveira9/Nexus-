// C9 (ADR-002): fixture do Playwright que bloqueia e registra todo pedido fora da própria origem e
// faz o teste falhar se houver algum. NX-015 (nexus-tech); o QA pode reaproveitar nas suítes dele.
import { test as base, expect } from '@playwright/test';

export const test = base.extend<{ pedidosExternos: string[] }>({
  pedidosExternos: [
    async ({ context, baseURL }, use) => {
      const origem = new URL(baseURL!).origin;
      const externos: string[] = [];
      await context.route('**/*', (rota) => {
        const url = rota.request().url();
        if (/^(data|blob):/.test(url) || new URL(url).origin === origem) return rota.continue();
        externos.push(url);
        return rota.abort('blockedbyclient');
      });
      await use(externos);
      expect(externos, 'nenhum pedido fora da própria origem (C9)').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
