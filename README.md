# Fornecia — landing de pré-venda

Página estática (HTML + CSS + JS, sem build).

Configuração em `config.js`:
- `checkoutMonthlyUrl` e `checkoutAnnualUrl`: links da Kiwify. Enquanto começarem com `#`, os botões aparecem como "Em breve", sem link.
- `supportEmail`: enquanto contiver `A.DEFINIR`, o rodapé mostra "canal de suporte em breve".
- `productName`: nome do produto.

Dados de exemplo: licitações públicas do PNCP (pncp.gov.br).

Páginas:
- `privacidade/` e `termos/`: geradas por `docs/legal/gerar_paginas.py` no repositório privado do pipeline (versão no topo da página).
- `comecar/`: formulário de configuração do alerta (noindex). Copiado de `onboarding/comecar/` do pipeline por `intake/aplicar_urls.py`; `comecar/config.js` aponta para o Worker de intake (`*.workers.dev`).
