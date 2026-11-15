// Formulário de onboarding da Fornecia (estático; posta no Worker de intake). Sem dependências.
(function () {
  const C = window.CATALOGO, CFG = window.FORNECIA, $ = (id) => document.getElementById(id);
  const token = new URLSearchParams(location.search).get("t") || "";
  $("link-priv").href = CFG.privacidadeUrl;
  if (CFG.termosUrl && $("link-termos")) $("link-termos").href = CFG.termosUrl;

  function checks(el, itens, nome, valor, rotulo) {
    el.innerHTML = itens.map((it) => `<label><input type="checkbox" name="${nome}" value="${valor(it)}"> <span>${rotulo(it)}</span></label>`).join("");
  }
  checks($("ramos"), C.ramos, "ramo", (r) => r.slug, (r) => r.rotulo.charAt(0).toUpperCase() + r.rotulo.slice(1));
  checks($("ufs"), C.ufs, "uf", (u) => u.sigla, (u) => `<abbr title="${u.nome}">${u.sigla}</abbr>`);
  checks($("modalidades"), C.modalidades, "mod", (m) => m.id, (m) => m.nome);
  const marcados = (n) => [...document.querySelectorAll(`input[name=${n}]:checked`)].map((i) => i.value);
  const marcar = (n, vals) => document.querySelectorAll(`input[name=${n}]`).forEach((i) => (i.checked = vals.map(String).includes(i.value)));

  $("ramos").addEventListener("change", (e) => {
    if (marcados("ramo").length > C.limites.max_ramos) { e.target.checked = false; msg("err", [`Escolha no máximo ${C.limites.max_ramos} ramos.`]); }
  });
  $("todas-ufs").addEventListener("change", (e) => marcar("uf", e.target.checked ? C.ufs.map((u) => u.sigla) : []));

  function msg(tipo, linhas, alvo = "msg") {
    const el = $(alvo);
    el.className = "msg " + tipo;
    el.innerHTML = linhas.length > 1 ? `<b>Confira:</b><ul>${linhas.map((l) => `<li>${l}</li>`).join("")}</ul>` : linhas[0] || "";
  }
  const termos = (s) => s.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);

  function validar(d) {
    const e = [];
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) e.push("Informe um e-mail válido.");
    if (!d.ufs.length) e.push("Escolha pelo menos um estado.");
    if (!d.ramos.length && !d.palavras.length) e.push("Escolha um ramo ou escreva pelo menos uma palavra-chave.");
    if (d.palavras.length > C.limites.max_palavras) e.push(`No máximo ${C.limites.max_palavras} palavras-chave.`);
    if (d.excluir.length > C.limites.max_excluir) e.push(`No máximo ${C.limites.max_excluir} palavras para excluir.`);
    const [mn, mx] = C.limites.tam_palavra;
    if ([...d.palavras, ...d.excluir].some((t) => t.length < mn || t.length > mx)) e.push(`Cada termo deve ter de ${mn} a ${mx} caracteres.`);
    const num = (v) => (v === "" ? null : Number(v.replace(/\./g, "").replace(",", ".")));
    const a = num(d.valor_min), b = num(d.valor_max);
    if ((a !== null && !(a >= 0)) || (b !== null && !(b >= 0))) e.push("Valores devem ser números positivos.");
    if (a !== null && b !== null && a > b) e.push("O valor mínimo é maior que o máximo.");
    if (!d.aceite) e.push("Aceite a política de privacidade.");
    return e;
  }

  async function api(caminho, opt) {
    const r = await fetch(CFG.intakeUrl + caminho, opt);
    let b = {}; try { b = await r.json(); } catch (_) {}
    return { status: r.status, body: b };
  }

  if (!token) {
    $("pedir-link").hidden = false;
    $("form-link").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const email = $("email-link").value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return msg("err", ["Informe um e-mail válido."], "msg-link");
      const r = await api("/onboarding/link", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
      msg(r.status === 200 ? "ok" : "err", [r.body.mensagem || (r.body.erros || ["Não foi possível agora. Tente de novo."]).join(" ")], "msg-link");
    });
    return;
  }

  $("form-perfil").hidden = false;
  api("/onboarding/perfil?t=" + encodeURIComponent(token)).then((r) => {
    if (r.status !== 200) { $("form-perfil").hidden = true; $("pedir-link").hidden = false; return msg("err", ["Este link não vale mais. Peça um novo abaixo."], "msg-link"); }
    $("email").value = r.body.email || "";
    const p = r.body.perfil;
    if (p) {
      marcar("ramo", p.ramos); marcar("uf", p.ufs); marcar("mod", p.modalidades.length === C.modalidades.length ? [] : p.modalidades);
      $("palavras").value = p.palavras.join(", "); $("excluir").value = p.excluir.join(", ");
      $("valor_min").value = p.valor_min ?? ""; $("valor_max").value = p.valor_max ?? ""; $("incluir_sem_valor").checked = p.incluir_sem_valor !== false;
      $("salvar").textContent = "Salvar alterações";
    }
  });

  $("form-perfil").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const d = { t: token, email: $("email").value.trim(), ramos: marcados("ramo"), ufs: marcados("uf"), palavras: termos($("palavras").value),
      excluir: termos($("excluir").value), modalidades: marcados("mod").map(Number), valor_min: $("valor_min").value.trim(),
      valor_max: $("valor_max").value.trim(), incluir_sem_valor: $("incluir_sem_valor").checked, aceite: $("aceite").checked };
    const erros = validar(d);
    if (erros.length) return msg("err", erros);
    $("salvar").disabled = true;
    try {
      const r = await api("/onboarding", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(d) });
      if (r.status === 200) msg("ok", ["<b>Pronto! Seu alerta está ligado.</b> O primeiro chega pela manhã do próximo dia útil. Guarde este link para mudar o perfil quando quiser."]);
      else msg("err", r.body.erros || [r.body.erro || "Não foi possível salvar agora. Tente de novo."]);
    } catch (_) { msg("err", ["Sem conexão com o servidor. Tente de novo em instantes."]); }
    finally { $("salvar").disabled = false; }
  });
})();
