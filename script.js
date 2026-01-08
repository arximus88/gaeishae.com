class HolographicCard {
    constructor() {
        this.soundEnabled = true;
        this.audioContext = null;
        this.isFlipped = false;
        this.localization = null;
        this.neuroShader = null;
        this.isMobile = this.detectMobile();
        this.touchActive = false;
        this.mobileAnimationActive = false;
        this.mobileAnimationTimeout = null;
        
        this.initializeElements();
        this.initializeLocalization();
        this.initializeAudio();
        this.initializeGlowPointer();
        this.initializeNeuroEffect();
        this.bindEvents();
    }

    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               (typeof window.orientation !== "undefined") || 
               window.matchMedia("(max-width: 768px)").matches;
    }

    initializeLocalization() {
        this.localization = new window.Localization();
    }

    initializeGlowPointer() {
        const updatePointer = (e) => {
            document.documentElement.style.setProperty('--x', e.clientX.toFixed(2));
            document.documentElement.style.setProperty('--y', e.clientY.toFixed(2));
            document.documentElement.style.setProperty('--xp', (e.clientX / window.innerWidth).toFixed(2));
            document.documentElement.style.setProperty('--yp', (e.clientY / window.innerHeight).toFixed(2));
        };

        document.body.addEventListener('pointermove', updatePointer);
        document.body.addEventListener('mousemove', updatePointer);
    }

    initializeElements() {
        this.card = document.getElementById('businessCard');
        this.bookingModal = document.getElementById('bookingModal');
        this.bookingForm = document.getElementById('bookingForm');
        this.portfolioModal = document.getElementById('portfolioModal');
        this.closePortfolioModal = document.getElementById('closePortfolioModal');
        this.infoModal = document.getElementById('infoModal');
        this.closeInfoModal = document.getElementById('closeInfoModal');
        this.whoIsTitle = document.getElementById('whoIsTitle');
        this.teaserBtn = document.getElementById('teaserBtn');
        this.videoModal = document.getElementById('videoModal');
        this.closeVideoModal = document.getElementById('closeVideoModal');
        this.teaserVideoIframe = document.getElementById('teaserVideoIframe');
        this.soundToggle = document.getElementById('soundToggle');
        this.closeModal = document.getElementById('closeModal');
        this.neuroCanvas = document.getElementById('neuroCanvas');
        
        this.bookShowBtn = document.getElementById('bookShowBtn');
        this.listenBtn = document.getElementById('listenBtn');
        this.portfolioBtn = document.getElementById('portfolioBtn');
        
        // Handle video fallback
        this.logoVideo = document.querySelector('.logo-video');
        this.logoText = document.querySelector('.logo-text.fallback');
        
        if (this.logoVideo) {
            this.logoVideo.addEventListener('error', () => {
                this.logoVideo.style.display = 'none';
                if (this.logoText) {
                    this.logoText.style.display = 'block';
                }
            });
        }
    }

    initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }

    initializeNeuroEffect() {
        if (!this.neuroCanvas) {
            console.log('Neuro canvas not found');
            return;
        }
        
        try {
            console.log('Initializing neuro shader...');
            this.neuroShader = new NeuroShader(this.neuroCanvas, this.isMobile);
            this.neuroShader.init();
            console.log('Neuro shader initialized successfully');
        } catch (e) {
            console.log('WebGL not supported, neuro effect disabled:', e);
            this.neuroCanvas.style.display = 'none';
        }
    }

    bindEvents() {
        // Card flip - different logic for mobile vs desktop
        this.card.addEventListener('click', (e) => {
            if (!e.target.closest('.btn')) {
                if (this.isMobile) {
                    this.handleMobileTap();
                } else {
                    this.flipCard();
                }
            }
        });

        // Only add desktop hover effects if not mobile
        if (!this.isMobile) {
            this.card.addEventListener('mousemove', (e) => this.handleCardHover(e));
            this.card.addEventListener('mouseenter', () => this.handleCardMouseEnter());
            this.card.addEventListener('mouseleave', () => this.handleCardMouseLeave());
        }

        // Button actions
        this.bookShowBtn.addEventListener('click', () => this.openBookingModal());
        if (this.listenBtn) {
            this.listenBtn.addEventListener('click', () => this.openMusicLink());
        }
        this.portfolioBtn.addEventListener('click', () => this.openPortfolio());

        // Modal events
        this.closeModal.addEventListener('click', () => this.closeBookingModal());
        this.bookingModal.addEventListener('click', (e) => {
            if (e.target === this.bookingModal) {
                this.closeBookingModal();
            }
        });

        // Portfolio modal events
        this.closePortfolioModal.addEventListener('click', () => this.closePortfolioModalHandler());
        this.portfolioModal.addEventListener('click', (e) => {
            if (e.target === this.portfolioModal) {
                this.closePortfolioModalHandler();
            }
        });

        // Info modal events
        if (this.whoIsTitle) {
            this.whoIsTitle.addEventListener('click', (e) => {
                // Prevent card flip when clicking title
                e.stopPropagation();
                this.openInfoModal();
            });
        }
        
        if (this.closeInfoModal) {
            this.closeInfoModal.addEventListener('click', () => this.closeInfoModalHandler());
        }
        
        if (this.infoModal) {
            this.infoModal.addEventListener('click', (e) => {
                if (e.target === this.infoModal) {
                    this.closeInfoModalHandler();
                }
            });
        }

        // Video modal events
        if (this.teaserBtn) {
            this.teaserBtn.addEventListener('click', () => this.openVideoModal());
        }

        if (this.closeVideoModal) {
            this.closeVideoModal.addEventListener('click', () => this.closeVideoModalHandler());
        }

        if (this.videoModal) {
            this.videoModal.addEventListener('click', (e) => {
                if (e.target === this.videoModal) {
                    this.closeVideoModalHandler();
                }
            });
        }

        // Form submission
        this.bookingForm.addEventListener('submit', (e) => this.handleFormSubmission(e));

        // Sound toggle
        this.soundToggle.addEventListener('click', () => this.toggleSound());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.bookingModal.style.display === 'block') {
                    this.closeBookingModal();
                } else if (this.portfolioModal.style.display === 'block') {
                    this.closePortfolioModalHandler();
                } else if (this.infoModal && this.infoModal.style.display === 'block') {
                    this.closeInfoModalHandler();
                } else if (this.videoModal && this.videoModal.style.display === 'block') {
                    this.closeVideoModalHandler();
                }
            }
            if (e.key === ' ' || e.key === 'Enter') {
                if (document.activeElement === this.card) {
                    this.flipCard();
                }
            }
        });
    }

    handleCardHover(e) {
        if (this.card.classList.contains('flipped')) return;

        const rect = this.card.getBoundingClientRect();
        
        // Calculate mouse position relative to card
        const mouseXPercent = ((e.clientX - rect.left) / rect.width) * 100;
        const mouseYPercent = ((e.clientY - rect.top) / rect.height) * 100;
        
        const cardFront = this.card.querySelector('.card-front');
        
        // Update mouse position for border glow
        cardFront.style.setProperty('--mouse-x', `${mouseXPercent}%`);
        cardFront.style.setProperty('--mouse-y', `${mouseYPercent}%`);
        
        // Update neuro shader
        if (this.neuroShader) {
            this.neuroShader.updatePointer(
                (e.clientX - rect.left) / rect.width,
                1 - (e.clientY - rect.top) / rect.height
            );
        }
    }

    handleCardMouseEnter() {
        // Show neuro canvas
        if (this.neuroCanvas) {
            this.neuroCanvas.classList.add('active');
        }
        // Activate neuro shader
        if (this.neuroShader) {
            this.neuroShader.show();
        }
        // Add slight scale increase
        this.card.style.transform = 'scale(1.02)';
        this.card.style.transition = 'transform 0.3s ease';
    }

    handleCardMouseLeave() {
        this.resetCardTransform();
        // Hide neuro canvas
        if (this.neuroCanvas) {
            this.neuroCanvas.classList.remove('active');
        }
        // Deactivate neuro shader
        if (this.neuroShader) {
            this.neuroShader.hide();
        }
    }

    resetCardTransform() {
        if (this.card.classList.contains('flipped')) return;
        
        this.card.style.transform = '';
        this.card.style.transition = 'transform 0.3s ease';
    }

    handleMobileTap() {
        // Prevent multiple taps during animation
        if (this.mobileAnimationActive) return;
        
        this.mobileAnimationActive = true;
        
        // Clear any existing timeout
        if (this.mobileAnimationTimeout) {
            clearTimeout(this.mobileAnimationTimeout);
        }
        
        // Phase 1: Scale down + show neuro effect (0-200ms)
        this.card.style.transform = 'scale(0.92)';
        this.card.style.transition = 'transform 1.5s ease-out';
        
        // Show neuro effect immediately
        if (this.neuroCanvas) {
            this.neuroCanvas.classList.add('active');
        }
        if (this.neuroShader) {
            this.neuroShader.show();
        }
        
        this.playSound('click');
        
        // Phase 2: Hold the effect for 1.5 seconds (200-1700ms)
        setTimeout(() => {
            // Phase 3: Start scaling back up (1700-2200ms)
            this.card.style.transform = 'scale(1)';
            this.card.style.transition = 'transform 0.5s ease-in-out';
            
            // Phase 4: At 2000ms (0.3s before scale completes), start hiding neuro and flip
            this.mobileAnimationTimeout = setTimeout(() => {
                // Hide neuro effect
                if (this.neuroCanvas) {
                    this.neuroCanvas.classList.remove('active');
                }
                if (this.neuroShader) {
                    this.neuroShader.hide();
                }
                
                // Flip the card
                this.flipCard();
                
                // Reset animation flag
                this.mobileAnimationActive = false;
                
            }, 300); // 1.8s total (200 + 1500 + 100ms buffer)
            
        }, 1500); // Hold for 1.5s
    }

    flipCard() {
        this.isFlipped = !this.isFlipped;
        this.card.classList.toggle('flipped');
        
        // Reset any hover transforms before flipping
        this.card.style.transform = '';
        this.card.style.transition = '';
        
        // Toggle neuro canvas blur and z-index
        if (this.neuroCanvas) {
            this.neuroCanvas.classList.toggle('clicked');
        }
        
        this.playSound('flip');
    }

    openBookingModal() {
        this.bookingModal.style.display = 'flex';
        this.playSound('open');
        // Focus first input
        setTimeout(() => {
            document.getElementById('name').focus();
        }, 300);
    }

    closeBookingModal() {
        this.bookingModal.style.display = 'none';
        this.playSound('close');
        this.bookingForm.reset();
    }

    openMusicLink() {
        // Replace with actual music link
        window.open('https://open.spotify.com/', '_blank');
        this.playSound('click');
    }

    async openPortfolio() {
        this.portfolioModal.style.display = 'flex';
        this.playSound('open');

        // Initialize slider if not already done
        if (!this.portfolioSlider) {
            await this.initializePortfolioSlider();
        }
    }

    closePortfolioModalHandler() {
        this.portfolioModal.style.display = 'none';
        this.playSound('close');
    }

    openInfoModal() {
        if (!this.infoModal) return;
        this.infoModal.style.display = 'flex';
        this.playSound('open');
    }

    closeInfoModalHandler() {
        if (!this.infoModal) return;
        this.infoModal.style.display = 'none';
        this.playSound('close');
    }

    openVideoModal() {
        if (!this.videoModal) return;
        this.videoModal.style.display = 'flex';
        this.playSound('open');
        
        if (this.teaserVideoIframe) {
            this.teaserVideoIframe.src = 'https://player.cloudinary.com/embed/?cloud_name=dnoji6mcx&public_id=C3102_u0kjrg&profile=cld-default&autoplay=true';
        }
    }

    closeVideoModalHandler() {
        if (!this.videoModal) return;
        this.videoModal.style.display = 'none';
        this.playSound('close');
        
        if (this.teaserVideoIframe) {
            this.teaserVideoIframe.src = '';
        }
    }

    async initializePortfolioSlider() {
        try {
            const portfolioItems = await this.fetchCloudinaryMedia();
            this.createSlider(portfolioItems);
        } catch (error) {
            console.error('Error loading portfolio:', error);
            this.showPortfolioError();
        }
    }

    async fetchCloudinaryMedia() {
        const cloudName = 'dnoji6mcx';
        const portfolioTag = 'geashae';

        try {
            const endpoints = [
                {
                    type: 'image',
                    url: `https://res.cloudinary.com/${cloudName}/image/list/${portfolioTag}.json`
                },
                {
                    type: 'video',
                    url: `https://res.cloudinary.com/${cloudName}/video/list/${portfolioTag}.json`
                }
            ];

            const responses = await Promise.all(
                endpoints.map(async (endpoint) => {
                    try {
                        const res = await fetch(endpoint.url);
                        if (!res.ok) return null;
                        const data = await res.json();
                        const resources = Array.isArray(data.resources) ? data.resources : [];
                        return resources.map((item) => ({
                            ...item,
                            resource_type: item.resource_type || endpoint.type
                        }));
                    } catch (err) {
                        console.warn(`Cloudinary request failed for ${endpoint.type} list`, err);
                        return null;
                    }
                })
            );

            const mergedResources = responses
                .filter(Boolean)
                .flat();

            if (mergedResources.length > 0) {
                return this.processCloudinaryItems(mergedResources, cloudName);
            }

            console.warn(`No Cloudinary resources found for tag "${portfolioTag}". Falling back to samples.`);
            return this.createTestPortfolioItems(cloudName);
        } catch (error) {
            console.error('Cloudinary API error:', error);
            return this.createTestPortfolioItems(cloudName);
        }
    }

    createTestPortfolioItems(cloudName) {
        // For testing purposes, create items with common Cloudinary public_ids
        // You should replace these with your actual uploaded media public_ids
        return [
            {
                type: 'image',
                url: `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_800,h_600,q_auto/sample`,
                title: 'Performance Photo 1'
            },
            {
                type: 'video',
                url: `https://res.cloudinary.com/${cloudName}/video/upload/c_scale,w_800,q_auto/samples/sea-turtle`,
                title: 'Performance Video 1'
            },
            {
                type: 'image',
                url: `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_800,h_600,q_auto/samples/landscapes/nature-mountains`,
                title: 'Studio Photo 1'
            }
        ];
    }

    processCloudinaryItems(resources, cloudName) {
        return resources.map((item, index) => {
            const isVideo = item.resource_type === 'video';
            return {
                type: isVideo ? 'video' : 'image',
                url: `https://res.cloudinary.com/${cloudName}/${isVideo ? 'video' : 'image'}/upload/c_scale,w_800,q_auto/${item.public_id}`,
                title: `Portfolio Item ${index + 1}`
            };
        });
    }

    createSlider(items) {
        const slider = document.getElementById('portfolio-slider');

        // Clear loading content
        slider.innerHTML = '';

        // Add slides
        items.forEach((item, index) => {
            const slide = document.createElement('div');
            slide.className = 'keen-slider__slide';

            if (item.type === 'video') {
                slide.innerHTML = `
                    <video controls preload="metadata" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                        <source src="${item.url}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                `;
            } else {
                slide.innerHTML = `
                    <img src="${item.url}" alt="${item.title}" loading="lazy">
                `;
            }

            slider.appendChild(slide);
        });

        // Initialize Keen Slider
        this.portfolioSlider = new KeenSlider(slider, {
            loop: true,
            slides: {
                perView: 1,
                spacing: 0
            },
            created: (s) => {
                this.updateSlideCounter(s.track.details.rel + 1, items.length);
            },
            slideChanged: (s) => {
                this.updateSlideCounter(s.track.details.rel + 1, items.length);
            }
        });

        // Setup navigation buttons
        this.setupSliderNavigation(items.length);
    }

    setupSliderNavigation(totalSlides) {
        const prevBtn = document.getElementById('portfolioPrev');
        const nextBtn = document.getElementById('portfolioNext');

        if (prevBtn && nextBtn) {
            prevBtn.addEventListener('click', () => {
                this.portfolioSlider.prev();
            });

            nextBtn.addEventListener('click', () => {
                this.portfolioSlider.next();
            });
        }

        this.updateSlideCounter(1, totalSlides);
    }

    updateSlideCounter(current, total) {
        const currentSlide = document.getElementById('currentSlide');
        const totalSlides = document.getElementById('totalSlides');

        if (currentSlide) currentSlide.textContent = current;
        if (totalSlides) totalSlides.textContent = total;
    }

    showPortfolioError() {
        const slider = document.getElementById('portfolio-slider');
        slider.innerHTML = `
            <div class="keen-slider__slide loading-slide">
                <div style="text-align: center; color: rgba(255, 255, 255, 0.8);">
                    <p>Unable to load portfolio items.</p>
                    <p>Please try again later.</p>
                </div>
            </div>
        `;
    }

    async handleFormSubmission(e) {
        e.preventDefault();
        
        const formData = new FormData(this.bookingForm);
        
        // Check honeypot - bots fill hidden fields
        const honeypot = formData.get('website_url');
        if (honeypot) {
            // Bot detected - silently "succeed" to fool them
            this.showSuccess();
            this.closeBookingModal();
            return;
        }
        
        // Get form values
        const name = formData.get('name')?.trim() || '';
        const contact = formData.get('contact')?.trim() || '';
        const event = formData.get('event')?.trim() || '';
        const location = formData.get('location')?.trim() || '';
        const expectations = formData.get('expectations')?.trim() || '';
        
        // Field validation
        const validationErrors = this.validateFormFields(name, contact, location);
        if (validationErrors.length > 0) {
            this.showValidationErrors(validationErrors);
            return;
        }
        
        // Get Turnstile token if available
        const turnstileToken = document.querySelector('[name="cf-turnstile-response"]')?.value;
        
        const data = {
            name,
            contact,
            event,
            location,
            expectations,
            turnstileToken
        };

        try {
            const response = await fetch('https://gaeishae-booking-bot.arximus88.workers.dev/api/submit-booking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                this.showSuccess();
                this.closeBookingModal();
                // Reset Turnstile for next submission
                if (window.turnstile) {
                    window.turnstile.reset();
                }
                // Reset content filter trips on success
                localStorage.removeItem('gaeishae-filter-trips');
            } else if (response.status === 429) {
                // Rate limited
                this.showRateLimitError();
            } else {
                const errorData = await response.json().catch(() => ({}));
                if (errorData.error && errorData.error.includes('неприйнятний')) {
                    this.showContentError();
                } else if (errorData.error && errorData.error.includes('Верифікація')) {
                    this.showTurnstileError();
                } else {
                    throw new Error(errorData.error || 'Submission failed');
                }
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            this.showError();
        }
    }

    validateFormFields(name, contact, location) {
        const errors = [];
        const currentLang = window.getCurrentLanguage ? window.getCurrentLanguage() : 'uk';
        
        // Name validation: no numbers or special characters (allow letters, spaces, apostrophes, hyphens)
        const namePattern = /^[a-zA-Zа-яА-ЯіІїЇєЄґҐ\s'\-]+$/;
        if (!namePattern.test(name)) {
            errors.push({
                field: 'name',
                message: currentLang === 'uk' 
                    ? 'Ім\'я не може містити цифри або спецсимволи'
                    : 'Name cannot contain numbers or special characters'
            });
        }
        
        // Contact validation: valid phone number or email
        const phonePattern = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!phonePattern.test(contact.replace(/\s/g, '')) && !emailPattern.test(contact)) {
            errors.push({
                field: 'contact',
                message: currentLang === 'uk' 
                    ? 'Введіть коректний номер телефону або email'
                    : 'Please enter a valid phone number or email'
            });
        }
        
        // Location validation: minimum 3 characters, can't be only numbers
        if (location && location.length > 0) {
            if (location.length < 3) {
                errors.push({
                    field: 'location',
                    message: currentLang === 'uk' 
                        ? 'Місце повинно містити мінімум 3 символи'
                        : 'Location must be at least 3 characters'
                });
            } else if (/^\d+$/.test(location)) {
                errors.push({
                    field: 'location',
                    message: currentLang === 'uk' 
                        ? 'Місце не може складатися лише з цифр'
                        : 'Location cannot be only numbers'
                });
            }
        }
        
        return errors;
    }

    showValidationErrors(errors) {
        // Clear previous errors
        this.bookingForm.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
        this.bookingForm.querySelectorAll('.error-message').forEach(el => el.remove());
        
        errors.forEach(error => {
            const field = this.bookingForm.querySelector(`#${error.field}`);
            if (field) {
                field.classList.add('error');
                
                // Add error message below field
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message visible';
                errorDiv.textContent = error.message;
                field.parentNode.appendChild(errorDiv);
            }
        });
        
        this.playSound('error');
        
        // Focus first error field
        const firstErrorField = this.bookingForm.querySelector('.error');
        if (firstErrorField) {
            firstErrorField.focus();
        }
    }

    showSuccess() {
        // Simple success notification
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.textContent = this.localization.t('successMessage');
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
        
        this.playSound('success');
    }

    showError() {
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.textContent = this.localization.t('errorMessage');
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
        
        this.playSound('error');
    }

    showContentError() {
        // Track how many times filter was tripped using localStorage
        let trips = parseInt(localStorage.getItem('gaeishae-filter-trips') || '0');
        trips++;
        localStorage.setItem('gaeishae-filter-trips', trips.toString());

        // Use different message for 2nd time onwards
        const messageKey = trips === 1 ? 'contentError1' : 'contentError2';
        const message = this.localization.t(messageKey);
        
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
        
        this.playSound('error');
    }

    showRateLimitError() {
        const currentLang = window.getCurrentLanguage ? window.getCurrentLanguage() : 'uk';
        const message = currentLang === 'uk' 
            ? 'Забагато запитів. Спробуйте пізніше.'
            : 'Too many requests. Please try again later.';
        
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
        
        this.playSound('error');
    }

    showTurnstileError() {
        const currentLang = window.getCurrentLanguage ? window.getCurrentLanguage() : 'uk';
        const message = currentLang === 'uk' 
            ? 'Верифікація не пройдена. Спробуйте ще раз.'
            : 'Verification failed. Please try again.';
        
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
        
        this.playSound('error');
        
        // Reset Turnstile
        if (window.turnstile) {
            window.turnstile.reset();
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.soundToggle.textContent = this.soundEnabled ? '🔊' : '🔇';
        this.soundToggle.classList.toggle('muted', !this.soundEnabled);
    }

    playSound(type) {
        if (!this.soundEnabled || !this.audioContext) return;

        const frequencies = {
            flip: [440, 550],
            shimmer: [880, 1100],
            click: [660, 440],
            open: [330, 440, 550],
            close: [550, 440, 330],
            success: [440, 550, 660, 880],
            error: [220, 165, 110]
        };

        const freq = frequencies[type];
        if (!freq) return;

        this.createTone(freq, type === 'success' ? 0.8 : 0.3);
    }

    createTone(frequencies, duration) {
        const oscillators = [];
        const gainNode = this.audioContext.createGain();
        
        gainNode.connect(this.audioContext.destination);
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

        frequencies.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
            
            if (frequencies.length > 1) {
                oscillator.frequency.exponentialRampToValueAtTime(
                    freq * (index % 2 === 0 ? 1.1 : 0.9), 
                    this.audioContext.currentTime + duration
                );
            }
            
            oscillator.connect(gainNode);
            oscillator.start(this.audioContext.currentTime + index * 0.1);
            oscillator.stop(this.audioContext.currentTime + duration + index * 0.1);
            
            oscillators.push(oscillator);
        });
    }

}

// Add notification styles
const notificationStyles = `
.notification {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 15px 25px;
    border-radius: 8px;
    font-weight: bold;
    z-index: 20000;
    animation: slideDown 0.3s ease-out;
}

.notification.success {
    background: linear-gradient(45deg, #00ff00, #00cc00);
    color: #000;
}

.notification.error {
    background: linear-gradient(45deg, #ff0000, #cc0000);
    color: #fff;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateX(-50%) translateY(-20px);
    }
    to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }
}
`;

// Add styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

class NeuroShader {
    constructor(canvas, isMobile = false) {
        this.canvas = canvas;
        this.gl = null;
        this.program = null;
        this.uniforms = {};
        this.pointer = { x: 0.5, y: 0.5 };
        this.intensity = 0;
        this.targetIntensity = 0;
        this.isHovering = false;
        this.isMobile = isMobile;
        this.reducedQuality = isMobile; // Use reduced quality on mobile
    }

    init() {
        // Use lower resolution on mobile for better performance
        const maxPixelRatio = this.isMobile ? 1 : 2;
        const devicePixelRatio = Math.min(window.devicePixelRatio, maxPixelRatio);
        
        this.canvas.width = this.canvas.offsetWidth * devicePixelRatio;
        this.canvas.height = this.canvas.offsetHeight * devicePixelRatio;

        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        if (!this.gl) {
            throw new Error('WebGL not supported');
        }

        this.setupShaders();
        this.setupGeometry();
        this.render();

        // Handle window resize for responsive canvas
        window.addEventListener('resize', () => this.handleResize());
    }

    setupShaders() {
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, document.getElementById('vertexShader').innerHTML);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, document.getElementById('fragmentShader').innerHTML);

        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);

        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            console.error('Unable to initialize shader program:', this.gl.getProgramInfoLog(this.program));
            return;
        }

        this.gl.useProgram(this.program);

        // Get uniform locations
        this.uniforms.u_time = this.gl.getUniformLocation(this.program, 'u_time');
        this.uniforms.u_ratio = this.gl.getUniformLocation(this.program, 'u_ratio');
        this.uniforms.u_pointer_position = this.gl.getUniformLocation(this.program, 'u_pointer_position');
        this.uniforms.u_intensity = this.gl.getUniformLocation(this.program, 'u_intensity');

        // Set initial ratio
        const ratio = this.canvas.width / this.canvas.height;
        this.gl.uniform1f(this.uniforms.u_ratio, ratio);
    }

    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compilation error:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    setupGeometry() {
        const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
        const vertexBuffer = this.gl.createBuffer();
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

        const positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
    }

    updatePointer(x, y) {
        this.pointer.x = x;
        this.pointer.y = y;
    }

    show() {
        this.targetIntensity = 1.0;
    }

    hide() {
        this.targetIntensity = 0;
    }

    handleResize() {
        const maxPixelRatio = this.isMobile ? 1 : 2;
        const devicePixelRatio = Math.min(window.devicePixelRatio, maxPixelRatio);
        
        this.canvas.width = this.canvas.offsetWidth * devicePixelRatio;
        this.canvas.height = this.canvas.offsetHeight * devicePixelRatio;
        
        // Update ratio uniform
        const ratio = this.canvas.width / this.canvas.height;
        this.gl.uniform1f(this.uniforms.u_ratio, ratio);
    }

    render() {
        // Smooth intensity transition
        this.intensity += (this.targetIntensity - this.intensity) * 0.1;

        // Clear and set viewport
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        // Update uniforms
        this.gl.uniform1f(this.uniforms.u_time, performance.now());
        this.gl.uniform2f(this.uniforms.u_pointer_position, this.pointer.x, this.pointer.y);
        this.gl.uniform1f(this.uniforms.u_intensity, this.intensity);

        // Enable blending for transparency
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        // Draw
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

        // Continue animation
        requestAnimationFrame(() => this.render());
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.holographicCard = new HolographicCard();
});

// Handle audio context resume (required by some browsers)
document.addEventListener('click', () => {
    if (window.holographicCard && window.holographicCard.audioContext) {
        if (window.holographicCard.audioContext.state === 'suspended') {
            window.holographicCard.audioContext.resume();
        }
    }
}, { once: true });
