/* ===== CONFIGURAÇÃO — edite só este bloco ===== */
window.HG = {
  nomeCurto: "Bruno Ortiz",
  saudacao: "Olá, equipe Bruno Ortiz!",      // começo de todas as mensagens prontas
  whatsapp: "5531996077793",                 // DDI + DDD + número, só dígitos
  metaPixelId: "902396809491746",            // Pixel da Meta (o mesmo do site antigo)
  ga4Id: "G-M4WXYDKMWW",                     // Google Analytics 4
  googleAdsId: "AW-18076144707",             // Google Ads
  googleAdsConversao: "AW-18076144707/9ODvCJ2AnZ0dEMOosKtD",
  dominio: "brunoaprovaconcursos.com.br",    // medição só liga neste domínio (prévias não sujam os dados)
  /* As campanhas de Leads da Meta otimizam o evento "Lead" (1º contato da pessoa em 7 dias).
     false = Contato em todo clique, como no modelo (padrão).
     true  = Contato só 1x por pessoa a cada 30 dias (use só se alguma campanha voltar a otimizar "Contato"). */
  contatoUmaVez: false,
  social: {                                  // vazio = some do site
    facebook: "https://www.facebook.com/1110130492177431",
    youtube: "https://www.youtube.com/channel/UCFcYFOVcGCRMS1OHLwovt9w",
    google: "https://www.google.com/search?q=Bruno+Aprova+Concursos",
    instagram: "",
    tiktok: ""
  }
};
/* ============================================== */

(function () {
  var C = window.HG;
  var host = location.hostname.replace(/^www\./, '');
  var medir = host === C.dominio;
  window.HG_medindo = medir;

  /* Meta Pixel */
  if (medir && C.metaPixelId) {
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', C.metaPixelId);
    fbq('track', 'PageView');
    var area = document.body.getAttribute('data-area');
    if (area) fbq('track', 'ViewContent', { content_name: area, content_category: 'tutoria-academica' });
  }

  /* Google Analytics 4 + Google Ads */
  if (medir && (C.ga4Id || C.googleAdsId)) {
    var g = document.createElement('script');
    g.async = true; g.src = 'https://www.googletagmanager.com/gtag/js?id=' + (C.ga4Id || C.googleAdsId);
    document.head.appendChild(g);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){ dataLayer.push(arguments); };
    gtag('js', new Date());
    if (C.ga4Id) gtag('config', C.ga4Id);
    if (C.googleAdsId) gtag('config', C.googleAdsId);
  }

  /* Links de WhatsApp com mensagem por botão */
  var base = 'https://wa.me/' + C.whatsapp + '?text=';
  window.HG_wa = function (msg) { return base + encodeURIComponent(msg || (C.saudacao + ' Vim pelo site e quero orientação.')); };
  document.querySelectorAll('[data-wa]').forEach(function (a) {
    a.href = window.HG_wa(a.getAttribute('data-wa'));
    a.target = '_blank'; a.rel = 'noopener';
  });

  /* ===== Medição de contato no WhatsApp =====
     - "whatsapp_click" (GA4): todo clique em qualquer botão de WhatsApp.
     - "Contact" (Meta): todo clique, ou 1x por pessoa a cada 30 dias enquanto contatoUmaVez = true.
       Junto com ele vão a conversão do Google Ads e o "clique_whatsapp" do GA4 (os mesmos do site antigo).
     - "Lead" (Meta) e "generate_lead" (GA4): só o 1º contato da pessoa em 7 dias
       e só quando o interesse é graduação, concurso ou serviço acadêmico (nunca ensino médio).
     - Toda medição leva a área de interesse. */
  var LEAD_KEY = 'hg_lead_ts', INT_KEY = 'hg_interesse', LEAD_DIAS = 7;
  var CONTATO_KEY = 'bo_contato_zap', CONTATO_DIAS = 30;   /* mesma chave do site antigo: quem já contou não conta de novo */
  var store = {
    get: function (k, s) { try { return (s ? sessionStorage : localStorage).getItem(k); } catch (e) { return null; } },
    set: function (k, v, s) { try { (s ? sessionStorage : localStorage).setItem(k, v); } catch (e) {} }
  };
  var interessePorArea = { 'concursos': 'concursos', 'graduacao': 'graduacao', 'ensino-medio': 'ensino-medio', 'servicos': 'servicos-academicos' };
  var interessePorObjetivo = function (v) {
    v = (v || '').toLowerCase();
    if (v.indexOf('concurso') > -1) return 'concursos';
    if (v.indexOf('gradua') > -1) return 'graduacao';
    if (v.indexOf('ensino m') > -1) return 'ensino-medio';
    if (v.indexOf('pend') > -1) return 'servicos-academicos';
    return '';
  };
  var interesseAtual = function () {
    var area = document.body.getAttribute('data-area') || '';
    return interessePorArea[area] || store.get(INT_KEY, true) || 'geral';
  };
  var novoId = function () { return 'wa_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8); };
  var dentroDe = function (k, dias) { var t = parseInt(store.get(k) || '0', 10); return t && (Date.now() - t) < dias * 864e5; };
  window.HG_interesse = function (i) { if (i) store.set(INT_KEY, i, true); };

  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href*="wa.me/"], a[href*="api.whatsapp.com"]');
    if (!a) return;
    if (a.classList.contains('wa-float') && document.getElementById('hg-chat')) return; /* abre o balão, não é contato */
    var origem = a.getAttribute('data-wa-label') || document.body.getAttribute('data-area') || 'site';
    var interesse = a.getAttribute('data-interesse') || interesseAtual();
    var pagina = location.pathname;
    var info = { content_name: origem, content_category: interesse };

    try { if (window.gtag) gtag('event', 'whatsapp_click', { origem: origem, interesse: interesse, pagina: pagina, transport_type: 'beacon' }); } catch (e) {}

    var primeiroContato = !dentroDe(CONTATO_KEY, CONTATO_DIAS);
    if (primeiroContato) store.set(CONTATO_KEY, String(Date.now()));
    if (!C.contatoUmaVez || primeiroContato) {
      try { if (window.fbq) fbq('track', 'Contact', info, { eventID: novoId() }); } catch (e) {}
    }
    if (primeiroContato) {
      var id = novoId();
      try { if (window.gtag && C.googleAdsConversao) gtag('event', 'conversion', { send_to: C.googleAdsConversao, transaction_id: id }); } catch (e) {}
      try { if (window.gtag && C.ga4Id) gtag('event', 'clique_whatsapp', { send_to: C.ga4Id, pagina: pagina, interesse: interesse }); } catch (e) {}
    }

    if (!dentroDe(LEAD_KEY, LEAD_DIAS) && interesse !== 'ensino-medio') {
      store.set(LEAD_KEY, String(Date.now()));
      try { if (window.fbq) fbq('track', 'Lead', info, { eventID: novoId() }); } catch (e) {}
      try { if (window.gtag) gtag('event', 'generate_lead', { method: 'whatsapp', origem: origem, interesse: interesse, pagina: pagina, transport_type: 'beacon' }); } catch (e) {}
    }
  }, true);

  /* Redes sociais: mostra só as configuradas */
  document.querySelectorAll('[data-social]').forEach(function (a) {
    var url = C.social[a.getAttribute('data-social')];
    if (url) { a.href = url; a.target = '_blank'; a.rel = 'noopener me'; } else { a.hidden = true; }
  });

  /* Menu do celular */
  var btn = document.querySelector('.menu-btn'), nav = document.getElementById('nav');
  if (btn && nav) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? 'Fechar' : 'Menu';
    });
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('open') && !nav.contains(e.target)) {
        nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); btn.textContent = 'Menu';
      }
    });
  }

  /* Cartão-resposta do topo: monta a mensagem do WhatsApp com as respostas */
  var gab = document.getElementById('gabarito'), env = document.getElementById('gab-enviar');
  if (gab && env) {
    var montar = function () {
      var o = gab.querySelector('input[name="obj"]:checked'), p = gab.querySelector('input[name="prazo"]:checked');
      var msg = C.saudacao + ' Vim pelo site e quero ' + (o ? o.value : 'orientação') + (p ? ', ' + p.value : '') + '. Pode me passar o diagnóstico gratuito?';
      env.setAttribute('data-wa', msg);
      env.setAttribute('data-interesse', interessePorObjetivo(o && o.value) || 'geral');
      env.href = window.HG_wa(msg);
      return o;
    };
    gab.addEventListener('change', function (e) {
      var o = montar();
      window.HG_interesse(interessePorObjetivo(o && o.value));
      try { if (window.gtag) gtag('event', 'quiz_answer', { question: e.target.name, answer: e.target.value }); } catch (err) {}
    });
    gab.addEventListener('submit', function (e) {
      e.preventDefault();
      var o = montar(); window.HG_interesse(interessePorObjetivo(o && o.value));
      env.click();
    });
    montar();
  }

  /* Revelação suave ao rolar (o conteúdo já nasce visível sem JS) */
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var els = document.querySelectorAll('.reveal');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    document.documentElement.classList.add('js-motion');
    els.forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 70 + 'ms'; io.observe(el); });
    /* Segurança: numa rolagem muito rápida, nada que já passou pela tela fica escondido. */
    var pend = false;
    var conferir = function () {
      pend = false;
      document.querySelectorAll('.reveal:not(.in)').forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) { el.classList.add('in'); io.unobserve(el); }
      });
    };
    window.addEventListener('scroll', function () { if (!pend) { pend = true; requestAnimationFrame(conferir); } }, { passive: true });
    window.addEventListener('load', conferir);
  }

  /* Balão de atendimento (pré-cadastro antes do WhatsApp) */
  if (document.querySelector('.wa-float')) {
    var proprio = document.querySelector('script[src*="assets/app.js"]');
    var at = document.createElement('script');
    at.src = (proprio ? proprio.src.replace(/app\.js(\?.*)?$/, 'atendimento.js') : 'assets/atendimento.js') + '?v=20261029';
    at.defer = true;
    document.body.appendChild(at);
  }

  var y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
})();
