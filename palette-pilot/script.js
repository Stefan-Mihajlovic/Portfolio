const PALETTE_API_URL = 'https://tvm-licensing-api-prod.optiflowzoffice.workers.dev';
const PALETTE_TEST_API_URL = 'https://tvm-licensing-api.optiflowzoffice.workers.dev';
const PALETTE_PRODUCT = 'palette_pilot_pro';

function paletteApiUrl(path, body) {
    const isSandboxCheckoutResult = path === '/v1/checkout/result'
        && typeof body?.sessionId === 'string'
        && body.sessionId.startsWith('cs_test_');
    return isSandboxCheckoutResult ? PALETTE_TEST_API_URL : PALETTE_API_URL;
}

async function postToPaletteApi(path, body) {
    const response = await fetch(`${paletteApiUrl(path, body)}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: PALETTE_PRODUCT, ...body })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(data.error?.message || 'Something went wrong. Please try again.');
        error.code = data.error?.code || 'request_failed';
        throw error;
    }
    return data;
}

function cleanCheckoutQuery() {
    const url = new URL(window.location.href);
    url.searchParams.delete('checkout');
    url.searchParams.delete('session_id');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

function checkoutStatusElements() {
    return {
        modal: document.getElementById('checkoutStatus'),
        title: document.getElementById('checkoutStatusTitle'),
        message: document.getElementById('checkoutStatusMessage'),
        result: document.getElementById('licenseResult'),
        key: document.getElementById('purchasedLicenseKey'),
        copy: document.getElementById('copyLicenseButton')
    };
}

function showCheckoutStatus({ title, message, licenseKey }) {
    const elements = checkoutStatusElements();
    elements.title.textContent = title;
    elements.message.textContent = message;
    elements.modal.hidden = false;
    document.body.style.overflow = 'hidden';
    elements.key.textContent = licenseKey || '';
    elements.result.hidden = !licenseKey;
}

function closeCheckoutStatus() {
    checkoutStatusElements().modal.hidden = true;
    document.body.style.overflow = '';
    cleanCheckoutQuery();
}

function initializeCheckoutButton() {
    const button = document.querySelector('.checkoutButton');
    if (!button) return;
    button.addEventListener('click', async () => {
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = 'Opening secure checkout…';
        try {
            const checkout = await postToPaletteApi('/v1/checkout', { plan: 'lifetime' });
            window.location.assign(checkout.url);
        } catch (error) {
            button.disabled = false;
            button.textContent = originalText;
            showCheckoutStatus({
                title: 'Could not open checkout',
                message: error.message
            });
        }
    });
}

function initializePurchaseDetails() {
    const form = document.getElementById('manageLicenseForm');
    const input = document.getElementById('billingLicenseKey');
    const message = document.getElementById('billingMessage');
    if (!form || !input || !message) return;

    input.addEventListener('input', () => {
        input.value = input.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
        message.textContent = '';
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Opening…';
        message.textContent = '';
        try {
            const portal = await postToPaletteApi('/v1/billing/portal', {
                licenseKey: input.value.trim()
            });
            window.location.assign(portal.url);
        } catch (error) {
            message.textContent = error.code === 'license_not_found'
                ? 'That Palette Pilot license key could not be found.'
                : error.message;
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });
}

function initializeCheckoutStatus() {
    const elements = checkoutStatusElements();
    if (!elements.modal) return;

    elements.modal.querySelector('.checkoutClose').addEventListener('click', closeCheckoutStatus);
    elements.modal.querySelector('.checkoutBackdrop').addEventListener('click', closeCheckoutStatus);
    document.getElementById('checkoutDoneButton').addEventListener('click', closeCheckoutStatus);
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !elements.modal.hidden) closeCheckoutStatus();
    });
    elements.copy.addEventListener('click', async () => {
        const originalText = elements.copy.textContent;
        try {
            await navigator.clipboard.writeText(elements.key.textContent);
            elements.copy.textContent = 'Copied';
        } catch {
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(elements.key);
            selection.removeAllRanges();
            selection.addRange(range);
            elements.copy.textContent = 'Select and copy the key';
        }
        window.setTimeout(() => { elements.copy.textContent = originalText; }, 1800);
    });

    const params = new URLSearchParams(window.location.search);
    const checkoutState = params.get('checkout');
    const sessionId = params.get('session_id');
    if (checkoutState === 'cancelled') {
        showCheckoutStatus({
            title: 'No payment was made',
            message: 'Palette Pilot Pro will be here whenever you are ready.'
        });
        return;
    }

    if (checkoutState === 'success' && sessionId) {
        showCheckoutStatus({
            title: 'Preparing your license…',
            message: 'Confirming your Stripe payment securely.'
        });
        postToPaletteApi('/v1/checkout/result', { sessionId })
            .then((license) => {
                if (license.product !== PALETTE_PRODUCT || !license.licenseKey?.startsWith('PPL-')) {
                    throw new Error('Stripe returned a license for a different product.');
                }
                showCheckoutStatus({
                    title: 'Welcome to Palette Pilot Pro',
                    message: `Your license is ready for ${license.email}. Save it somewhere safe, then activate it inside the extension settings.`,
                    licenseKey: license.licenseKey
                });
            })
            .catch((error) => {
                showCheckoutStatus({
                    title: 'We could not load your license yet',
                    message: `${error.message} Refresh this page in a moment to try again.`
                });
            });
    }
}

function initializeScrollHeader() {
    const header = document.querySelector('.scrollHeader');
    const hero = document.querySelector('.heroSection');
    if (!header || !hero) return;

    let ticking = false;
    const update = () => {
        const revealPoint = Math.min(hero.offsetHeight * 0.36, 390);
        header.classList.toggle('is-visible', window.scrollY > revealPoint);
        ticking = false;
    };
    const requestUpdate = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
    };

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    update();
}

function initializeDirectProAnchor() {
    if (window.location.hash !== '#pro') return;
    const target = document.getElementById('pro');
    if (!target) return;

    requestAnimationFrame(() => {
        const root = document.documentElement;
        const previousBehavior = root.style.scrollBehavior;
        root.style.scrollBehavior = 'auto';
        target.scrollIntoView({ block: 'start' });
        root.style.scrollBehavior = previousBehavior;
    });
}

function initializeSmoothFaq() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    document.querySelectorAll('.faqList details').forEach((details) => {
        const summary = details.querySelector('summary');
        const answer = details.querySelector('p');
        if (!summary || !answer) return;

        let animation = null;
        let answerAnimation = null;

        const finish = (open) => {
            details.open = open;
            details.style.height = '';
            details.style.overflow = '';
            details.classList.remove('is-opening', 'is-closing');
            animation = null;
            answerAnimation = null;
        };

        summary.addEventListener('click', (event) => {
            event.preventDefault();
            const isOpen = details.open;
            const startHeight = `${details.offsetHeight}px`;

            animation?.cancel();
            answerAnimation?.cancel();
            details.style.height = startHeight;
            details.style.overflow = 'hidden';

            if (!isOpen) details.open = true;
            const endHeight = isOpen ? `${summary.offsetHeight}px` : `${summary.offsetHeight + answer.offsetHeight}px`;
            details.classList.toggle('is-opening', !isOpen);
            details.classList.toggle('is-closing', isOpen);

            animation = details.animate({ height: [startHeight, endHeight] }, {
                duration: 380,
                easing: 'cubic-bezier(.2,.75,.2,1)'
            });
            answerAnimation = answer.animate({
                opacity: isOpen ? [1, 0] : [0, 1],
                transform: isOpen ? ['translateY(0)', 'translateY(-7px)'] : ['translateY(-7px)', 'translateY(0)']
            }, {
                duration: isOpen ? 230 : 340,
                easing: 'cubic-bezier(.2,.75,.2,1)',
                fill: 'both'
            });
            animation.onfinish = () => finish(!isOpen);
            animation.oncancel = () => {
                details.style.height = '';
                details.style.overflow = '';
            };
        });
    });
}

function initializeFeatureMicroDemos() {
    const contrastValue = document.querySelector('[data-contrast-value]');
    const accessCard = contrastValue?.closest('.accessCard');
    const typedCode = document.querySelector('.typedCode');
    const exportCard = typedCode?.closest('.exportCard');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const codeSource = ':root {\n  --color-primary: #FF006A;\n  --color-surface: #160008;\n  --color-accent: #71D0E9;\n}';

    const renderCode = (value) => {
        if (!typedCode) return;
        const escaped = value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        typedCode.innerHTML = escaped
            .replace(/:root/g, '<span class="codeRoot">:root</span>')
            .replace(/#[0-9A-F]{6}/gi, '<span class="codeValue">$&</span>');
    };

    if (reducedMotion) {
        renderCode(codeSource);
        return;
    }

    if (contrastValue && accessCard) {
        const values = ['12.6', '12.8', '13.1', '12.9', '12.5', '12.7'];
        let valueIndex = 0;
        window.setInterval(() => {
            if (!accessCard.classList.contains('demo-active') || document.hidden) return;
            contrastValue.classList.add('is-changing');
            window.setTimeout(() => {
                valueIndex = (valueIndex + 1) % values.length;
                contrastValue.textContent = values[valueIndex];
                contrastValue.classList.remove('is-changing');
            }, 150);
        }, 1050);
    }

    if (typedCode && exportCard) {
        let characterIndex = 0;
        let deleting = false;

        const typeNextCharacter = () => {
            if (!exportCard.classList.contains('demo-active') || document.hidden) {
                window.setTimeout(typeNextCharacter, 250);
                return;
            }

            characterIndex += deleting ? -1 : 1;
            characterIndex = Math.max(0, Math.min(codeSource.length, characterIndex));
            renderCode(codeSource.slice(0, characterIndex));

            let delay = deleting ? 20 : 42;
            if (!deleting && characterIndex === codeSource.length) {
                deleting = true;
                delay = 1900;
            } else if (deleting && characterIndex === 0) {
                deleting = false;
                delay = 520;
            } else if (!deleting && /[;{}\n]/.test(codeSource[characterIndex - 1] || '')) {
                delay = 125;
            }

            window.setTimeout(typeNextCharacter, delay);
        };

        renderCode('');
        window.setTimeout(typeNextCharacter, 380);
    }
}

function initializeMotion() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const targets = document.querySelectorAll([
        '.trustStrip > *',
        '.sectionIntro',
        '.featureCard',
        '.workflowSteps article',
        '.workflowVisual',
        '.pricingCopy',
        '.priceCard',
        '.faqIntro',
        '.faqList details',
        '.finalCta > div:last-child'
    ].join(','));

    document.body.classList.add('motion-ready');
    targets.forEach((target, index) => {
        target.classList.add('reveal');
        target.style.setProperty('--reveal-delay', `${(index % 3) * 75}ms`);
    });

    requestAnimationFrame(() => document.body.classList.add('page-ready'));

    if (!('IntersectionObserver' in window)) {
        targets.forEach((target) => target.classList.add('in-view'));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });

    targets.forEach((target) => observer.observe(target));

    const demoObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            entry.target.classList.toggle('demo-active', entry.isIntersecting);
        });
    }, { threshold: 0.22 });

    document.querySelectorAll('.featureCard').forEach((card) => demoObserver.observe(card));
}

document.addEventListener('DOMContentLoaded', () => {
    initializeDirectProAnchor();
    initializeScrollHeader();
    initializeSmoothFaq();
    initializeMotion();
    initializeFeatureMicroDemos();
    initializeCheckoutButton();
    initializePurchaseDetails();
    initializeCheckoutStatus();
});
