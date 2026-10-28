/* Redes sociais da Bruno Ortiz: menu no topo, ícones no rodapé e ajuste do menu no computador.
   Para trocar um link, altere só a lista abaixo — vale para todas as páginas. */
(function () {
    'use strict';

    var REDES = [
        { id: 'whatsapp',  nome: 'WhatsApp',          icone: 'fa-brands fa-whatsapp', zap: true },
        { id: 'facebook',  nome: 'Facebook',          icone: 'fa-brands fa-facebook-f', url: 'https://www.facebook.com/1110130492177431' },
        { id: 'youtube',   nome: 'YouTube',           icone: 'fa-brands fa-youtube',    url: 'https://www.youtube.com/channel/UCFcYFOVcGCRMS1OHLwovt9w' },
        { id: 'google',    nome: 'Google Meu Negócio', icone: 'fa-brands fa-google',    url: 'https://www.google.com/search?q=Bruno+Aprova+Concursos' }
    ];

    function link(rede, classe, comTexto) {
        var a = document.createElement('a');
        a.className = classe + ' rede-' + rede.id + (rede.zap ? ' c-zap' : '');
        a.setAttribute('aria-label', rede.nome);
        a.title = rede.nome;
        if (rede.zap) {
            a.href = 'javascript:void(0)';
        } else {
            a.href = rede.url;
            a.target = '_blank';
            a.rel = 'noopener';
        }
        var i = document.createElement('i');
        i.className = rede.icone;
        i.setAttribute('aria-hidden', 'true');
        a.appendChild(i);
        if (comTexto) {
            var s = document.createElement('span');
            s.textContent = rede.nome;
            a.appendChild(s);
        }
        return a;
    }

    var header = document.querySelector('.site-header');
    var nav = document.getElementById('menu-links');

    /* 1. Menu "Redes" no topo */
    if (header && nav && !nav.querySelector('.redes-menu')) {
        var box = document.createElement('div');
        box.className = 'redes-menu';

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'redes-toggle';
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-controls', 'redes-lista');
        btn.innerHTML = '<i class="fa-solid fa-share-nodes" aria-hidden="true"></i> Redes <i class="fa-solid fa-chevron-down redes-seta" aria-hidden="true"></i>';

        var lista = document.createElement('div');
        lista.className = 'redes-lista';
        lista.id = 'redes-lista';
        var titulo = document.createElement('span');
        titulo.className = 'redes-titulo';
        titulo.textContent = 'Redes sociais';
        lista.appendChild(titulo);
        REDES.forEach(function (r) { lista.appendChild(link(r, 'redes-item', true)); });

        box.appendChild(btn);
        box.appendChild(lista);

        var cta = nav.querySelector('.btn-destaque');
        nav.insertBefore(box, cta || null);

        function fechar() { box.classList.remove('aberto'); btn.setAttribute('aria-expanded', 'false'); }
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            var abrir = !box.classList.contains('aberto');
            box.classList.toggle('aberto', abrir);
            btn.setAttribute('aria-expanded', abrir ? 'true' : 'false');
        });
        document.addEventListener('click', function (e) { if (!box.contains(e.target)) fechar(); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fechar(); });
        lista.addEventListener('click', function (e) { if (e.target.closest('a')) fechar(); });
    }

    /* 2. Menu do computador: quando os itens não cabem na barra, vira menu recolhido (sem quebrar) */
    if (header && nav) {
        var celular = window.matchMedia('(max-width: 1050px)');
        var pendente = false;

        function ajustar() {
            pendente = false;
            if (celular.matches) { header.classList.add('nav-compacta'); return; }
            header.classList.remove('nav-compacta');
            var cs = window.getComputedStyle(header);
            var livre = header.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
            if (nav.scrollWidth > livre + 1) {
                header.classList.add('nav-compacta');
            } else {
                nav.classList.remove('menu-aberto');
            }
        }
        function agendar() { if (!pendente) { pendente = true; window.requestAnimationFrame(ajustar); } }

        ajustar();
        window.addEventListener('resize', agendar);
        window.addEventListener('load', agendar);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(agendar);
    }

    /* 3. Ícones no rodapé */
    function rodape() {
        var footer = document.querySelector('footer');
        if (!footer || footer.querySelector('.redes-rodape')) return;
        var bloco = document.createElement('div');
        bloco.className = 'redes-rodape';
        var t = document.createElement('span');
        t.className = 'redes-titulo';
        t.textContent = 'Redes sociais';
        var linha = document.createElement('div');
        linha.className = 'redes-icones';
        REDES.forEach(function (r) { linha.appendChild(link(r, 'redes-icone', false)); });
        bloco.appendChild(t);
        bloco.appendChild(linha);

        /* entra logo acima da linha de direitos autorais */
        var ultimo = footer.lastElementChild;
        if (ultimo && ultimo.tagName === 'DIV' && /©/.test(ultimo.textContent)) {
            footer.insertBefore(bloco, ultimo);
        } else if (footer.children.length === 0) {
            var copy = document.createElement('div');
            copy.className = 'redes-copy';
            while (footer.firstChild) copy.appendChild(footer.firstChild);
            footer.appendChild(bloco);
            footer.appendChild(copy);
        } else {
            footer.appendChild(bloco);
        }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', rodape); else rodape();
})();
