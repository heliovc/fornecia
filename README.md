# Fornecia — site público

Páginas estáticas (HTML + CSS + JS). Publicado em https://heliovc.github.io/fornecia/.

Configuração em `config.js`:
- `checkoutMonthlyUrl` e `checkoutAnnualUrl`: links da Kiwify. Enquanto começarem com `#`, os botões aparecem como "Em breve", sem link.
- `supportEmail`: enquanto contiver `A.DEFINIR`, o rodapé mostra "canal de suporte em breve".
- `intakeUrl` e `turnstileSiteKey`: formulário opcional da amostra por e-mail. Sem a site key do Turnstile, o formulário só aparece em desenvolvimento local.
- `oferta`: faixa de lançamento (texto, cupom, preço, `expiraEm`). Some sozinha depois do prazo. O cupom é aplicado no checkout anual com `?coupon=` (documentado pela Kiwify).
- `productName`: nome do produto.

Páginas:
- `privacidade/` e `termos/`: geradas por `docs/legal/gerar_paginas.py` no repositório privado do pipeline (versão no topo da página).
- `licitacoes/`: listas programáticas por ramo e estado (geradas por `seo/build.py` + `seo/publicar_site.py` no pipeline). Só entram no `sitemap.xml` as que passam na regra de indexação.
- `amostra/{ramo}/{uf}.json`: base do dia para a amostra grátis da landing (sem chamada à API no navegador).
- `comecar/`: formulário de configuração do alerta (noindex). Copiado de `onboarding/comecar/` do pipeline por `intake/aplicar_urls.py`; `comecar/config.js` aponta para o Worker de intake (`*.workers.dev`).
- `sitemap.xml` e `robots.txt` (este `robots.txt` de subcaminho **não** é lido pelos crawlers; conta o `https://heliovc.github.io/robots.txt`. O sitemap precisa ser enviado no Search Console).

Arquivos `google*.html` de verificação do Search Console, se forem colocados na raiz, devem ser preservados na publicação.

Fonte dos dados: Portal Nacional de Contratações Públicas (pncp.gov.br).
