const TVM_API_URL = 'https://tvm-licensing-api-prod.optiflowzoffice.workers.dev';
const TVM_TEST_API_URL = 'https://tvm-licensing-api.optiflowzoffice.workers.dev';

function tvmApiUrl(path, body) {
    const isSandboxCheckoutResult = path === '/v1/checkout/result'
        && typeof body?.sessionId === 'string'
        && body.sessionId.startsWith('cs_test_');
    return isSandboxCheckoutResult ? TVM_TEST_API_URL : TVM_API_URL;
}

async function postToTvm(path, body) {
    const response = await fetch(`${tvmApiUrl(path, body)}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
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

function initializeCheckoutButtons() {
    document.querySelectorAll('.checkoutButton').forEach((button) => {
        button.addEventListener('click', async () => {
            const originalText = button.textContent;
            button.disabled = true;
            button.textContent = 'Opening secure checkout…';

            try {
                const checkout = await postToTvm('/v1/checkout', { plan: button.dataset.plan });
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
    });
}

function initializeBillingPortal() {
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
            const portal = await postToTvm('/v1/billing/portal', {
                licenseKey: input.value.trim()
            });
            window.location.assign(portal.url);
        } catch (error) {
            message.textContent = error.code === 'license_not_found'
                ? 'That license key could not be found.'
                : error.message;
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });
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

    if (licenseKey) {
        elements.key.textContent = licenseKey;
        elements.result.hidden = false;
    } else {
        elements.key.textContent = '';
        elements.result.hidden = true;
    }
}

function closeCheckoutStatus() {
    const { modal } = checkoutStatusElements();
    modal.hidden = true;
    document.body.style.overflow = '';
    cleanCheckoutQuery();
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
            message: 'You can choose a Pro plan whenever you are ready.'
        });
        return;
    }

    if (checkoutState === 'success' && sessionId) {
        showCheckoutStatus({
            title: 'Preparing your license…',
            message: 'Confirming your Stripe payment securely.'
        });

        postToTvm('/v1/checkout/result', { sessionId })
            .then((license) => {
                showCheckoutStatus({
                    title: 'Welcome to Tab Volume Manager Pro',
                    message: `Your license is ready for ${license.email}. Save it somewhere safe, then activate it inside the extension.`,
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

function initializeMotion() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const targets = document.querySelectorAll([
        '.signalStrip span',
        '.sectionIntro',
        '.featureCard',
        '.experienceCopy',
        '.experienceCopy li',
        '.experienceVisual',
        '.galleryGrid figure',
        '.pricingHeading',
        '.priceCard',
        '.monthlyRow',
        '.manageForm',
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

function initializeAnimatedValues() {
    const volumeValue = document.querySelector('[data-volume-value]');
    const volumeTrack = document.querySelector('.volumeCard .sliderTrack');
    const volumeThumb = volumeTrack?.querySelector('i');
    const mixerMeters = [...document.querySelectorAll('.mixerRows > span')].map((row) => ({
        fill: row.querySelector('u'),
        track: row.querySelector('em'),
        value: row.querySelector('small')
    })).filter(({ fill, track, value }) => fill && track && value);

    if ((!volumeValue || !volumeTrack || !volumeThumb) && !mixerMeters.length) return;

    const render = () => {
        if (!document.hidden && volumeValue && volumeTrack && volumeThumb) {
            const trackRect = volumeTrack.getBoundingClientRect();
            const thumbRect = volumeThumb.getBoundingClientRect();
            const position = (thumbRect.left + thumbRect.width / 2 - trackRect.left) / trackRect.width;
            const nextValue = `${Math.round(Math.max(0, Math.min(1, position)) * 500)}%`;
            if (volumeValue.textContent !== nextValue) volumeValue.textContent = nextValue;
        }

        if (!document.hidden) {
            mixerMeters.forEach(({ fill, track, value }) => {
                const level = Math.round((fill.getBoundingClientRect().width / track.getBoundingClientRect().width) * 100);
                const nextValue = `${Math.max(0, Math.min(100, level))}`;
                if (value.textContent !== nextValue) value.textContent = nextValue;
            });
        }

        requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
}

document.addEventListener('DOMContentLoaded', () => {
    initializeDirectProAnchor();
    initializeScrollHeader();
    initializeSmoothFaq();
    initializeMotion();
    initializeAnimatedValues();
    initializeCheckoutButtons();
    initializeBillingPortal();
    initializeCheckoutStatus();
});
