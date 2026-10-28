"""Verify independent dish assets and create review contact sheets."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps
import hashlib
import json
import sys
import time

root=Path(__file__).resolve().parents[1]
partial='--partial' in sys.argv
for attempt in range(10):
    try:
        manifest=json.loads((root/'review/asset-manifest.json').read_text(encoding='utf-8'))
        break
    except json.JSONDecodeError:
        time.sleep(.1)
records=[]; pending=[]; errors=[]; seen={}; perceptual=[]
for index,entry in enumerate(manifest):
    path=root/'dist'/entry['path']
    if entry['status']=='pending' or not path.exists():
        pending.append(entry['id']);continue
    image=Image.open(path).convert('RGBA')
    digest=hashlib.sha256(path.read_bytes()).hexdigest()
    if digest in seen: errors.append(f"Identical image files: {seen[digest]} and {entry['id']}")
    seen[digest]=entry['id']
    alpha=image.getchannel('A')
    if alpha.getextrema()!=(0,255):errors.append('No real alpha: '+entry['id'])
    if path.stat().st_size>200_000:errors.append('Size budget exceeded: '+entry['id'])
    thumbnail=entry.get('thumbnail',{})
    thumb_path=root/'dist'/thumbnail.get('path','missing-thumbnail')
    if not thumb_path.is_file():errors.append('Missing thumbnail: '+entry['id'])
    elif thumb_path.stat().st_size>35_000:errors.append('Thumbnail size budget exceeded: '+entry['id'])
    elif thumbnail.get('sha256')!=hashlib.sha256(thumb_path.read_bytes()).hexdigest() or thumbnail.get('derivedFrom')!=digest:errors.append('Invalid thumbnail provenance: '+entry['id'])
    occupancy=sum(value>10 for value in alpha.get_flattened_data())/(image.width*image.height)
    if not .1<occupancy<.9:errors.append('Unexpected opaque area: '+entry['id'])
    bbox=alpha.point(lambda a:255 if a>20 else 0).getbbox()
    if bbox and (bbox[0]==0 or bbox[1]==0 or bbox[2]==image.width or bbox[3]==image.height):errors.append('Subject touches image edge: '+entry['id'])
    background=Image.new('RGBA',image.size,'#F6F8EE');background.alpha_composite(image)
    tiny=background.convert('L').resize((9,8))
    values=list(tiny.get_flattened_data());bits=0
    for y in range(8):
        for x in range(8):bits=(bits<<1)|(values[y*9+x]>values[y*9+x+1])
    perceptual.append((entry['id'],bits))
    records.append({'id':entry['id'],'name':entry['dishName'],'bytes':path.stat().st_size,'sha256':digest,'alpha':True,'opaqueFraction':round(occupancy,3)})
near=[]
for i,(identity,bits) in enumerate(perceptual):
    for other,other_bits in perceptual[:i]:
        distance=(bits^other_bits).bit_count()
        if distance<=5:near.append({'a':identity,'b':other,'distance':distance})
output=root/'review/contact-sheets';output.mkdir(exist_ok=True)
font_path=Path('C:/Windows/Fonts/msyh.ttc')
font=ImageFont.truetype(str(font_path),18)
small=ImageFont.truetype(str(font_path),12)
available=[(i,e) for i,e in enumerate(manifest) if e['status']!='pending' and (root/'dist'/e['path']).exists()]
for start in range(0,len(available),20):
    group=available[start:start+20]
    sheet=Image.new('RGB',(1200,5*260),'#F6F8EE');draw=ImageDraw.Draw(sheet)
    for position,(index,e) in enumerate(group):
        x=(position%4)*300;y=(position//4)*260
        image=Image.open(root/'dist'/e['path']).convert('RGBA');image.thumbnail((270,195),Image.Resampling.LANCZOS)
        sheet.paste(image,(x+(300-image.width)//2,y+5+(195-image.height)//2),image)
        draw.text((x+10,y+203),f"{index+1:03d} {e['dishName']}",font=font,fill='#28382F')
        draw.text((x+10,y+232),e['meal']+' / '+e['restaurant']+' / '+e['id'][-6:],font=small,fill='#637268')
    sheet.save(output/f'page-{start//20+1:02d}.jpg',quality=92)
report={'total':len(manifest),'ready':len(records),'pending':pending,'uniqueHashes':len(seen),'bytes':sum(r['bytes'] for r in records),'errors':errors,'nearDuplicatesForVisualReview':near,'assets':records}
(root/'review/assets-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='assets'},ensure_ascii=False))
if errors or (pending and not partial):sys.exit(1)
