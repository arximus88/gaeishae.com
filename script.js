class HolographicCard {
    constructor() {
        this.soundEnabled = true;
        this.audioContext = null;
        this.isFlipped = false;
        this.localization = null;
        
        this.initializeElements();
        this.initializeLocalization();
        this.initializeAudio();
        this.initializeGlowPointer();
        this.bindEvents();
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

    bindEvents() {
        // Card flip
        this.card.addEventListener('click', (e) => {
            if (!e.target.closest('.btn')) {
                this.flipCard();
            }
        });

        // Card 3D hover effect
        this.card.addEventListener('mousemove', (e) => this.handleCardHover(e));
        this.card.addEventListener('mouseleave', () => this.resetCardTransform());

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
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;
        
        // Calculate rotation values (very subtle)
        const rotateX = -(mouseY / rect.height) * 10; // Max 10 degrees
        const rotateY = (mouseX / rect.width) * 10;   // Max 10 degrees
        
        // Calculate mouse position relative to card
        const mouseXPercent = ((e.clientX - rect.left) / rect.width) * 100;
        const mouseYPercent = ((e.clientY - rect.top) / rect.height) * 100;
        
        const cardFront = this.card.querySelector('.card-front');
        
        // Apply transform
        this.card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        this.card.style.transition = 'transform 0.1s ease-out';
        
        // Update mouse position for border glow
        cardFront.style.setProperty('--mouse-x', `${mouseXPercent}%`);
        cardFront.style.setProperty('--mouse-y', `${mouseYPercent}%`);
    }

    resetCardTransform() {
        if (this.card.classList.contains('flipped')) return;
        
        this.card.style.transform = '';
        this.card.style.transition = 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    }

    flipCard() {
        this.isFlipped = !this.isFlipped;
        this.card.classList.toggle('flipped');
        
        // Reset any hover transforms before flipping
        this.card.style.transform = '';
        this.card.style.transition = '';
        
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
        window.open('https://open.spotify.com/artist/your-artist-id', '_blank');
        this.playSound('click');
    }

    openSocialLinks() {
        // Replace with actual Linktree URL
        window.open('https://linktr.ee/gaeishae', '_blank');
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

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new HolographicCard();
});

// Handle audio context resume (required by some browsers)
document.addEventListener('click', () => {
    if (window.holographicCard && window.holographicCard.audioContext) {
        if (window.holographicCard.audioContext.state === 'suspended') {
            window.holographicCard.audioContext.resume();
        }
    }
}, { once: true });