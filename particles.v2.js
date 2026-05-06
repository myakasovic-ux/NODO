/* ==========================================================================
   NODO — Hero Particle Field  v2  (with casual line connections)
   Dots oscillate with sine noise, repel from cursor, and form a sparse
   network of lines between randomly selected neighbour pairs.
   Backup of v1 → particles.v1.js
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
        spacing:         44,    // grid spacing (px)
        baseRadius:      1.4,   // dot radius at rest
        hoverRadius:     3.4,   // dot radius near cursor
        repulseRadius:   150,   // cursor influence radius (px)
        repulseStrength: 8,     // push-away multiplier
        spring:          0.038, // spring back to oscillation target
        damping:         0.78,  // velocity decay per frame
        oscAmp:          4,     // oscillation amplitude (px)
        oscSpeed:        0.0007,// oscillation speed factor
        baseAlpha:       0.12,  // dot opacity at rest
        hoverAlpha:      0.72,  // dot opacity near cursor
        baseColor:       [160, 190, 230], // cool blue-white
        accentColor:     [201, 168,  76], // NODO gold

        /* line settings */
        connectProb:     0.28,  // probability each eligible neighbour pair connects
        lineBaseAlpha:   0.07,  // line opacity at rest
        lineHoverAlpha:  0.30,  // extra line opacity near cursor
        lineMaxDist:     1.0,   // multiplier of spacing — beyond this, line fades out
        lineWidth:       0.55,  // stroke width (px)
    };

    /* ── State ───────────────────────────────────────────────────────── */
    let W = 0, H = 0;
    let particles   = [];
    let connections = [];   // array of [i, j] index pairs
    let gridCols    = 0;    // stored so buildConnections can use row/col arithmetic
    const mouse = { x: -9999, y: -9999 };

    /* ── Helpers ─────────────────────────────────────────────────────── */
    function lerp(a, b, t) { return a + (b - a) * t; }

    /* ── Grid builder ────────────────────────────────────────────────── */
    function buildGrid() {
        particles   = [];
        connections = [];

        const sp   = window.innerWidth < 600 ? CFG.spacing * 1.5 : CFG.spacing;
        const cols = Math.ceil(W / sp) + 1;
        const rows = Math.ceil(H / sp) + 1;
        const ox   = (W - (cols - 1) * sp) / 2;
        const oy   = (H - (rows - 1) * sp) / 2;
        gridCols   = cols;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const bx = ox + c * sp;
                const by = oy + r * sp;
                particles.push({
                    ox: bx, oy: by,
                    x:  bx, y:  by,
                    vx: 0,  vy: 0,
                    phase:     Math.random() * Math.PI * 2,
                    phaseY:    Math.random() * Math.PI * 2,
                    speed:     0.55 + Math.random() * 0.9,
                    proximity: 0,
                });
            }
        }

        const dirs = [
            [0,  1],
            [1,  0],
            [1,  1],
            [1, -1],
        ];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const i = r * cols + c;
                for (const [dr, dc] of dirs) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
                    if (Math.random() < CFG.connectProb) {
                        connections.push([i, nr * cols + nc]);
                    }
                }
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
        const rr = CFG.repulseRadius * CFG.repulseRadius;

        for (const p of particles) {
            const oscX = Math.sin(ts * CFG.oscSpeed * p.speed + p.phase)  * CFG.oscAmp;
            const oscY = Math.cos(ts * CFG.oscSpeed * p.speed + p.phaseY) * CFG.oscAmp;
            const tx = p.ox + oscX;
            const ty = p.oy + oscY;

            p.vx += (tx - p.x) * CFG.spring;
            p.vy += (ty - p.y) * CFG.spring;

            const mdx = p.x - mx;
            const mdy = p.y - my;
            const d2  = mdx * mdx + mdy * mdy;
            let prox  = 0;

            if (d2 < rr) {
                const d  = Math.sqrt(d2);
                prox     = 1 - d / CFG.repulseRadius;
                const f  = prox * prox * CFG.repulseStrength;
                p.vx += (mdx / d) * f;
                p.vy += (mdy / d) * f;
            }

            p.vx      *= CFG.damping;
            p.vy      *= CFG.damping;
            p.x       += p.vx;
            p.y       += p.vy;
            p.proximity = prox;
        }

        const maxLineDist = CFG.spacing * CFG.lineMaxDist * 2.2;
        ctx.lineWidth = CFG.lineWidth;

        for (const [i, j] of connections) {
            const a  = particles[i];
            const b  = particles[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const d  = Math.sqrt(dx * dx + dy * dy);

            if (d >= maxLineDist) continue;

            const distFade  = 1 - d / maxLineDist;
            const proxBoost = Math.max(a.proximity, b.proximity);
            const al        = (CFG.lineBaseAlpha + proxBoost * CFG.lineHoverAlpha) * distFade;

            if (al < 0.005) continue;

            const t2 = proxBoost * proxBoost;
            const cr = Math.round(lerp(CFG.baseColor[0], CFG.accentColor[0], t2));
            const cg = Math.round(lerp(CFG.baseColor[1], CFG.accentColor[1], t2));
            const cb = Math.round(lerp(CFG.baseColor[2], CFG.accentColor[2], t2));

            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(${cr},${cg},${cb},${al.toFixed(2)})`;
            ctx.stroke();
        }

        for (const p of particles) {
            const t2  = p.proximity * p.proximity;
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
        const r = hero.getBoundingClientRect();
        mouse.x = e.clientX - r.left;
        mouse.y = e.clientY - r.top;
    });

    hero.addEventListener('mouseleave', () => { mouse.x = mouse.y = -9999; });

    hero.addEventListener('touchmove', e => {
        const r = hero.getBoundingClientRect();
        const t = e.touches[0];
        mouse.x = t.clientX - r.left;
        mouse.y = t.clientY - r.top;
    }, { passive: true });

    hero.addEventListener('touchend', () => { mouse.x = mouse.y = -9999; });

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 150);
    });

    /* ── Init ────────────────────────────────────────────────────────── */
    resize();
    requestAnimationFrame(animate);

})();
