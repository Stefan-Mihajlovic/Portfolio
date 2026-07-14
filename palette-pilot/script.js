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
        eyebrow: document.getElementById('checkoutStatusEyebrow'),
        title: document.getElementById('checkoutStatusTitle'),
        message: document.getElementById('checkoutStatusMessage'),
        result: document.getElementById('licenseResult'),
        key: document.getElementById('purchasedLicenseKey'),
        copy: document.getElementById('copyLicenseButton')
    };
}

function showCheckoutStatus({ eyebrow, title, message, licenseKey }) {
    const elements = checkoutStatusElements();
    elements.eyebrow.textContent = eyebrow;
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
                eyebrow: 'Checkout unavailable',
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
            eyebrow: 'Checkout cancelled',
            title: 'No payment was made',
            message: 'Palette Pilot Pro will be here whenever you are ready.'
        });
        return;
    }

    if (checkoutState === 'success' && sessionId) {
        showCheckoutStatus({
            eyebrow: 'Payment received',
            title: 'Preparing your license…',
            message: 'Confirming your Stripe payment securely.'
        });
        postToPaletteApi('/v1/checkout/result', { sessionId })
            .then((license) => {
                if (license.product !== PALETTE_PRODUCT || !license.licenseKey?.startsWith('PPL-')) {
                    throw new Error('Stripe returned a license for a different product.');
                }
                showCheckoutStatus({
                    eyebrow: 'Lifetime Pro license',
                    title: 'Welcome to Palette Pilot Pro',
                    message: `Your license is ready for ${license.email}. Save it somewhere safe, then activate it inside the extension settings.`,
                    licenseKey: license.licenseKey
                });
            })
            .catch((error) => {
                showCheckoutStatus({
                    eyebrow: 'License pending',
                    title: 'We could not load your license yet',
                    message: `${error.message} Refresh this page in a moment to try again.`
                });
            });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeCheckoutButton();
    initializePurchaseDetails();
    initializeCheckoutStatus();
});
