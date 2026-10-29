/* Registro do clique no WhatsApp (Pixel Meta + Google Ads)
   - Envia só o evento "Contact" ao Pixel (o mesmo que a campanha de Leads otimiza).
   - Conta cada visitante uma única vez a cada 30 dias, mesmo que clique várias vezes
     ou em páginas diferentes. O WhatsApp abre normalmente em todos os cliques. */
(function () {
    var CHAVE = 'bo_contato_zap';
    var JANELA = 30 * 24 * 60 * 60 * 1000; /* 30 dias */
    var jaContouNestaPagina = false;

    function jaContou() {
        if (jaContouNestaPagina) return true;
        try {
            var t = parseInt(localStorage.getItem(CHAVE), 10);
            return !isNaN(t) && (Date.now() - t) < JANELA;
        } catch (e) { return false; }
    }

    function marcar() {
        jaContouNestaPagina = true;
        try { localStorage.setItem(CHAVE, String(Date.now())); } catch (e) {}
    }

    window.registrarContatoZap = function () {
        if (jaContou()) return;
        marcar();
        var id = 'zap-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
        if (typeof fbq === 'function') { fbq('track', 'Contact', {}, { eventID: id }); }
        if (typeof gtag === 'function') {
            gtag('event', 'conversion', { 'send_to': 'AW-18076144707/9ODvCJ2AnZ0dEMOosKtD', 'transaction_id': id });
        }
    };
})();
