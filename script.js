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
        this.soundToggle = document.getElementById('soundToggle');
        this.closeModal = document.getElementById('closeModal');
        this.neuroCanvas = document.getElementById('neuroCanvas');
        
        this.bookShowBtn = document.getElementById('bookShowBtn');
        this.listenBtn = document.getElementById('listenBtn');
        this.socialBtn = document.getElementById('socialBtn');
        
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
        this.listenBtn.addEventListener('click', () => this.openMusicLink());
        this.socialBtn.addEventListener('click', () => this.openSocialLinks());

        // Modal events
        this.closeModal.addEventListener('click', () => this.closeBookingModal());
        this.bookingModal.addEventListener('click', (e) => {
            if (e.target === this.bookingModal) {
                this.closeBookingModal();
            }
        });

        // Form submission
        this.bookingForm.addEventListener('submit', (e) => this.handleFormSubmission(e));

        // Sound toggle
        this.soundToggle.addEventListener('click', () => this.toggleSound());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.bookingModal.style.display === 'block') {
                this.closeBookingModal();
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
        this.bookingModal.style.display = 'block';
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

    openSocialLinks() {
        // Replace with actual Linktree URL
        window.open('https://linktr.ee/melting_butter', '_blank');
        this.playSound('click');
    }

    async handleFormSubmission(e) {
        e.preventDefault();
        
        const formData = new FormData(this.bookingForm);
        const data = {
            name: formData.get('name'),
            contact: formData.get('contact'),
            event: formData.get('event'),
            location: formData.get('location'),
            expectations: formData.get('expectations')
        };

        try {
            // This will be replaced with actual Cloudflare Worker endpoint
            const response = await fetch('/api/submit-booking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                this.showSuccess();
                this.closeBookingModal();
            } else {
                throw new Error('Submission failed');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            this.showError();
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
    z-index: 2000;
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