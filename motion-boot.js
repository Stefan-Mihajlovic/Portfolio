(() => {
    'use strict';

    document.documentElement.classList.add('art-motion-pending');
    window.setTimeout(() => {
        document.documentElement.classList.remove('art-motion-pending', 'art-transition-pending');
    }, 3000);

    const logoFontPreload = document.createElement('link');
    logoFontPreload.rel = 'preload';
    logoFontPreload.href = '/fonts/medula-one-latin.woff2';
    logoFontPreload.as = 'font';
    logoFontPreload.type = 'font/woff2';
    logoFontPreload.crossOrigin = 'anonymous';
    logoFontPreload.fetchPriority = 'high';
    document.head.appendChild(logoFontPreload);

    try {
        if (window.sessionStorage.getItem('art-page-transition') !== '1') return;

        const transitionColor = window.sessionStorage.getItem('art-page-transition-color');
        document.documentElement.classList.add('art-transition-pending');
        if (transitionColor) {
            document.documentElement.style.setProperty('--art-transition-bootstrap-bg', transitionColor);
        }
    } catch (error) {
        // The regular page transition remains available when storage is blocked.
    }
})();
