(function () {
  "use strict";

  var defaults = {
    productName: "Fornecia",
    checkoutMonthlyUrl: "#",
    checkoutAnnualUrl: "#",
    checkoutPanoramaUrl: "#",
    supportEmail: "SUPORTE@EMAIL.A.DEFINIR"
  };

  var cfg = Object.assign({}, defaults, window.SITE_CONFIG || {});

  function setText(el, text) {
    if (!el) return;
    el.textContent = text;
  }

  function applyProductName() {
    var name = cfg.productName;
    document.querySelectorAll("[data-product-name]").forEach(function (el) {
      setText(el, name);
    });
    document.title = name + " — alerta diário de licitações do PNCP";
    var map = {
      'meta[property="og:title"]': name + " — alerta diário de licitações do PNCP",
      'meta[name="twitter:title"]': name + " — alerta diário de licitações do PNCP",
      'meta[name="apple-mobile-web-app-title"]': name
    };
    Object.keys(map).forEach(function (sel) {
      var el = document.querySelector(sel);
      if (el) el.setAttribute("content", map[sel]);
    });
  }

  function applyCheckout() {
    // Enquanto o checkout não existir (URL vazia ou começando com "#"),
    // os botões ficam como "Em breve", sem link.
    var labels = {
      monthly: "Assinar o plano fundador por R$ 47/mês",
      annual: "Assinar o anual de fundador por R$ 397/ano",
      panorama: "Quero o Panorama do meu ramo — R$ 27"
    };
    var urls = { monthly: cfg.checkoutMonthlyUrl, annual: cfg.checkoutAnnualUrl, panorama: cfg.checkoutPanoramaUrl };
    ["monthly", "annual", "panorama"].forEach(function (kind) {
      var url = urls[kind];
      if (!url || url.charAt(0) === "#") return;
      document.querySelectorAll("[data-checkout='" + kind + "']").forEach(function (a) {
        a.setAttribute("href", url);
        a.removeAttribute("aria-disabled");
        a.removeAttribute("role");
        a.classList.remove("is-soon");
        a.textContent = labels[kind];
      });
    });
  }

  function applySupport() {
    if (!cfg.supportEmail || cfg.supportEmail.indexOf("A.DEFINIR") !== -1) return;
    document.querySelectorAll("[data-support-email]").forEach(function (el) {
      if (el.tagName === "SPAN") {
        var a = document.createElement("a");
        a.setAttribute("href", "mailto:" + cfg.supportEmail);
        a.textContent = cfg.supportEmail;
        el.replaceWith(a);
      } else if (el.tagName === "A") {
        el.setAttribute("href", "mailto:" + cfg.supportEmail);
        if (el.getAttribute("data-support-email") !== "href-only") {
          setText(el, cfg.supportEmail);
        }
      } else {
        setText(el, cfg.supportEmail);
      }
    });
  }

  applyProductName();
  applyCheckout();
  applySupport();

  var toggle = document.querySelector("[data-nav-toggle]");
  var nav = document.getElementById("menu-principal");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  function localDev() {
    var h = location.hostname;
    return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
  }

  function intakeOk() {
    var u = cfg.intakeUrl || "";
    if (!u || u.charAt(0) === "#" || /A\.DEFINIR|example\.com|placeholder/i.test(u)) return false;
    return true;
  }

  function podeFormEmail() {
    if (!intakeOk()) return false;
    if (cfg.turnstileSiteKey) return true;
    return localDev(); // sem Turnstile só em dev local
  }

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function renderTender(it, i) {
    var resumo = "";
    if (it.resumo) {
      resumo = '<p class="tender-resumo"><strong>Resumo:</strong> ' + esc(it.resumo) +
        ' <small>O resumo é feito por IA e pode ter imprecisões. A decisão é sempre no edital oficial.</small></p>';
    } else if (i < 3) {
      resumo = '<p class="tender-resumo muted">Resumo disponível no plano fundador.</p>';
    }
    return '<article class="tender">' +
      '<div class="tender-head"><p class="tender-org">' + esc(it.orgao) + '</p>' +
      '<p class="tender-place">' + esc(it.municipio) + "/" + esc(it.uf) + "</p></div>" +
      '<ul class="tender-facts">' +
      "<li><span>Valor estimado</span> " + esc(it.valor_fmt) + "</li>" +
      "<li><span>Propostas até</span> " + esc(it.prazo_fmt) + "</li>" +
      "</ul>" +
      '<p class="tender-objeto"><strong>Objeto:</strong> ' + esc(it.objeto) + "</p>" +
      resumo +
      (it.link_pncp ? '<a class="tender-link" href="' + esc(it.link_pncp) + '" rel="noopener noreferrer" target="_blank">Ver no PNCP <span class="sr-only">(abre em nova aba)</span> →</a>' : "") +
      "</article>";
  }

  function initAmostra() {
    var form = document.getElementById("form-amostra-ver");
    var selRamo = document.getElementById("amostra-ramo");
    var selUf = document.getElementById("amostra-uf");
    var box = document.getElementById("amostra-resultado");
    var cta = document.getElementById("amostra-cta-diario");
    var formEmail = document.getElementById("form-amostra-email");
    var dest = document.getElementById("licitacoes-destaque");
    if (!form || !selRamo) return;

    var indice = null;
    var atual = null;

    fetch("amostra/indice.json", { credentials: "omit" })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (d) {
        indice = d;
        selRamo.innerHTML = '<option value="">Escolha o ramo</option>' +
          (d.ramos || []).map(function (r) {
            return '<option value="' + esc(r.slug) + '">' + esc(r.rotulo) + "</option>";
          }).join("");
        selUf.innerHTML = '<option value="">Escolha o estado</option>' +
          (d.ufs || []).map(function (u) {
            return '<option value="' + esc(u.sigla) + '">' + esc(u.nome) + " (" + esc(u.sigla) + ")</option>";
          }).join("");
        if (dest && d.paginas_indexadas) {
          dest.innerHTML = d.paginas_indexadas.slice(0, 12).map(function (p) {
            return '<li><a href="' + esc(p.href) + '">Licitações de ' + esc(p.rotulo) + " em " + esc(p.uf) + "</a></li>";
          }).join("");
        }
      })
      .catch(function () {
        selRamo.innerHTML = '<option value="">Listas em atualização</option>';
        selUf.innerHTML = '<option value="">—</option>';
      });

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var ramo = selRamo.value, uf = selUf.value;
      if (!ramo || !uf) return;
      box.hidden = false;
      box.innerHTML = "<p>Carregando…</p>";
      if (cta) cta.hidden = true;
      if (formEmail) formEmail.hidden = true;
      fetch("amostra/" + encodeURIComponent(ramo) + "/" + encodeURIComponent(uf.toLowerCase()) + ".json", { credentials: "omit" })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
        .then(function (d) {
          atual = d;
          if (!d.itens || !d.itens.length) {
            var viz = (d.vizinhas || []).filter(function (v) { return v.abertas > 0; }).slice(0, 4);
            var sug = viz.length
              ? "<p>Você pode ver:</p><ul>" + viz.map(function (v) {
                  return "<li><button type=\"button\" class=\"linkish\" data-viz-ramo=\"" + esc(v.ramo) + "\" data-viz-uf=\"" + esc(v.uf) + "\">" +
                    esc(v.rotulo) + " — " + v.abertas + " abertas</button></li>";
                }).join("") + "</ul>"
              : "<p>Não encontramos abertas neste recorte nem em recortes próximos, na atualização do dia.</p>";
            box.innerHTML = "<p>Não havia licitações de <strong>" + esc(d.ramo_rotulo) + "</strong> com prazo aberto em <strong>" +
              esc(d.uf_nome || d.uf) + "</strong> na atualização de " + esc((d.atualizado_em || "").split("-").reverse().join("/")) + ".</p>" + sug;
            if (formEmail) formEmail.hidden = true;
            return;
          }
          var extra = d.mais > 0 ? "<p class=\"more\">+" + d.mais + " outras abertas no plano completo.</p>" : "";
          box.innerHTML = "<p>Segundo o PNCP, na atualização de " + esc((d.atualizado_em || "").split("-").reverse().join("/")) +
            " havia <strong>" + d.total_abertas + "</strong> licitaç" + (d.total_abertas === 1 ? "ão" : "ões") +
            " de " + esc(d.ramo_rotulo) + " com prazo aberto em " + esc(d.uf_nome || d.uf) +
            ". Mostramos as de prazo mais curto primeiro.</p>" +
            d.itens.map(renderTender).join("") + extra;
          if (cta) cta.hidden = false;
          if (formEmail && podeFormEmail()) {
            formEmail.hidden = false;
            montarTurnstile();
          }
        })
        .catch(function () {
          box.innerHTML = "<p>Não foi possível carregar esta amostra agora. Tente de novo em instantes.</p>";
        });
    });

    box.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-viz-ramo]");
      if (!b) return;
      selRamo.value = b.getAttribute("data-viz-ramo");
      selUf.value = b.getAttribute("data-viz-uf");
      form.requestSubmit();
    });

    var tsWidgetId = null;
    function montarTurnstile() {
      var slot = document.getElementById("amostra-turnstile");
      if (!slot || !cfg.turnstileSiteKey || !window.turnstile) return;
      slot.innerHTML = "";
      tsWidgetId = window.turnstile.render(slot, { sitekey: cfg.turnstileSiteKey, theme: "light" });
    }
    if (cfg.turnstileSiteKey && podeFormEmail()) {
      var st = document.createElement("script");
      st.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      st.async = true;
      st.defer = true;
      st.onload = function () { if (formEmail && !formEmail.hidden) montarTurnstile(); };
      document.head.appendChild(st);
    }

    if (formEmail) {
      formEmail.addEventListener("submit", function (ev) {
        ev.preventDefault();
        var msg = document.getElementById("amostra-email-msg");
        function show(t, ok) {
          msg.hidden = false;
          msg.textContent = t;
          msg.className = "amostra-msg" + (ok ? " ok" : " err");
        }
        if (!atual || !atual.itens || !atual.itens.length) {
          show("Não enviamos e-mail quando não há licitações abertas neste recorte. Escolha um ramo e estado com resultados.");
          return;
        }
        if (!document.getElementById("amostra-consent").checked) {
          show("É preciso aceitar a política de privacidade para receber a amostra por e-mail.");
          return;
        }
        var token = "";
        if (cfg.turnstileSiteKey && window.turnstile) {
          token = window.turnstile.getResponse(tsWidgetId) || "";
          if (!token) { show("Confirme que você não é um robô."); return; }
        }
        var body = {
          email: document.getElementById("amostra-email").value,
          ramo: atual.ramo,
          uf: atual.uf,
          consentimento: true,
          marketing: document.getElementById("amostra-marketing").checked,
          website: document.getElementById("amostra-website").value,
          turnstile: token
        };
        var btn = document.getElementById("amostra-enviar");
        btn.disabled = true;
        fetch(cfg.intakeUrl.replace(/\/+$/, "") + "/amostra", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body)
        }).then(function (r) { return r.json().then(function (j) { return { st: r.status, j: j }; }); })
          .then(function (x) {
            btn.disabled = false;
            if (x.st === 200 && x.j && x.j.ok) {
              show("Enviamos a amostra para " + body.email + ". Confira também a caixa de spam.", true);
              formEmail.querySelector("button[type=submit]").hidden = true;
            } else if (x.j && x.j.vazia) {
              show(x.j.mensagem || "Não havia licitações abertas neste recorte; não enviamos e-mail vazio.");
            } else if (x.st === 429) {
              show(x.j && x.j.erro ? x.j.erro : "Limite de amostras atingido. Tente amanhã ou assine o plano para receber todo dia.");
            } else {
              show((x.j && (x.j.erro || (x.j.erros && x.j.erros.join(" ")))) || "Não foi possível enviar agora.");
            }
            if (cfg.turnstileSiteKey && window.turnstile && tsWidgetId != null) window.turnstile.reset(tsWidgetId);
          })
          .catch(function () {
            btn.disabled = false;
            show("Não foi possível falar com o servidor. Tente de novo em instantes.");
          });
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAmostra);
  } else {
    initAmostra();
  }

})();
