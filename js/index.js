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

/* Program Code Easter Egg */

let codeArray = {
  "C#": `<span class="purpleCode">namespace</span> <span class="blueCode">EasterEgg</span><br>{<br>&emsp;&emsp;<span class="purpleCode">class</span> <span class="blueCode">NothingImportant</span> {<br>&emsp;&emsp;&emsp;&emsp;<span class="purpleCode">static void</span> <span class="blueCode">Main</span>(<span class="purpleCode">string</span>[] args)<br>&emsp;&emsp;&emsp;&emsp;{<br>&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;System.Console.WriteLine(<span class="lightGreenCode">"Hiyya partner!"</span>);<br>&emsp;&emsp;&emsp;&emsp;}<br>&emsp;&emsp;}<br>}`,
  "C++": `C++`,
  "Java": `Java`,
  "JavaScript": `<span class="yellowCode">console</span>.log(<span class="lightGreenCode">'Only one line, hmmm? Are there hidden ones?'</span>)<br><span class="transparentCode">// You found the hidden text congrats! The code is #FF005F</span>`,
  "C": `<span class="greenCode">#include</span>&nbsp;<span class="blueCode">&lt;stdio.h&gt;</span><br><br>int main<span class="redCode">()</span><br><span class="yellowCode">{</span><br>&emsp;&emsp;&emsp;printf<span class="redCode">(</span><span class="yellowCode">"Curiosity killed the cat?! Well the SECRET is NOT here!"</span><span class="redCode">);</span><br><br><span class="redCode">&emsp;&emsp;&emsp;return</span> 0<span class="redCode">;</span><br><span class="yellowCode">}</span>`,
  "HTML": `<span class="grayCode">&lt;!</span>DOCTYPE <span class="lightBlueCode">html</span><span class="grayCode">&gt;</span><br><span class="grayCode">&lt;</span>html <span class="lightBlueCode">lang</span><span class="grayCode">=</span><span class="orangeCode">"en"</span><span class="grayCode">&gt;</span><br><span class="grayCode">&lt;</span>head<span class="grayCode">&gt;</span><br>&emsp;&emsp;<span class="grayCode">&lt;</span>meta <span class="lightBlueCode">charset</span><span class="grayCode">=</span><span class="orangeCode">"UTF-8"</span><span class="grayCode">&gt;</span><br>&emsp;&emsp;<span class="grayCode">&lt;</span>meta <span class="lightBlueCode">http-equiv</span><span class="grayCode">=</span><span class="orangeCode">"X-UA-Compatible"</span> <span class="lightBlueCode">content</span><span class="grayCode">=</span><span class="orangeCode">"IE=edge"</span><span class="grayCode">&gt;</span><br>&emsp;&emsp;<span class="grayCode">&lt;</span>meta <span class="lightBlueCode">name</span><span class="grayCode">=</span><span class="orangeCode">"viewport"</span> <span class="lightBlueCode">content</span><span class="grayCode">=</span><span class="orangeCode">"width=device-width, initial-scale=1.0"</span><span class="grayCode">&gt;</span><br>&emsp;&emsp;<span class="grayCode">&lt;</span>title<span class="grayCode">&gt;</span> <span class="grayCode">?</span> <span class="grayCode">&lt;/</span>title<span class="grayCode">&gt;</span><br><span class="grayCode">&lt;/</span>head<span class="grayCode">&gt;</span><br><span class="grayCode">&lt;</span>body<span class="grayCode">&gt;</span><br>&emsp;&emsp;<span class="grayCode">&lt;</span>h1<span class="grayCode">&gt;</span> <span class="grayCode">You might as well see every code snippet, right? </span><span class="grayCode">&lt;/</span>h1<span class="grayCode">&gt;</span><br><span class="grayCode">&lt;/</span>body<span class="grayCode">&gt;</span><br><span class="grayCode">&lt;/</span>html<span class="grayCode">&gt;</span><br>`,
  "REACT": `REACT`
}

function openProgramCode(language){
  let languageWindow = document.getElementById('languageWindow');
  let titleBarName = document.getElementById('titleBarName');
  let innerCode = document.getElementById('innerCode');
  titleBarName.innerHTML = "Easter egg: " + language;
  languageWindow.classList.toggle('languageWindowOpen');

  if(language === "HTML"){
    innerCode.style.color = "rgb(0, 132, 255)";
  }else{
    innerCode.style.color = "white";
  }

  innerCode.innerHTML = codeArray[language];
}

function maximizeProgramCode(){
  let languageWindow = document.getElementById('languageWindow');
  languageWindow.classList.toggle('languageWindowMaximized');
}

// ----- CHECK THE CODE ON THE ABOUT ME PAGE

let confReady = true;

function checkCode(e, input){
  if(e.key == "Enter" && confReady){
    if(input.value === "#FF005F"){
      // IF YOU FOUND THE CODE IN HERE YOU ARE ONE CHEEKY HUMAN 😁
      Confetti();
      confReady = false;
      input.classList.add("rightCode");
      input.value = "😉 CONGRATULATIONS 😁";
      input.readOnly = true;
      setTimeout(() => {
        confReady = true;
        input.classList.remove("rightCode");
        input.value = "#FF005F";
        input.readOnly = false;
      }, 6000);
    }else{
      input.classList.add("wrongCode");
      setTimeout(() => {
        input.classList.remove("wrongCode");
      }, 500);
    }
  }
}

function Confetti(){
  var duration = 7 * 1000;
  var animationEnd = Date.now() + duration;
  var defaults = { startVelocity: 20, spread: 360, ticks: 60, zIndex: 100 };

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  var interval = setInterval(function() {
    var timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    var particleCount = 50 * (timeLeft / duration);
    // since particles fall down, start a bit higher than random
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
  }, 250);
}