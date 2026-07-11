import json
import re
import math
from pathlib import Path

# Load districts
script_dir = Path(__file__).parent
root_dir = script_dir.parent
districts = json.loads((root_dir / 'public' / 'tampere-districts.json').read_text(encoding='utf8'))

# Parse PDF data (requires PyPDF2)
from PyPDF2 import PdfReader

reader = PdfReader(root_dir / 'tampere-vuosikirja.pdf')

def normalize_name(s):
    s = re.sub(r'\s*\d+\)\s*$', '', s)
    return s.strip().upper()

# Parse area table with structure
area_text = ''
for i in [9, 10, 11]:
    area_text += '\n' + reader.pages[i].extract_text()

suuralue_re = re.compile(r'^(\d)\s+([A-Za-zäöåÄÖÅ\-]+)\s+suuralue')
current_suuralue = None
current_suunnittelualue = None
mapping = {}

for raw_line in area_text.split('\n'):
    line = raw_line.replace('\xa0', '')
    tokens = line.split()
    if not tokens:
        continue
    m = suuralue_re.match(line)
    if m:
        current_suuralue = m.group(2)
        current_suunnittelualue = None
        continue
    if re.match(r'^\d{2}\s+', line) and not re.match(r'^\d{3}\s+', line):
        current_suunnittelualue = tokens[1]
        continue
    if re.match(r'^\d{3}\s+', line):
        nums = [t for t in tokens[1:] if re.match(r'^[\d\.]+$', t) and t != '..']
        if len(nums) >= 3:
            num_start_idx = 1
            while num_start_idx < len(tokens) and not (re.match(r'^[\d\.]+$', tokens[num_start_idx]) and tokens[num_start_idx] != '..'):
                num_start_idx += 1
            name_tokens = tokens[1:num_start_idx]
            name = normalize_name(' '.join(name_tokens))
            mapping[name] = {
                'suuralue': current_suuralue,
                'suunnittelualue': current_suunnittelualue,
                'areaHa': int(nums[-2]) / 10,  # PDF area is in 1000 m2, so /10 = hectares
            }

# Parse population table
pop_text = ''
for i in [36, 37, 38, 39]:
    pop_text += '\n' + reader.pages[i].extract_text()

def is_data_token(t):
    return re.match(r'^-?\d+$', t) or t == '-'

pop_rows = {}
for raw_line in pop_text.split('\n'):
    line = raw_line.replace('\xa0', '')
    tokens = line.split()
    if not tokens or not re.match(r'^\d{3}$', tokens[0]):
        continue
    nums = [int(t) for t in tokens[1:] if re.match(r'^-?\d+$', t)]
    if len(nums) < 1:
        continue
    pop2020 = nums[-1]
    num_start_idx = 1
    while num_start_idx < len(tokens) and not is_data_token(tokens[num_start_idx]):
        num_start_idx += 1
    name_tokens = tokens[1:num_start_idx]
    if name_tokens and re.match(r'^\d+\)$', name_tokens[-1]):
        name_tokens = name_tokens[:-1]
    name = normalize_name(' '.join(name_tokens))
    pop_rows[name] = pop2020

# Compute path-based area for fallback / missing
def get_path_area(path_string):
    nums = [float(x) for x in re.findall(r'-?\d+\.\d+', path_string)]
    area = 0
    ln = len(nums)
    for i in range(0, ln, 2):
        x1 = nums[i]
        y1 = nums[i + 1]
        x2 = nums[(i + 2) % ln]
        y2 = nums[(i + 3) % ln]
        area += x1 * y2 - x2 * y1
    return abs(area) / 2

# Total SVG area corresponds to ~51254 ha (from PDF total)
# Compute scaling factor
known_areas = [m['areaHa'] for m in mapping.values() if m['areaHa'] > 0]
known_path_areas = [get_path_area(d['path']) for d in districts if normalize_name(d['name']) in mapping and mapping[normalize_name(d['name'])]['areaHa'] > 0]
# Better: compute sum of known path areas and compare to sum of known hectares
sum_known_ha = sum(known_areas)
sum_known_path = sum(known_path_areas)
ha_per_path_unit = sum_known_ha / sum_known_path if sum_known_path > 0 else 0.001

def compute_area_ha(district):
    name = district['name'].upper()
    if name in mapping and mapping[name]['areaHa'] > 0:
        return round(mapping[name]['areaHa'], 1)
    path_area = get_path_area(district['path'])
    return round(path_area * ha_per_path_unit, 1)

# Manual assignments for newer subdivisions not in 2018-2020 yearbook
manual_assignments = {
    'KAUPINLAAKSO': {'suuralue': 'Keskinen', 'suunnittelualue': 'Sampo'},
    'HERVANTA KAAKKO': {'suuralue': 'Kaakkoinen', 'suunnittelualue': 'Herva'},
    'HERVANTA LOUNAS': {'suuralue': 'Kaakkoinen', 'suunnittelualue': 'Herva'},
    'HERVANTA KOILLINEN': {'suuralue': 'Kaakkoinen', 'suunnittelualue': 'Herva'},
    'HERVANTA LUODE': {'suuralue': 'Kaakkoinen', 'suunnittelualue': 'Herva'},
    'ANNALA': {'suuralue': 'Kaakkoinen', 'suunnittelualue': 'Kauka'},
    'HIEDANRANTA': {'suuralue': 'Luoteinen', 'suunnittelualue': 'Liela'},
    'SORILA': {'suuralue': 'Pohjoinen', 'suunnittelualue': 'Aito'},
    'AITONIEMI': {'suuralue': 'Pohjoinen', 'suunnittelualue': 'Aito'},
    'VIITAPOHJA': {'suuralue': 'Pohjoinen', 'suunnittelualue': 'Kämmen'},
    'TERÄLAHTI': {'suuralue': 'Pohjoinen', 'suunnittelualue': 'Terä'},
    'VELAATTA': {'suuralue': 'Pohjoinen', 'suunnittelualue': 'Terä'},
}

# Suuralue names in nominative case
suuralue_display = {
    'Keskinen': 'Keskinen suuralue',
    'Koillinen': 'Koillinen suuralue',
    'Kaakkoinen': 'Kaakkoinen suuralue',
    'Eteläinen': 'Eteläinen suuralue',
    'Lounainen': 'Lounainen suuralue',
    'Luoteinen': 'Luoteinen suuralue',
    'Pohjoinen': 'Pohjoinen suuralue',
}

# Suuralue names in adessive case ("millä suuralueella")
suuralue_adessive = {
    'Keskinen': 'Keskisellä',
    'Koillinen': 'Koillisella',
    'Kaakkoinen': 'Kaakkoisella',
    'Eteläinen': 'Eteläisellä',
    'Lounainen': 'Lounaisella',
    'Luoteinen': 'Luoteisella',
    'Pohjoinen': 'Pohjoisella',
}

# Generate descriptions based on suuralue and area type
def generate_description(district, info):
    name = district['name']
    suur = suuralue_adessive.get(info['suuralue'], info['suuralue'])
    pop = info.get('population2020')
    area = info['areaHa']
    parts = [f"{name} on Tampereen kaupunginosa {suur} suuralueella."]
    if pop is not None:
        parts.append(f"Vuonna 2020 alueella oli {pop} asukasta.")
    parts.append(f"Kaupunginosan pinta-ala on noin {area} hehtaaria.")
    return ' '.join(parts)

# Build final info
info_list = []
for district in districts:
    name = district['name']
    key = name.upper()
    suuralue = mapping.get(key, {}).get('suuralue') or manual_assignments.get(key, {}).get('suuralue', 'Tuntematon')
    suunnittelualue = mapping.get(key, {}).get('suunnittelualue') or manual_assignments.get(key, {}).get('suunnittelualue', '')
    area_ha = compute_area_ha(district)
    pop = pop_rows.get(key)
    info = {
        'id': district['id'],
        'name': name,
        'suuralue': suuralue,
        'suuralueDisplay': suuralue_display.get(suuralue, suuralue),
        'suunnittelualue': suunnittelualue,
        'areaHa': area_ha,
        'population2020': pop,
        'description': generate_description(district, {
            'suuralue': suuralue,
            'areaHa': area_ha,
            'population2020': pop,
        }),
    }
    info_list.append(info)

# Write output
out_path = root_dir / 'public' / 'district-info.json'
out_path.write_text(json.dumps(info_list, ensure_ascii=False, indent=2), encoding='utf8')
print(f'Wrote {len(info_list)} district info records to {out_path}')

# Summary
print('\nSuuralueet:')
from collections import Counter
for suur, count in sorted(Counter(i['suuralue'] for i in info_list).items()):
    print(f'  {suur}: {count}')
