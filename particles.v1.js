/* ==========================================================================
   NODO — Hero Particle Field
   Dots oscillate with sine noise and repel from the cursor with spring-back.
   Inspired by the GPU particle technique at antigravity.google
   ========================================================================== */

(function () {
    'use strict';

    const hero = document.getElementById('hero');
    if (!hero) return;

    /* ── Canvas setup ───────────────────────────────────────────────── */
    const canvas = document.createElement('canvas');
    canvas.id = 'hero-particles';
    hero.insertBefore(canvas, hero.firstChild);
    const ctx = canvas.getContext('2d');

    /* ── Config ─────────────────────────────────────────────────────── */
    const CFG = {
        spacing:         44,     // grid spacing in px
        baseRadius:      1.4,    // dot size at rest
        hoverRadius:     3.4,    // dot size near cursor
        repulseRadius:   150,    // cursor influence radius (px)
        repulseStrength: 8,      // push-away force multiplier
        spring:          0.038,  // pull-back to oscillation target
        damping:         0.78,   // velocity decay per frame
        oscAmp:          4,      // oscillation amplitude (px)
        oscSpeed:        0.0007, // oscillation speed factor
        baseAlpha:       0.12,   // opacity at rest
        hoverAlpha:      0.72,   // opacity near cursor
        // Lerp: rest → cursor proximity
        baseColor:       [160, 190, 230], // cool blue-white
        accentColor:     [201, 168,  76], // NODO gold
    };

    /* ── State ───────────────────────────────────────────────────────── */
    let W = 0, H = 0;
    let particles = [];
    const mouse = { x: -9999, y: -9999 };

    /* ── Helpers ─────────────────────────────────────────────────────── */
    function lerp(a, b, t) { return a + (b - a) * t; }

    /* ── Grid builder ────────────────────────────────────────────────── */
    function buildGrid() {
        particles = [];
        const sp   = window.innerWidth < 600 ? CFG.spacing * 1.5 : CFG.spacing;
        const cols = Math.ceil(W / sp) + 1;
        const rows = Math.ceil(H / sp) + 1;
        const ox   = (W - (cols - 1) * sp) / 2;
        const oy   = (H - (rows - 1) * sp) / 2;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const bx = ox + c * sp;
                const by = oy + r * sp;
                particles.push({
                    ox: bx, oy: by,   // origin (grid position)
                    x:  bx, y:  by,   // current position
                    vx: 0,  vy: 0,    // velocity
                    phase:  Math.random() * Math.PI * 2,  // x oscillation phase
                    phaseY: Math.random() * Math.PI * 2,  // y oscillation phase
                    speed:  0.55 + Math.random() * 0.9,   // individual timing offset
                });
            }
        }
    }

    /* ── Resize ──────────────────────────────────────────────────────── */
    function resize() {
        W = canvas.width  = hero.offsetWidth;
        H = canvas.height = hero.offsetHeight;
        buildGrid();
    }

    /* ── Main loop ───────────────────────────────────────────────────── */
    function animate(ts) {
        requestAnimationFrame(animate);
        ctx.clearRect(0, 0, W, H);

        const mx = mouse.x;
        const my = mouse.y;
        const rr = CFG.repulseRadius * CFG.repulseRadius; // squared, avoid sqrt when possible

        for (const p of particles) {

            /* 1 · Oscillation — each dot breathes independently */
            const oscX = Math.sin(ts * CFG.oscSpeed * p.speed + p.phase)  * CFG.oscAmp;
            const oscY = Math.cos(ts * CFG.oscSpeed * p.speed + p.phaseY) * CFG.oscAmp;
            const tx = p.ox + oscX;
            const ty = p.oy + oscY;

            /* 2 · Spring toward oscillation target */
            p.vx += (tx - p.x) * CFG.spring;
            p.vy += (ty - p.y) * CFG.spring;

            /* 3 · Mouse repulsion */
            const mdx = p.x - mx;
            const mdy = p.y - my;
            const d2  = mdx * mdx + mdy * mdy;
            let proximity = 0;

            if (d2 < rr) {
                const d   = Math.sqrt(d2);
                proximity = 1 - d / CFG.repulseRadius;
                const f   = proximity * proximity * CFG.repulseStrength;
                p.vx += (mdx / d) * f;
                p.vy += (mdy / d) * f;
            }

            /* 4 · Integrate */
            p.vx *= CFG.damping;
            p.vy *= CFG.damping;
            p.x  += p.vx;
            p.y  += p.vy;

            /* 5 · Draw — size, alpha, color all lerp by proximity² */
            const t2  = proximity * proximity;
            const rad = lerp(CFG.baseRadius, CFG.hoverRadius, t2);
            const al  = lerp(CFG.baseAlpha,  CFG.hoverAlpha,  t2);
            const cr  = Math.round(lerp(CFG.baseColor[0], CFG.accentColor[0], t2));
            const cg  = Math.round(lerp(CFG.baseColor[1], CFG.accentColor[1], t2));
            const cb  = Math.round(lerp(CFG.baseColor[2], CFG.accentColor[2], t2));

            ctx.beginPath();
            ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${cr},${cg},${cb},${al.toFixed(2)})`;
            ctx.fill();
        }
    }

    /* ── Events ──────────────────────────────────────────────────────── */
    hero.addEventListener('mousemove', e => {
        const r   = hero.getBoundingClientRect();
        mouse.x   = e.clientX - r.left;
        mouse.y   = e.clientY - r.top;
    });

    hero.addEventListener('mouseleave', () => {
        mouse.x = mouse.y = -9999;
    });

    hero.addEventListener('touchmove', e => {
        const r = hero.getBoundingClientRect();
        const t = e.touches[0];
        mouse.x = t.clientX - r.left;
        mouse.y = t.clientY - r.top;
    }, { passive: true });

    hero.addEventListener('touchend', () => {
        mouse.x = mouse.y = -9999;
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 150);
    });

    /* ── Init ────────────────────────────────────────────────────────── */
    resize();
    requestAnimationFrame(animate);

})();
