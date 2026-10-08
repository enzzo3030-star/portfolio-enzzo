/* ==========================================================================
   script.js — portfólio one-page (Enzzo)
   IIFE puro, sem dependências. Comentado em pt-BR.

   ------------------------------------------------------------------------
   SNIPPET ANTI-FLASH DE TEMA (colar INLINE no <head>, ANTES do style.css):
   ------------------------------------------------------------------------
   <script>
     (function () {
       try {
         var t = localStorage.getItem('theme');
         if (t !== 'light' && t !== 'dark') {
           t = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
         }
         document.documentElement.setAttribute('data-theme', t);
       } catch (e) {
         document.documentElement.setAttribute('data-theme', 'dark');
       }
     })();
   </script>
   ------------------------------------------------------------------------
   Com isso o <html> já carrega com data-theme correto e o CSS não "pisca".
   O módulo de tema abaixo repete a lógica por segurança (caso o snippet
   não esteja presente) e cuida do toggle.
   ========================================================================== */

(function () {
  'use strict';

  /* ---------- Utilitários / feature detection ---------- */
  var docEl = document.documentElement;
  var mq = function (q) { return window.matchMedia ? window.matchMedia(q) : { matches: false, addEventListener: null }; };
  var reducedMotion = mq('(prefers-reduced-motion: reduce)');
  var noHover = mq('(hover: none)');            // touch / mobile
  var isMobile = function () { return noHover.matches || window.innerWidth < 768; };

  // Garante que um callback roda após o DOM estar pronto
  function onReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  /* ==========================================================
     1) TEMA — aplica cedo no <html>, toggle com localStorage
     ========================================================== */
  var THEME_KEY = 'theme';

  function getStoredTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }
  function setStoredTheme(t) {
    try { localStorage.setItem(THEME_KEY, t); } catch (e) { /* storage bloqueado: ignora */ }
  }
  function systemTheme() {
    return mq('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  function applyTheme(t) {
    docEl.setAttribute('data-theme', t);
    // Atualiza a barra do navegador em mobile (se a meta existir)
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      // Usa a cor de fundo real do CSS (--bg); fallback caso o CSS ainda não tenha carregado
      var bg = getComputedStyle(docEl).getPropertyValue('--bg').trim();
      meta.setAttribute('content', bg || (t === 'light' ? '#ffffff' : '#0a0a0a'));
    }
    var btn = document.getElementById('theme-toggle');
    if (btn) btn.setAttribute('aria-pressed', t === 'light' ? 'true' : 'false');
  }

  // Aplica imediatamente (antes do DOM pronto) — reforço do snippet inline
  (function initThemeEarly() {
    var stored = getStoredTheme();
    applyTheme(stored === 'light' || stored === 'dark' ? stored : systemTheme());
  })();

  function initThemeToggle() {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var next = docEl.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      applyTheme(next);
      setStoredTheme(next);
    });

    // Se o usuário nunca escolheu manualmente, acompanha mudanças do sistema
    var sys = mq('(prefers-color-scheme: light)');
    if (sys.addEventListener) {
      sys.addEventListener('change', function () {
        if (!getStoredTheme()) applyTheme(systemTheme());
      });
    }
  }

  /* ==========================================================
     2) CANVAS DE PARTÍCULAS CONECTADAS (#hero-canvas)
     - devicePixelRatio, resize, pausa fora da tela/aba oculta
     - desligado em mobile e prefers-reduced-motion
     ========================================================== */
  function initParticles() {
    var canvas = document.getElementById('hero-canvas');
    if (!canvas || !canvas.getContext) return;
    if (reducedMotion.matches || isMobile()) {
      canvas.style.display = 'none';
      return;
    }

    var ctx = canvas.getContext('2d', { alpha: true });
    var hero = canvas.parentElement || canvas;
    var dpr = 1, W = 0, H = 0;
    var particles = [];
    var mouse = { x: -9999, y: -9999, active: false };
    var running = false, rafId = 0, visible = true, pageVisible = !document.hidden;

    // Parâmetros de "sensação" (ajuste fino aqui)
    var LINK_DIST = 120;      // distância máxima para ligar duas partículas
    var MOUSE_DIST = 160;     // raio de influência do mouse
    var MOUSE_FORCE = 0.045;  // força de atração para o mouse
    var SPEED = 0.35;         // velocidade base
    var DENSITY = 1 / 11000;  // partículas por pixel² (CSS px)
    var MAX_PARTICLES = 140;

    // Lê a cor de destaque das variáveis CSS (--accent) para combinar com o tema
    function accentRGB() {
      var raw = getComputedStyle(docEl).getPropertyValue('--accent').trim() || '#c6ff00';
      if (raw[0] === '#') {
        var h = raw.length === 4
          ? raw.slice(1).split('').map(function (c) { return c + c; }).join('')
          : raw.slice(1, 7);
        var n = parseInt(h, 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
      }
      var m = raw.match(/\d+/g);
      return m && m.length >= 3 ? [+m[0], +m[1], +m[2]] : [198, 255, 0];
    }
    var rgb = accentRGB();
    var rgbStr = rgb.join(',');

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2); // limita a 2x para economizar GPU
      W = hero.clientWidth || window.innerWidth;
      H = hero.clientHeight || window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // desenha em unidades CSS

      // Ajusta quantidade de partículas à área
      var target = Math.min(MAX_PARTICLES, Math.max(30, Math.round(W * H * DENSITY)));
      while (particles.length < target) particles.push(spawn());
      particles.length = target;
    }

    function spawn() {
      var a = Math.random() * Math.PI * 2;
      var s = SPEED * (0.5 + Math.random());
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        r: 1 + Math.random() * 1.5
      };
    }

    function step() {
      ctx.clearRect(0, 0, W, H);
      var i, j, p, q, dx, dy, d2, n = particles.length;

      // Movimento + influência do mouse + bordas (wrap)
      for (i = 0; i < n; i++) {
        p = particles[i];
        if (mouse.active) {
          dx = mouse.x - p.x; dy = mouse.y - p.y;
          d2 = dx * dx + dy * dy;
          if (d2 < MOUSE_DIST * MOUSE_DIST && d2 > 1) {
            var d = Math.sqrt(d2);
            var f = (1 - d / MOUSE_DIST) * MOUSE_FORCE;
            p.vx += (dx / d) * f;
            p.vy += (dy / d) * f;
          }
        }
        // Limita velocidade para não "explodir" perto do mouse
        var sp = p.vx * p.vx + p.vy * p.vy, maxSp = SPEED * 3;
        if (sp > maxSp * maxSp) { var k = maxSp / Math.sqrt(sp); p.vx *= k; p.vy *= k; }
        // Atrito leve para voltar à velocidade base
        p.vx *= 0.995; p.vy *= 0.995;

        p.x += p.vx; p.y += p.vy;
        if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10; else if (p.y > H + 10) p.y = -10;
      }

      // Linhas entre partículas próximas (O(n²) mas n ≤ 140 → barato)
      ctx.lineWidth = 1;
      for (i = 0; i < n; i++) {
        p = particles[i];
        for (j = i + 1; j < n; j++) {
          q = particles[j];
          dx = p.x - q.x; dy = p.y - q.y;
          d2 = dx * dx + dy * dy;
          if (d2 < LINK_DIST * LINK_DIST) {
            var alpha = (1 - Math.sqrt(d2) / LINK_DIST) * 0.35;
            ctx.strokeStyle = 'rgba(' + rgbStr + ',' + alpha.toFixed(3) + ')';
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
        // Linha até o mouse
        if (mouse.active) {
          dx = p.x - mouse.x; dy = p.y - mouse.y;
          d2 = dx * dx + dy * dy;
          if (d2 < MOUSE_DIST * MOUSE_DIST) {
            var a2 = (1 - Math.sqrt(d2) / MOUSE_DIST) * 0.5;
            ctx.strokeStyle = 'rgba(' + rgbStr + ',' + a2.toFixed(3) + ')';
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
          }
        }
      }

      // Pontos
      ctx.fillStyle = 'rgba(' + rgbStr + ',0.8)';
      for (i = 0; i < n; i++) {
        p = particles[i];
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }

      rafId = requestAnimationFrame(step);
    }

    function start() {
      if (running || !visible || !pageVisible) return;
      running = true;
      rafId = requestAnimationFrame(step);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(rafId);
    }

    // Pausa quando o hero sai da tela
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        visible ? start() : stop();
      }, { threshold: 0.05 }).observe(hero);
    }
    // Pausa quando a aba fica oculta
    document.addEventListener('visibilitychange', function () {
      pageVisible = !document.hidden;
      pageVisible ? start() : stop();
    });

    // Mouse (coordenadas relativas ao hero, já que o canvas tem pointer-events:none)
    hero.addEventListener('mousemove', function (e) {
      var rect = hero.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    }, { passive: true });
    hero.addEventListener('mouseleave', function () { mouse.active = false; });

    // Resize com debounce
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        if (isMobile()) { stop(); canvas.style.display = 'none'; return; }
        canvas.style.display = '';
        resize();
        start();
      }, 150);
    }, { passive: true });

    // Recalcula cor quando o tema muda (observa o atributo data-theme)
    if ('MutationObserver' in window) {
      new MutationObserver(function () { rgb = accentRGB(); rgbStr = rgb.join(','); })
        .observe(docEl, { attributes: true, attributeFilter: ['data-theme'] });
    }

    // Se o usuário ativar reduced-motion em tempo real, desliga
    if (reducedMotion.addEventListener) {
      reducedMotion.addEventListener('change', function (e) {
        if (e.matches) { stop(); canvas.style.display = 'none'; }
        else { canvas.style.display = ''; resize(); start(); }
      });
    }

    resize();
    start();
  }

  /* ==========================================================
     3) CURSOR CUSTOM (.cursor-dot)
     - segue o mouse com leve suavização (lerp) via rAF
     - .is-hover em a/button/[role=button]/label/input
     - desativado em (hover:none) e reduced-motion
     ========================================================== */
  function initCursor() {
    var dot = document.querySelector('.cursor-dot');
    if (!dot) return;
    if (noHover.matches || reducedMotion.matches) {
      dot.style.display = 'none';
      return;
    }

    var tx = -100, ty = -100, cx = -100, cy = -100; // alvo e posição atual
    var raf = 0, shown = false;
    var HOVER_SEL = 'a, button, [role="button"], label, input, textarea, select, summary';

    function loop() {
      // Interpolação: 0.25 = responsivo mas suave
      cx += (tx - cx) * 0.25;
      cy += (ty - cy) * 0.25;
      dot.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0) translate(-50%,-50%)';
      if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) raf = requestAnimationFrame(loop);
      else raf = 0;
    }

    document.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!shown) { shown = true; cx = tx; cy = ty; dot.classList.add('is-active'); }
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });

    // Esconde ao sair da janela, mostra ao voltar
    document.addEventListener('mouseleave', function () { dot.classList.remove('is-active'); });
    document.addEventListener('mouseenter', function () { dot.classList.add('is-active'); });

    // Hover em interativos (delegação com mouseover/mouseout — bubbling)
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest && e.target.closest(HOVER_SEL)) dot.classList.add('is-hover');
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest && e.target.closest(HOVER_SEL)) dot.classList.remove('is-hover');
    });
  }

  /* ==========================================================
     4) REVEAL AO ROLAR (.reveal -> .is-visible)
     ========================================================== */
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    // Sem IO ou com reduced-motion: mostra tudo de uma vez
    if (!('IntersectionObserver' in window) || reducedMotion.matches) {
      for (var i = 0; i < els.length; i++) els[i].classList.add('is-visible');
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-visible');
          io.unobserve(en.target); // anima uma única vez
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    for (var j = 0; j < els.length; j++) io.observe(els[j]);
  }

  /* ==========================================================
     5) HEADER #nav — .is-scrolled + link ativo por seção
     ========================================================== */
  function initNav() {
    var nav = document.getElementById('nav');
    if (!nav) return;

    // .is-scrolled (com rAF para não processar todo evento de scroll)
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        nav.classList.toggle('is-scrolled', window.scrollY > 24);
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Link ativo por seção
    var links = Array.prototype.slice.call(nav.querySelectorAll('.nav__link[href^="#"]'));
    if (!links.length || !('IntersectionObserver' in window)) return;

    var byId = {};
    var sections = [];
    links.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      var sec = id && document.getElementById(id);
      if (sec) { byId[id] = a; sections.push(sec); }
    });
    if (!sections.length) return;

    function setActive(id) {
      links.forEach(function (a) {
        var on = a === byId[id];
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
      });
    }

    // Observa a faixa central da viewport: a seção que a ocupa é a ativa
    var ratios = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { ratios[en.target.id] = en.isIntersecting ? en.intersectionRatio : 0; });
      var best = null, bestR = 0;
      sections.forEach(function (s) {
        if ((ratios[s.id] || 0) > bestR) { bestR = ratios[s.id]; best = s.id; }
      });
      if (best) setActive(best);
    }, { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] });

    sections.forEach(function (s) { io.observe(s); });
  }

  /* ==========================================================
     6) MENU MOBILE (#nav-burger -> .nav__menu.is-open)
     ========================================================== */
  function initBurger() {
    var burger = document.getElementById('nav-burger');
    var menu = document.querySelector('.nav__menu');
    if (!burger || !menu) return;

    function setOpen(open) {
      menu.classList.toggle('is-open', open);
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('menu-open', open); // CSS pode travar o scroll
    }
    burger.setAttribute('aria-expanded', 'false');
    if (!burger.hasAttribute('aria-controls') && menu.id) burger.setAttribute('aria-controls', menu.id);

    burger.addEventListener('click', function () {
      setOpen(!menu.classList.contains('is-open'));
    });

    // Fecha ao clicar em qualquer link do menu
    menu.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a')) setOpen(false);
    });

    // Fecha com Esc
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) { setOpen(false); burger.focus(); }
    });

    // Fecha ao clicar fora
    document.addEventListener('click', function (e) {
      if (!menu.classList.contains('is-open')) return;
      if (!menu.contains(e.target) && !burger.contains(e.target)) setOpen(false);
    });

    // Fecha se voltar para desktop (960px, mesmo breakpoint do CSS)
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 960 && menu.classList.contains('is-open')) setOpen(false);
    }, { passive: true });
  }

  /* ==========================================================
     7) ANO ATUAL NO FOOTER (#year)
     ========================================================== */
  function initYear() {
    var y = document.getElementById('year');
    if (y) y.textContent = String(new Date().getFullYear());
  }

  /* ---------- Boot ---------- */
  onReady(function () {
    initThemeToggle();
    initYear();
    initNav();
    initBurger();
    initReveal();
    initCursor();
    initParticles();
  });
})();
