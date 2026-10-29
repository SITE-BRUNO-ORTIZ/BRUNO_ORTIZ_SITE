/* Balão de atendimento: pré-cadastro rápido antes do WhatsApp.
   Abre no lugar do botão verde flutuante, faz 3 perguntas + nome
   e envia tudo pronto na mensagem do WhatsApp. Não guarda dados no site. */
(function () {
  var C = window.HG || {};
  var NUM = C.whatsapp || '5531996077793';
  var OLA = C.saudacao || 'Olá, equipe Bruno Ortiz!';
  var flt = document.querySelector('.wa-float');
  if (!flt || document.getElementById('hg-chat')) return;

  var PERGUNTAS = {
    inicio: {
      txt: 'Oi! 👋 Aqui é o atendimento da Bruno Ortiz. Com 3 perguntas rápidas eu deixo a sua mensagem pronta para a equipe no WhatsApp. Do que você precisa?',
      ops: [
        { r: 'Graduação', v: 'graduação', i: 'graduacao' },
        { r: 'Concurso público', v: 'concurso público', i: 'concursos' },
        { r: 'Serviço acadêmico', v: 'serviço acadêmico', i: 'servicos-academicos' },
        { r: 'Ensino médio', v: 'ensino médio', i: 'ensino-medio' }
      ]
    },
    graduacao: { txt: 'Legal! Como está a sua graduação hoje?', ops: ['Ainda não comecei', 'Comecei e parei ou tranquei', 'Já sou formado e quero outro curso', 'Preciso do diploma para vaga, promoção ou concurso'] },
    concursos: { txt: 'Certo! Em que ponto você está?', ops: ['Vou começar a estudar agora', 'Estudo, mas não consigo passar', 'Tenho um edital aberto', 'Preciso da escolaridade que o cargo pede'] },
    'servicos-academicos': { txt: 'Entendi. Com o que você precisa de ajuda?', ops: ['Matrícula ou transferência', 'Aproveitamento de disciplinas', 'TCC e normas ABNT', 'Pós-graduação', 'Diploma e registro'] },
    'ensino-medio': { txt: 'Certo! Você já sabe qual caminho quer seguir?', ops: ['ENCCEJA', 'EJA a distância', 'Ainda não sei'] },
    prazo: { txt: 'E para quando você precisa resolver isso?', ops: ['O quanto antes', 'Nos próximos meses', 'Só estou pesquisando'] }
  };

  var css = '' +
  '#hg-chat{position:fixed;right:calc(18px + env(safe-area-inset-right,0px));bottom:calc(88px + env(safe-area-inset-bottom,0px));z-index:80;width:min(380px,calc(100vw - 32px));max-height:min(620px,calc(100vh - 120px));display:flex;flex-direction:column;background:var(--card,#102A4A);color:var(--grafite,#F8FAFC);border:1px solid var(--linha,#1E3657);border-radius:20px;box-shadow:0 24px 60px -18px rgba(0,0,0,.8);overflow:hidden;font:400 .98rem/1.45 var(--body,system-ui);transform-origin:100% 100%;transition:transform .22s cubic-bezier(.2,.8,.2,1),opacity .22s}' +
  '#hg-chat[hidden]{display:flex;opacity:0;transform:scale(.92) translateY(10px);pointer-events:none;visibility:hidden}' +
  '#hg-chat .hc-top{display:flex;align-items:center;gap:12px;padding:14px 14px 14px 16px;background:var(--banda,#0B1E36);color:#fff;border-bottom:1px solid var(--linha,#1E3657)}' +
  '#hg-chat .hc-sol{width:42px;height:42px;flex:none;border-radius:50%;background:#071224;border:1.5px solid var(--ouro,#DAB15F);display:grid;place-items:center;overflow:hidden}' +
  '#hg-chat .hc-sol img{width:30px;height:auto}' +
  '#hg-chat .hc-tit{flex:1;min-width:0}#hg-chat .hc-tit b{display:block;font:800 1rem/1.2 var(--display,system-ui)}#hg-chat .hc-tit small{opacity:.85;font-size:.8rem}' +
  '#hg-chat .hc-x{background:none;border:0;color:#fff;font-size:1.6rem;line-height:1;width:40px;height:40px;border-radius:50%;cursor:pointer}#hg-chat .hc-x:hover{background:rgba(255,255,255,.14)}' +
  '#hg-chat .hc-corpo{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:var(--papel,#030811)}' +
  '#hg-chat .hc-b{max-width:88%;padding:10px 14px;border-radius:16px;animation:hcIn .25s ease both}' +
  '#hg-chat .hc-bot{align-self:flex-start;background:var(--card,#102A4A);border:1px solid var(--linha,#1E3657);border-bottom-left-radius:4px}' +
  '#hg-chat .hc-eu{align-self:flex-end;background:var(--ouro,#DAB15F);color:#030811;font-weight:600;border-bottom-right-radius:4px}' +
  '#hg-chat .hc-ops{display:flex;flex-wrap:wrap;gap:8px;animation:hcIn .25s ease both}' +
  '#hg-chat .hc-op{border:1.5px solid var(--ouro,#DAB15F);color:var(--ouro-2,#E3C06F);background:transparent;border-radius:999px;padding:9px 14px;font:600 .9rem var(--body,system-ui);cursor:pointer;text-align:left}' +
  '#hg-chat .hc-op:hover,#hg-chat .hc-op:focus-visible{background:var(--ouro,#DAB15F);color:#030811;outline:none}' +
  '#hg-chat form{display:flex;gap:8px;animation:hcIn .25s ease both}' +
  '#hg-chat input{flex:1;min-width:0;border:1.5px solid var(--linha,#1E3657);background:var(--card,#102A4A);color:inherit;border-radius:999px;padding:11px 16px;font:400 1rem var(--body,system-ui)}#hg-chat input:focus{outline:none;border-color:var(--ouro,#DAB15F)}' +
  '#hg-chat .hc-ok{border:0;border-radius:999px;padding:0 18px;background:var(--ouro,#DAB15F);color:#030811;font:700 .95rem var(--body,system-ui);cursor:pointer}' +
  '#hg-chat .hc-wa{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:4px;padding:15px 18px;border-radius:999px;background:var(--wa,#1FA855);color:#fff;text-decoration:none;font:700 1rem var(--body,system-ui);animation:hcIn .25s ease both}' +
  '#hg-chat .hc-wa svg{width:22px;height:22px}' +
  '#hg-chat .hc-pe{display:flex;justify-content:space-between;gap:12px;padding:10px 16px;border-top:1px solid var(--linha,#1E3657);font-size:.8rem;color:var(--grafite-2,#94A3B8);background:var(--card,#102A4A)}' +
  '#hg-chat .hc-pe a,#hg-chat .hc-pe button{color:inherit;background:none;border:0;padding:0;font:inherit;text-decoration:underline;cursor:pointer}' +
  '.wa-float .hc-ping{position:absolute;top:-4px;right:-4px;width:18px;height:18px;border-radius:50%;background:var(--ouro,#DAB15F);border:2px solid var(--papel,#030811)}' +
  '@keyframes hcIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}' +
  '@media (max-width:520px){#hg-chat{right:0;left:0;bottom:0;width:100%;max-height:82vh;border-radius:20px 20px 0 0;padding-bottom:env(safe-area-inset-bottom,0px)}}' +
  '@media (prefers-reduced-motion:reduce){#hg-chat,#hg-chat *{animation:none!important;transition:none!important}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var WA_ICO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3Z"/></svg>';
  var simbolo = (document.querySelector('.brand .mark') || {}).src || 'assets/logo-simbolo.png';

  var box = document.createElement('div');
  box.id = 'hg-chat'; box.hidden = true;
  box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'false'); box.setAttribute('aria-label', 'Atendimento Bruno Ortiz');
  box.innerHTML =
    '<div class="hc-top"><span class="hc-sol"><img src="' + simbolo + '" alt=""></span><div class="hc-tit"><b>' + (C.nomeCurto || 'Bruno Ortiz') + '</b><small>Diagnóstico grátis · atendimento on-line</small></div><button type="button" class="hc-x" aria-label="Fechar">×</button></div>' +
    '<div class="hc-corpo" aria-live="polite"></div>' +
    '<div class="hc-pe"><button type="button" class="hc-rec">Recomeçar</button><a class="hc-dir" href="https://wa.me/' + NUM + '?text=' + encodeURIComponent(OLA + ' Vim pelo site e quero orientação.') + '" target="_blank" rel="noopener" data-wa-label="balao-direto">Prefiro ir direto ao WhatsApp</a></div>';
  document.body.appendChild(box);

  var corpo = box.querySelector('.hc-corpo');
  var resp = {}, iniciado = false, ultimoFoco = null;
  var ga = function (n, p) { try { if (window.gtag) gtag('event', n, p || {}); } catch (e) {} };
  var rolar = function () { corpo.scrollTop = corpo.scrollHeight; };

  var fala = function (txt, quem, cb) {
    var b = document.createElement('div');
    b.className = 'hc-b ' + (quem === 'eu' ? 'hc-eu' : 'hc-bot');
    b.textContent = txt; corpo.appendChild(b); rolar();
    if (cb) setTimeout(cb, quem === 'eu' ? 350 : 0);
  };
  var opcoes = function (lista, cb) {
    var w = document.createElement('div'); w.className = 'hc-ops';
    lista.forEach(function (o) {
      var item = typeof o === 'string' ? { r: o, v: o } : o;
      var bt = document.createElement('button'); bt.type = 'button'; bt.className = 'hc-op'; bt.textContent = item.r;
      bt.addEventListener('click', function () { w.remove(); fala(item.r, 'eu', function () { cb(item); }); });
      w.appendChild(bt);
    });
    corpo.appendChild(w); rolar();
    var f = w.querySelector('button'); if (f) f.focus({ preventScroll: true });
  };

  var passoObjetivo = function () {
    fala(PERGUNTAS.inicio.txt, 'bot');
    opcoes(PERGUNTAS.inicio.ops, function (o) {
      resp.obj = o.v; resp.int = o.i;
      if (window.HG_interesse) window.HG_interesse(o.i);
      ga('chat_passo', { passo: 'objetivo', resposta: o.i });
      passoSituacao();
    });
  };
  var passoSituacao = function () {
    var q = PERGUNTAS[resp.int];
    fala(q.txt, 'bot');
    opcoes(q.ops, function (o) { resp.sit = o.v; ga('chat_passo', { passo: 'situacao', resposta: o.v }); passoPrazo(); });
  };
  var passoPrazo = function () {
    fala(PERGUNTAS.prazo.txt, 'bot');
    opcoes(PERGUNTAS.prazo.ops, function (o) { resp.prazo = o.v; ga('chat_passo', { passo: 'prazo', resposta: o.v }); passoNome(); });
  };
  var passoNome = function () {
    fala('Para terminar: como posso te chamar?', 'bot');
    var f = document.createElement('form');
    f.innerHTML = '<input type="text" name="nome" autocomplete="given-name" maxlength="40" placeholder="Seu nome" aria-label="Seu nome"><button class="hc-ok" type="submit">OK</button>';
    corpo.appendChild(f); rolar();
    var inp = f.querySelector('input'); inp.focus({ preventScroll: true });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var n = inp.value.trim().replace(/\s+/g, ' ');
      f.remove();
      resp.nome = n;
      fala(n || 'Prefiro não dizer', 'eu', fim);
    });
  };
  var fim = function () {
    ga('chat_passo', { passo: 'concluido', resposta: resp.int });
    var nome = resp.nome ? resp.nome.split(' ')[0] : '';
    fala((nome ? 'Prontinho, ' + nome + '! ' : 'Prontinho! ') + 'Sua mensagem já está montada. Toque no botão e envie no WhatsApp; a equipe continua de lá.', 'bot');
    var msg = OLA + ' ' + (resp.nome ? 'Sou ' + resp.nome + '. ' : '') + 'Vim pelo site.\n' +
      '• Quero: ' + resp.obj + '\n• Situação: ' + resp.sit + '\n• Prazo: ' + resp.prazo + '\n' +
      'Pode me passar o diagnóstico gratuito?';
    var a = document.createElement('a');
    a.className = 'hc-wa'; a.target = '_blank'; a.rel = 'noopener';
    a.setAttribute('data-wa-label', 'balao');
    a.setAttribute('data-interesse', resp.int || 'geral');
    a.href = 'https://wa.me/' + NUM + '?text=' + encodeURIComponent(msg);
    a.innerHTML = WA_ICO + '<span>Enviar no WhatsApp</span>';
    corpo.appendChild(a); rolar(); a.focus({ preventScroll: true });
  };
  var comecar = function () { corpo.innerHTML = ''; resp = {}; passoObjetivo(); };

  var abrir = function () {
    ultimoFoco = document.activeElement;
    box.hidden = false; flt.setAttribute('aria-expanded', 'true');
    var p = flt.querySelector('.hc-ping'); if (p) p.remove();
    if (!iniciado) { iniciado = true; comecar(); ga('chat_aberto', { pagina: location.pathname }); }
    else { var f = corpo.querySelector('button, input, a'); if (f) f.focus({ preventScroll: true }); }
  };
  var fechar = function () {
    box.hidden = true; flt.setAttribute('aria-expanded', 'false');
    if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus({ preventScroll: true });
  };

  flt.setAttribute('aria-controls', 'hg-chat'); flt.setAttribute('aria-expanded', 'false');
  flt.setAttribute('aria-label', 'Abrir atendimento');
  var ping = document.createElement('span'); ping.className = 'hc-ping'; ping.setAttribute('aria-hidden', 'true'); flt.appendChild(ping);
  /* Captura antes da medição de WhatsApp: abrir o balão não conta como contato. */
  flt.addEventListener('click', function (e) {
    e.preventDefault(); e.stopImmediatePropagation();
    if (box.hidden) abrir(); else fechar();
  }, true);
  box.querySelector('.hc-x').addEventListener('click', fechar);
  box.querySelector('.hc-rec').addEventListener('click', function () { ga('chat_passo', { passo: 'recomecar' }); comecar(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !box.hidden) fechar(); });
})();
