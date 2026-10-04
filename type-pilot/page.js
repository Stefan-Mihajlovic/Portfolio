const modes = {
  fonts: {image:'fonts.jpg', height:1024, description:'Open the extension. The page’s fonts are already there.', alt:'Type Pilot in Edge showing the current page’s fonts'},
  pairing: {image:'pairing.jpg', height:1154, description:'See your heading and body together. Click either to edit.', alt:'The real Type Pilot pairing preview and editor in Edge'},
  library: {image:'library.jpg', height:1002, description:'Your pairings, ready to reopen or export as CSS.', alt:'Saved typography pairings in the Type Pilot extension'}
};
const buttons=[...document.querySelectorAll('[data-shot]')];
function show(button) {
 const mode=modes[button.dataset.shot];
 buttons.forEach(b=>{b.setAttribute('aria-selected',String(b===button));b.tabIndex=b===button?0:-1;});
 const image=document.getElementById('product-shot');image.src='screenshots/'+mode.image;image.alt=mode.alt;image.height=mode.height;image.width=740;
 document.getElementById('mode-description').textContent=mode.description;
 document.getElementById('product-preview').setAttribute('aria-labelledby',button.id);
}
buttons.forEach((button,i)=>{button.onclick=()=>show(button);button.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;buttons[next].focus();show(buttons[next]);};});
