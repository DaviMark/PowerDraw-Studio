/**
 * DataArch - Landing Page Professional
 * JavaScript puro - Sem dependências
 */

// ============================================
// MOBILE MENU
// ============================================

const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navMobile = document.querySelector('.nav-mobile');

if (mobileMenuBtn && navMobile) {
    mobileMenuBtn.addEventListener('click', () => {
        navMobile.style.display = navMobile.style.display === 'flex' ? 'none' : 'flex';
    });

    // Fechar menu ao clicar em um link
    const mobileLinks = navMobile.querySelectorAll('a');
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMobile.style.display = 'none';
        });
    });
}

// ============================================
// SMOOTH SCROLL
// ============================================

document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[href^="#"]');
    
    if (!anchor) return;
    
    const href = anchor.getAttribute('href');
    if (!href || href === '#') return;
    
    e.preventDefault();
    
    const element = document.querySelector(href);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
});

// ============================================
// SCROLL ANIMATIONS
// ============================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observar elementos para animação
document.querySelectorAll('.about-item, .feature-item').forEach(element => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    element.style.transition = 'all 600ms ease';
    observer.observe(element);
});

// ============================================
// HEADER STICKY EFFECT
// ============================================

const header = document.querySelector('.header');
let lastScrollTop = 0;

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > 50) {
        header.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
    } else {
        header.style.boxShadow = 'none';
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
});

// ============================================
// BUTTON INTERACTIONS
// ============================================

const buttons = document.querySelectorAll('.btn-primary, .btn-secondary, .cta-button');

buttons.forEach(button => {
    button.addEventListener('click', function(e) {
        // Criar efeito de ripple
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.position = 'absolute';
        ripple.style.background = 'rgba(255, 255, 255, 0.5)';
        ripple.style.borderRadius = '50%';
        ripple.style.pointerEvents = 'none';
        ripple.style.animation = 'ripple-animation 600ms ease-out';

        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    });
});

// ============================================
// COUNTER ANIMATION
// ============================================

function animateCounter(element, targetValue, duration = 2000) {
    const startTime = Date.now();
    const startValue = 0;

    function update() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentValue = Math.floor(startValue + (targetValue - startValue) * progress);
        
        element.textContent = currentValue + (element.textContent.includes('+') ? '+' : element.textContent.includes('M') ? 'M+' : '%');

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    update();
}

// Animar números quando entram na viewport
const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
            entry.target.dataset.animated = 'true';
            
            const text = entry.target.textContent;
            const match = text.match(/(\d+)/);
            
            if (match) {
                const targetValue = parseInt(match[1]);
                animateCounter(entry.target, targetValue);
            }
            
            counterObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

// Aplicar animação aos números das estatísticas
document.querySelectorAll('.stat-number').forEach(element => {
    counterObserver.observe(element);
});

// ============================================
// PARALLAX EFFECT
// ============================================

function parallaxScroll() {
    const parallaxElements = document.querySelectorAll('[data-parallax]');
    
    parallaxElements.forEach(element => {
        const scrollPosition = window.pageYOffset;
        const elementOffset = element.offsetTop;
        const distance = scrollPosition - elementOffset;
        
        if (distance > -window.innerHeight && distance < window.innerHeight) {
            element.style.transform = `translateY(${distance * 0.5}px)`;
        }
    });
}

window.addEventListener('scroll', parallaxScroll);

// ============================================
// FORM VALIDATION (IF NEEDED)
// ============================================

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('DataArch - Landing Page Loaded');
    
    // Adicionar estilo de ripple animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple-animation {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
});

// ============================================
// ANALYTICS (OPTIONAL)
// ============================================

// Rastrear cliques em botões
buttons.forEach(button => {
    button.addEventListener('click', () => {
        console.log('Button clicked:', button.textContent.trim());
        // Enviar para seu serviço de analytics aqui
    });
});

// Rastrear navegação
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
        const target = link.getAttribute('href');
        console.log('Navigation to:', target);
        // Enviar para seu serviço de analytics aqui
    });
});

// Google Analytics

window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-RY77B4ZVWP'); 
