// MOBILE MENU TOGGLE

const siteHeader = document.querySelector('header');
const mobileMenuButton = document.getElementById('mobileMenuButton');
const mobileMenuWrapper = document.querySelector('.mobileMenuWrapper');
const mobileMenu = document.querySelector('.mobileMenu');

mobileMenu?.querySelectorAll('a').forEach((link) => {
    if (link.querySelector('.mobileMenuLabel')) return;

    const label = document.createElement('span');
    label.className = 'mobileMenuLabel';
    label.textContent = link.textContent.trim();
    link.replaceChildren(label);
});

const normalizeMenuPath = (pathname) => {
    const normalized = pathname.replace(/\/index\.html$/, '').replace(/\/+$/, '');
    return normalized || '/';
};

const createMenuWord = (className, text) => {
    const word = document.createElement('span');
    word.className = className;

    Array.from(text).forEach((character, index) => {
        const letter = document.createElement('span');
        letter.className = 'mobileMenuMorphLetter';
        letter.style.setProperty('--letter-index', index);
        letter.textContent = character === ' ' ? '\u00a0' : character;
        word.appendChild(letter);
    });

    return word;
};

mobileMenu?.querySelectorAll('a[href]').forEach((link) => {
    const url = new URL(link.href, window.location.href);
    const isCurrentPage = url.origin === window.location.origin
        && normalizeMenuPath(url.pathname) === normalizeMenuPath(window.location.pathname)
        && url.search === window.location.search;

    if (!isCurrentPage) return;

    const label = link.querySelector('.mobileMenuLabel');
    if (!label) return;

    const originalText = label.textContent.trim();
    const originalWord = createMenuWord('mobileMenuOriginal', originalText);
    const feedbackWord = createMenuWord('mobileMenuFeedback', 'YOU\u2019RE ALREADY HERE');
    feedbackWord.setAttribute('aria-hidden', 'true');
    label.replaceChildren(originalWord, feedbackWord);

    link.classList.add('is-current-page');
    link.setAttribute('aria-current', 'page');
    link.setAttribute('aria-label', `${originalText}, current page`);

    let returnTimer = 0;
    let cleanupTimer = 0;

    link.addEventListener('click', (event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        event.preventDefault();
        window.clearTimeout(returnTimer);
        window.clearTimeout(cleanupTimer);
        link.classList.remove('is-already-here', 'is-returning');
        void link.offsetWidth;
        link.classList.add('is-already-here');

        returnTimer = window.setTimeout(() => {
            link.classList.add('is-returning');
        }, 1950);

        cleanupTimer = window.setTimeout(() => {
            link.classList.remove('is-already-here', 'is-returning');
        }, 2900);
    });
});

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

mobileMenu?.addEventListener('click', (event) => {
    if (event.target === mobileMenu) setMobileMenuOpen(false);
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

document.addEventListener("DOMContentLoaded", () => {
initFadeInObserver();
initScreenshotLightbox();
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
            <div class="lightboxChrome" aria-hidden="true">
                <span>Gallery view</span>
                <span class="lightboxCount">01 / 01</span>
            </div>
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

    const overlayImage = overlay.querySelector('.lightboxImage');
    const closeButton = overlay.querySelector('.lightboxClose');
    const prevButton = overlay.querySelector('.lightboxPrev');
    const nextButton = overlay.querySelector('.lightboxNext');
    const backdrop = overlay.querySelector('.lightboxBackdrop');
    const lightboxCount = overlay.querySelector('.lightboxCount');

    let activeImages = [];
    let activeIndex = 0;
    let closeTimer = 0;

    function renderImage() {
        const currentImage = activeImages[activeIndex];
        if (!currentImage) return;

        overlayImage.src = currentImage.src;
        overlayImage.alt = currentImage.alt;
        prevButton.disabled = activeImages.length <= 1;
        nextButton.disabled = activeImages.length <= 1;
        lightboxCount.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(activeImages.length).padStart(2, '0')}`;
    }

    function openLightbox(images, index, slider) {
        window.clearTimeout(closeTimer);
        overlay.classList.remove('closing');
        activeImages = images;
        activeIndex = index;
        const panel = slider.closest('.art-panel');
        const panelStyle = panel ? getComputedStyle(panel) : null;
        overlay.style.setProperty('--lightbox-bg', panel?.dataset.artBg || panelStyle?.backgroundColor || '#8fb7ff');
        overlay.style.setProperty('--lightbox-ink', panel?.dataset.artInk || panelStyle?.color || '#090909');
        renderImage();
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('lightboxOpen');
    }

    function closeLightbox() {
        if (!overlay.classList.contains('open') || overlay.classList.contains('closing')) return;

        const finishClose = () => {
            overlay.classList.remove('open', 'closing');
            document.body.classList.remove('lightboxOpen');
        };

        overlay.classList.add('closing');
        overlay.setAttribute('aria-hidden', 'true');

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            finishClose();
            return;
        }

        closeTimer = window.setTimeout(finishClose, 640);
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
        const galleryHeading = slider.parentElement.querySelector('.sectionHeading');
        const galleryPosition = document.createElement('span');

        if (galleryHeading) {
            galleryHeading.classList.add('galleryMeta');
            galleryHeading.replaceChildren();

            const galleryLabel = document.createElement('span');
            galleryLabel.textContent = 'Swipe to explore';
            galleryPosition.className = 'galleryPosition';
            galleryHeading.append(galleryLabel, galleryPosition);
        }

        const updateGalleryPosition = () => {
            if (!images.length || !galleryPosition) return;
            const cards = Array.from(slider.querySelectorAll('.screenshotCard'));
            const nearestIndex = cards.reduce((nearest, card, index) => {
                const distance = Math.abs(card.offsetLeft - slider.scrollLeft);
                return distance < nearest.distance ? { index, distance } : nearest;
            }, { index: 0, distance: Infinity }).index;
            galleryPosition.textContent = `${String(nearestIndex + 1).padStart(2, '0')} / ${String(images.length).padStart(2, '0')}`;
        };

        updateGalleryPosition();
        let galleryFrame = 0;
        slider.addEventListener('scroll', () => {
            cancelAnimationFrame(galleryFrame);
            galleryFrame = requestAnimationFrame(updateGalleryPosition);
        }, { passive: true });

        images.forEach((image, index) => {
            image.setAttribute('role', 'button');
            image.setAttribute('tabindex', '0');
            image.setAttribute('aria-label', `Open screenshot ${index + 1}`);

            image.addEventListener('click', () => openLightbox(images, index, slider));
            image.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openLightbox(images, index, slider);
                }
            });
        });
    });

    closeButton.addEventListener('click', closeLightbox);
    backdrop.addEventListener('click', closeLightbox);
    prevButton.addEventListener('click', showPrevious);
    nextButton.addEventListener('click', showNext);

    document.addEventListener('keydown', (event) => {
        if (!overlay.classList.contains('open') || overlay.classList.contains('closing')) return;

        if (event.key === 'Escape') closeLightbox();
        if (event.key === 'ArrowLeft') showPrevious();
        if (event.key === 'ArrowRight') showNext();
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
