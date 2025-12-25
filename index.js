// MOBILE MENU TOGGLE

const mobileMenuButton = document.getElementById('mobileMenuButton');
mobileMenuButton.addEventListener('click', function() {
    document.querySelector('.mobileMenuWrapper').classList.toggle('closed');
    mobileMenuButton.classList.toggle('open');
});

function closeMobileMenu(){
    document.querySelector('.mobileMenuWrapper').classList.toggle('closed');
    mobileMenuButton.classList.toggle('open');
}

// HEADER SCROLL SHADOW

const scrollShadow = document.querySelector('.scrollShadow');
window.addEventListener('scroll', () => {
    if (window.scrollY > 10) {
        scrollShadow.classList.add('active');
    } else {
        scrollShadow.classList.remove('active');
    }
});

// CURSOR EFFECT

const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

if (isTouchDevice) {
    document.querySelector('.cursor').style.display = 'none';
    document.body.style.cursor = 'auto';
}

const cursor = document.querySelector('.cursor');
const cursorDot = document.querySelector('.cursor-dot');

let mouseX = -100, mouseY = -100;
let cursorX = 0, cursorY = 0;
let velocityX = 0, velocityY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

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

animate();

const hoverables = document.querySelectorAll('a, button, .skillCard p, .closeMenuButton');

hoverables.forEach(element => {
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
});

document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
});

document.addEventListener('mouseenter', () => {
    cursor.style.opacity = '1';
});

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