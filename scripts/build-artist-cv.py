"""Regenerate the public, one-page CV from artist-approved website facts only."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import simpleSplit
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

font_root = Path('/usr/share/fonts/truetype/dejavu')
fonts = {'Helvetica':'CVSans','Helvetica-Bold':'CVSansBold','Times-Roman':'CVSerif','Times-Italic':'CVSerifItalic'}
for alias, filename in [('CVSans','DejaVuSans.ttf'),('CVSansBold','DejaVuSans-Bold.ttf'),('CVSerif','DejaVuSerif.ttf'),('CVSerifItalic','DejaVuSerif-Italic.ttf')]:
    pdfmetrics.registerFont(TTFont(alias,str(font_root/filename)))

target = Path(__file__).resolve().parent.parent / 'assets/uriel-alexander-artist-cv.pdf'
c = canvas.Canvas(str(target), pagesize=(612,792), invariant=1)
c.setTitle('Uriel Alexander | Artist CV')
c.setAuthor('Uriel Alexander Art Studio')
c.setSubject('Artist CV, November 2026')
ink, wine, muted = map(HexColor, ['#27211f','#7c424d','#655b52'])
left, right, y = 48, 564, 740

def text(value, size=10, font='Helvetica', color=ink, leading=15, width=516):
    global y
    font = fonts[font]
    c.setFont(font,size); c.setFillColor(color)
    for line in simpleSplit(value,font,size,width):
        c.drawString(left,y,line); y -= leading

def section(value):
    global y
    y -= 17
    c.setStrokeColor(HexColor('#d4c8bb')); c.setLineWidth(.6)
    c.line(left,y+9,right,y+9)
    text(value.upper(),8.2,'Helvetica-Bold',wine,19)

text('Uriel Alexander',32,'Times-Roman',ink,34)
text('ARTIST CV / NOVEMBER 2026',8.5,'Helvetica-Bold',wine,21)
text('Bronx, New York',10,'Helvetica',muted,17)
text('urielalexanderstudio@gmail.com  |  urielalexanderstudio.com',9,'Helvetica',muted,16)
text('Instagram: @urielalexanderstudio',9,'Helvetica',muted,16)

section('Practice')
text('Visual artist based in the Bronx, New York. Work encompasses portraiture, figurative painting, urban subjects and abstraction.',10,leading=15)

section('Selected professional activity')
text('2026-Present  |  Gallery Volunteer',10.5,'Helvetica-Bold',leading=17)
text('Bronx River Art Center (BRAC), Bronx, New York',10,leading=15)
text('Volunteer orientation completed October 2026.',9,'Helvetica',muted,20)
text('2026  |  Artist registration',10.5,'Helvetica-Bold',leading=17)
text('Bronx Council on the Arts, Bronx, New York',10,leading=15)

section('Current artistic project')
text('2026-Present  |  Becoming: A Person, Place, and Time',11,'Times-Italic',leading=18)
text('A seven-painting series in development exploring identity, transformation and the ways different Bronx neighborhoods shape a sense of place.',10,leading=15)

section('Selected paintings')
for title,detail in [
    ('Skyline State of Mind, 2026','Acrylic and oil on cotton canvas | 24 × 36 in'),
    ('Next Door to Everything, 2026','Acrylic and oil on canvas | 36 × 24 in'),
    ('Guiding Hands, 2025','Acrylic on canvas | 36 × 48 in'),
    ('Self Portrait, 2025','Acrylic and oil on cotton canvas | 30 × 40 in')
]:
    text(title,10.5,'Times-Italic',leading=16)
    text(detail,9,'Helvetica',muted,21)

assert y > 65, 'CV content exceeds the one-page layout'
c.setStrokeColor(HexColor('#d4c8bb')); c.line(left,51,right,51)
c.setFillColor(muted); c.setFont(fonts['Helvetica'],8)
c.drawString(left,35,'URIEL ALEXANDER ART STUDIO')
c.drawRightString(right,35,'Artist CV | 1')
c.showPage(); c.save()
print(target)
