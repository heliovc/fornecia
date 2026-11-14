(function () {
  "use strict";

  var defaults = {
    productName: "Fornecia",
    checkoutMonthlyUrl: "#",
    checkoutAnnualUrl: "#",
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
      annual: "Assinar o anual de fundador por R$ 397/ano"
    };
    ["monthly", "annual"].forEach(function (kind) {
      var url = kind === "monthly" ? cfg.checkoutMonthlyUrl : cfg.checkoutAnnualUrl;
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
})();
