(function () {
  "use strict";
  var cfg = window.SITE_CONFIG || {};
  var intake = (cfg.intakeUrl || "").replace(/\/+$/, "");
  var params = new URLSearchParams(location.search);
  var token = params.get("t") || "";
  var form = document.getElementById("form-panorama");
  var lead = document.getElementById("lead");
  var periodoEl = document.getElementById("periodo");
  var msgLink = document.getElementById("msg-link");
  var aviso = document.getElementById("aviso");
  var sugestoes = document.getElementById("sugestoes");
  var ok = document.getElementById("ok");
  var selRamo = document.getElementById("ramo");
  var selUf = document.getElementById("uf");
  var indice = null;

  function show(el, text) {
    if (text !== undefined) el.textContent = text;
    el.hidden = false;
  }
  function hide(el) { el.hidden = true; }

  function conta(ramo, uf) {
    if (!indice) return null;
    for (var i = 0; i < indice.itens.length; i++) {
      if (indice.itens[i].ramo === ramo && indice.itens[i].uf === uf) return indice.itens[i];
    }
    return null;
  }

  function atualizarAviso() {
    hide(aviso); hide(sugestoes);
    var ramo = selRamo.value, uf = selUf.value;
    if (!ramo || !uf || !indice) return;
    var item = conta(ramo, uf);
    var n = item ? item.n : 0;
    var min = indice.minimo || 30;
    if (n >= min) return;
    var txt = n
      ? "Neste recorte há " + n + " licitações no período — abaixo do mínimo de " + min + " para um Panorama útil."
      : "Não há licitações deste ramo neste estado no período coberto.";
    show(aviso, txt + " Você pode escolher uma UF vizinha, o recorte nacional (quando disponível) ou pedir reembolso pela Kiwify em até 7 dias.");
    var alts = indice.itens
      .filter(function (it) { return it.ramo === ramo && it.disponivel && it.uf !== uf; })
      .sort(function (a, b) { return b.n - a.n; })
      .slice(0, 4);
    if (!alts.length) return;
    sugestoes.innerHTML = "Sugestões com pelo menos " + min + " licitações: ";
    alts.forEach(function (it) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "btn btn-secondary";
      b.textContent = it.uf + " (" + it.n + ")";
      b.addEventListener("click", function () { selUf.value = it.uf; atualizarAviso(); });
      sugestoes.appendChild(b);
    });
    sugestoes.hidden = false;
  }

  function preencher(idx) {
    var ramos = [], ufs = [], seenR = {}, seenU = {};
    idx.itens.forEach(function (it) {
      if (!seenR[it.ramo]) { seenR[it.ramo] = 1; ramos.push(it); }
      if (!seenU[it.uf]) { seenU[it.uf] = 1; ufs.push({ uf: it.uf, uf_nome: it.uf_nome }); }
    });
    ramos.sort(function (a, b) { return a.ramo_rotulo.localeCompare(b.ramo_rotulo, "pt-BR"); });
    ufs.sort(function (a, b) { return a.uf_nome.localeCompare(b.uf_nome, "pt-BR"); });
    selRamo.innerHTML = '<option value="">Escolha o ramo</option>' + ramos.map(function (r) {
      return '<option value="' + r.ramo + '">' + r.ramo_rotulo + "</option>";
    }).join("");
    selUf.innerHTML = '<option value="">Escolha o estado</option>' + ufs.map(function (u) {
      return '<option value="' + u.uf + '">' + u.uf_nome + " (" + u.uf + ")</option>";
    }).join("");
    selRamo.addEventListener("change", atualizarAviso);
    selUf.addEventListener("change", atualizarAviso);
  }

  function iniciar() {
    if (!token || token.length < 32 || !intake) {
      show(msgLink);
      return;
    }
    Promise.all([
      fetch("indice.json").then(function (r) { return r.ok ? r.json() : null; }),
      fetch(intake + "/panorama/pedido?t=" + encodeURIComponent(token)).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, status: r.status, body: j }; }); })
    ]).then(function (res) {
      indice = res[0];
      if (indice && indice.periodo_rotulo) {
        show(periodoEl, "Período coberto neste momento: " + indice.periodo_rotulo + " (" + indice.dias + " dias com dados completos).");
      }
      var ped = res[1];
      if (!ped.ok) {
        show(msgLink, ped.status === 410 ? "Este pedido foi reembolsado e o acesso foi encerrado." : msgLink.textContent);
        return;
      }
      if (ped.body.revogado || ped.body.status === "reembolsado") {
        show(msgLink, "Este pedido foi reembolsado e o acesso foi encerrado.");
        return;
      }
      if (ped.body.status === "enviado") {
        show(ok, "O Panorama de " + (ped.body.ramo || "") + " em " + (ped.body.uf || "") + " já foi enviado para o e-mail da compra.");
        return;
      }
      preencher(indice || { itens: [] });
      if (ped.body.ramo) selRamo.value = ped.body.ramo;
      if (ped.body.uf) selUf.value = ped.body.uf;
      atualizarAviso();
      form.hidden = false;
    }).catch(function () {
      show(msgLink, "Não foi possível falar com o servidor agora. Tente de novo em alguns minutos, pelo mesmo link do e-mail.");
    });
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var btn = document.getElementById("enviar");
    btn.disabled = true;
    fetch(intake + "/panorama/escolher", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: token, ramo: selRamo.value, uf: selUf.value })
    }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, status: r.status, body: j }; }); })
      .then(function (res) {
        if (res.status === 410) { form.hidden = true; show(msgLink, res.body.erro || "Pedido encerrado."); return; }
        if (!res.ok) {
          show(aviso, (res.body && (res.body.erro || (res.body.erros || []).join(" "))) || "Não foi possível registrar a escolha.");
          aviso.hidden = false;
          btn.disabled = false;
          return;
        }
        form.hidden = true;
        var manual = res.body.dispatch === "aguardando_geracao_manual";
        show(ok, manual
          ? "Recorte registrado. A geração automática ainda não está ligada; a Fornecia envia o PDF e a planilha para o e-mail da compra em seguida."
          : "Recorte registrado. O PDF e a planilha devem chegar ao e-mail da compra em poucos minutos.");
      })
      .catch(function () { show(aviso, "Falha de rede. Tente de novo."); aviso.hidden = false; btn.disabled = false; });
  });

  iniciar();
})();
