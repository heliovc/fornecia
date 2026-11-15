/**
 * Fornecia — configuração da landing.
 * checkoutMonthlyUrl / checkoutAnnualUrl: links da Kiwify. Enquanto começarem com "#",
 * os botões aparecem como "Em breve", sem link.
 * supportEmail: enquanto contiver "A.DEFINIR", o rodapé mostra "canal de suporte em breve".
 * intakeUrl: Worker de intake. Se estiver vazio ou for placeholder, o formulário de amostra por e-mail some.
 * turnstileSiteKey: chave do widget Cloudflare Turnstile (o Chefe cria na conta). Vazio: o formulário
 *   por e-mail só aparece em desenvolvimento local (localhost / 127.0.0.1).
 * oferta: faixa e bloco de lançamento. Se texto ou expiraEm estiverem vazios, não aparece.
 *   Depois de expiraEm a faixa some sozinha. Cupom na URL do checkout anual: ?coupon=CODIGO
 *   (documentado pela Kiwify em ajuda.kiwify.com.br/pt-br/article/cupons-de-desconto-l808xv/).
 */
window.SITE_CONFIG = {
  productName: "Fornecia",
  checkoutMonthlyUrl: "https://pay.kiwify.com.br/1VbxuG1",
  checkoutAnnualUrl: "https://pay.kiwify.com.br/fCFCOFx",
  supportEmail: "heliovcastro@gmail.com",
  intakeUrl: "https://fornecia-intake.heliovcastro.workers.dev",
  turnstileSiteKey: "0x4AAAAAAGCSkj2DnGMRcxrT",
  oferta: {
    texto: "Oferta de lançamento: anual de fundador por R$ 277,90 com o cupom LANCAMENTO30",
    cupom: "LANCAMENTO30",
    preco: "R$ 277,90",
    expiraEm: "2026-11-17T23:59:00-03:00"
  }
};
