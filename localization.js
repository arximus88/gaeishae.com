const translations = {
    uk: {
        whoIs: "Хто така GÆISHÆ?",
        tagline: "Артистка • Виконавиця • Творець",
        bookShow: "Забронювати шоу",
        listenSong: "Прослухати пісню",
        viewPortfolio: "Переглянути портфоліо",
        bookingTitle: "Забронювати шоу",
        nameLabel: "Ваше ім'я:",
        namePlaceholder: "Введіть ваше ім'я",
        contactLabel: "Контакт (телефон/email):",
        contactPlaceholder: "Ваш номер телефону або email",
        eventLabel: "Для кого шоу:",
        eventPlaceholder: "Опишіть подію",
        locationLabel: "Де:",
        locationPlaceholder: "Місце проведення",
        expectationsLabel: "Що очікуєте:",
        expectationsPlaceholder: "Опишіть ваші очікування",
        submitBtn: "Надіслати заявку",
        successMessage: "Заявку надіслано! З вами зв'яжуться найближчим часом.",
        errorMessage: "Помилка відправки. Спробуйте ще раз або зв'яжіться напряму.",
        contentError1: "Будь ласка, перефразуйте ваше повідомлення.",
        contentError2: "Ми цінуємо повагу. Будь ласка, опишіть ваші очікування від шоу без спаму.",
        soundToggleTitle: "Увімкнути/вимкнути звук",
        touchInstruction: "Доторкнись до картки",
        portfolioTitle: "Портфоліо",
        bookingNotice: "Кожен перформанс адаптується до простору, аудиторії та задуму події — жодне шоу не повторюється.",
        infoTitle: "Хто така GÆISHÆ?",
        infoText1: "Gaeishae (formerly known as 芸者) — артистка, перформерка та storyteller. Child of art, вона увібрала філософію японської культури гейші й левітує на межі образів, сенсів та витонченості.",
        infoText2: "Її тілесний перформанс, у якому голос, рух і образ зливаються в єдину дію, пробуджує підсвідомі бажання та веде до катарсису — граючи.",
        infoText3: "Gaeishae — це аура свободи, спокуси та присутності: досвід, який хочеться відчути знову і знову.",
        metaDescription: "Gaeishae (ex. 芸者) — артистка, перформерка та storyteller. Відкрийте філософію японської гейші в сучасному перформансі.",
        watchTeaser: "Дивитися тізер"
    },
    en: {
        whoIs: "Who is GÆISHÆ?",
        tagline: "Artist • Performer • Creator",
        bookShow: "Book a Show",
        listenSong: "Listen to Song",
        viewPortfolio: "View Portfolio",
        watchTeaser: "Watch teaser",
        bookingTitle: "Book a Show",
        nameLabel: "Your name:",
        namePlaceholder: "Insert your name",
        contactLabel: "Contact (phone/email):",
        contactPlaceholder: "Your phone number or email",
        eventLabel: "Event details:",
        eventPlaceholder: "Describe the event",
        locationLabel: "Location:",
        locationPlaceholder: "Venue location",
        expectationsLabel: "What do you expect:",
        expectationsPlaceholder: "Describe your expectations",
        submitBtn: "Send Request",
        successMessage: "Request sent! We will contact you soon.",
        errorMessage: "Sending error. Please try again or contact directly.",
        contentError1: "Please rephrase your message.",
        contentError2: "We value respect. Please describe your expectations for the show without spamming.",
        soundToggleTitle: "Toggle sound on/off",
        touchInstruction: "Touch the card",
        portfolioTitle: "Portfolio",
        bookingNotice: "Each performance adapts to the space, audience, and event concept — no two shows are alike.",
        infoTitle: "Who is GÆISHÆ?",
        infoText1: "Gaeishae (formerly known as 芸者) — a performance artist and storyteller. Child of art, she draws from the philosophy of the Japanese geisha and moves gracefully between images, feelings, and elegance.",
        infoText2: "Her performances, where voice, movement, and presence come together as one, awaken hidden desires and lead to catharsis — playfully.",
        infoText3: "Gaeishae is an aura of freedom, seduction, and presence: an experience you want to feel again and again.",
        metaDescription: "Gaeishae (formerly known as 芸者) — a performance artist and storyteller. Experience the art of Japanese geisha philosophy merged with modern performance."
    }
};

class Localization {
    constructor() {
        this.currentLang = this.detectLanguage();
        this.init();
    }

    detectLanguage() {
        // Check URL parameter first
        const urlParams = new URLSearchParams(window.location.search);
        const langParam = urlParams.get('lang');
        if (langParam && translations[langParam]) {
            return langParam;
        }

        // Check localStorage
        const savedLang = localStorage.getItem('gaeishae-lang');
        if (savedLang && translations[savedLang]) {
            return savedLang;
        }

        // Check browser language
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang.startsWith('uk')) {
            return 'uk';
        }

        // Default to Ukrainian
        return 'uk';
    }

    init() {
        this.createLanguageToggle();
        this.applyTranslations();
        this.updateURL();
    }

    createLanguageToggle() {
        const langToggle = document.createElement('button');
        langToggle.className = 'lang-toggle';
        langToggle.innerHTML = this.currentLang === 'uk' ? '🇺🇦' : '🇬🇧';
        langToggle.title = this.currentLang === 'uk' ? 'Switch to English' : 'Перемкнути на українську';
        
        langToggle.addEventListener('click', () => {
            this.switchLanguage();
        });

        // Add to body
        document.body.appendChild(langToggle);

        // Add styles
        this.addLanguageToggleStyles();
    }

    addLanguageToggleStyles() {
        const styles = `
            .lang-toggle {
                position: fixed;
                top: 20px;
                left: 20px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                width: 50px;
                height: 50px;
                font-size: 24px;
                cursor: pointer;
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }

            .lang-toggle:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: scale(1.1);
            }

            @media (max-width: 500px) {
                .lang-toggle {
                    width: 40px;
                    height: 40px;
                    font-size: 20px;
                }
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    switchLanguage() {
        this.currentLang = this.currentLang === 'uk' ? 'en' : 'uk';
        localStorage.setItem('gaeishae-lang', this.currentLang);
        
        this.applyTranslations();
        this.updateURL();
        this.updateLanguageToggle();
    }

    updateLanguageToggle() {
        const langToggle = document.querySelector('.lang-toggle');
        langToggle.innerHTML = this.currentLang === 'uk' ? '🇺🇦' : '🇬🇧';
        langToggle.title = this.currentLang === 'uk' ? 'Switch to English' : 'Перемкнути на українську';
    }

    updateURL() {
        const url = new URL(window.location);
        url.searchParams.set('lang', this.currentLang);
        window.history.replaceState({}, '', url);
    }

    applyTranslations() {
        const t = translations[this.currentLang];

        // Update all elements with data-i18n attributes
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (t[key]) {
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    if (element.type === 'text' || element.tagName === 'TEXTAREA') {
                        element.placeholder = t[key];
                    }
                } else {
                    element.textContent = t[key];
                }
            }
        });

        // Update title attributes
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            if (t[key]) {
                element.title = t[key];
            }
        });

        // Update HTML lang attribute
        document.documentElement.lang = this.currentLang;

        // Update SEO Meta Tags
        if (t.metaDescription) {
            document.querySelector('meta[name="description"]').setAttribute('content', t.metaDescription);
            document.querySelector('meta[property="og:description"]').setAttribute('content', t.metaDescription);
            document.querySelector('meta[property="twitter:description"]').setAttribute('content', t.metaDescription);
        }
    }

    t(key) {
        return translations[this.currentLang][key] || key;
    }

    getCurrentLang() {
        return this.currentLang;
    }
}

// Export for use in other modules
window.Localization = Localization;