// Шаблоны для ручного заполнения: устав и протокол № 1 с подсказками вместо полей.
//
// Берёт те же .docx, что заполняет форма на сайте, и вместо каждого поля ставит
// подсказку в квадратных скобках с жёлтой заливкой: «[город]», «[ФИО учредителя 1]».
// Форма организации («Потребительский Кооператив», «ПК») подставляется обычным
// текстом: её пользователь не меняет. Результат — архив в public/samples,
// кнопка «Скачать шаблоны» на главной странице отдаёт его как есть.
//
// Запускается перед сборкой и перед dev-сервером (prebuild / predev), поэтому
// шаблоны всегда собраны из актуальных .docx и отдельно не правятся.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const TEMPLATES = path.join(root, 'public/templates/new-cooperative')
const OUT_DIR = path.join(root, 'public/samples')
const OUT_ZIP = path.join(OUT_DIR, 'shablony-novyy-kooperativ.zip')

// Метки начала и конца подсказки: таких знаков в шаблонах нет, по ним
// постобработка находит подставленный текст и выделяет его.
const OPEN = '⟦'
const CLOSE = '⟧'
const hint = (label) => `${OPEN}[${label}]${CLOSE}`

const MEMBER_HINTS = {
  full_name: (n) => `ФИО учредителя ${n}`,
  birthday: () => 'дата рождения',
  passport_series: () => 'серия',
  passport_number: () => 'номер',
  passport_issue_date: () => 'дата выдачи',
  passport_issued_by: () => 'кем выдан',
  passport_code: () => 'код подразделения',
  passport_address: () => 'адрес регистрации',
  inn: () => 'ИНН',
}

const data = {
  // Форма организации — обычный текст
  full_abbr: 'Потребительский Кооператив',
  full_abbr_genitive: 'Потребительского Кооператива',
  big_full_abbr: 'ПОТРЕБИТЕЛЬСКИЙ КООПЕРАТИВ',
  short_abbr: 'ПК',
  full_abbr_eng: 'Consumer Benefit Society',
  short_abbr_eng: 'CBS',
  // Поля для заполнения — подсказки
  name: hint('название'),
  eng_name: hint('название латиницей'),
  city: hint('город'),
  fp_day: hint('ДД'),
  fp_month: hint('месяц'),
  fp_year: hint('ГГГГ'),
  protocol_1_date: hint('ДД.ММ.ГГГГ'),
  protocol_1_open_time: hint('ЧЧ:ММ'),
  protocol_1_close_time: hint('ЧЧ:ММ'),
  index_and_full_address: hint('индекс и адрес кооператива'),
  initial_individuals_and_entprs: hint('сумма'),
  initial_individuals_and_entprs_text: hint('сумма прописью'),
  initial_organizations: hint('сумма'),
  initial_organizations_text: hint('сумма прописью'),
  minimum_individuals_and_entprs: hint('сумма'),
  minimum_individuals_and_entprs_text: hint('сумма прописью'),
  minimum_organizations: hint('сумма'),
  minimum_organizations_text: hint('сумма прописью'),
}
for (let n = 1; n <= 6; n++) {
  for (const [field, label] of Object.entries(MEMBER_HINTS)) {
    data[`member_${n}.${field}`] = hint(label(n))
  }
}

// Элементы свойств run, которые по схеме OOXML идут ПОСЛЕ w:highlight.
// Заливку вставляем перед первым из них, иначе Word считает файл повреждённым.
const AFTER_HIGHLIGHT = ['u', 'effect', 'bdr', 'shd', 'fitText', 'vertAlign', 'rtl', 'cs', 'em', 'lang', 'eastAsianLayout', 'specVanish', 'oMath']

function withHighlight(rPr) {
  if (!rPr) return '<w:rPr><w:highlight w:val="yellow"/></w:rPr>'
  const body = rPr.replace(/<w:highlight [^>]*\/>/g, '')
  for (const tag of AFTER_HIGHLIGHT) {
    const i = body.search(new RegExp(`<w:${tag}[ />]`))
    if (i !== -1) return body.slice(0, i) + '<w:highlight w:val="yellow"/>' + body.slice(i)
  }
  return body.replace('</w:rPr>', '<w:highlight w:val="yellow"/></w:rPr>')
}

const textRun = (rPr, text) =>
  `<w:r>${rPr}<w:t xml:space="preserve">${text}</w:t></w:r>`

// Делит run с меткой на несколько: обычный текст с прежними свойствами,
// подсказку — с жёлтой заливкой.
function splitRun(run) {
  const rPrMatch = run.match(/^<w:r(?: [^>]*)?>(<w:rPr>[\s\S]*?<\/w:rPr>)?/)
  const rPr = rPrMatch[1] || ''
  const inner = run.slice(rPrMatch[0].length, -'</w:r>'.length)
  const hl = withHighlight(rPr)
  let out = ''
  const parts = inner.match(/<w:t(?: [^>]*)?>[\s\S]*?<\/w:t>|<w:[a-zA-Z]+[^>]*\/>|<w:([a-zA-Z]+)[^>]*>[\s\S]*?<\/w:\1>/g) || []
  for (const part of parts) {
    const t = part.match(/^<w:t(?: [^>]*)?>([\s\S]*?)<\/w:t>$/)
    if (!t || !t[1].includes(OPEN)) {
      out += `<w:r>${rPr}${part}</w:r>`
      continue
    }
    for (const seg of t[1].split(new RegExp(`(${OPEN}[^${CLOSE}]*${CLOSE})`))) {
      if (!seg) continue
      out += seg.startsWith(OPEN) ? textRun(hl, seg.slice(1, -1)) : textRun(rPr, seg)
    }
  }
  return out
}

// Прежняя заливка шаблона (редакторские пометки, белая заливка протокола)
// снимается: в шаблоне для ручного заполнения жёлтым выделены только поля.
function highlightHints(xml) {
  xml = xml.replace(/<w:highlight [^>]*\/>/g, '')
  return xml.replace(/<w:r(?: [^>]*)?>[\s\S]*?<\/w:r>/g, (run) => (run.includes(OPEN) ? splitRun(run) : run))
}

function renderSample(file) {
  const doc = new Docxtemplater(new PizZip(fs.readFileSync(path.join(TEMPLATES, file))), {
    paragraphLoop: true,
    linebreaks: true,
  })
  doc.render(data)
  const zip = doc.getZip()
  for (const name of Object.keys(zip.files)) {
    if (!/^word\/(document|header\d*|footer\d*)\.xml$/.test(name)) continue
    const xml = highlightHints(zip.file(name).asText())
    if (xml.includes(OPEN) || xml.includes(CLOSE)) throw new Error(`${file}: в ${name} осталась невыделенная подсказка`)
    zip.file(name, xml)
  }
  return zip.generate({ type: 'nodebuffer' })
}

const archive = new PizZip()
archive.file('Устав (шаблон).docx', renderSample('ustav.docx'))
archive.file('Протокол № 1 учредительного собрания (шаблон).docx', renderSample('protocol_1.docx'))
fs.mkdirSync(OUT_DIR, { recursive: true })
fs.writeFileSync(OUT_ZIP, archive.generate({ type: 'nodebuffer', compression: 'DEFLATE' }))
console.log(`Шаблоны собраны: ${path.relative(root, OUT_ZIP)}`)
