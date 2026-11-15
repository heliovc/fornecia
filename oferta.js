/**
 * Faixa de oferta de lançamento. Lê window.SITE_CONFIG.oferta.
 * Esconde sozinha depois de expiraEm e não aparece se a config estiver vazia.
 * Cupom pré-preenchido: a Kiwify documenta ?coupon=CODIGO
 * (ajuda.kiwify.com.br/pt-br/article/cupons-de-desconto-l808xv/, atualizado em 30/10/2026).
 */
(function () {
  "use strict";
  var cfg = window.SITE_CONFIG || {};
  var o = cfg.oferta;
  if (!o || !o.texto || !o.expiraEm) return;
  var fim;
  try { fim = new Date(o.expiraEm); } catch (e) { return; }
  if (!fim || isNaN(fim.getTime()) || Date.now() > fim.getTime()) return;

  var el = document.getElementById("oferta-faixa");
  if (!el) {
    el = document.createElement("div");
    el.id = "oferta-faixa";
    el.setAttribute("role", "region");
    el.setAttribute("aria-label", "Oferta de lançamento");
    document.body.insertBefore(el, document.body.firstChild);
  }

  var anual = cfg.checkoutAnnualUrl || "";
  var href = anual && anual.charAt(0) !== "#"
    ? anual + (anual.indexOf("?") >= 0 ? "&" : "?") + "coupon=" + encodeURIComponent(o.cupom || "")
    : "#planos";

  var quando;
  try {
    quando = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    }).format(fim) + " (horário de Brasília)";
  } catch (e) {
    quando = o.expiraEm;
  }

  if (!document.getElementById("oferta-faixa-css")) {
    var s = document.createElement("style");
    s.id = "oferta-faixa-css";
    s.textContent =
      "#oferta-faixa{background:#1A4A3C;color:#F3EEE4;font:600 15px/1.4 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;}" +
      "#oferta-faixa .oferta-inner{max-width:980px;margin:0 auto;padding:10px 16px;display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center;justify-content:center;}" +
      "#oferta-faixa a{color:#E8C15A;font-weight:700;text-decoration:underline;}" +
      "#oferta-faixa .cupom{display:inline-flex;align-items:center;gap:6px;background:#0F2A22;border:1px dashed #E8C15A;border-radius:6px;padding:2px 8px;font-family:ui-monospace,monospace;letter-spacing:.04em;}" +
      "#oferta-faixa .copiar{background:transparent;border:0;color:#E8C15A;cursor:pointer;font:inherit;text-decoration:underline;padding:0;}";
    document.head.appendChild(s);
  }

  var cupom = o.cupom ? '<span class="cupom"><span>' + esc(o.cupom) + '</span>' +
    '<button type="button" class="copiar" data-copiar-cupom>Copiar</button></span>' : "";
  el.innerHTML = '<div class="oferta-inner"><span>' + esc(o.texto) +
    (quando ? " · válida até " + esc(quando) : "") + "</span>" + cupom +
    (href ? ' <a class="oferta-cta" href="' + esc(href) + '">Quero o anual com desconto</a>' : "") +
    "</div>";
  el.hidden = false;

  var btn = el.querySelector("[data-copiar-cupom]");
  if (btn && o.cupom && navigator.clipboard) {
    btn.addEventListener("click", function () {
      navigator.clipboard.writeText(o.cupom).then(function () {
        btn.textContent = "Copiado";
        setTimeout(function () { btn.textContent = "Copiar"; }, 2000);
      });
    });
  }

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  // Bloco opcional na seção de planos (landing)
  var bloco = document.getElementById("oferta-lancamento");
  if (bloco) {
    bloco.hidden = false;
    var preco = bloco.querySelector("[data-oferta-preco]");
    var validade = bloco.querySelector("[data-oferta-validade]");
    var cta = bloco.querySelector("[data-oferta-cta]");
    var cupomEl = bloco.querySelector("[data-oferta-cupom]");
    if (preco) preco.textContent = o.preco || "";
    if (validade) validade.textContent = quando;
    if (cupomEl) cupomEl.textContent = o.cupom || "";
    if (cta && href) cta.setAttribute("href", href);
  }
})();
