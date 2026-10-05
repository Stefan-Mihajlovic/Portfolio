// Motion shared by the photographic extension pages. Content remains usable without JS.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches || !('IntersectionObserver' in window)) return;
  const isPalette = document.body.dataset.motionPage === 'palette-pilot';
  const isVolume = document.body.classList.contains('tab-volume-manager');
  document.body.classList.add('motion-enhanced');
  const pending = new Set();
  const activeAnimations = new Set();
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(({target, isIntersecting}) => {
      if (!isIntersecting) return;
      target.classList.remove('motion-pending');
      pending.delete(target);
      revealObserver.unobserve(target);
    });
  }, {threshold: .08, rootMargin: '0px 0px -24px 0px'});

  function reveal(selector, {delay = 0, step = 75, kind = 'copy'} = {}) {
    document.querySelectorAll(selector).forEach((el, i) => {
      el.classList.add('motion-enter', 'motion-pending', `motion-${kind}`);
      el.style.setProperty('--motion-delay', `${delay + (i % 5) * step}ms`);
      pending.add(el);
      revealObserver.observe(el);
    });
  }
  if (!isPalette) {
    reveal(isVolume ? '.siteHeader' : '.hero > nav', {kind:'nav', step:0});
    reveal(isVolume ? '.heroCopy > *' : '.hero-copy > *', {delay:100, step:90});
    const art = document.querySelector(isVolume ? '.heroArtwork' : '.hero-art');
    if (art) {
      const animation = art.animate([{scale:1.065, opacity:.55}, {scale:1, opacity:1}],
        {duration:1600, easing:'cubic-bezier(.16,1,.3,1)'});
      activeAnimations.add(animation);
      animation.onfinish = () => activeAnimations.delete(animation);
    }
    if (isVolume) {
      reveal('.audioRibbon span', {step:90});
      document.querySelectorAll('.listeningScene').forEach(scene => {
        scene.querySelectorAll('.sceneCopy > *').forEach((el,i) => {
          el.dataset.sceneCopy = '';
          el.style.setProperty('--motion-delay', `${i*90}ms`);
          el.classList.add('motion-enter','motion-pending','motion-copy');
          pending.add(el);revealObserver.observe(el);
        });
      });
      reveal('.musicVolume, .musicEq, .cinemaEffects', {kind:'capture', step:160});
      reveal('.pricingHeading, .priceCard, .manageForm', {step:100});
      reveal('.faqIntro, .faqList', {step:100});
    } else {
      reveal('.showcase-copy', {step:0});
      reveal('.product-stage', {kind:'capture', delay:100, step:0});
      reveal('.inspect-copy > *', {step:100});
      reveal('.inspect-collage figure', {kind:'capture', step:140});
      reveal('.plus-intro > *, .plus-features li, .plus-price, .plus-purchase > .button, .plus-fine, .plus-manage', {step:70});
      reveal('.download-section > img, .download-section > h2, .download-section > .button, .download-section > p, .download-section > .details', {step:90});
    }
  }
  reveal('.downloadSection > div > *', {step:90});

  // Capture rotation is retained; drift is on the individual translate axis.
  const floating = document.querySelectorAll('.inspect-collage figure, .listeningScene .realCapture');
  floating.forEach((el,i) => {
    el.classList.add('motion-float');
    el.style.setProperty('--float-duration', `${7+i*1.3}s`);
    el.style.setProperty('--float-phase', `${-i*1.7}s`);
  });
  document.querySelectorAll('.floating-type span').forEach((el,i) => {
    el.style.setProperty('--wander-x', `${[65,-70,90,-65,55,-60][i]}px`);
    el.style.setProperty('--wander-y', `${[-55,60,-50,-65,75,-80][i]}px`);
    el.style.setProperty('--wander-time', `${[23,29,26,31,21,27][i]}s`);
    el.style.setProperty('--wander-phase', `${-i*3.8}s`);
  });
  const scenes = [...document.querySelectorAll('.showcase, .inspect-section, .listeningScene, .download-section, .downloadSection')];
  let frame = null;
  const visibleScenes = new Set();
  function updateDepth() {
    frame = null;
    if (document.hidden || reduced.matches) return;
    visibleScenes.forEach(scene => {
      const box = scene.getBoundingClientRect();
      const progress = Math.max(-1,Math.min(1,(innerHeight/2 - box.top-box.height/2)/(innerHeight+box.height)));
      scene.style.setProperty('--scene-depth', `${progress * (innerWidth < 700 ? 22 : 52)}px`);
    });
  }
  function scheduleDepth() { if (frame === null) frame = requestAnimationFrame(updateDepth); }
  const sceneObserver = new IntersectionObserver(entries => {
    entries.forEach(({target,isIntersecting}) => {
      target.classList.toggle('motion-active', isIntersecting && !document.hidden);
      if (isIntersecting) visibleScenes.add(target);else visibleScenes.delete(target);
    });
    scheduleDepth();
  });
  scenes.forEach(el => sceneObserver.observe(el));
  addEventListener('scroll',scheduleDepth,{passive:true});
  addEventListener('resize',scheduleDepth,{passive:true});
  document.addEventListener('visibilitychange',()=>{
    visibleScenes.forEach(el=>el.classList.toggle('motion-active',!document.hidden));
    scheduleDepth();
  });

  // Footer links never wait in a hidden state; animate only when they first appear.
  const footerObserver = new IntersectionObserver(entries => {
    entries.forEach(({target,isIntersecting}) => {
      if (!isIntersecting) return;
      target.querySelectorAll('.footer-main > *, .footerTop > *, .footer-bottom, .footerBottom').forEach((el,i)=>{
        const animation = el.animate([{opacity:.35,translate:'0 15px'}, {opacity:1,translate:'0 0'}],
          {duration:650,delay:i*65,easing:'cubic-bezier(.16,1,.3,1)'});
        activeAnimations.add(animation);
        animation.onfinish=()=>activeAnimations.delete(animation);
        el.addEventListener('focusin',()=>animation.cancel(),{once:true});
      });
      footerObserver.unobserve(target);
    });
  },{threshold:.08});
  document.querySelectorAll('.site-footer, .modernFooter, body.tab-volume-manager footer').forEach(el=>footerObserver.observe(el));
  document.addEventListener('focusin',event=>{
    const el=event.target.closest('.motion-pending');
    if(el){el.classList.remove('motion-pending');pending.delete(el);revealObserver.unobserve(el);}
  });
  reduced.addEventListener('change',event=>{
    if(!event.matches)return;
    pending.forEach(el=>el.classList.remove('motion-pending'));pending.clear();
    activeAnimations.forEach(animation=>animation.cancel());activeAnimations.clear();
    revealObserver.disconnect();sceneObserver.disconnect();footerObserver.disconnect();
    removeEventListener('scroll',scheduleDepth);removeEventListener('resize',scheduleDepth);
    if(frame!==null)cancelAnimationFrame(frame);
  });
})();
