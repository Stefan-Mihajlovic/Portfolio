// MOBILE MENU TOGGLE

const siteHeader = document.querySelector('header');
const mobileMenuButton = document.getElementById('mobileMenuButton');
const mobileMenuWrapper = document.querySelector('.mobileMenuWrapper');
const mobileMenu = document.querySelector('.mobileMenu');

if (siteHeader && mobileMenu) {
    siteHeader.appendChild(mobileMenu);
}

function setMobileMenuOpen(isOpen) {
    mobileMenuWrapper?.classList.toggle('closed', !isOpen);
    mobileMenuButton?.classList.toggle('is-open', isOpen);
    mobileMenuButton?.setAttribute('aria-expanded', String(isOpen));
    mobileMenuButton?.setAttribute(
        'aria-label',
        isOpen ? 'Close navigation menu' : 'Open navigation menu'
    );
    document.body.classList.toggle('mobile-menu-open', isOpen);
}

mobileMenuButton?.setAttribute('aria-expanded', 'false');
mobileMenuButton?.addEventListener('click', () => {
    setMobileMenuOpen(mobileMenuWrapper?.classList.contains('closed'));
});

function closeMobileMenu(){
    setMobileMenuOpen(false);
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMobileMenu();
});

// HEADER SCROLL SHADOW AND SCROLL TO TOP BUTTON

const scrollShadow = document.querySelector('.scrollShadow');
const scrollToTop = document.querySelector('.scrollToTop');

function updateScrollUi() {
    const hasScrollBackdrop = window.scrollY > 10;

    siteHeader?.classList.toggle('has-scroll-backdrop', hasScrollBackdrop);
    scrollShadow?.classList.toggle('active', hasScrollBackdrop);
    scrollToTop?.classList.toggle('active', window.scrollY > 50);
}

window.addEventListener('scroll', updateScrollUi, { passive: true });
updateScrollUi();

// FADE IN OBSERVER

function initFadeInObserver({
    selector = ".fade-in",
    visibleClass = "is-visible",
    threshold = 0.05,
    rootMargin = "0px 0px -10% 0px",
    once = true
} = {}) {
    const elements = Array.from(document.querySelectorAll(selector));
    if (!elements.length) return;
    
    if (!("IntersectionObserver" in window)) {
      elements.forEach(el => el.classList.add(visibleClass));
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add(visibleClass);
          if (once) obs.unobserve(entry.target);
        } else if (!once) {
          entry.target.classList.remove(visibleClass);
        }
      });
    }, { threshold, rootMargin });

    elements.forEach(el => observer.observe(el));
    return observer;
}

function initFaqAccordions() {
    const faqItems = Array.from(document.querySelectorAll('.faqItem'));
    if (!faqItems.length) return;

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const animationDuration = prefersReducedMotion ? 0 : 420;
    const animationEasing = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

    faqItems.forEach((item) => {
        const summary = item.querySelector('summary');
        const answer = item.querySelector('.faqAnswer');
        if (!summary || !answer) return;

        const setState = (isOpen) => {
            item.open = isOpen;
            answer.hidden = !isOpen;
            answer.style.height = isOpen ? 'auto' : '0px';
            answer.style.opacity = isOpen ? '1' : '0';
        };

        setState(item.open);

        summary.addEventListener('click', (event) => {
            event.preventDefault();
            if (item.dataset.faqAnimating === 'true') return;

            const isOpening = !item.open;

            if (animationDuration === 0) {
                setState(isOpening);
                return;
            }

            item.dataset.faqAnimating = 'true';

            if (isOpening) {
                item.open = true;
                answer.hidden = false;
                answer.style.height = 'auto';
                answer.style.opacity = '1';
                const targetHeight = answer.getBoundingClientRect().height;

                answer.style.height = '0px';
                answer.style.opacity = '0';

                const animation = answer.animate([
                    { height: '0px', opacity: 0 },
                    { height: `${targetHeight}px`, opacity: 1 }
                ], {
                    duration: animationDuration,
                    easing: animationEasing
                });

                animation.addEventListener('finish', () => {
                    answer.style.height = 'auto';
                    answer.style.opacity = '1';
                    delete item.dataset.faqAnimating;
                }, { once: true });
                return;
            }

            const currentHeight = answer.getBoundingClientRect().height;
            answer.style.height = `${currentHeight}px`;
            answer.style.opacity = '1';

            const animation = answer.animate([
                { height: `${currentHeight}px`, opacity: 1 },
                { height: '0px', opacity: 0 }
            ], {
                duration: animationDuration,
                easing: animationEasing
            });

            animation.addEventListener('finish', () => {
                setState(false);
                delete item.dataset.faqAnimating;
            }, { once: true });
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
initFadeInObserver();
initScreenshotLightbox();
initFaqAccordions();
});

function initScreenshotLightbox() {
    const sliders = Array.from(document.querySelectorAll('.screenshotsSlider'));
    if (!sliders.length) return;

    const overlay = document.createElement('div');
    overlay.className = 'lightboxOverlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
        <div class="lightboxBackdrop"></div>
        <div class="lightboxDialog" role="dialog" aria-modal="true" aria-label="Screenshot preview">
            <button class="lightboxClose hoverable" type="button" aria-label="Close preview">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 6L18 18M18 6L6 18"></path>
                </svg>
            </button>
            <button class="lightboxNav lightboxPrev hoverable" type="button" aria-label="Previous screenshot">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M14.5 5.5L8 12L14.5 18.5"></path>
                </svg>
            </button>
            <figure class="lightboxFigure">
                <img class="lightboxImage" src="" alt="Selected project screenshot preview">
            </figure>
            <button class="lightboxNav lightboxNext hoverable" type="button" aria-label="Next screenshot">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9.5 5.5L16 12L9.5 18.5"></path>
                </svg>
            </button>
        </div>
    `;
    document.body.appendChild(overlay);
    bindHoverables(overlay);

    const overlayImage = overlay.querySelector('.lightboxImage');
    const closeButton = overlay.querySelector('.lightboxClose');
    const prevButton = overlay.querySelector('.lightboxPrev');
    const nextButton = overlay.querySelector('.lightboxNext');
    const backdrop = overlay.querySelector('.lightboxBackdrop');

    let activeImages = [];
    let activeIndex = 0;

    function renderImage() {
        const currentImage = activeImages[activeIndex];
        if (!currentImage) return;

        overlayImage.src = currentImage.src;
        overlayImage.alt = currentImage.alt;
        prevButton.disabled = activeImages.length <= 1;
        nextButton.disabled = activeImages.length <= 1;
    }

    function openLightbox(images, index) {
        activeImages = images;
        activeIndex = index;
        renderImage();
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('lightboxOpen');
    }

    function closeLightbox() {
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('lightboxOpen');
    }

    function showPrevious() {
        activeIndex = (activeIndex - 1 + activeImages.length) % activeImages.length;
        renderImage();
    }

    function showNext() {
        activeIndex = (activeIndex + 1) % activeImages.length;
        renderImage();
    }

    sliders.forEach((slider) => {
        const images = Array.from(slider.querySelectorAll('img'));

        images.forEach((image, index) => {
            image.setAttribute('role', 'button');
            image.setAttribute('tabindex', '0');
            image.setAttribute('aria-label', `Open screenshot ${index + 1}`);

            image.addEventListener('click', () => openLightbox(images, index));
            image.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openLightbox(images, index);
                }
            });
        });
    });

    closeButton.addEventListener('click', closeLightbox);
    backdrop.addEventListener('click', closeLightbox);
    prevButton.addEventListener('click', showPrevious);
    nextButton.addEventListener('click', showNext);

    document.addEventListener('keydown', (event) => {
        if (!overlay.classList.contains('open')) return;

        if (event.key === 'Escape') closeLightbox();
        if (event.key === 'ArrowLeft') showPrevious();
        if (event.key === 'ArrowRight') showNext();
    });
}

// CURSOR EFFECT

const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
const isCustomCursorDisabled = document.body.classList.contains('nativeCursor');

const cursor = document.querySelector('.cursor');
const cursorDot = document.querySelector('.cursor-dot');
const canUseCustomCursor = !isTouchDevice && !isCustomCursorDisabled && cursor && cursorDot;

if (!canUseCustomCursor) {
    if (cursor) cursor.style.display = 'none';
    document.body.style.cursor = 'auto';
}

let mouseX = -100, mouseY = -100;
let cursorX = 0, cursorY = 0;
let velocityX = 0, velocityY = 0;

if (canUseCustomCursor) {
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
}

let isHovering = false;
let currentElement = null;
let targetX = 0, targetY = 0;
let isTransitioning = false;

function animate() {
    if (isHovering && currentElement) {
        const rect = currentElement.getBoundingClientRect();
        targetX = rect.left + rect.width / 2;
        targetY = rect.top + rect.height / 2;
        
        cursorX += (targetX - cursorX) * 0.1;
        cursorY += (targetY - cursorY) * 0.1;
        
        cursor.style.left = cursorX + 'px';
        cursor.style.top = cursorY + 'px';
        
        cursorDot.style.transform = 'translate(-50%, -50%)';
    } else {
        const dx = mouseX - cursorX;
        const dy = mouseY - cursorY;
        
        cursorX += dx * 0.15;
        cursorY += dy * 0.15;
        
        velocityX = dx * 0.15;
        velocityY = dy * 0.15;
        
        cursor.style.left = cursorX + 'px';
        cursor.style.top = cursorY + 'px';
        
        if (!isTransitioning) {
            const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
            const stretchFactor = Math.min(speed * 0.75, 25);
            
            const angle = Math.atan2(velocityY, velocityX);
            const scaleX = 1 + stretchFactor * 0.08;
            const scaleY = 1 - stretchFactor * 0.06;
            
            cursorDot.style.transform = `
                translate(-50%, -50%) 
                rotate(${angle}rad) 
                scaleX(${scaleX}) 
                scaleY(${scaleY})
            `;
        } else {
            cursorDot.style.transform = 'translate(-50%, -50%)';
        }
    }
    
    requestAnimationFrame(animate);
}

if (canUseCustomCursor) animate();

const hoverableSelector = 'a, button, .skillCard p, .closeMenuButton, .hoverable';

function bindHoverable(element) {
    if (!canUseCustomCursor || element.dataset.hoverableBound === 'true') return;
    element.dataset.hoverableBound = 'true';

    element.addEventListener('mouseenter', () => {
        isHovering = true;
        isTransitioning = true;
        currentElement = element;
        const rect = element.getBoundingClientRect();
        cursor.classList.add('morphing');
        
        setTimeout(() => {
            if (isHovering && currentElement === element) {
                cursorDot.style.width = rect.width + 'px';
                cursorDot.style.height = rect.height + 'px';
                cursorDot.style.borderRadius = getComputedStyle(element).borderRadius;
            }
        }, 50);
    });
    
    element.addEventListener('mouseleave', () => {
        isHovering = false;
        currentElement = null;
        cursor.classList.remove('morphing');
        isTransitioning = true;
        
        cursorDot.style.width = '40px';
        cursorDot.style.height = '40px';
        cursorDot.style.borderRadius = '50%';
        
        setTimeout(() => {
            isTransitioning = false;
        }, 400);
    });
}

function bindHoverables(root = document) {
    root.querySelectorAll(hoverableSelector).forEach(bindHoverable);
}

bindHoverables();

if (canUseCustomCursor) {
    document.addEventListener('mouseleave', () => {
        cursor.style.opacity = '0';
    });

    document.addEventListener('mouseenter', () => {
        cursor.style.opacity = '1';
    });
}

// CONTACT FORM HANDLING

document?.getElementById("contactForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const alertMessage = document.getElementById("alertMessage");

  const form = e.target;
  const data = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    message: form.message.value.trim(),
    website: form.website.value.trim(),
  };

  try {
    const res = await fetch("/.netlify/functions/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to send");

    alertMessage.innerHTML = `<span class="accentText">Your message</span> was sent successfully! I'll be replying as soon as I can 😁`;
    alertMessage.classList.add("open");
    setTimeout(() => {
        alertMessage.classList.remove("open");
    }, 4500);
    form.reset();
  } catch (err) {
    alertMessage.innerHTML = `Your message was <span class="accentText red">not sent</span>! There was an error and now I'm sad 🥲`;
    alertMessage.classList.add("open");
    setTimeout(() => {
        alertMessage.classList.remove("open");
    }, 4500);
  }
});
