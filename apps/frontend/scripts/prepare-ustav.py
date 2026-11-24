#!/usr/bin/env python3
# Шаблон устава для генератора из рабочей редакции владельца (Google Docs, .docx).
#
#   python3 scripts/prepare-ustav.py <редакция.docx> public/templates/new-cooperative/ustav.docx
#
# Текст владельца переносится дословно. Скрипт меняет только:
#   1) шапку: «Общим собранием пайщиков-учредителей / {full_abbr_genitive} «{name}» /
#      Протокол №1» — без второго наименования после «Протокол №1»;
#   2) ляпы оформления: точки и пробелы после номеров, две опечатки, согласование
#      «именуемое» с «Обществом», нумерацию п. 4.1 подряд; п. 4.2 — редакция от 12.11.2026
#      (ответ владельца в комментарии: «Бери редакцию 12.11»);
#   3) настраиваемые места п. 13.2 и 13.4:
#      «в абзаце/ах [а-и]» → поле {chair_abzac} в блоке {#chair_has}…{/chair_has};
#      «[(ж) …]» → «ж) …» в блоке {#council_suspend}…{/council_suspend};
#      буквы з)–с) → поля {l_z} … {l_s} (сдвиг при исключении ж);
#   4) оформление рабочего документа: комментарии, служебные блоки Google (w:sdt),
#      красный цвет текста и цветная заливка фона — в шаблон не попадают.
# Каждое исправление пропускается, если места уже нет: владелец мог исправить его
# в документе сам. В конце — проверки, что ничего лишнего не осталось.
import re
import sys
import zipfile

src, out = sys.argv[1], sys.argv[2]
zin = zipfile.ZipFile(src)
xml = zin.read('word/document.xml').decode('utf-8')

PARA = re.compile(r'<w:p[ >].*?</w:p>', re.S)
T = re.compile(r'(<w:t(?: [^>]*)?>)(.*?)(</w:t>)', re.S)


def text_of(p):
    return ''.join(m.group(2) for m in T.finditer(p))


def marker(p, tag):
    """Абзац с тем же оформлением, внутри только тег блока docxtemplater."""
    ppr = re.search(r'<w:pPr>.*?</w:pPr>', p, re.S)
    return f'<w:p>{ppr.group(0) if ppr else ""}<w:r><w:t>{tag}</w:t></w:r></w:p>'


def replace_text(p, old, new):
    """Заменяет фрагмент текста абзаца, даже если он разбит на несколько run."""
    runs = list(T.finditer(p))
    full = ''.join(m.group(2) for m in runs)
    i = full.find(old)
    assert i >= 0, (old, full[:120])
    j = i + len(old)
    pos, pieces, first_done = 0, [], False
    for m in runs:
        s, e = pos, pos + len(m.group(2))
        pos = e
        if e <= i or s >= j:
            continue
        a, b = max(i, s) - s, min(j, e) - s
        repl = new if not first_done else ''
        first_done = True
        pieces.append((m.start(2), m.end(2), m.group(2)[:a] + repl + m.group(2)[b:]))
    res, last = [], 0
    for st, en, txt in pieces:
        res += [p[last:st], txt]
        last = en
    res.append(p[last:])
    return ''.join(res)


def each_para(xml, fn):
    parts, last = [], 0
    for m in PARA.finditer(xml):
        parts += [xml[last:m.start()], fn(m.group(0))]
        last = m.end()
    parts.append(xml[last:])
    return ''.join(parts)


# ── 1. Шапка ────────────────────────────────────────────────────────────────
state = {'name_line': False, 'protocol': False}


def fix_header(p):
    t = text_of(p)
    if not state['name_line'] and t.strip() == '{full_abbr_genitive}':
        state['name_line'] = True
        return replace_text(p, '{full_abbr_genitive}', '{full_abbr_genitive} «{name}»')
    if not state['protocol'] and t.startswith('Протокол №1{full_abbr_genitive}'):
        state['protocol'] = True
        runs = list(re.finditer(r'<w:r(?: [^>]*)?>.*?</w:r>', p, re.S))
        first = next(r for r in runs if 'Протокол №1' in text_of(r.group(0)))
        p = p[:first.end()] + '</w:p>'
        assert text_of(p) == 'Протокол №1', text_of(p)
    return p


# Правка касается только старого вида шапки, где наименование стоит и после
# «Протокол №1». С 24.11.2026 владелец исправил шапку в документе сам —
# тогда текст переносится как есть (иначе правка задела бы титул «У С Т А В»).
if 'Протокол №1{full_abbr_genitive}' in ''.join(text_of(m.group(0)) for m in PARA.finditer(xml)):
    xml = each_para(xml, fix_header)
    assert state['name_line'] and state['protocol'], state

# ── 2. Ляпы оформления ──────────────────────────────────────────────────────
FIXES = [
    ('8.1.8 получать', '8.1.8. получать'),
    ('9.1.2.выполнять', '9.1.2. выполнять'),
    ('9.1.3.выполнять', '9.1.3. выполнять'),
    ('11.1.Органами', '11.1. Органами'),
    ('12.6 Принятие', '12.6. Принятие'),
    ('12.7.Общее', '12.7. Общее'),
    ('13.4.В исключительную', '13.4. В исключительную'),
    ('20.2.Филиалы', '20.2. Филиалы'),
    ('может проводится', 'может проводиться'),
    ('получение и использования пайщиками', 'получение и использование пайщиками'),
    ('образовательных процессов по 4.1.8. правовым', 'образовательных процессов по правовым'),
    ('именуемый в дальнейшем «Общество», создано', 'именуемое в дальнейшем «Общество», создано'),
    ('4.2. Общество вправе осуществлять любые другие виды деятельности, не запрещенные действующим законодательством РФ.',
     '4.2. Общество вправе осуществлять иные виды деятельности, не противоречащие целям его создания и специальной '
     'правоспособности потребительского общества, установленной ГК РФ и Законом № 3085-1.'),
]
fixed = []


def apply_fixes(p):
    for old, new in FIXES:
        if old in text_of(p):
            p = replace_text(p, old, new)
            fixed.append(old)
    return p


xml = each_para(xml, apply_fixes)

n41 = [0]


def renumber_41(p):
    mm = re.match(r'^4\.1\.(\d+)\.', text_of(p))
    if mm:
        n41[0] += 1
        if int(mm.group(1)) != n41[0]:
            p = replace_text(p, f'4.1.{mm.group(1)}.', f'4.1.{n41[0]}.')
    return p


xml = each_para(xml, renumber_41)

# ── 3. Настраиваемые места п. 13.2 и 13.4 ───────────────────────────────────
LETTERS_AFTER = {'з': 'l_z', 'и': 'l_i', 'к': 'l_k', 'л': 'l_l', 'м': 'l_m', 'н': 'l_n',
                 'о': 'l_o', 'п': 'l_p', 'р': 'l_r', 'с': 'l_s'}
done = {'chair': False, 'zh': False, 'letters': set()}
sect = ['before']


def config_points(p):
    t = text_of(p)
    if 'абзаце/ах [а-и]' in t:
        done['chair'] = True
        new = replace_text(p, 'абзаце/ах [а-и]', '{chair_abzac}')
        return marker(p, '{#chair_has}') + new + marker(p, '{/chair_has}')
    if t.startswith('13.4.'):
        sect[0] = 'in_134'
        return p
    if sect[0] == 'in_134' and t.startswith('[(ж)'):
        done['zh'] = True
        new = replace_text(p, '[(ж)', 'ж)')
        tail = text_of(new).rstrip()
        k = tail.rfind(']')
        assert k >= len(tail) - 3, tail[-40:]
        seg = tail[k - 40:]
        new = replace_text(new, seg, seg.replace(']', '', 1))
        return marker(p, '{#council_suspend}') + new + marker(p, '{/council_suspend}')
    if sect[0] == 'in_134':
        mm = re.match(r'^([з-с])\) ', t)
        if mm and mm.group(1) in LETTERS_AFTER and mm.group(1) not in done['letters']:
            letter = mm.group(1)
            done['letters'].add(letter)
            if letter == 'с':
                sect[0] = 'after'
            return replace_text(p, f'{letter})', '{' + LETTERS_AFTER[letter] + '})')
        if t.startswith('13.5'):
            sect[0] = 'after'
    return p


xml = each_para(xml, config_points)
assert done['chair'], 'не найдено «абзаце/ах [а-и]»'
assert done['zh'], 'не найден подпункт «[(ж)»'
assert done['letters'] == set(LETTERS_AFTER), sorted(set(LETTERS_AFTER) - done['letters'])

# ── 4. Оформление рабочего документа ────────────────────────────────────────
# Цветная заливка фона (пометки владельца в рабочем документе, напр. FFF2CC)
xml = re.sub(r'<w:shd\b[^>]*w:fill="(?!auto|FFFFFF|ffffff)[0-9A-Fa-f]{6}"[^>]*/>', '', xml)
# Красный цвет текста попал в редакцию случайно (слово владельца 16.11.2026)
xml = re.sub(r'<w:color w:val="(?i:ff0000)"', '<w:color w:val="000000"', xml)
# Выделение маркером
xml = re.sub(r'<w:highlight w:val="(?!white|none)\w+"/>', '', xml)
# Комментарии рабочего документа
xml = re.sub(r'<w:commentRange(?:Start|End)\b[^>]*/>', '', xml)
xml = re.sub(r'<w:r(?: [^>]*)?>(?:(?!</w:r>).)*?<w:commentReference\b[^>]*/>(?:(?!</w:r>).)*?</w:r>', '', xml, flags=re.S)
xml = re.sub(r'<w:commentReference\b[^>]*/>', '', xml)
# Служебные блоки Google без содержимого: docxtemplater вставил бы в них абзац
xml = re.sub(r'<w:sdt>(?:(?!</w:sdt>).)*?<w:sdtContent>\s*</w:sdtContent></w:sdt>', '', xml, flags=re.S)

COMMENT_PART = re.compile(r'^word/(comments[A-Za-z]*|people)\.xml$')
ct = zin.read('[Content_Types].xml').decode('utf-8')
ct = re.sub(r'<Override\b[^>]*PartName="/word/(?:comments[A-Za-z]*|people)\.xml"[^>]*/>', '', ct)
rels = zin.read('word/_rels/document.xml.rels').decode('utf-8')
rels = re.sub(r'<Relationship\b[^>]*Target="(?:comments[A-Za-z]*|people)\.xml"[^>]*/>', '', rels)

zout = zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED)
for item in zin.infolist():
    if COMMENT_PART.match(item.filename):
        continue
    data = {'word/document.xml': xml, '[Content_Types].xml': ct, 'word/_rels/document.xml.rels': rels}.get(item.filename)
    zout.writestr(item, data.encode('utf-8') if data is not None else zin.read(item.filename))
zout.close()

# ── Проверки ────────────────────────────────────────────────────────────────
chk = zipfile.ZipFile(out)
assert not [n for n in chk.namelist() if 'comment' in n.lower()], 'части комментариев остались'
body = chk.read('word/document.xml').decode('utf-8')
assert not re.search(r'<w:comment|commentRange|commentReference', body), 'отметки комментариев остались'
assert not re.search(r'(?i)ff0000', body), 'красный цвет остался'
assert not re.search(r'<w:shd\b[^>]*w:fill="(?!auto|FFFFFF|ffffff)[0-9A-Fa-f]{6}"', body), 'цветная заливка осталась'
assert not re.search(r'<w:sdtContent>\s*</w:sdtContent>', body), 'пустой служебный блок остался'
print('шапка:', state, '| ляпов исправлено:', len(fixed), '| подпунктов 4.1:', n41[0])
print('готово:', out)
