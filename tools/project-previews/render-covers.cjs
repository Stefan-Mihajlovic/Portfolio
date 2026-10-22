// Render source composition, then encode lightweight WebP covers used by the portfolio.
const {chromium}=require('playwright');
const sharp=require('sharp');
const path=require('node:path');
(async()=>{
 const root=path.resolve(__dirname,'../..');
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1672,height:941},deviceScaleFactor:1});
 for(const name of ['tab-volume-manager','palette-pilot','font-pirate']){
  await page.goto(`http://127.0.0.1:4173/tools/project-previews/extension-covers.html?project=${name}`,{waitUntil:'networkidle'});
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(img=>img.decode()))});
  const screenshot=await page.screenshot();
  await sharp(screenshot).webp({quality:92}).toFile(path.join(root,`assets/covers/${name}-ui.webp`));
  console.log('Rendered',name);
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
