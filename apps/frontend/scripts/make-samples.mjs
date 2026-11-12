// Шаблоны для ручного заполнения: устав, протокол № 1 и гарантийное письмо
// с подсказками вместо полей, плюс пустой бланк заявления Р11001.
//
// Берёт те же .docx, что заполняет форма на сайте, и вместо каждого поля ставит
// подсказку в квадратных скобках с жёлтой заливкой: «[город]», «[ФИО учредителя 1]».
// Форма организации («Потребительский Кооператив», «ПК») подставляется обычным
// текстом: её пользователь не меняет. Результат — архив в public/samples,
// кнопка «Скачать шаблоны» на главной странице отдаёт его как есть.
//
// Запускается в начале build и dev (см. package.json), поэтому шаблоны всегда
// собраны из актуальных .docx и отдельно не правятся.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import { GARANT_HINTS, highlightDocx, hint } from '../src/lib/hints.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const TEMPLATES = path.join(root, 'public/templates/new-cooperative')
const OUT_DIR = path.join(root, 'public/samples')
const OUT_ZIP = path.join(OUT_DIR, 'shablony-novyy-kooperativ.zip')

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
  ...GARANT_HINTS,
}
for (let n = 1; n <= 6; n++) {
  for (const [field, label] of Object.entries(MEMBER_HINTS)) {
    data[`member_${n}.${field}`] = hint(label(n))
  }
}

function renderSample(file) {
  const doc = new Docxtemplater(new PizZip(fs.readFileSync(path.join(TEMPLATES, file))), {
    paragraphLoop: true,
    linebreaks: true,
  })
  doc.render(data)
  const zip = doc.getZip()
  // Прежняя заливка шаблона (белая заливка протокола) снимается: в шаблоне
  // для ручного заполнения жёлтым выделены только поля.
  for (const name of Object.keys(zip.files)) {
    if (/^word\/(document|header\d*|footer\d*)\.xml$/.test(name)) {
      zip.file(name, zip.file(name).asText().replace(/<w:highlight [^>]*\/>/g, ''))
    }
  }
  highlightDocx(zip)
  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' })
}

const archive = new PizZip()
archive.file('Устав (шаблон).docx', renderSample('ustav.docx'))
archive.file('Протокол № 1 учредительного собрания (шаблон).docx', renderSample('protocol_1.docx'))
archive.file('Гарантийное письмо собственника помещения (шаблон).docx', renderSample('garant_letter.docx'))
// Пустой бланк Р11001 — тот же файл, что в архиве заполненных документов
archive.file('Форма Р11001 (бланк).pdf', fs.readFileSync(path.join(root, 'public/forms/R11001.pdf')))
fs.mkdirSync(OUT_DIR, { recursive: true })
fs.writeFileSync(OUT_ZIP, archive.generate({ type: 'nodebuffer', compression: 'DEFLATE' }))
console.log(`Шаблоны собраны: ${path.relative(root, OUT_ZIP)}`)
