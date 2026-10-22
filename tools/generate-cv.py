"""Rebuild the two one-page CVs. Run with Python + reportlab installed."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parents[1]
FONT = Path('/System/Library/Fonts/Supplemental')
pdfmetrics.registerFont(TTFont('CV', str(FONT / 'Arial.ttf')))
pdfmetrics.registerFont(TTFont('CVBold', str(FONT / 'Arial Bold.ttf')))
pdfmetrics.registerFontFamily('CV', normal='CV', bold='CVBold')
PURPLE = '#965CFF'  # Crimson Music accent
DATA = {
 'English': {
  'role':'WEB DESIGNER & FRONT-END DEVELOPER', 'location':'Belgrade, Serbia',
  'sections':['PROFILE','EXPERIENCE','SELECTED WORK','EDUCATION','SKILLS','LANGUAGES'],
  'profile':'Web designer and developer building polished, responsive websites and digital products from concept to launch. I combine UI/UX design, front-end development, and product thinking across client platforms, web apps, browser extensions, and mobile experiences.',
  'job':'OptiFlowz - Co-Founder','date':'Mar 2025 - Present',
  'experience':['Co-founded a web design and development studio focused on modern, conversion-oriented digital experiences.','Design and build responsive interfaces using Next.js, React, and contemporary UI/UX workflows.'],
  'projects':[
   ('HealthPlus Edukacije','Web design & development','Designed and developed a healthcare education platform that unifies accredited courses, news, membership, and enrollment.','https://healthplusedu.com/'),
   ('EAES Video Corner','React, Tailwind CSS, Mux Video','Built a focused surgical video library for the European Association for Endoscopic Surgery.','https://stefanmihajlovic.com/eaes-video-corner/'),
   ('Crimson Music','React Native, Expo, TypeScript, Audius API','Designed and developed a music player for iOS, Android, and web, with discovery, playlists, library management, and offline listening on mobile.','https://stefanmihajlovic.com/crimson-music/'),
   ('OptiFlowz Website','Next.js, React, UI/UX design','Designed and developed the studio website, from visual direction and service architecture to responsive layouts, animation, and SEO-aware structure.','https://www.optiflowz.com/')],
  'education':[('University of Belgrade - Faculty of Organizational Sciences','BSc candidate, Information Systems and Technologies','2023 - Present'),('Electrotechnical School "Rade Končar"','Information Technology Technician','2019 - 2023')],
  'skills':['<b>Design:</b> Figma, Affinity Suite, UI/UX, responsive design, prototyping','<b>Front end:</b> JavaScript, TypeScript, React, Next.js, Tailwind CSS, HTML, CSS, Capacitor','<b>Back end & platforms:</b> Node.js, PostgreSQL, WordPress, PHP, Firebase, Git','<b>Additional:</b> C#, .NET, SQL, Unity'],
  'languages':'Serbian - Native | English - Fluent'
 },
 'Srpski': {
  'role':'VEB DIZAJNER I FRONT-END DEVELOPER','location':'Beograd, Srbija',
  'sections':['PROFIL','ISKUSTVO','IZDVOJENI PROJEKTI','OBRAZOVANJE','VEŠTINE','JEZICI'],
  'profile':'Veb dizajner i developer koji gradi kvalitetne, responzivne sajtove i digitalne proizvode od ideje do produkcije. Spajam UI/UX dizajn, front-end razvoj i produktno razmišljanje kroz klijentske platforme, veb aplikacije, browser ekstenzije i mobilna iskustva.',
  'job':'OptiFlowz - Suosnivač','date':'mart 2025 - danas',
  'experience':['Suosnivač studija za veb dizajn i razvoj usmerenog na moderna digitalna iskustva koja podržavaju konverziju.','Dizajniram i razvijam responzivne interfejse koristeći Next.js, React i savremene UI/UX procese.'],
  'projects':[
   ('HealthPlus Edukacije','Veb dizajn i razvoj','Dizajnirao i razvio platformu za zdravstvenu edukaciju koja objedinjuje akreditovane kurseve, vesti, članstvo i prijave.','https://healthplusedu.com/'),
   ('EAES Video Corner','React, Tailwind CSS, Mux Video','Izradio namensku biblioteku hirurških video-materijala za Evropsko udruženje endoskopskih hirurga.','https://stefanmihajlovic.com/eaes-video-corner/'),
   ('Crimson Music','React Native, Expo, TypeScript, Audius API','Dizajnirao i razvio muzičku aplikaciju za iOS, Android i veb, sa otkrivanjem muzike, plejlistama, bibliotekom i slušanjem bez interneta na telefonu.','https://stefanmihajlovic.com/crimson-music/'),
   ('OptiFlowz Website','Next.js, React, UI/UX dizajn','Dizajnirao i razvio sajt studija: vizuelni identitet, prezentaciju usluga, responzivne interfejse, animacije i strukturu prilagođenu pretraživačima.','https://www.optiflowz.com/')],
  'education':[('Univerzitet u Beogradu - Fakultet organizacionih nauka','Osnovne akademske studije, Informacioni sistemi i tehnologije','2023 - danas'),('Elektrotehnička škola "Rade Končar"','Elektrotehničar informacionih tehnologija','2019 - 2023')],
  'skills':['<b>Dizajn:</b> Figma, Affinity Suite, UI/UX, responzivni dizajn, prototipovi','<b>Front end:</b> JavaScript, TypeScript, React, Next.js, Tailwind CSS, HTML, CSS, Capacitor','<b>Back end i platforme:</b> Node.js, PostgreSQL, WordPress, PHP, Firebase, Git','<b>Dodatno:</b> C#, .NET, SQL, Unity'],
  'languages':'Srpski - maternji | Engleski - tečno'
 }
}

def build(language, d):
 path=ROOT/'resumes'/f'Stefan Mihajlovic CV - {language}.pdf'
 c=canvas.Canvas(str(path),pagesize=A4)
 c.setTitle('Stefan Mihajlovic - CV');c.setAuthor('Stefan Mihajlovic');c.setSubject('Web Designer and Front-End Developer CV')
 w,h=A4;left=50;right=w-50; width=right-left
 c.setFillColor(HexColor('#0B0910'));c.rect(0,h-112,w,112,fill=1,stroke=0)
 c.setFillColor(HexColor(PURPLE));c.rect(0,h-7,w,7,fill=1,stroke=0)
 c.setFillColor(HexColor('#FFFFFF'));c.setFont('CVBold',25);c.drawString(left,h-49,'STEFAN MIHAJLOVIC')
 c.setFillColor(HexColor('#B99AFF'));c.setFont('CVBold',9);c.drawString(left,h-70,d['role'])
 style=ParagraphStyle('body',fontName='CV',fontSize=9.5,leading=13,textColor=HexColor('#202026'))
 contactStyle=ParagraphStyle('contact',parent=style,fontSize=8,leading=11,textColor=HexColor('#DDD8E7'))
 contact=Paragraph(d['location']+' &nbsp; | &nbsp; <link href="mailto:stefan@optiflowz.com">stefan@optiflowz.com</link> &nbsp; | &nbsp; <link href="https://stefanmihajlovic.com">stefanmihajlovic.com</link> &nbsp; | &nbsp; <link href="https://www.linkedin.com/in/stefanmihajlovic-in/">LinkedIn</link> &nbsp; | &nbsp; <link href="https://github.com/Stefan-Mihajlovic">GitHub</link>',contactStyle)
 _,ch=contact.wrap(width,50);contact.drawOn(c,left,h-96)
 y=h-140
 def para(text,gap=6):
  nonlocal y
  p=Paragraph(text,style);_,height=p.wrap(width,1000);y-=height;p.drawOn(c,left,y);y-=gap
 def section(title):
  nonlocal y
  c.setFillColor(HexColor(PURPLE));c.rect(left,y-10,3,11,fill=1,stroke=0)
  c.setFont('CVBold',10);c.setFillColor(HexColor('#202026'));c.drawString(left+11,y-8,title);y-=23
 def dated(title,subtitle,date):
  nonlocal y
  c.setFont('CVBold',9.5);c.setFillColor(HexColor('#202026'));c.drawString(left,y-9,title)
  c.setFont('CV',8);c.setFillColor(HexColor('#6B6872'));c.drawRightString(right,y-9,date);y-=13
  para('<font color="#6B6872">'+subtitle+'</font>',7)
 section(d['sections'][0]);para(d['profile'],13)
 section(d['sections'][1]);dated(d['job'],d['location'],d['date'])
 for line in d['experience']:para('• &nbsp; '+line,4)
 y-=9;section(d['sections'][2])
 for title,stack,desc,url in d['projects']:
  para(f'<b><link href="{url}">{title}</link></b> <font color="#6B6872">| {stack.replace("&","&amp;")}</font>',3)
  para(desc,10)
 y-=5;section(d['sections'][3])
 for row in d['education']:dated(*row)
 y-=5;section(d['sections'][4])
 for line in d['skills']:para(line,3)
 y-=8;section(d['sections'][5]);para(d['languages'],0)
 assert y>30,(language,y)
 c.save();print(language,'bottom margin:',round(y,1),'pt')

if __name__=='__main__':
 for language,data in DATA.items():build(language,data)
