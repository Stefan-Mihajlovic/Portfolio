/* GET YEAR IN FOOTER */

let currentYear = new Date().getFullYear();
document.getElementById("currentYearSpan").innerHTML = currentYear;

/* DEVICE ? */

let isOnMobile = false;

const circles = document.querySelectorAll(".circle");

if (/Mobile|Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i.test(navigator.userAgent)) {
  circles.forEach(circle => {
    circle.style.display = "none";
  });
  isOnMobile = true;
}else{
  circles.forEach(circle => {
    circle.style.display = "block";
  });
  isOnMobile = false;
}

/* SKILL VALUES */

let onIndex = false;

function setSkillValues(){

  onIndex = true;

  const Unity = document.getElementById("Unity").style.width = "55%";
  const UnrealEngine = document.getElementById("UnrealEngine").style.width = "30%";
  const Cs = document.getElementById("C#").style.width = "85%";
  const Cpp = document.getElementById("C++").style.width = "75%";
  const HCJ = document.getElementById("hcj").style.width = "95%";
  const Android = document.getElementById("Android").style.width = "25%";

  const Serbian = document.getElementById("Serbian").style.width = "100%";
  const English = document.getElementById("English").style.width = "70%";
  const QuickLearn = document.getElementById("QuickLearn").style.width = "79%";
  const Teamwork = document.getElementById("Teamwork").style.width = "87%";
}

/* PAGE TRANSITIONS */

function setTransition(){
  const transitionEl = document.querySelector('.transitionDiv');
  const anchors = document.querySelectorAll('.tLink');

  setTimeout(() => {
    transitionEl.classList.remove('is-active');
  }, 300);

  anchors.forEach((anchor) => {
    anchor.addEventListener('click', e => {
      e.preventDefault();
      let target = e.target.href;

      transitionEl.classList.add('is-active');
      setTimeout(() => {
        window.location.href = target;
      }, 300);
    })
  })
}

/* WINDOW SCROLLED TO TOP */

window.addEventListener("scroll", () => {
  if(onIndex){
    if(window.scrollY < 1){
      document.getElementById("jiggleText").style.animation = "textJiggle 0.7s linear infinite";
    }else{
      document.getElementById("jiggleText").style.animation = "none";
    }
  }
  if(window.scrollY < 1){
    document.getElementsByTagName("header")[0].classList.remove("headerNotTop");
  }else{
    document.getElementsByTagName("header")[0].classList.add("headerNotTop");
    //document.body.style.backgroundPositionY = -window.scrollY / 11 + "px";
  }
});

/* SEND EMAIL TO MY EMAIL */

function closePopupMessage(){
  const popupMessage = document.getElementById("popupMessage");
  popupMessage.classList.remove("popupMessageWrapperOpen");
}

function sendEmail(e){
  e.preventDefault();

  const form = document.getElementById("contactForm");
  const name = document.getElementById("contactName");
  const email = document.getElementById("contactEmail");
  const subject = document.getElementById("contactSubject");
  const msg = document.getElementById("contactMessage");

  const popupMessage = document.getElementById("popupMessage");
  const popupMessageText = document.getElementById("popupMessageText");

  if(name.value == "" || name.value == " "){
    popupMessage.classList.add("popupMessageWrapperOpen");
    popupMessageText.innerHTML = "Name wasn't specified!";
  }else if(email.value == "" || email.value == " "){
    popupMessage.classList.add("popupMessageWrapperOpen");
    popupMessageText.innerHTML = "Email wasn't specified!";
  }
  else{
    Email.send({
      Host : "smtp.elasticemail.com",
      Username : "stef.mihajlovicc@gmail.com",
      Password : "27829E33FFB23B812EF682F23A4A6416FA5A",
      To : 'stef.mihajlovicc@gmail.com',
      From : 'stef.mihajlovicc@gmail.com',
      Subject : subject.value + " - FROM: " + email.value,
      Body : msg.value
  }).then(
    message => {
      if(message == "OK"){
        popupMessage.classList.add("popupMessageWrapperOpen");
        popupMessageText.innerHTML = "Email was sent!";
      }
    }
  );
  }
}

/* ITEMS ANIM ON SCROLL */

const observer = new IntersectionObserver((entires) => {
  entires.forEach((entry) => {
    if(entry.isIntersecting){
      entry.target.classList.add("show");
    }else{
      entry.target.classList.remove("show");
    }
  });
});

const observer2 = new IntersectionObserver((entires) => {
  entires.forEach((entry) => {
    if(entry.isIntersecting){
      entry.target.classList.add("show2");
    }else{
      entry.target.classList.remove("show2");
    }
  });
});

const observer3 = new IntersectionObserver((entires) => {
  entires.forEach((entry) => {
    if(entry.isIntersecting){
      entry.target.classList.add("show3");
    }else{
      entry.target.classList.remove("show3");
    }
  });
});

const observer4 = new IntersectionObserver((entires) => {
  entires.forEach((entry) => {
    if(entry.isIntersecting){
      entry.target.classList.add("show4");
    }
  });
});

const observer5 = new IntersectionObserver((entires) => {
  entires.forEach((entry) => {
    if(entry.isIntersecting){
      entry.target.classList.add("show5");
    }else{
      entry.target.classList.remove("show5");
    }
  });
});

const hiddenElements = document.querySelectorAll(".hidden");
hiddenElements.forEach((el) => observer.observe(el));

const hiddenElements2 = document.querySelectorAll(".hidden2");
hiddenElements2.forEach((el) => observer2.observe(el));

const hiddenElements3 = document.querySelectorAll(".hidden3");
hiddenElements3.forEach((el) => observer3.observe(el));

const hiddenElements4 = document.querySelectorAll(".hidden4");
hiddenElements4.forEach((el) => observer4.observe(el));

const hiddenElements5 = document.querySelectorAll(".hidden5");
hiddenElements5.forEach((el) => observer5.observe(el));

/* CURSOR CONTROLLER */

const coords = { x: 0, y: 0 };

let circleDevider = (circles.length - 4);

function setCircleDevider(object){
    object.style.zIndex = "999999999";
    circleDevider = (circles.length - 11);
    circles.forEach(circle => {
        circle.classList.add("circleTrans");
    });
}

function leaveCircleDevider(object){
    object.style.zIndex = "0";
    circleDevider = (circles.length - 4);
    circles.forEach(circle => {
        circle.classList.remove("circleTrans");
    });
}

const colors = [
  "#8080D7",
  "#8080D7",
  "#8080D7",
  "#8080D7",
  "#8080D7",
  "#8080D7",
  "#8080D7",
  "#8080D7",
  "#8080D7",
  "#8080D7",
  "#8080D7",
  "#8080D7",
  "#8080D7",
  "#8080D7",
  "#8080D7"
];

circles.forEach(function (circle, index) {
  circle.x = 0;
  circle.y = 0;
  circle.style.backgroundColor = colors[index % colors.length];
});

window.addEventListener("mousemove", function(e){
  coords.x = e.clientX + this.window.scrollX;
  coords.y = e.clientY + this.window.scrollY;
});

function animateCircles() {
  
  let x = coords.x;
  let y = coords.y;
  
  circles.forEach(function (circle, index) {
    circle.style.left = x - 12 + "px";
    circle.style.top = y - 12 + "px";
    
    circle.style.scale = (circles.length - index) / circleDevider;
    
    circle.x = x;
    circle.y = y;

    const nextCircle = circles[index + 1] || circles[0];
    x += (nextCircle.x - x) * 0.5;
    y += (nextCircle.y - y) * 0.5;
  });
 
  requestAnimationFrame(animateCircles);
}

animateCircles();

/* SLIDER */

function startCarousel(){

  $('.main-carousel').flickity({
    // options
    cellAlign: 'center',
    wrapAround: true,
    freeScroll: false,
    autoPlay: 4000,
    lazyLoad: 1
  });

  document.querySelector('.main-carousel').addEventListener("mouseleave", () => {
    circles.forEach(circle => {
      circle.classList.remove("circleTrans2");
    });
  });

  var carousel = document.querySelector('.carousel');
var flkty = new Flickity( carousel, {
  imagesLoaded: true,
  percentPosition: false,
});

var $carousel = $('.carousel').flickity();

var $progressBar = $('.progress-bar');

$carousel.on( 'dragMove.flickity', function( event, progress ) {
  circles.forEach(circle => {
    circle.classList.add("circleTrans2");
  });
});

$carousel.off( 'dragMove.flickity', function( event, progress ) {
  circles.forEach(circle => {
    circle.classList.remove("circleTrans2");
  });
});
}


/* NAVBAR CONTROLLER"*/

let navBarOpen = false;
let navBar = document.querySelector("nav");

function openNavBarBig(object){
  if(navBarOpen){
    object.classList.remove("bi-x-circle");
    object.classList.remove("menuIconAnim");
    object.classList.add("bi-list");

    navBar.classList.remove("navBarOpen");

    navBarOpen = false;
  }else{
    object.classList.remove("bi-list");
    object.classList.add("bi-x-circle");
    object.classList.add("menuIconAnim");

    navBar.classList.add("navBarOpen");

    navBarOpen = true;
  }
}

function closeMobileNav(){
  document.getElementById("navButton").classList.remove("bi-x-circle");
  document.getElementById("navButton").classList.remove("menuIconAnim");
  document.getElementById("navButton").classList.add("bi-list");

  navBar.classList.remove("navBarOpen");

  navBarOpen = false;
}