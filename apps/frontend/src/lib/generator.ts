// Генерация документов целиком в браузере пользователя.
// Данные формы (ФИО, паспорта, ИНН учредителей) не покидают устройство:
// шаблоны .docx скачиваются как статические файлы, docxtemplater заполняет
// их на странице, архив сохраняется сразу на диск. Сервера нет, поэтому
// кооператив не получает и не обрабатывает персональные данные.
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import type { ConnectionPackageData, NewCooperativeData } from '../../../../packages/shared/src'

// Префикс пути сайта: на GitHub Pages сайт живёт в подкаталоге репозитория.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ''

// Наборы шаблонов лежат в public/templates/<набор>/. Список задан явно:
// у статического сайта нет каталога, который можно прочитать.
const TEMPLATE_SETS = {
  'new-cooperative': ['ustav.docx', 'protocol_1.docx'],
  'connection-package': [
    '100_entrepreneur_application_form.docx',
    '100_individual_application_form.docx',
    '100_organization_application_form.docx',
    '1_regulation_on_the_cpp_wallet.docx',
    '2_regulation_simple_electronic_signature.docx',
    '3_privacy_policy.docx',
    '4_user_agreement.docx',
  ],
} as const

type TemplateSet = keyof typeof TEMPLATE_SETS

// Месяц в родительном падеже: «15 января», а не «15 январь».
const MONTHS_GENITIVE = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

// Поле <input type="date"> отдаёт дату строкой YYYY-MM-DD.
// Разбираем её вручную: new Date('2024-01-15') — полночь UTC, и в часовом
// поясе западнее Гринвича getDate() вернул бы 14-е число.
function parseIsoDate(value: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value || '')
  if (!m) throw new Error(`Неверная дата: «${value}». Укажите дату в календаре.`)
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) }
}

const pad2 = (n: number) => n.toString().padStart(2, '0')

function processConnectionPackageData(data: ConnectionPackageData) {
  const d = parseIsoDate(data.protocol_date)
  const dayAndMonth = `${d.day} ${MONTHS_GENITIVE[d.month - 1]}`
  return {
    ...data,
    // Номер и дата протоколов совета для каждого документа пакета
    wallet_protocol_number: data.protocol_date,
    wallet_protocol_day_and_month: dayAndMonth,
    wallet_protocol_year: d.year,
    pep_protocol: data.protocol_date,
    pep_date_and_month: dayAndMonth,
    pep_year: d.year,
    confidential_protocol_number: data.protocol_date,
    confidential_protocol_day_and_month: dayAndMonth,
    confidential_protocol_year: d.year,
    agreement_protocol: data.protocol_date,
    agreement_day_and_month: dayAndMonth,
    agreement_year: d.year,
    coop_offer_protocol: data.protocol_date,
    coop_offer_day_and_month: dayAndMonth,
    coop_offer_year: d.year.toString(),
    big_full_abbr: data.full_abbr?.toUpperCase() || '',
    full_abbr_eng: data.full_abbr_eng || 'Consumer Benefit Society',
    short_abbr_eng: data.short_abbr_eng || 'CBS',
    eng_name: data.eng_name || data.name,
  }
}

const MEMBER_FIELDS = [
  'full_name', 'birthday', 'passport_series', 'passport_number',
  'passport_issue_date', 'passport_issued_by', 'passport_code',
  'passport_address', 'inn',
] as const

function processNewCooperativeData(data: NewCooperativeData) {
  const f = parseIsoDate(data.founding_date)
  const protocol1 = data.protocol_1_date ? parseIsoDate(data.protocol_1_date) : null

  const result: Record<string, any> = {
    ...data,
    fp_day: f.day.toString(),
    fp_month: MONTHS_GENITIVE[f.month - 1],
    fp_year: f.year.toString(),
    founding_date: `${pad2(f.day)}.${pad2(f.month)}.${f.year}`,
    big_full_abbr: data.full_abbr?.toUpperCase() || 'ПОТРЕБИТЕЛЬСКИЙ КООПЕРАТИВ',
    full_abbr_eng: data.full_abbr_eng || 'Consumer Benefit Society',
    short_abbr_eng: data.short_abbr_eng || 'CBS',
    eng_name: data.eng_name || data.name,
    website: data.website || '',
    contact_email: data.contact_email || '',
    confidential_email: data.confidential_email || '',
    confidential_link: data.confidential_link || '',
    protocol_1_date: protocol1 ? `${pad2(protocol1.day)}.${pad2(protocol1.month)}.${protocol1.year}` : '',
    index_and_full_address: data.index_and_full_address || '',
    protocol_1_open_time: data.protocol_1_open_time || '',
    protocol_1_close_time: data.protocol_1_close_time || '',
    initial_individuals_and_entprs_text: data.initial_individuals_and_entprs_text || 'Сто',
    initial_organizations_text: data.initial_organizations_text || 'Одна тысяча',
    minimum_individuals_and_entprs_text: data.minimum_individuals_and_entprs_text || 'Триста',
    minimum_organizations_text: data.minimum_organizations_text || 'Три тысячи',
  }

  // Учредители: шаблоны читают и вложенный объект member_N, и плоский ключ
  // «member_N.поле» — заполняем оба вида, как делал прежний сервер.
  for (let i = 1; i <= 6; i++) {
    const src: any = (data as any)[`member_${i}`] || {}
    const member: Record<string, string> = {}
    for (const field of MEMBER_FIELDS) {
      member[field] = src[field] || ''
      result[`member_${i}.${field}`] = member[field]
    }
    result[`member_${i}`] = member
  }
  return result
}

// Заполняет все шаблоны набора и возвращает zip-архив с готовыми .docx.
async function renderSet(set: TemplateSet, data: Record<string, any>) {
  const archive = new PizZip()
  const files: string[] = []
  for (const name of TEMPLATE_SETS[set]) {
    const res = await fetch(`${BASE_PATH}/templates/${set}/${name}`)
    if (!res.ok) throw new Error(`Шаблон ${name} не загрузился (HTTP ${res.status})`)
    const doc = new Docxtemplater(new PizZip(await res.arrayBuffer()), {
      paragraphLoop: true,
      linebreaks: true,
    })
    doc.render(data)
    const outName = name.replace(/\.docx$/, '_rendered.docx')
    archive.file(outName, doc.getZip().generate({ type: 'uint8array' }))
    files.push(outName)
  }
  return { blob: archive.generate({ type: 'blob', mimeType: 'application/zip' }) as Blob, files }
}

// Сохраняет архив на диск через временную ссылку.
function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export async function generateNewCooperative(data: NewCooperativeData) {
  const { blob, files } = await renderSet('new-cooperative', processNewCooperativeData(data))
  saveBlob(blob, 'documents.zip')
  return { blob, files }
}

export async function generateConnectionPackage(data: ConnectionPackageData) {
  const { blob, files } = await renderSet('connection-package', processConnectionPackageData(data))
  saveBlob(blob, 'documents.zip')
  return { blob, files }
}

export { saveBlob }

// Тестовая кнопка «заполнить пример» включается переменной сборки.
export const SHOW_TEST_BUTTON = process.env.NEXT_PUBLIC_SHOW_TEST_BUTTON === 'true'
