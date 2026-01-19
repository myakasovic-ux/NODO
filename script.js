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

            // Initialize Leaflet Map
            if (!mapInstance && typeof L !== 'undefined') {
                mapInstance = L.map('map').setView([-33.044796, -71.578108], 19);

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
});
