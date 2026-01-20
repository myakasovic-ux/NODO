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

    // Global-ish state for the session
    let currentUFValue = 39750; // Default fallback

    // Fetch UF Value
    async function fetchUF() {
        try {
            const response = await fetch('https://mindicador.cl/api/uf');
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            currentUFValue = data.serie[0].valor;
            const ufDisplay = document.getElementById('uf-value-display');
            if (ufDisplay) {
                // Style the number with Chilean format for display
                const formattedUF = new Intl.NumberFormat('es-CL', {
                    style: 'currency',
                    currency: 'CLP',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }).format(currentUFValue);

                ufDisplay.textContent = formattedUF;

                // Trigger mortgage calculation update after UF is fetched
                if (typeof calculateMortgage === 'function') {
                    calculateMortgage();
                }
            }
        } catch (error) {
            console.error('Error fetching UF:', error);
            // Fallback: show the default value if fetch fails
            const ufDisplay = document.getElementById('uf-value-display');
            if (ufDisplay) {
                const formattedUF = new Intl.NumberFormat('es-CL', {
                    style: 'currency',
                    currency: 'CLP',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }).format(currentUFValue);
                ufDisplay.textContent = formattedUF;
            }
        }
    }

    fetchUF();

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
    const revealElements = document.querySelectorAll('.reveal, .timeline-progress');

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

    // Scroll Spy for Header Navigation
    const sections = document.querySelectorAll('section[id], .footer-calculator[id], footer[id]');
    const navLinks = document.querySelectorAll('.main-nav a[href^="#"]');

    function updateActiveLink() {
        let currentSectionId = '';
        const scrollPosition = window.scrollY + window.innerHeight / 3;

        // Check if we are at the bottom of the page
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50) {
            currentSectionId = 'contact';
        } else {
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                if (scrollPosition >= sectionTop) {
                    currentSectionId = section.getAttribute('id');
                }
            });
        }

        navLinks.forEach(link => {
            link.classList.toggle('active-link', link.getAttribute('href') === `#${currentSectionId}`);
        });
    }

    window.addEventListener('scroll', updateActiveLink);
    updateActiveLink(); // Run once on load

    // Project Carousel Logic
    const contactForm = document.getElementById('contact-form');
    const tipologiasBtn = document.getElementById('btn-tipologias');
    const indicatorBtn = document.getElementById('btn-fullscreen-view');
    const imageModal = document.getElementById('image-modal');
    const modalImageDisplay = document.getElementById('modal-image-display');
    const arrowPrev = document.getElementById('carousel-prev');
    const arrowNext = document.getElementById('carousel-next');
    const closeImageModal = document.querySelector('.close-image-modal');

    // Group elements
    const groupExterior = document.querySelector('.group-exterior');
    const groupInterior = document.querySelector('.group-interior');

    // State
    let isShowingInterior = false;

    // Carousel Navigation Function
    function navigateCarousel(direction) {
        // Determine active group container
        const activeGroup = isShowingInterior ? groupInterior : groupExterior;
        const images = activeGroup.querySelectorAll('.carousel-img');

        let activeIndex = 0;
        images.forEach((img, index) => {
            if (img.classList.contains('active')) activeIndex = index;
        });

        // Calculate new index
        let newIndex = activeIndex + direction;
        if (newIndex >= images.length) newIndex = 0;
        if (newIndex < 0) newIndex = images.length - 1;

        // Update classes
        images[activeIndex].classList.remove('active');
        images[newIndex].classList.add('active');
    }

    if (arrowPrev && arrowNext) {
        arrowPrev.addEventListener('click', (e) => {
            e.stopPropagation();
            navigateCarousel(-1);
        });
        arrowNext.addEventListener('click', (e) => {
            e.stopPropagation();
            navigateCarousel(1);
        });
    }

    // Toggle Groups (Exterior / Interior)
    function toggleProjectMode() {
        if (!groupExterior || !groupInterior || !tipologiasBtn) return;

        isShowingInterior = !isShowingInterior;

        if (isShowingInterior) {
            groupExterior.classList.remove('active');
            groupInterior.classList.add('active');
            tipologiasBtn.textContent = 'Ver Vista';
        } else {
            groupInterior.classList.remove('active');
            groupExterior.classList.add('active');
            tipologiasBtn.textContent = 'Ver tipologías';
        }
    }

    if (tipologiasBtn) {
        tipologiasBtn.addEventListener('click', toggleProjectMode);
    }

    // Logic for "Ver en grande" (Fullscreen Modal) to use ACTIVE image in ACTIVE group
    const modalPrev = document.getElementById('modal-prev');
    const modalNext = document.getElementById('modal-next');
    let currentModalImages = [];
    let currentModalIndex = 0;

    function updateModalImage() {
        if (currentModalImages.length > 0 && modalImageDisplay) {
            modalImageDisplay.src = currentModalImages[currentModalIndex].src;
        }
    }

    if (indicatorBtn && imageModal && modalImageDisplay) {
        indicatorBtn.addEventListener('click', (e) => {
            e.stopPropagation();

            // Find currently active group and images
            const activeGroup = isShowingInterior ? groupInterior : groupExterior;
            // Get all images in the active group to populate the modal carousel
            const images = activeGroup.querySelectorAll('.carousel-img');
            currentModalImages = Array.from(images);

            // Find index of currently active image
            const activeImg = activeGroup.querySelector('.carousel-img.active');
            currentModalIndex = currentModalImages.indexOf(activeImg);
            if (currentModalIndex === -1) currentModalIndex = 0; // Fallback

            updateModalImage();

            imageModal.style.display = 'flex';
            void imageModal.offsetWidth;
            imageModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    // Modal Arrow Listeners
    if (modalPrev && modalNext) {
        modalPrev.addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentModalImages.length === 0) return;
            currentModalIndex--;
            if (currentModalIndex < 0) currentModalIndex = currentModalImages.length - 1;
            updateModalImage();
        });

        modalNext.addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentModalImages.length === 0) return;
            currentModalIndex++;
            if (currentModalIndex >= currentModalImages.length) currentModalIndex = 0;
            updateModalImage();
        });
    }

    const closeImgFunc = () => {
        if (!imageModal) return;
        imageModal.classList.remove('active');
        setTimeout(() => {
            imageModal.style.display = 'none';
            if (modalImageDisplay) modalImageDisplay.src = ''; // Clear src
        }, 400);
        document.body.style.overflow = 'auto';
    };

    if (closeImageModal) {
        closeImageModal.addEventListener('click', closeImgFunc);
    }

    if (imageModal) {
        imageModal.addEventListener('click', (e) => {
            if (e.target === imageModal || e.target.classList.contains('image-modal-content')) {
                closeImgFunc();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && imageModal.classList.contains('active')) {
                closeImgFunc();
            }
        });
    }

    // RUT Formatting and Validation
    const rutInput = document.getElementById('user-rut');
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


    // Map Modal Logic
    const wazeBtn = document.getElementById('btn-waze');
    const mapModal = document.getElementById('map-modal');
    const mapCloseBtn = mapModal ? mapModal.querySelector('.close-modal') : null;
    let mapInstance = null;

    if (wazeBtn && mapModal) {
        wazeBtn.addEventListener('click', () => {
            mapModal.style.display = 'flex';
            // Force a reflow
            void mapModal.offsetWidth;
            mapModal.classList.add('active');
            document.body.style.overflow = 'hidden';

            // Initialize Leaflet Map (MAPA OPENSTREET)
            if (!mapInstance && typeof L !== 'undefined') {
                // Initialize map with coordinates. Change the latitude and longitude values here to update the map location.
                mapInstance = L.map('map').setView([-33.044796, -71.578108], 16);

                L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                }).addTo(mapInstance);

                L.marker([-33.044796, -71.578108]).addTo(mapInstance)
                    .bindPopup('<b>ADP2</b><br>Proyecto Actual')
                    .openPopup();
            }

            // Fix for map rendering in hidden container
            setTimeout(() => {
                if (mapInstance) mapInstance.invalidateSize();
            }, 300);
        });

        const closeFunc = () => {
            mapModal.classList.remove('active');
            setTimeout(() => {
                mapModal.style.display = 'none';
            }, 400); // Match CSS transition duration
            document.body.style.overflow = 'auto'; // Restore scrolling
        };

        mapCloseBtn?.addEventListener('click', closeFunc);

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
        if (currentUFValue > 0) {
            const dividendoClp = Math.round(dividendo * currentUFValue);
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

    // New Form Fields Logic (Salary and Phone)
    const salaryInput = document.getElementById('user-salary');
    const salaryValue = document.getElementById('val-salary');
    const phoneInput = document.getElementById('user-phone');

    if (salaryInput && salaryValue) {
        salaryInput.addEventListener('input', () => {
            const val = parseInt(salaryInput.value);
            const step = 200000;
            if (val >= 5000000) {
                salaryValue.textContent = '+$5.000.000';
            } else {
                const nextVal = val + step;
                salaryValue.textContent = `$${val.toLocaleString('es-CL')} - $${nextVal.toLocaleString('es-CL')}`;
            }
        });
    }

    if (phoneInput) {
        // Prevent deleting the prefix if desired, or just validate
        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value;
            // Ensure it starts with +
            if (!value.startsWith('+')) {
                value = '+' + value.replace(/[^\d]/g, '');
            }
            e.target.value = value;
        });
    }

    // Update Contact Form Submit to include new validations
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            const rawRut = rutInput.value.replace(/[^\dkK]/g, '');
            const phoneVal = phoneInput?.value || '';
            const digitsOnly = phoneVal.replace(/[^\d]/g, '');

            if (!validateRut(rawRut)) {
                e.preventDefault();
                alert('El RUT ingresado no es válido. Por favor, revíselo.');
                rutInput.focus();
                return;
            }

            if (digitsOnly.length < 11) {
                e.preventDefault();
                alert('Por favor, ingrese un número de celular válido (9 dígitos después del código de Chile).');
                phoneInput.focus();
                return;
            }

            // Checkbox validation
            const interests = contactForm.querySelectorAll('input[name="interest"]:checked');
            if (interests.length === 0) {
                e.preventDefault();
                alert('Por favor, seleccione al menos una opción de interés (Proyecto Actual o Futuros Proyectos).');
                return;
            }

            // =========================================================================================
            // SUGERENCIA PARA BACKEND: Almacenado de datos en Base de Datos (SQL/NoSQL)
            // =========================================================================================
            // Actualmente el formulario solo hace un 'alert'. Al hostear el sitio, necesitarás un endpoint.
            //
            // OPCIÓN 1: Fetch API a tu propio servidor (Node.js, PHP, Python)
            // -----------------------------------------------------------------------------------------
            // e.preventDefault(); // Detienes el envío estándar para manejarlo con JS
            //
            // const formData = {
            //     rut: rawRut,
            //     email: document.getElementById('user-email').value,
            //     salaryRange: document.getElementById('val-salary').textContent,
            //     phone: phoneVal,
            //     interests: Array.from(interests).map(cb => cb.value),
            //     timestamp: new Date().toISOString()
            // };
            //
            // fetch('https://tu-dominio.com/api/guardar-lead', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(formData)
            // })
            // .then(response => response.json())
            // .then(data => {
            //     alert('Datos guardados correctamente en la base de datos.');
            //     contactForm.reset();
            // })
            // .catch(error => console.error('Error:', error));
            //
            // OPCIÓN 2: Usar servicios como EmailJS, Formspree o Google Sheets
            // -----------------------------------------------------------------------------------------
            // Son fáciles de integrar si no tienes un backend dedicado.
            //
            // OPCIÓN 3: Firebase (Backend as a Service)
            // -----------------------------------------------------------------------------------------
            // Importarías las funciones de Firebase y usarías: 
            // await addDoc(collection(db, "leads"), formData);
            // =========================================================================================

            alert('¡Formulario enviado con éxito!');
        });
    }

    // WhatsApp Close Functionality
    const whatsappClose = document.getElementById('whatsapp-close');
    const whatsappContainer = document.getElementById('whatsapp-container');

    if (whatsappClose && whatsappContainer) {
        whatsappClose.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent any accidental link triggers
            e.stopPropagation();
            whatsappContainer.style.display = 'none';
        });

        // Show the close button after 5 seconds
        setTimeout(() => {
            whatsappClose.classList.add('show-close');
        }, 5000);
    }
    // --- Warp Animation Logic (Antigravity Style) ---
    (function initWarpAnimation() {
        const section = document.getElementById('warp-section') || document.getElementById('model');
        const canvas = section ? section.querySelector('.warp-canvas') : null;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // =========================================================================
        // CONFIGURACIÓN PARA EL USUARIO
        // =========================================================================

        // 1. CANTIDAD DE PARTÍCULAS
        const starCount = 3000; // Cambia este número para más o menos estrellas

        // 2. PATRÓN DE MOVIMIENTO
        // Valor 1: Radial (Actual / Starfield)
        // Valor 2: Espiral (Giro galáctico)
        // Valor 3: Caos Magnético (Movimiento errático y fluido)
        // Valor 4: Pulsar Grupal (Se acercan y alejan en grupos)
        // Valor 5: Agujero Negro (Succión central y aceleración)
        // Valor 6: Cúmulos Nebulares (Movimiento orgánico y fluido)
        // Valor 7: Combo Aleatorio (Cambia entre patrones 1-6 automáticamente)
        // Valor 8: Combo Secuencial (Ciclo ordenado del 1 al 6)
        const movementPattern = 7;

        // 2.1 Intervalo para Pattern x (segundos)
        const comboSwitchInterval = 3;

        // 3. ESQUEMA DE COLOR
        // Valor 1: Starlight (Blanco, Cian, Violeta sutil)
        // Valor 2: Dinámico (Blanco -> Celeste -> Amarillo)
        const colorScheme = 2;

        // 4. VELOCIDAD GLOBAL
        // Ajusta este valor para acelerar o ralentizar todo el sistema (ej: 0.5, 2, 5)
        const globalSpeed = 0.7;

        // Parámetros de ajuste fino (ahora dependen de globalSpeed)
        const baseSpeed = 0.2 * globalSpeed;
        const boostMultiplier = 6 * globalSpeed;
        const starSize = 1.0;

        // =========================================================================

        const colorsScheme1 = [
            'hsla(210, 100%, 95%, ',
            'hsla(190, 100%, 80%, ',
            'hsla(260, 80%, 90%, ',
            'hsla(45, 100%, 95%, '
        ];

        let width, height, centerX, centerY;
        let stars = [];
        let mouseX = 0, mouseY = 0;
        let scrollRatio = 0;
        let isVisible = false;
        let animationFrameId = null;
        let time = 0; // Para movimientos dinámicos y colores
        let activeSubPattern = 1; // Para el modo Combo (Pattern 7)
        let lastSwitchTime = Date.now();

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        function resize() {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const rect = section.getBoundingClientRect();
            width = rect.width;
            height = rect.height;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
            centerX = width / 2;
            centerY = height / 2;
        }

        class Star {
            constructor() {
                this.reset();
            }

            reset() {
                // Posicionamiento 3D inicial
                this.x = (Math.random() - 0.5) * width * 2.5;
                this.y = (Math.random() - 0.5) * height * 2.5;
                this.z = Math.random() * width;
                this.pz = this.z;

                // Propiedades individuales
                this.angle = Math.atan2(this.y, this.x);
                this.radius = Math.sqrt(this.x * this.x + this.y * this.y);
                this.speedOffset = Math.random() * 0.5 + 0.5;
                this.baseColor = colorsScheme1[Math.floor(Math.random() * colorsScheme1.length)];
                this.size = Math.random() * starSize + 0.3;
            }

            update(speed) {
                this.pz = this.z;
                this.z -= speed * this.speedOffset;

                // Determinar patrón efectivo (especialmente para modos Combo 7 y 8)
                const effectivePattern = (movementPattern === 7 || movementPattern === 8) ? activeSubPattern : movementPattern;

                // Lógica de movimiento según patrón (Escalada por globalSpeed para que el control de velocidad sea total)
                if (effectivePattern === 2) {
                    // Patrón 2: Espiral
                    this.angle += 0.005 * globalSpeed * (1 - this.z / width);
                    this.x = Math.cos(this.angle) * this.radius;
                    this.y = Math.sin(this.angle) * this.radius;
                } else if (effectivePattern === 3) {
                    // Patrón 3: Caos Magnético
                    this.x += Math.sin(time * 0.02 + this.z * 0.01) * 2 * globalSpeed;
                    this.y += Math.cos(time * 0.02 + this.z * 0.01) * 2 * globalSpeed;
                } else if (effectivePattern === 4) {
                    // Patrón 4: Pulsar Grupal (Acercamiento y expansión)
                    const pulse = Math.sin(time * 0.04) * 0.5;
                    const groupEffect = Math.sin(this.angle * 4); // Crea 4 grupos principales
                    this.x += Math.cos(this.angle) * pulse * groupEffect * 50 * globalSpeed;
                    this.y += Math.sin(this.angle) * pulse * groupEffect * 50 * globalSpeed;
                } else if (effectivePattern === 5) {
                    // Patrón 5: Agujero Negro (Succión central)
                    const pull = (1 - this.z / width) * 15 * globalSpeed;
                    this.x -= Math.cos(this.angle) * pull;
                    this.y -= Math.sin(this.angle) * pull;
                    // Rotación creciente al acercarse
                    this.angle += 0.02 * globalSpeed * (1 - this.z / width);
                } else if (effectivePattern === 6) {
                    // Patrón 6 REINTERPRETADO: Cúmulos Nebulares (Movimiento Orgánico)
                    const nebulaFrec = 0.002;
                    const nebulaAmp = 25 * globalSpeed;
                    this.x += Math.sin(time * 0.01 + this.radius * nebulaFrec) * nebulaAmp;
                    this.y += Math.cos(time * 0.015 + this.angle * 2) * (nebulaAmp * 0.5);
                }

                if (this.z < 1) {
                    this.reset();
                    this.z = width;
                    this.pz = this.z;
                }
            }

            getColor() {
                if (colorScheme === 2) {
                    // Color Dinámico: Blanco -> Celeste -> Amarillo
                    const cycle = (time * 0.01 + this.z * 0.005) % 3;
                    if (cycle < 1) return `hsla(200, 100%, ${80 + cycle * 20}%, `; // Blanco a Celeste
                    if (cycle < 2) return `hsla(190, 100%, 70%, `; // Celeste
                    return `hsla(50, 100%, 80%, `; // Hacia Amarillo
                }
                return this.baseColor;
            }

            draw() {
                // Proyectar 3D a 2D
                const sx = (this.x / this.z) * centerX + centerX;
                const sy = (this.y / this.z) * centerY + centerY;
                const px = (this.x / this.pz) * centerX + centerX;
                const py = (this.y / this.pz) * centerY + centerY;

                // Efecto Parallax con el mouse
                const mx = (mouseX - 0.5) * 50 * (1 - this.z / width);
                const my = (mouseY - 0.5) * 50 * (1 - this.z / width);

                const opacity = Math.min(1, (1 - this.z / width) * 2);

                ctx.beginPath();
                ctx.strokeStyle = this.getColor() + opacity + ')';
                ctx.lineWidth = this.size * (1 - this.z / width) * 2.5;
                ctx.lineCap = 'round';

                // Dibujar trazo (streak)
                ctx.moveTo(px + mx, py + my);
                ctx.lineTo(sx + mx, sy + my);
                ctx.stroke();

                // Núcleo brillante
                if (this.z < width * 0.4) {
                    ctx.fillStyle = this.getColor() + (opacity * 0.6) + ')';
                    ctx.beginPath();
                    ctx.arc(sx + mx, sy + my, this.lineWidth * 0.4, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        function initStars() {
            stars = [];
            for (let i = 0; i < starCount; i++) {
                stars.push(new Star());
            }
        }

        function loop() {
            if (!isVisible || prefersReducedMotion) return;
            time += globalSpeed;

            // Lógica de cambio para Pattern 7 (Combo Aleatorio) o Pattern 8 (Secuencial)
            if (movementPattern === 7 || movementPattern === 8) {
                const now = Date.now();
                if (now - lastSwitchTime > comboSwitchInterval * 1000) {
                    if (movementPattern === 7) {
                        // Aleatorio
                        let nextPattern;
                        do {
                            nextPattern = Math.floor(Math.random() * 6) + 1;
                        } while (nextPattern === activeSubPattern);
                        activeSubPattern = nextPattern;
                    } else {
                        // Secuencial (Pattern 8)
                        activeSubPattern = (activeSubPattern % 6) + 1;
                    }
                    lastSwitchTime = now;
                }
            }

            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = '#111111';
            ctx.fillRect(0, 0, width, height);
            ctx.globalCompositeOperation = 'lighter';

            const currentSpeed = baseSpeed + (scrollRatio * boostMultiplier);
            stars.forEach(star => {
                star.update(currentSpeed);
                star.draw();
            });
            animationFrameId = requestAnimationFrame(loop);
        }

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX / window.innerWidth;
            mouseY = e.clientY / window.innerHeight;
        });

        window.addEventListener('scroll', () => {
            const st = window.pageYOffset || document.documentElement.scrollTop;
            const scrollTotal = document.documentElement.scrollHeight - window.innerHeight;
            scrollRatio = scrollTotal > 0 ? st / scrollTotal : 0;
        });

        const resizeObserver = new ResizeObserver(() => {
            resize();
        });
        resizeObserver.observe(section);

        const intersectionObserver = new IntersectionObserver((entries) => {
            isVisible = entries[0].isIntersecting;
            if (isVisible && !animationFrameId) {
                loop();
            } else if (!isVisible && animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        }, { threshold: 0.1 });
        intersectionObserver.observe(section);

        resize();
        initStars();
        loop();
    })();
});
