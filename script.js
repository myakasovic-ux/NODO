document.addEventListener('DOMContentLoaded', () => {
    // Header Scroll Effect
    const header = document.querySelector('.main-header');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Reveal Animations using Intersection Observer
    const observerOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Ensure smooth one-time animation
            }
        });
    }, observerOptions);

    // Elements to reveal
    const revealElements = document.querySelectorAll('.model-card, .section-header, .project-info, .project-visual, .footer-cta, .timeline-progress, .footer-calculator');

    revealElements.forEach(el => {
        if (el.classList.contains('timeline-progress')) {
            // Special observer for timeline to trigger animation class
            const progressObserver = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    el.classList.add('animate');
                    progressObserver.unobserve(el);
                }
            }, { threshold: 0.5 });
            progressObserver.observe(el);
        } else {
            el.classList.add('reveal');
            observer.observe(el);
        }
    });

    // Project Image Toggle Interaction
    const projectVisual = document.querySelector('.project-visual');
    const indicator = projectVisual?.querySelector('.image-indicator');
    const tipologiasBtn = document.getElementById('btn-tipologias');

    function toggleProjectImage() {
        if (!projectVisual || !indicator) return;
        const isShowingSecondary = projectVisual.classList.toggle('show-secondary');
        indicator.textContent = isShowingSecondary
            ? 'Click para volver a vista'
            : 'Hacer click para ver plano';
    }

    if (projectVisual) {
        projectVisual.addEventListener('click', toggleProjectImage);
    }

    if (tipologiasBtn) {
        tipologiasBtn.addEventListener('click', toggleProjectImage);
    }

    // RUT Formatting and Validation
    const rutInput = document.getElementById('user-rut');
    const contactForm = document.getElementById('contact-form');

    if (rutInput) {
        rutInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/[^\dkK]/g, '');
            if (value.length > 1) {
                let body = value.slice(0, -1);
                let dv = value.slice(-1).toUpperCase();

                // Add dots
                if (body.length > 6) {
                    body = body.replace(/(\d+)(\d{3})(\d{3})$/, '$1.$2.$3');
                } else if (body.length > 3) {
                    body = body.replace(/(\d+)(\d{3})$/, '$1.$2');
                }

                e.target.value = `${body}-${dv}`;
            } else if (value.length === 1) {
                e.target.value = value.toUpperCase();
            }
        });
    }

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            const rawRut = rutInput.value.replace(/[^\dkK]/g, '');
            if (!validateRut(rawRut)) {
                e.preventDefault();
                alert('El RUT ingresado no es válido. Por favor, revíselo.');
                rutInput.focus();
            } else {
                alert('¡Formulario enviado con éxito!');
            }
        });
    }

    // Map Modal Logic
    const wazeBtn = document.getElementById('btn-waze');
    const mapModal = document.getElementById('map-modal');
    const closeModal = document.querySelector('.close-modal');

    if (wazeBtn && mapModal) {
        wazeBtn.addEventListener('click', () => {
            mapModal.style.display = 'flex';
            // Force a reflow to make the transition work
            void mapModal.offsetWidth;
            mapModal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        });

        const closeFunc = () => {
            mapModal.classList.remove('active');
            setTimeout(() => {
                mapModal.style.display = 'none';
            }, 400); // Match CSS transition duration
            document.body.style.overflow = 'auto'; // Restore scrolling
        };

        closeModal?.addEventListener('click', closeFunc);

        // Close on background click
        window.addEventListener('click', (e) => {
            if (e.target === mapModal) {
                closeFunc();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mapModal.classList.contains('active')) {
                closeFunc();
            }
        });
    }

    function validateRut(rut) {
        if (rut.length < 8) return false;

        const dv = rut.slice(-1).toUpperCase();
        let body = rut.slice(0, -1);

        let sum = 0;
        let mul = 2;

        for (let i = body.length - 1; i >= 0; i--) {
            sum += parseInt(body.charAt(i)) * mul;
            mul = mul === 7 ? 2 : mul + 1;
        }

        let res = 11 - (sum % 11);
        let calculatedDv = res === 11 ? '0' : res === 10 ? 'K' : res.toString();

        return dv === calculatedDv;
    }

    // Mortgage Calculator Logic
    const calcMonto = document.getElementById('calc-monto');
    const calcPie = document.getElementById('calc-pie');
    const calcTasa = document.getElementById('calc-tasa');
    const calcAnos = document.getElementById('calc-anos');

    const valMonto = document.getElementById('val-monto');
    const valPie = document.getElementById('val-pie');
    const valTasa = document.getElementById('val-tasa');
    const valAnos = document.getElementById('val-anos');
    const valDividendo = document.getElementById('val-dividendo');
    const valClp = document.getElementById('val-clp');

    function calculateMortgage() {
        if (!calcMonto || !calcPie || !calcTasa || !calcAnos) return;

        const monto = parseFloat(calcMonto.value);
        const piePct = parseFloat(calcPie.value);
        const tasaAnual = parseFloat(calcTasa.value);
        const anos = parseInt(calcAnos.value);

        // Update display values
        valMonto.textContent = monto.toLocaleString('es-CL');
        valPie.textContent = piePct;
        valTasa.textContent = tasaAnual;
        valAnos.textContent = anos;

        // Calculations
        const principal = monto * (1 - piePct / 100);
        const tasaMensual = (tasaAnual / 100) / 12;
        const totalPagos = anos * 12;

        let dividendo = 0;
        if (tasaMensual > 0) {
            dividendo = principal * (tasaMensual * Math.pow(1 + tasaMensual, totalPagos)) / (Math.pow(1 + tasaMensual, totalPagos) - 1);
        } else {
            dividendo = principal / totalPagos;
        }

        valDividendo.textContent = dividendo.toFixed(2);

        // CLP Conversion
        const ufString = document.querySelector('.uf-value')?.textContent || '';
        const ufMatch = ufString.match(/\$[\d\.]+/);
        if (ufMatch) {
            const ufValue = parseFloat(ufMatch[0].replace('$', '').replace(/\./g, ''));
            const dividendoClp = Math.round(dividendo * ufValue);
            valClp.textContent = `$${dividendoClp.toLocaleString('es-CL')}`;
        }
    }

    if (calcMonto) {
        [calcMonto, calcPie, calcTasa, calcAnos].forEach(input => {
            input.addEventListener('input', calculateMortgage);
        });
        // Initial calculation
        calculateMortgage();
    }
});
