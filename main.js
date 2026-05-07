/* ==========================================================================
   NODO — INTERACTIVE LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    // --- 1. LOADING LOGIC ---
    const loader      = document.getElementById('loader');
    const mainContent = document.getElementById('main-content');
    const nav         = document.getElementById('navbar');

    document.body.style.overflow = 'hidden';

    if (loader) {
        function hideLoader() {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
                revealMainContent();
            }, 600);
        }
        // Logo fade-in dura ~2s; mostramos loader ~2.7s total (40% más rápido)
        setTimeout(hideLoader, 2700);
    } else {
        revealMainContent();
    }

    function revealMainContent() {
        mainContent.classList.add('visible');
        document.body.style.overflowY = 'auto';

        // Comienza las animaciones de aparición solo después de que el loader se haya ido
        setTimeout(() => {
            if (typeof startReveal === 'function') startReveal();
        }, 400);

        setTimeout(() => {
            const wspPlugin = document.getElementById('wsp-plugin');
            const isMobile  = window.innerWidth <= 768;
            
            if (wspPlugin && !isMobile) {
                wspPlugin.classList.add('show');
            }

            setTimeout(() => {
                const wspClose = document.getElementById('close-wsp');
                if (wspClose) wspClose.classList.add('visible');
            }, 5000);
        }, 1000);
    }

    // --- WhatsApp Scroll Visibility (Mobile) ---
    window.addEventListener('scroll', () => {
        const isMobile  = window.innerWidth <= 768;
        if (!isMobile) return;

        const wspPlugin = document.getElementById('wsp-plugin');
        if (!wspPlugin) return;

        const heroEl = document.getElementById('hero');
        const threshold = heroEl ? heroEl.offsetHeight - 100 : 600;

        if (window.scrollY > threshold) {
            wspPlugin.classList.add('show');
        } else {
            wspPlugin.classList.remove('show');
        }
    });

    // Plugin close
    const wspClose = document.getElementById('close-wsp');
    if (wspClose) {
        wspClose.addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('wsp-plugin').style.display = 'none';
        });
    }

    // --- 2. NAVBAR & SCROLL PROGRESS ---
    const scrollProgress = document.getElementById('scroll-progress');

    const heroEl = document.getElementById('hero');

    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        
        // --- PARALLAX HERO CONTENT ---
        const heroContent = document.querySelector('.hero-content');
        if (heroContent && scrolled < 1000) {
            // El contenido baja un poco más lento (0.35x) para efecto profundidad
            heroContent.style.transform = `translateY(${scrolled * 0.35}px)`;
            // Desvanecimiento suave al bajar
            heroContent.style.opacity = 1 - (scrolled / 800);
        }

        const isMobile  = window.innerWidth <= 768;
        const threshold = isMobile
            ? (heroEl ? heroEl.offsetHeight - 80 : 400)
            : 60;
        nav.classList.toggle('scrolled', window.scrollY > threshold);

        const fullHeight = document.documentElement.scrollHeight - window.innerHeight;
        scrollProgress.style.width = ((window.scrollY / fullHeight) * 100) + '%';
    });


    // --- HITOS TIMELINE ANIMATION ---
    const hitosEl = document.querySelector('.nosotros-hitos');
    if (hitosEl) {
        const hitosObs = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                hitosEl.classList.add('animate');
                hitosObs.disconnect();
            }
        }, { threshold: 0.3 });
        hitosObs.observe(hitosEl);
    }

    // --- 4. FAQ ACCORDION ---
    document.querySelectorAll('.faq-question').forEach(btn => {
        btn.addEventListener('click', () => {
            const item   = btn.closest('.faq-item');
            const answer = item.querySelector('.faq-answer');
            const isOpen = item.classList.contains('open');

            // Close all
            document.querySelectorAll('.faq-item.open').forEach(openItem => {
                openItem.classList.remove('open');
                openItem.querySelector('.faq-answer').style.maxHeight = null;
                openItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
            });

            // Toggle current
            if (!isOpen) {
                item.classList.add('open');
                answer.style.maxHeight = answer.scrollHeight + 'px';
                btn.setAttribute('aria-expanded', 'true');
            }
        });
    });

    // --- 5. FORM VALIDATION & SUBMISSION ---
    const contactForm = document.getElementById('contact-form');
    const emailInput  = document.getElementById('email');
    const hpInput     = document.getElementById('website');

    if (emailInput) {
        emailInput.addEventListener('input', () => emailInput.setCustomValidity(''));
    }

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Honeypot check
            if (hpInput && hpInput.value !== '') return;

            const email = emailInput ? emailInput.value : '';
            const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailReg.test(email)) {
                emailInput.setCustomValidity('Email inválido');
                emailInput.reportValidity();
                return;
            }

            const formData  = new FormData(contactForm);
            const data      = Object.fromEntries(formData.entries());
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const origText  = submitBtn.innerHTML;

            submitBtn.innerHTML = 'Enviando... <i class="fas fa-spinner fa-spin"></i>';
            submitBtn.disabled  = true;

            fetch('api/submit.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(data)
            })
            .then(() => {
                setTimeout(() => {
                    window.location.href = 'formulario_enviado.html';
                }, 800);
            })
            .catch(() => {
                setTimeout(() => {
                    window.location.href = 'formulario_enviado.html';
                }, 800);
            });
        });
    }

    // --- 6. SCROLL REVEAL ---
    const revealEls = document.querySelectorAll(
        '.pillar-card, .servicio-card, .section-header, .timeline-item, .stat-item, .faq-item, .elegant-form, .nosotros-text, .mision-text, .mision-pillars, .stat-badge, .socio-badge'
    );

    revealEls.forEach(el => el.classList.add('reveal'));

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                // Stagger de 150ms para elementos que entran en lote
                setTimeout(() => entry.target.classList.add('active'), i * 150);
            }
        });
    }, { threshold: 0.1 });

    function startReveal() {
        revealEls.forEach(el => observer.observe(el));
    }
    // Hacemos startReveal disponible si se definió antes del llamado
    window.startReveal = startReveal;

    // --- 7. MOUSE SHINE ON CARDS ---
    document.querySelectorAll('.servicio-card, .pillar-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
            card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
        });
    });

    // --- 8. SERVICE CARDS EXPAND ---
    const grid = document.querySelector('.servicios-grid');
    document.querySelectorAll('.servicio-card').forEach(card => {
        card.addEventListener('click', () => {
            const btn = card.querySelector('.btn-ver-mas');
            const isOpen = card.classList.contains('open');
            
            // Si vamos a abrir esta tarjeta, cerramos cualquier otra que esté abierta
            if (!isOpen) {
                document.querySelectorAll('.servicio-card.open').forEach(openCard => {
                    openCard.classList.remove('open');
                    const otherBtn = openCard.querySelector('.btn-ver-mas');
                    if (otherBtn) otherBtn.textContent = 'Ver +';
                });
            }

            // Alternar estado de la tarjeta actual
            card.classList.toggle('open');
            const isNowOpen = card.classList.contains('open');
            if (btn) btn.textContent = isNowOpen ? 'Cerrar -' : 'Ver +';

            // Alternar estado del grid general para el layout de foco
            if (grid) {
                grid.classList.toggle('has-open', isNowOpen);
            }

            // Scroll suave hacia la tarjeta expandida si es necesario
            if (isNowOpen) {
                setTimeout(() => {
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            }
        });
    });

});

// --- VISIT TRACKER ---
(() => {
    const API_URL = "/api/api_visitas.php";
    const START_KEY   = "viu_session_start_ms";
    const SENT_END_KEY = "viu_sent_end";

    if (!sessionStorage.getItem(START_KEY)) {
        sessionStorage.setItem(START_KEY, String(Date.now()));
    }
    sessionStorage.removeItem(SENT_END_KEY);

    function detectDevice() {
        const w  = Math.min(window.screen.width || 0, window.innerWidth || 0) || window.innerWidth || 1024;
        const ua = navigator.userAgent || "";
        if (/iPad|Tablet|Nexus 7|SM-T|Tab/i.test(ua) || (w >= 768 && w <= 1024)) return "tablet";
        if (/Mobi|Android|iPhone|iPod/i.test(ua) || w < 768) return "mobile";
        return "desktop";
    }

    function detectRefCategory() {
        const r = (document.referrer || "").toLowerCase();
        if (!r) return "direct";
        if (r.includes("google."))   return "google";
        if (r.includes("facebook.") || r.includes("fb.com")) return "facebook";
        if (r.includes("instagram.")) return "instagram";
        if (r.includes("linkedin.")) return "linkedin";
        return "other";
    }

    fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", pagina: location.pathname || "/", device: detectDevice(), ref: detectRefCategory() }),
        keepalive: true
    }).catch(() => {});

    function sendEnd() {
        if (sessionStorage.getItem(SENT_END_KEY) === "1") return;
        sessionStorage.setItem(SENT_END_KEY, "1");
        const startMs = parseInt(sessionStorage.getItem(START_KEY) || "0", 10);
        const durSec  = startMs ? Math.max(0, Math.round((Date.now() - startMs) / 1000)) : 0;
        const blob = new Blob([JSON.stringify({ action: "end", pagina: location.pathname || "/", duracion_seg: durSec })], { type: "application/json" });
        if (navigator.sendBeacon) navigator.sendBeacon(API_URL, blob);
    }

    window.addEventListener("pagehide",     sendEnd);
    window.addEventListener("beforeunload", sendEnd);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") sendEnd(); });
})();
