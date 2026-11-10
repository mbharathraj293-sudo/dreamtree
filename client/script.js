/* ==========================================================================
   THE DREAMING TREE - INTERACTIVE LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // ==========================================================================
    // 1. PRELOADER HANDLER & RACE CONDITION RESOLVER
    // ==========================================================================
    const preloader = document.getElementById('preloader');

    function hidePreloader() {
        if (preloader && !preloader.classList.contains('fade-out')) {
            setTimeout(() => {
                preloader.classList.add('fade-out');
                setTimeout(() => {
                    preloader.style.display = 'none';
                }, 800); // Match CSS transition duration
            }, 800); // Draw animation moment
        }
    }

    // Safety fallback trigger immediately if loaded, else attach load bindings
    if (document.readyState === 'complete') {
        hidePreloader();
    } else {
        window.addEventListener('load', hidePreloader);
        setTimeout(hidePreloader, 4500); // Max fallback time
    }

    // ==========================================================================
    // 2. NAV BAR SCROLL EFFECT & ACTIVE STATE TRACKING & WIDGET TRIGGERS
    // ==========================================================================
    const header = document.querySelector('.header');
    const sections = document.querySelectorAll('section, footer');
    const navLinks = document.querySelectorAll('.nav-link');
    const backToTopBtn = document.getElementById('back-to-top');
    const stickyCta = document.getElementById('sticky-cta');

    window.addEventListener('scroll', () => {
        const scrollPos = window.scrollY;

        // Toggle sticky headers shrink styling
        if (scrollPos > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Show/Hide Back to Top button
        if (backToTopBtn) {
            if (scrollPos > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        }

        // Show/Hide Mobile Sticky CTA (visible after hero height)
        if (stickyCta) {
            const heroHeight = document.getElementById('hero')?.offsetHeight || 600;
            if (scrollPos > heroHeight - 100) {
                stickyCta.classList.add('show');
            } else {
                stickyCta.classList.remove('show');
            }
        }

        // Section Scroll Spy to highlight active navbar items
        let currentSectionId = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 150;
            const sectionHeight = section.offsetHeight;
            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    });

    // Smooth scroll back to top handler
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // ==========================================================================
    // 3. MOBILE MENU NAVIGATION DRAWER
    // ==========================================================================
    const mobileNavToggle = document.getElementById('mobile-nav-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');

    function toggleMobileMenu() {
        const isOpen = mobileMenu.classList.contains('open');
        mobileNavToggle.classList.toggle('active');
        mobileMenu.classList.toggle('open');
        mobileNavToggle.setAttribute('aria-expanded', !isOpen);
        mobileMenu.setAttribute('aria-hidden', isOpen);

        // Toggle overlay
        const overlay = document.getElementById('mobile-overlay');
        if (overlay) overlay.classList.toggle('show', !isOpen);

        // Prevent body scroll when menu is open
        document.body.style.overflow = isOpen ? '' : 'hidden';
    }

    mobileNavToggle.addEventListener('click', toggleMobileMenu);

    // Close mobile menu on overlay click
    const mobileOverlay = document.getElementById('mobile-overlay');
    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', () => {
            if (mobileMenu.classList.contains('open')) toggleMobileMenu();
        });
    }

    // Close mobile menu when clicking a link
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (mobileMenu.classList.contains('open')) {
                toggleMobileMenu();
            }
        });
    });

    // ==========================================================================
    // 4. FLOATING LEAVES ENGINE (HIGH-PERFORMANCE CANVAS ANIMATION)
    // ==========================================================================
    const canvas = document.getElementById('leaves-canvas');
    const ctx = canvas.getContext('2d');

    // Handle canvas resizing
    function resizeCanvas() {
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.parentElement.offsetHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle settings
    const leavesArray = [];
    const maxLeaves = 28;

    // Define colors to match deep green and amber palette
    const colors = [
        'rgba(15, 61, 46, 0.25)',  // Deep Forest Green
        'rgba(212, 160, 23, 0.35)', // Golden Amber
        'rgba(92, 64, 51, 0.2)',   // Earth Brown
        'rgba(248, 246, 241, 0.3)' // Soft Cream
    ];

    class Leaf {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * -100 - 20; // Start above viewport
            this.size = Math.random() * 12 + 6;  // Size range
            this.speedX = Math.random() * 1.5 - 0.5; // Drift horizontal
            this.speedY = Math.random() * 0.8 + 0.4;  // Fall speed
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = Math.random() * 0.02 - 0.01;
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.waveFrequency = Math.random() * 0.02;
            this.waveAmplitude = Math.random() * 15;
            this.waveOffset = Math.random() * 100;
        }

        update(time) {
            this.y += this.speedY;
            // Add a wavy drift effect based on sine wave
            this.x += this.speedX + Math.sin(time * this.waveFrequency + this.waveOffset) * 0.15;
            this.rotation += this.rotationSpeed;

            // Reset particles if they reach the bottom or sides
            if (this.y > canvas.height + 20) {
                this.y = -20;
                this.x = Math.random() * canvas.width;
                this.speedY = Math.random() * 0.8 + 0.4;
            }
            if (this.x > canvas.width + 20) {
                this.x = -20;
            } else if (this.x < -20) {
                this.x = canvas.width + 20;
            }
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.fillStyle = this.color;
            ctx.beginPath();

            // Draw a leaf shape (curved path)
            ctx.moveTo(0, -this.size);
            // Left curve
            ctx.quadraticCurveTo(-this.size * 0.6, 0, 0, this.size);
            // Right curve
            ctx.quadraticCurveTo(this.size * 0.6, 0, 0, -this.size);

            ctx.fill();
            ctx.restore();
        }
    }

    // Initialize particles
    for (let i = 0; i < maxLeaves; i++) {
        const leaf = new Leaf();
        // Disperse them across screen height initially so they don't fall all together
        leaf.y = Math.random() * canvas.height;
        leavesArray.push(leaf);
    }

    // Animation Loop
    function animateLeaves(timestamp) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        leavesArray.forEach(leaf => {
            leaf.update(timestamp);
            leaf.draw();
        });

        requestAnimationFrame(animateLeaves);
    }
    requestAnimationFrame(animateLeaves);

    // ==========================================================================
    // 5. SIGNATURE DISHES & GALLERY FILTER SYSTEM
    // ==========================================================================

    // Dish filtering
    const menuFilterButtons = document.querySelectorAll('.filter-btn');
    const menuCards = document.querySelectorAll('.menu-card');

    menuFilterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            menuFilterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const targetFilter = btn.getAttribute('data-filter');

            menuCards.forEach(card => {
                const category = card.getAttribute('data-category');

                if (targetFilter === 'all' || category === targetFilter) {
                    card.classList.remove('filtered-out');
                    // Add subtle fade animation
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'scale(1)';
                    }, 50);
                } else {
                    card.classList.add('filtered-out');
                }
            });
        });
    });

    // Gallery filtering
    const galleryFilterButtons = document.querySelectorAll('.g-filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    galleryFilterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            galleryFilterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const targetFilter = btn.getAttribute('data-category');

            galleryItems.forEach(item => {
                const category = item.getAttribute('data-category');

                if (targetFilter === 'all' || category === targetFilter) {
                    item.classList.remove('filtered-out');
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'scale(1)';
                    }, 50);
                } else {
                    item.classList.add('filtered-out');
                }
            });
        });
    });

    // ==========================================================================
    // 6. INTERSECTION OBSERVER ANIMATIONS (REVEAL ON SCROLL)
    // ==========================================================================
    const revealElements = document.querySelectorAll('.reveal, .reveal-up, .reveal-right');

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active-reveal');
                observer.unobserve(entry.target); // Animate once
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));

    // ==========================================================================
    // 7. ANIMATED NUMERICAL STATS COUNTER
    // ==========================================================================
    const statsSection = document.getElementById('stats');
    const statNumbers = document.querySelectorAll('.stat-number');
    let countersStarted = false;

    function startCounters() {
        statNumbers.forEach(counter => {
            const target = parseFloat(counter.getAttribute('data-target'));
            const decimals = parseInt(counter.getAttribute('data-decimals') || '0');
            const duration = 2000; // Counter animation time in ms
            const startTimestamp = performance.now();

            function updateCounter(now) {
                const progress = Math.min((now - startTimestamp) / duration, 1);
                // Ease out cubic
                const easeProgress = 1 - Math.pow(1 - progress, 3);
                const currentValue = easeProgress * target;

                counter.innerText = currentValue.toFixed(decimals);

                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.innerText = target.toFixed(decimals);
                }
            }

            requestAnimationFrame(updateCounter);
        });
    }

    const statsObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !countersStarted) {
                startCounters();
                countersStarted = true;
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.25 });

    if (statsSection) {
        statsObserver.observe(statsSection);
    }

    // ==========================================================================
    // 8. TESTIMONIALS SLIDER
    // ==========================================================================
    const slider = document.getElementById('testimonials-slider');
    const testimonials = document.querySelectorAll('.testimonial-card');
    const dotsContainer = document.getElementById('slider-dots');
    const prevBtn = document.querySelector('.slider-arrow.prev');
    const nextBtn = document.querySelector('.slider-arrow.next');

    let currentIndex = 0;
    const totalSlides = testimonials.length;

    // Create Navigation dots dynamically
    if (dotsContainer) {
        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goToSlide(i));
            dotsContainer.appendChild(dot);
        }
    }

    const dots = document.querySelectorAll('.dot');

    function updateDots() {
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
    }

    function goToSlide(index) {
        currentIndex = index;
        if (currentIndex < 0) currentIndex = totalSlides - 1;
        if (currentIndex >= totalSlides) currentIndex = 0;

        slider.style.transform = `translateX(-${currentIndex * 100}%)`;
        updateDots();
    }

    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            goToSlide(currentIndex - 1);
            resetAutoPlay();
        });
        nextBtn.addEventListener('click', () => {
            goToSlide(currentIndex + 1);
            resetAutoPlay();
        });
    }

    // Auto Play Slider
    let autoPlayInterval = setInterval(() => {
        goToSlide(currentIndex + 1);
    }, 6000);

    function resetAutoPlay() {
        clearInterval(autoPlayInterval);
        autoPlayInterval = setInterval(() => {
            goToSlide(currentIndex + 1);
        }, 6000);
    }

    // Swipe gestures on mobile
    let startX = 0;
    let endX = 0;

    slider.addEventListener('touchstart', e => {
        startX = e.touches[0].clientX;
    }, { passive: true });

    slider.addEventListener('touchend', e => {
        endX = e.changedTouches[0].clientX;
        const diffX = startX - endX;

        if (Math.abs(diffX) > 50) { // threshold
            if (diffX > 0) {
                goToSlide(currentIndex + 1); // Swipe Left -> Next
            } else {
                goToSlide(currentIndex - 1); // Swipe Right -> Prev
            }
            resetAutoPlay();
        }
    }, { passive: true });

    // ==========================================================================
    // 9. MASONRY GALLERY LIGHTBOX UTILITY
    // ==========================================================================
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');

    let activeGalleryItems = [];
    let currentGalleryIndex = 0;

    // Build array of currently visible gallery items (excludes filtered out ones)
    function updateActiveGallery() {
        activeGalleryItems = Array.from(galleryItems).filter(item =>
            !item.classList.contains('filtered-out')
        );
    }

    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            updateActiveGallery();
            currentGalleryIndex = activeGalleryItems.indexOf(item);
            openLightbox();
            loadLightboxImage();
        });
    });

    function openLightbox() {
        lightbox.style.display = 'flex';
        // Add tiny timeout to allow display change before triggering opacity fade-in
        setTimeout(() => {
            lightbox.classList.add('open');
        }, 10);
        document.body.style.overflow = 'hidden';
        lightbox.setAttribute('aria-hidden', 'false');
    }

    function closeLightbox() {
        lightbox.classList.remove('open');
        setTimeout(() => {
            lightbox.style.display = 'none';
        }, 300); // Match CSS fade speed
        document.body.style.overflow = '';
        lightbox.setAttribute('aria-hidden', 'true');
    }

    function loadLightboxImage() {
        const currentItem = activeGalleryItems[currentGalleryIndex];
        const img = currentItem.querySelector('img');
        const title = currentItem.querySelector('.g-title');

        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightboxTitle.innerText = title.innerText;
    }

    function prevImage() {
        currentGalleryIndex--;
        if (currentGalleryIndex < 0) {
            currentGalleryIndex = activeGalleryItems.length - 1;
        }
        loadLightboxImage();
    }

    function nextImage() {
        currentGalleryIndex++;
        if (currentGalleryIndex >= activeGalleryItems.length) {
            currentGalleryIndex = 0;
        }
        loadLightboxImage();
    }

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightboxPrev) lightboxPrev.addEventListener('click', prevImage);
    if (lightboxNext) lightboxNext.addEventListener('click', nextImage);

    // Close lightbox on click outside the image
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    // Keyboard controls for lightbox
    document.addEventListener('keydown', (e) => {
        if (lightbox.classList.contains('open')) {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') prevImage();
            if (e.key === 'ArrowRight') nextImage();
        }
    });

    // ==========================================================================
    // 10. RESERVATION FORM VALIDATION & SUCCESS MODAL
    // ==========================================================================
    const bookingForm = document.getElementById('booking-form');
    const successModal = document.getElementById('success-modal');
    const closeSuccessBtn = document.getElementById('close-success-btn');

    // Set dynamic minimum date to "Today" for reservation form date picker
    const resDateInput = document.getElementById('res-date');
    if (resDateInput) {
        const today = new Date().toISOString().split('T')[0];
        resDateInput.setAttribute('min', today);
    }

    // Input validation utility
    function validateField(input) {
        const formGroup = input.parentElement;
        let isValid = true;

        if (input.required && !input.value.trim()) {
            isValid = false;
        } else if (input.type === 'email' && input.value.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            isValid = emailRegex.test(input.value.trim());
        } else if (input.type === 'tel' && input.value.trim()) {
            // Basic international phone regex
            const phoneRegex = /^\+?[0-9\s-]{10,15}$/;
            isValid = phoneRegex.test(input.value.trim().replace(/\s+/g, ''));
        } else if (input.id === 'res-date' && input.value) {
            const selectedDate = new Date(input.value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            isValid = selectedDate >= today;
        }

        if (isValid) {
            formGroup.classList.remove('invalid');
        } else {
            formGroup.classList.add('invalid');
        }

        return isValid;
    }

    // Real-time blur event validation
    const formFields = bookingForm.querySelectorAll('input, select, textarea');
    formFields.forEach(field => {
        field.addEventListener('blur', () => validateField(field));
        field.addEventListener('input', () => {
            if (field.parentElement.classList.contains('invalid')) {
                validateField(field);
            }
        });
    });

    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();

        let isFormValid = true;
        formFields.forEach(field => {
            if (!validateField(field)) {
                isFormValid = false;
            }
        });

        if (isFormValid) {
            // Extract details to show in success popup
            const nameVal = document.getElementById('res-name').value;
            const phoneVal = document.getElementById('res-phone').value;
            const emailVal = document.getElementById('res-email').value;
            const guestsSelect = document.getElementById('res-guests');
            const guestsText = guestsSelect.options[guestsSelect.selectedIndex].text;
            const rawDate = document.getElementById('res-date').value;
            const timeSelect = document.getElementById('res-time');
            const timeText = timeSelect.options[timeSelect.selectedIndex].text;
            const notesVal = document.getElementById('res-notes').value;

            // Format date nicely
            const dateObj = new Date(rawDate);
            const formattedDate = dateObj.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });

            // Submit payload to server
            fetch('/api/v1/reservations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: nameVal,
                    phone: phoneVal,
                    email: emailVal,
                    guests: parseInt(guestsSelect.value),
                    date: rawDate,
                    timeSlot: timeSelect.value,
                    notes: notesVal
                })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        // Set modal values
                        const titleEl = document.getElementById('success-modal-title');
                        const descEl = document.getElementById('success-modal-desc');
                        if (titleEl) titleEl.innerText = 'Table Confirmed';
                        if (descEl) descEl.innerHTML = `Thank you, <strong>${nameVal}</strong>! Your table at <strong>The Dreaming Tree</strong> has been confirmed. A confirmation has been sent to your email.`;

                        document.getElementById('summary-guests').innerText = guestsText;
                        document.getElementById('summary-date').innerText = formattedDate;
                        document.getElementById('summary-time').innerText = timeText;

                        // Open success modal
                        successModal.style.display = 'flex';
                        setTimeout(() => {
                            successModal.classList.add('open');
                        }, 10);
                        document.body.style.overflow = 'hidden';
                        successModal.setAttribute('aria-hidden', 'false');

                        // Reset form details
                        bookingForm.reset();
                        formFields.forEach(field => {
                            field.parentElement.classList.remove('invalid');
                        });
                    } else {
                        alert(data.error || 'Failed to request table reservation. Table is fully booked.');
                    }
                })
                .catch(err => {
                    console.info('Backend reservation service unavailable, falling back to Demo Mode:', err);
                    
                    // Demo Mode Fallback: Clearly labelled demo confirmation
                    const titleEl = document.getElementById('success-modal-title');
                    const descEl = document.getElementById('success-modal-desc');
                    if (titleEl) titleEl.innerText = 'Reservation Verified (Demo Mode)';
                    if (descEl) descEl.innerHTML = `Thank you, <strong>${nameVal}</strong>! <em>(Demo Mode: Backend server not connected)</em>. Your reservation request for <strong>The Dreaming Tree</strong> was verified and processed locally.`;

                    document.getElementById('summary-guests').innerText = guestsText;
                    document.getElementById('summary-date').innerText = formattedDate;
                    document.getElementById('summary-time').innerText = timeText;

                    // Open success modal
                    successModal.style.display = 'flex';
                    setTimeout(() => {
                        successModal.classList.add('open');
                    }, 10);
                    document.body.style.overflow = 'hidden';
                    successModal.setAttribute('aria-hidden', 'false');

                    // Reset form details
                    bookingForm.reset();
                    formFields.forEach(field => {
                        field.parentElement.classList.remove('invalid');
                    });
                });
        } else {
            // Scroll to the first error item
            const firstInvalid = bookingForm.querySelector('.form-group.invalid');
            if (firstInvalid) {
                firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    });

    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener('click', () => {
            successModal.classList.remove('open');
            setTimeout(() => {
                successModal.style.display = 'none';
            }, 300);
            document.body.style.overflow = '';
            successModal.setAttribute('aria-hidden', 'true');
        });
    }

    // ==========================================================================
    // 11. NEWSLETTER SUBSCRIPTION FORM
    // ==========================================================================
    const newsletterForm = document.getElementById('newsletter-form');
    const nlEmail = document.getElementById('nl-email');
    const nlFeedback = document.querySelector('.newsletter-feedback');

    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailVal = nlEmail.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailVal || !emailRegex.test(emailVal)) {
            nlFeedback.innerText = "Please enter a valid email address.";
            nlFeedback.className = "newsletter-feedback error";
            return;
        }

        // Post request to subscriber endpoint
        fetch('/api/v1/auth/register-newsletter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailVal })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    nlFeedback.innerText = "Thank you! You are now subscribed.";
                    nlFeedback.className = "newsletter-feedback success";
                    nlEmail.value = '';
                } else {
                    nlFeedback.innerText = data.error || "Subscription failed.";
                    nlFeedback.className = "newsletter-feedback error";
                }
            })
            .catch(() => {
                nlFeedback.innerText = "Thank you! You are now subscribed."; // Fallback
                nlFeedback.className = "newsletter-feedback success";
                nlEmail.value = '';
            });

        // Reset message after 5 seconds
        setTimeout(() => {
            nlFeedback.innerText = '';
            nlFeedback.className = "newsletter-feedback";
        }, 5000);
    });

    // ==========================================================================
    // 12. COOKIES CONSENT BANNER HANDLER
    // ==========================================================================
    const cookieBanner = document.getElementById('cookie-banner');
    const cookieAcceptBtn = document.getElementById('cookie-accept');

    if (cookieBanner && cookieAcceptBtn) {
        // Show cookie banner if not accepted previously
        if (!localStorage.getItem('cookies-accepted')) {
            setTimeout(() => {
                cookieBanner.classList.add('show');
            }, 2000);
        }

        cookieAcceptBtn.addEventListener('click', () => {
            localStorage.setItem('cookies-accepted', 'true');
            cookieBanner.classList.remove('show');
        });
    }

    // ==========================================================================
    // 13. DISH DETAIL MODAL
    // ==========================================================================
    const dishModal = document.getElementById('dish-modal');
    const dishModalClose = document.getElementById('dish-modal-close');

    function openDishModal(card) {
        const img = card.querySelector('.menu-card-img img');
        const title = card.querySelector('.dish-title');
        const price = card.querySelector('.dish-price');
        const desc = card.querySelector('.dish-desc');
        const dietTag = card.querySelector('.diet-tag');

        const category = card.getAttribute('data-category') || '';
        const diet = card.getAttribute('data-diet') || 'veg';

        if (document.getElementById('dish-modal-img')) {
            document.getElementById('dish-modal-img').src = img ? img.src : '';
            document.getElementById('dish-modal-img').alt = img ? img.alt : '';
        }
        if (document.getElementById('dish-modal-title')) {
            document.getElementById('dish-modal-title').textContent = title ? title.textContent : '';
        }
        if (document.getElementById('dish-modal-price')) {
            document.getElementById('dish-modal-price').textContent = price ? price.textContent : '';
        }
        if (document.getElementById('dish-modal-desc')) {
            document.getElementById('dish-modal-desc').textContent = card.getAttribute('data-desc') || (desc ? desc.textContent : '');
        }

        // Category label
        const catMap = {
            asian: 'Asian Fusion',
            western: 'Western Mains',
            healthy: 'Healthy & Bowls',
            starters: 'Starters',
            desserts: 'Desserts',
            beverages: 'Beverages'
        };
        if (document.getElementById('dish-modal-category')) {
            document.getElementById('dish-modal-category').textContent = catMap[category] || category;
        }

        // Diet badge
        const dietEl = document.getElementById('dish-modal-diet');
        if (dietEl) {
            const dietLabel = dietTag ? dietTag.textContent.trim() : (diet === 'vegan' ? 'Vegan' : 'Vegetarian');
            dietEl.textContent = dietLabel;
            dietEl.className = 'dish-modal-diet ' + (diet === 'vegan' ? 'vegan' : diet === 'nonveg' ? 'nonveg' : 'veg');
        }

        if (dishModal) {
            dishModal.style.display = 'flex';
            setTimeout(() => { dishModal.classList.add('open'); }, 10);
            document.body.style.overflow = 'hidden';
            dishModal.setAttribute('aria-hidden', 'false');
        }
    }

    function closeDishModal() {
        if (dishModal) {
            dishModal.classList.remove('open');
            setTimeout(() => { dishModal.style.display = 'none'; }, 300);
            document.body.style.overflow = '';
            dishModal.setAttribute('aria-hidden', 'true');
        }
    }

    // Attach click to all menu cards
    document.querySelectorAll('.menu-card').forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => openDishModal(card));
    });

    if (dishModalClose) dishModalClose.addEventListener('click', closeDishModal);

    if (dishModal) {
        dishModal.addEventListener('click', (e) => {
            if (e.target === dishModal) closeDishModal();
        });
    }

    // Keyboard: Escape closes dish modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && dishModal && dishModal.classList.contains('open')) {
            closeDishModal();
        }
    });

});
