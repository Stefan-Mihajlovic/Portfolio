(() => {
    'use strict';

    const body = document.body;
    const root = document.documentElement;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobileMotionQuery = window.matchMedia('(max-width: 800px)');
    const isProductPage = Boolean(document.querySelector('.siteHeader'));

    let arrivingFromNavigation = false;
    let arrivingTransitionColor = '';
    try {
        arrivingFromNavigation = window.sessionStorage.getItem('art-page-transition') === '1';
        arrivingTransitionColor = window.sessionStorage.getItem('art-page-transition-color') || '';
        if (arrivingFromNavigation) window.sessionStorage.removeItem('art-page-transition');
        if (arrivingTransitionColor) window.sessionStorage.removeItem('art-page-transition-color');
    } catch (error) {
        arrivingFromNavigation = false;
        arrivingTransitionColor = '';
    }

    body.classList.add('motion-art', isProductPage ? 'motion-product' : 'motion-portfolio');
    if (arrivingFromNavigation) body.classList.add('art-entering');

    const route = window.location.pathname.replace(/\/+$/, '') || '/';
    const pageKey = route === '/' ? 'home' : route.split('/').filter(Boolean).pop() || 'home';
    body.dataset.artPage = pageKey;

    const pageMeta = {
        home: { title: 'STEFAN MIHAJLOVIC', color: '#7147ff', ink: '#f8f5ee' },
        about: { title: 'ABOUT STEFAN', color: '#ef7654', ink: '#090909' },
        projects: { title: 'SELECTED WORK', color: '#c7f36b', ink: '#090909' },
        skills: { title: 'THE SKILLSET', color: '#3f7bff', ink: '#f8f5ee' },
        contact: { title: 'LET’S TALK', color: '#ef76ad', ink: '#090909' },
        optiflowz: {
            title: 'OPTIFLOWZ CASE STUDY',
            lines: [
                { text: 'OPTIFLOWZ', outline: false },
                { text: 'CASE STUDY', outline: true }
            ],
            color: '#8fb7ff',
            ink: '#090909'
        },
        'eaes-video-corner': {
            title: 'EAES VIDEO CORNER',
            lines: [
                { text: 'EAES VIDEO', outline: false },
                { text: 'CORNER', outline: true }
            ],
            color: '#ff784b',
            ink: '#090909'
        },
        privacypolicies: { title: 'LEGAL', color: '#99a79a', ink: '#090909' },
        '404.html': { title: '404', color: '#ff784b', ink: '#090909' }
    };

    const getMeta = () => {
        if (route.includes('privacypolicies')) return pageMeta.privacypolicies;
        if (route.endsWith('terms.html')) return { title: 'TERMS', color: '#ef76ad', ink: '#090909' };
        return pageMeta[pageKey] || { title: document.title.split('|')[0].trim().toUpperCase(), color: '#7147ff', ink: '#f8f5ee' };
    };

    const palette = [
        { bg: '#99a79a', ink: '#090909' },
        { bg: '#ef76ad', ink: '#090909' },
        { bg: '#63adff', ink: '#090909' },
        { bg: '#ff784b', ink: '#090909' },
        { bg: '#c7f36b', ink: '#090909' },
        { bg: '#7147ff', ink: '#f8f5ee' }
    ];

    const skillsPalette = [
        { bg: '#ef76ad', ink: '#090909' },
        { bg: '#3f7bff', ink: '#f8f5ee' },
        { bg: '#63adff', ink: '#090909' },
        { bg: '#ff784b', ink: '#090909' }
    ];

    const contactPalette = [
        { bg: '#7147ff', ink: '#f8f5ee' }
    ];

    const caseStudyPalettes = {
        optiflowz: [
            { bg: '#8fb7ff', ink: '#090909' },
            { bg: '#ef76ad', ink: '#090909' },
            { bg: '#63adff', ink: '#090909' },
            { bg: '#ff784b', ink: '#090909' },
            { bg: '#7147ff', ink: '#f8f5ee' }
        ],
        'eaes-video-corner': [
            { bg: '#8fb7ff', ink: '#090909' },
            { bg: '#ef76ad', ink: '#090909' },
            { bg: '#7147ff', ink: '#f8f5ee' }
        ]
    };

    const projectThemes = [
        { className: 'healthPlus', bg: '#0795bd', ink: '#f8f5ee' },
        { className: 'eaes', bg: '#f78a3d', ink: '#090909' },
        { className: 'optiFlowz', bg: '#2778ee', ink: '#f8f5ee' },
        { className: 'crimsonMusic', bg: '#712fb4', ink: '#f8f5ee' },
        { className: 'palettePilot', bg: '#ee1760', ink: '#f8f5ee' },
        { className: 'krunaBoje', bg: '#c7f36b', ink: '#090909' },
        { className: 'roomRule', bg: '#ff6038', ink: '#090909' },
        { className: 'uehsWebsite', bg: '#28bda8', ink: '#090909' },
        { className: 'tabVolumeManager', bg: '#3f55d9', ink: '#f8f5ee' }
    ];

    const titleSizes = (text) => {
        const length = text.replace(/\s/g, '').length;
        if (length <= 7) return { desktop: 18, mobile: 22.5 };
        if (length === 8) return { desktop: 14.5, mobile: 17.8 };
        if (length <= 11) return { desktop: 12.5, mobile: 13.2 };
        if (length <= 16) return { desktop: 11.2, mobile: 15.5 };
        if (length <= 22) return { desktop: 8.6, mobile: 12.5 };
        return { desktop: 7, mobile: 10.2 };
    };

    const rail = document.createElement('div');
    rail.className = 'art-rail';
    rail.setAttribute('aria-hidden', 'true');
    rail.innerHTML = '<span class="art-rail-fill"></span><b>01</b><i>SCROLL</i>';
    body.appendChild(rail);

    const transition = document.createElement('div');
    transition.className = 'art-page-transition';
    transition.setAttribute('aria-hidden', 'true');
    transition.innerHTML = '<span>SM</span>';
    transition.style.setProperty('--art-transition-bg', arrivingTransitionColor || getMeta().color);
    body.appendChild(transition);
    root.classList.remove('art-transition-pending');

    const initializeHeaderLetterDeformation = () => {
        if (isProductPage || reducedMotion) return;

        document.querySelectorAll('body > header > nav > a').forEach((link) => {
            const label = link.textContent.replace(/\s+/g, ' ').trim();
            if (!label || link.querySelector('.art-nav-letter')) return;

            link.setAttribute('aria-label', link.getAttribute('aria-label') || label);
            const letters = Array.from(label, (character) => {
                const letter = document.createElement('span');
                letter.className = 'art-nav-letter';
                letter.setAttribute('aria-hidden', 'true');
                if (character === ' ') {
                    letter.classList.add('is-space');
                    letter.textContent = '\u00a0';
                } else {
                    letter.textContent = character;
                }
                return letter;
            });

            link.replaceChildren(...letters);
            const visibleLetters = letters.filter((letter) => !letter.classList.contains('is-space'));
            let hoveredLetter = null;
            let cleanupTimer = 0;

            const findNearestLetter = (clientX) => visibleLetters.reduce((nearest, letter) => {
                const rect = letter.getBoundingClientRect();
                const distance = Math.abs(clientX - (rect.left + rect.width * .5));
                return !nearest || distance < nearest.distance ? { letter, distance } : nearest;
            }, null)?.letter || visibleLetters[Math.floor(visibleLetters.length / 2)];

            const setHoveredLetter = (letter) => {
                if (hoveredLetter === letter) return;
                hoveredLetter?.classList.remove('is-letter-hovered');
                hoveredLetter = letter;
                hoveredLetter?.classList.add('is-letter-hovered');
            };

            const deformLetter = (letter) => {
                const index = visibleLetters.indexOf(letter);
                if (index < 0) return;

                window.clearTimeout(cleanupTimer);
                visibleLetters.forEach((item) => item.classList.remove('is-deforming', 'is-deforming-near'));
                void link.offsetWidth;
                letter.classList.add('is-deforming');
                visibleLetters[index - 1]?.classList.add('is-deforming-near');
                visibleLetters[index + 1]?.classList.add('is-deforming-near');
                cleanupTimer = window.setTimeout(() => {
                    visibleLetters.forEach((item) => item.classList.remove('is-deforming', 'is-deforming-near'));
                }, 720);
            };

            link.addEventListener('pointermove', (event) => setHoveredLetter(findNearestLetter(event.clientX)));
            link.addEventListener('pointerleave', () => setHoveredLetter(null));
            link.addEventListener('pointerdown', (event) => deformLetter(findNearestLetter(event.clientX)));
            link.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') deformLetter(hoveredLetter || visibleLetters[Math.floor(visibleLetters.length / 2)]);
            });
        });
    };

    initializeHeaderLetterDeformation();

    let heroScene = null;

    const startOutlineLetterLoop = (letters) => {
        if (reducedMotion || !letters.length) return;

        let activeIndex = -1;
        let hoveredLetter = null;
        let stepTimer = 0;
        let resumeTimer = 0;
        let deformationTimer = 0;

        const clearAutomaticFill = () => {
            letters.forEach((letter) => letter.classList.remove('is-auto-filled'));
        };

        const showNextLetter = () => {
            if (hoveredLetter) return;

            clearAutomaticFill();
            activeIndex = (activeIndex + 1) % letters.length;
            letters[activeIndex].classList.add('is-auto-filled');
            stepTimer = window.setTimeout(showNextLetter, 680);
        };

        const deformLetter = (letter) => {
            const index = letters.indexOf(letter);
            if (index < 0) return;

            window.clearTimeout(deformationTimer);
            letters.forEach((item) => item.classList.remove('is-deforming', 'is-deforming-near'));
            void letter.parentElement.offsetWidth;
            letter.classList.add('is-deforming');
            letters[index - 1]?.classList.add('is-deforming-near');
            letters[index + 1]?.classList.add('is-deforming-near');
            deformationTimer = window.setTimeout(() => {
                letters.forEach((item) => item.classList.remove('is-deforming', 'is-deforming-near'));
            }, 860);
        };

        letters.forEach((letter, letterIndex) => {
            letter.addEventListener('pointerenter', () => {
                hoveredLetter = letter;
                activeIndex = letterIndex;
                window.clearTimeout(stepTimer);
                window.clearTimeout(resumeTimer);
                clearAutomaticFill();
                letter.classList.add('is-filled');
            });

            letter.addEventListener('pointerleave', () => {
                if (hoveredLetter === letter) hoveredLetter = null;
                letter.classList.remove('is-filled');
                window.clearTimeout(resumeTimer);
                resumeTimer = window.setTimeout(showNextLetter, 420);
            });

            letter.addEventListener('pointerdown', () => deformLetter(letter));
        });

        stepTimer = window.setTimeout(showNextLetter, 520);
    };

    const buildHeroScene = () => {
        if (isProductPage) return;

        const heroBlock = document.querySelector('.megaHero') || document.querySelector('main h1.hero');
        if (!heroBlock) return;

        const meta = getMeta();
        heroScene = document.createElement('section');
        heroScene.className = 'art-hero-scene';
        heroScene.dataset.artBg = meta.color;
        heroScene.dataset.artInk = meta.ink;
        heroScene.style.setProperty('--art-panel-bg', meta.color);
        heroScene.style.setProperty('--art-panel-ink', meta.ink);

        const title = document.createElement('div');
        title.className = 'art-hero-title';
        title.setAttribute('aria-hidden', 'true');
        const heroLines = meta.lines || meta.title.split(' ').map((text, index) => ({
            text,
            outline: index % 2 === 1
        }));

        heroLines.forEach((lineConfig, index) => {
            const word = lineConfig.text;
            const line = document.createElement('span');
            line.style.setProperty('--art-line', index);
            const sizes = titleSizes(word);
            line.style.setProperty('--art-hero-size', `${sizes.desktop}vw`);
            line.style.setProperty('--art-hero-size-mobile', `${sizes.mobile}vw`);

            if (lineConfig.outline) {
                line.classList.add('art-outline-line');
                const outlineLetters = [];
                Array.from(word).forEach((character, characterIndex) => {
                    const letter = document.createElement('span');
                    letter.className = 'art-outline-letter';
                    letter.textContent = character === ' ' ? '\u00a0' : character;
                    letter.style.setProperty('--art-letter-index', characterIndex);
                    if (character === ' ') letter.classList.add('is-space');
                    else outlineLetters.push(letter);
                    line.appendChild(letter);
                });
                startOutlineLetterLoop(outlineLetters);
            } else {
                line.textContent = word;
            }
            title.appendChild(line);
        });

        const contactCta = document.createElement('a');
        contactCta.className = 'art-hero-cta';
        const isContactHero = pageKey === 'contact';
        contactCta.href = isContactHero ? '#contactForm' : '/contact/';
        if (isContactHero) contactCta.classList.add('art-hero-cta--contact');

        const contactLabel = document.createElement('span');
        contactLabel.className = 'art-hero-cta__label';
        contactLabel.textContent = isContactHero ? 'WRITE A MESSAGE' : 'GET IN CONTACT';

        const contactArrow = document.createElement('span');
        contactArrow.className = 'art-hero-cta__arrow';
        contactArrow.setAttribute('aria-hidden', 'true');

        contactCta.append(contactLabel, contactArrow);

        heroBlock.before(heroScene);
        heroScene.append(title, contactCta, heroBlock);
    };

    const cleanTitle = (text, fallback) => {
        return (text || fallback || 'STEFAN').replace(/\s+/g, ' ').trim();
    };

    const selectPortfolioPanels = () => {
        if (isProductPage) return Array.from(document.querySelectorAll('main > section'));

        const selectorsByPage = {
            home: '.projects > .projectCard, .projects > .moreProjects',
            projects: '.content > .currentProject, .content > .moreProjects',
            skills: '.content > .skillCard, .content > .moreProjects',
            about: '.content > .shortBio, .content > .detailedBio, .content > .currentProject, .content > .moreProjects',
            contact: '.content > form',
            optiflowz: '.content > .screenshotsSection, .content > .caseStudyTitle, .content > .metaCard, .content > .caseBlock',
            'eaes-video-corner': '.content > .screenshotsSection, .content > .extensionDetails'
        };

        const selector = selectorsByPage[pageKey];
        if (selector) return Array.from(document.querySelectorAll(selector));

        if (route.includes('privacypolicies') || route.endsWith('terms.html')) {
            const policy = document.querySelector('.policyContent');
            if (policy) {
                const sheet = document.createElement('section');
                sheet.className = 'art-legal-panel';
                Array.from(policy.children).filter((child) => child !== heroScene).forEach((child) => sheet.appendChild(child));
                policy.appendChild(sheet);
                return [sheet];
            }
        }

        return [];
    };

    buildHeroScene();

    const panels = selectPortfolioPanels();
    panels.forEach((panel, index) => {
        panel.classList.add('art-panel');
        if (isProductPage) panel.classList.add('art-product-panel');

        const projectTheme = projectThemes.find((item) => panel.classList.contains(item.className));
        const pagePalette = pageKey === 'skills'
            ? skillsPalette
            : pageKey === 'contact'
                ? contactPalette
                : caseStudyPalettes[pageKey] || palette;
        const theme = projectTheme || pagePalette[index % pagePalette.length];
        panel.style.setProperty('--art-panel-bg', theme.bg);
        panel.style.setProperty('--art-panel-ink', theme.ink);
        panel.style.setProperty('--art-index', index);
        panel.dataset.artBg = theme.bg;
        panel.dataset.artInk = theme.ink;

        const heading = panel.querySelector('h2, h3');
        const fallbackTitles = panel.classList.contains('shortBio') ? 'PORTRAIT'
            : panel.classList.contains('detailedBio') ? 'THE STORY'
            : panel.classList.contains('moreProjects') ? 'WHAT NEXT'
            : panel.tagName === 'FORM' ? 'MESSAGE ME'
            : `0${index + 1}`;
        const panelTitle = cleanTitle(heading?.textContent, fallbackTitles);
        const sizes = titleSizes(panelTitle);
        panel.dataset.artTitle = panelTitle;
        panel.style.setProperty('--art-title-size', `${sizes.desktop}vw`);
        panel.style.setProperty('--art-title-size-mobile', `${sizes.mobile}vw`);

        if (!isProductPage) {
            const chrome = document.createElement('div');
            const number = document.createElement('span');
            const label = document.createElement('span');
            chrome.className = 'art-panel-chrome';
            const panelKind = panel.classList.contains('projectCard') || panel.classList.contains('currentProject') ? 'PROJECT'
                : panel.classList.contains('shortBio') ? 'PORTRAIT'
                : panel.classList.contains('detailedBio') ? 'STORY'
                : panel.classList.contains('skillCard') ? 'SKILL'
                : panel.classList.contains('moreProjects') ? 'NEXT'
                : panel.classList.contains('screenshotsSection') ? 'GALLERY'
                : panel.classList.contains('caseStudyTitle') ? 'STUDY'
                : panel.classList.contains('metaCard') ? 'DETAILS'
                : panel.classList.contains('caseBlock') ? 'CHAPTER'
                : panel.classList.contains('extensionDetails') ? 'DETAILS'
                : panel.classList.contains('art-legal-panel') ? 'LEGAL'
                : panel.tagName === 'FORM' ? 'FORM'
                : 'SECTION';
            number.textContent = `${panelKind} / ${String(index + 1).padStart(2, '0')}`;
            label.textContent = panelTitle;
            chrome.append(number, label);
            panel.prepend(chrome);
        }

        const media = panel.querySelector(':scope > img, :scope > div > img, .screenshotsSlider, .shortBio img, .workflowVisual, .experienceVisual, .heroProduct, .browserFrame, .extensionPopup');
        if (media) {
            media.classList.add('art-float-media');
            media.style.setProperty('--art-media-rotate', `${index % 2 ? 2.5 : -2.5}deg`);
        }
    });

    if (!isProductPage) {
        document.querySelectorAll('.skillCard div p, .metaCard div p, .detailedBio p, .caseBlock p').forEach((card) => {
            card.classList.add('art-paper-card');
        });
    }

    const scenes = [heroScene, ...panels].filter(Boolean);
    const sceneMedia = Array.from(document.querySelectorAll('.art-float-media')).map((media) => ({
        media,
        panel: media.closest('.art-panel, .art-hero-scene')
    }));
    let sceneMetrics = [];
    let sceneMetricByElement = new Map();

    const measureScenes = () => {
        sceneMetrics = scenes.map((scene) => {
            let top = 0;
            let offsetNode = scene;
            while (offsetNode) {
                top += offsetNode.offsetTop || 0;
                offsetNode = offsetNode.offsetParent;
            }
            return {
                scene,
                top,
                height: Math.max(scene.offsetHeight, 1)
            };
        });
        sceneMetricByElement = new Map(sceneMetrics.map((metric) => [metric.scene, metric]));
    };

    measureScenes();

    let scrollY = window.scrollY;
    let previousScrollY = scrollY;
    let scrollVelocity = 0;
    let smoothVelocity = 0;
    let frameRequested = false;
    let activeHeaderScene = null;

    const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

    const updateHeader = () => {
        if (isProductPage) return;
        const header = document.querySelector('body > header');
        if (!header) return;

        const sampleY = Math.min(76, window.innerHeight * 0.12);
        const documentSampleY = window.scrollY + sampleY;
        const activeScenes = sceneMetrics.filter(({ top, height }) => {
            return top <= documentSampleY && top + height > documentSampleY;
        });
        const upcoming = sceneMetrics.find(({ top, height }) => top + height > documentSampleY);
        const activeMetric = activeScenes[activeScenes.length - 1] || upcoming || sceneMetrics[sceneMetrics.length - 1];
        const active = activeMetric?.scene;

        if (!active || active === activeHeaderScene) return;
        activeHeaderScene = active;
        header.style.setProperty('--art-header-bg', active.dataset.artBg || '#f8f5ee');
        header.style.setProperty('--art-header-ink', active.dataset.artInk || '#090909');
        body.style.setProperty('--art-active-bg', active.dataset.artBg || '#7147ff');
        body.style.setProperty('--art-active-ink', active.dataset.artInk || '#f8f5ee');
    };

    const render = () => {
        frameRequested = false;
        const viewportHeight = window.innerHeight;
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - viewportHeight);
        const progress = clamp(scrollY / maxScroll);

        if (mobileMotionQuery.matches) {
            scenes.forEach((scene) => {
                scene.classList.remove('art-motion-active');
                scene.style.setProperty('--art-panel-y', '0px');
                scene.style.setProperty('--art-scene-progress', '0');
            });
            sceneMedia.forEach(({ media }) => {
                media.classList.remove('art-motion-active');
                media.style.setProperty('--art-media-y', '0px');
            });

            smoothVelocity = 0;
            scrollVelocity = 0;
            updateHeader();
            return;
        }

        smoothVelocity += (scrollVelocity - smoothVelocity) * 0.13;
        scrollVelocity *= 0.82;

        sceneMetrics.forEach(({ scene, top: layoutTop, height: sceneHeight }) => {
            const viewportTop = layoutTop - scrollY;
            const isNearViewport = viewportTop + sceneHeight > -viewportHeight * 0.65
                && viewportTop < viewportHeight * 1.65;
            scene.classList.toggle('art-motion-active', isNearViewport);
            if (!isNearViewport) return;

            const centerDistance = (viewportTop + sceneHeight * 0.5 - viewportHeight * 0.5) / viewportHeight;
            const centerProgress = clamp(-centerDistance, -1, 1);
            scene.style.setProperty('--art-panel-y', `${Math.round(clamp(centerDistance * 70, -70, 70))}px`);
            scene.style.setProperty('--art-scene-progress', centerProgress.toFixed(4));
        });

        sceneMedia.forEach(({ media, panel }) => {
            const metric = sceneMetricByElement.get(panel);
            if (!metric) return;
            const viewportTop = metric.top - scrollY;
            const inView = viewportTop + metric.height > -100 && viewportTop < viewportHeight + 100;
            media.classList.toggle('art-motion-active', inView);
            if (!inView) return;

            const panelCenterY = viewportTop + metric.height * 0.5;
            const vertical = clamp((viewportHeight * 0.5 - panelCenterY) / viewportHeight, -1, 1);

            media.style.setProperty('--art-media-y', `${vertical * -54 + clamp(smoothVelocity * 0.13, -18, 18)}px`);
        });

        const railFill = rail.querySelector('.art-rail-fill');
        const railNumber = rail.querySelector('b');
        if (railFill) railFill.style.transform = `scaleY(${progress})`;
        const activeSampleY = scrollY + viewportHeight * 0.52;
        const activeIndex = Math.max(0, sceneMetrics.findIndex(({ top, height }) => {
            return top <= activeSampleY && top + height > activeSampleY;
        }));
        if (railNumber) railNumber.textContent = String(activeIndex + 1).padStart(2, '0');

        updateHeader();

        if (Math.abs(scrollVelocity) > 0.1) {
            requestFrame();
        }
    };

    const requestFrame = () => {
        if (frameRequested || reducedMotion) return;
        frameRequested = true;
        requestAnimationFrame(render);
    };

    window.addEventListener('scroll', () => {
        scrollY = window.scrollY;
        scrollVelocity += scrollY - previousScrollY;
        previousScrollY = scrollY;
        requestFrame();
    }, { passive: true });

    const refreshSceneMetrics = () => {
        measureScenes();
        requestFrame();
    };

    window.addEventListener('resize', refreshSceneMetrics, { passive: true });
    window.addEventListener('load', refreshSceneMetrics, { once: true });
    document.fonts?.ready.then(refreshSceneMetrics);

    if ('ResizeObserver' in window) {
        const sceneResizeObserver = new ResizeObserver(refreshSceneMetrics);
        scenes.forEach((scene) => sceneResizeObserver.observe(scene));
    }

    let anchorScrollFrame = 0;

    const cancelAnchorScroll = () => {
        if (!anchorScrollFrame) return;
        cancelAnimationFrame(anchorScrollFrame);
        anchorScrollFrame = 0;
    };

    const animateAnchorScroll = (targetTop) => {
        cancelAnchorScroll();

        const startTop = window.scrollY;
        const distance = targetTop - startTop;
        if (reducedMotion || mobileMotionQuery.matches || Math.abs(distance) < 2) {
            window.scrollTo({ top: targetTop, left: 0, behavior: 'auto' });
            return;
        }

        const duration = Math.min(1000, Math.max(520, 420 + Math.abs(distance) * 0.1));
        const startTime = performance.now();

        const step = (now) => {
            const progress = clamp((now - startTime) / duration);
            const eased = 1 - Math.pow(1 - progress, 4);
            window.scrollTo({ top: startTop + distance * eased, left: 0, behavior: 'auto' });

            if (progress < 1) {
                anchorScrollFrame = requestAnimationFrame(step);
            } else {
                anchorScrollFrame = 0;
            }
        };

        anchorScrollFrame = requestAnimationFrame(step);
    };

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (event) => {
            if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

            const hash = link.getAttribute('href') || '#';
            const isPageTop = hash === '#' || hash === '#top';
            let target = null;

            if (!isPageTop) {
                try {
                    target = document.getElementById(decodeURIComponent(hash.slice(1)));
                } catch (error) {
                    target = document.getElementById(hash.slice(1));
                }
                if (!target) return;
            }

            event.preventDefault();
            const header = document.querySelector('body > header');
            const headerOffset = target ? (header?.offsetHeight || 0) + 12 : 0;
            const targetTop = target
                ? Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerOffset)
                : 0;

            animateAnchorScroll(targetTop);

            if (hash !== '#' && hash !== window.location.hash) {
                window.history.pushState(null, '', hash);
            }
        });
    });

    window.addEventListener('wheel', cancelAnchorScroll, { passive: true });
    window.addEventListener('touchstart', cancelAnchorScroll, { passive: true });

    document.addEventListener('click', (event) => {
        const link = event.target.closest('a[href]');
        if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (link.target === '_blank' || link.hasAttribute('download')) return;

        const url = new URL(link.href, window.location.href);
        if (url.origin !== window.location.origin) return;
        const sameDocument = url.pathname === window.location.pathname && url.search === window.location.search;
        if (sameDocument && (url.hash || link.getAttribute('href') === '#')) return;

        event.preventDefault();
        const transitionScene = scenes.filter((scene) => {
            const rect = scene.getBoundingClientRect();
            return rect.top <= window.innerHeight * 0.5 && rect.bottom > window.innerHeight * 0.5;
        }).pop() || scenes[0];
        const transitionColor = transitionScene?.dataset.artBg || getMeta().color;
        transition.style.setProperty('--art-transition-bg', transitionColor);
        body.classList.add('art-leaving');
        try {
            window.sessionStorage.setItem('art-page-transition', '1');
            window.sessionStorage.setItem('art-page-transition-color', transitionColor);
        } catch (error) {
            // Navigation still works when storage is unavailable.
        }
        window.setTimeout(() => {
            window.location.href = url.href;
        }, reducedMotion ? 0 : 780);
    });

    window.addEventListener('pageshow', () => {
        body.classList.remove('art-leaving');
        requestFrame();
    });

    const revealReadyPage = () => {
        requestAnimationFrame(() => {
            body.classList.add('art-ready');
            root.classList.remove('art-motion-pending');
            scrollY = window.scrollY;
            previousScrollY = scrollY;
            refreshSceneMetrics();

            if (arrivingFromNavigation) {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => body.classList.remove('art-entering'));
                });
            }
        });
    };

    const fontDeadline = new Promise((resolve) => window.setTimeout(resolve, 900));
    Promise.race([document.fonts?.ready || Promise.resolve(), fontDeadline]).then(revealReadyPage);
})();
