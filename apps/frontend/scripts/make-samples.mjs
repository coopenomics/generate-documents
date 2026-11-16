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
import { addComments, GARANT_HINTS, highlightDocx, hint } from '../src/lib/hints.mjs'
import { chairPowersData } from '../src/lib/chair-powers.mjs'

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
  // Полномочия председателя — готовый вариант прошлой редакции: только б),
  // подпункт ж) остаётся; выбора в шаблоне для скачивания нет
  ...chairPowersData(['б']),
}
for (let n = 1; n <= 6; n++) {
  for (const [field, label] of Object.entries(MEMBER_HINTS)) {
    data[`member_${n}.${field}`] = hint(label(n))
  }
}

// Комментарии к шаблону устава: что вписать в жёлтые поля и как настроить
// полномочия председателя. Устав готов к печати после заполнения полей;
// кто ничего не меняет, комментарии только удаляет.
const USTAV_COMMENTS = [
  {
    find: 'У С Т А В',
    text: 'Шаблон устава потребительского кооператива. Устав готов к печати после заполнения жёлтых полей в квадратных скобках.\n' +
      'Комментарии описывают поля и одно настраиваемое положение (п. 13.2 и подпункт ж) п. 13.4). Кто ничего не настраивает, оставляет текст как есть.\n' +
      'Перед печатью удалите выделение жёлтым и все комментарии: «Рецензирование» → «Удалить» → «Удалить все примечания в документе». Иначе Word может напечатать комментарии на полях.',
  },
  {
    find: 'от «[ДД]»',
    text: 'Дата учредительного собрания — та же, что в протоколе № 1. Число цифрами, месяц словом в родительном падеже («января»), год четырьмя цифрами. Год повторяется на титуле: впишите его и там.',
  },
  {
    find: '[название]',
    text: 'Название кооператива. Впишите его без кавычек: кавычки уже стоят. Название повторяется в шапке, на титуле, в статье 1 и в п. 1.8 — замените его везде одинаково.',
  },
  {
    find: 'г. [город]',
    text: 'Город места нахождения кооператива — как в адресе по Государственному адресному реестру (fias.nalog.ru). Город повторяется в п. 1.9.',
  },
  {
    find: 'полное наименование на английском языке',
    text: 'Впишите название кооператива латиницей — для наименования на английском языке. Название латиницей повторяется в двух абзацах: впишите его в обоих одинаково.',
  },
  {
    find: '17.1. Вступительный взнос',
    text: 'Размеры вступительного и минимального паевого взносов утверждает учредительное собрание. Впишите те же суммы, что в протоколе № 1: цифрами в поле [сумма] и словами в поле [сумма прописью].',
  },
  {
    find: 'Председатель Совета Общества вправе единолично',
    text: 'Настраиваемое положение. Председателю передан подпункт б) пункта 13.4 — приём в пайщики, решение без кворума совета.\n' +
      'Можно передать председателю любой набор подпунктов а)–и) пункта 13.4, кроме ж). Один подпункт пишется «в абзаце б)», несколько — «в абзацах а), б) и е)».\n' +
      'Если среди выбранных есть а) или е), удалите подпункт ж) пункта 13.4 и сдвиньте буквы следующих подпунктов: з) станет ж), и) — з) и далее до р). Буквы в этом предложении пересчитайте так же.',
  },
  {
    find: 'ж) приостановление полномочий Председателя Совета',
    text: 'Подпункт остаётся, пока председателю в п. 13.2 переданы подпункты без а) и е). Если председателю передан а) или е), удалите этот подпункт и сдвиньте буквы следующих: з) станет ж), и) — з) и далее до р).',
  },
]

function renderSample(file, comments) {
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
  if (comments) addComments(zip, comments)
  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' })
}

const archive = new PizZip()
archive.file('Устав (шаблон).docx', renderSample('ustav.docx', USTAV_COMMENTS))
archive.file('Протокол № 1 учредительного собрания (шаблон).docx', renderSample('protocol_1.docx'))
archive.file('Гарантийное письмо собственника помещения (шаблон).docx', renderSample('garant_letter.docx'))
// Пустой бланк Р11001 — тот же файл, что в архиве заполненных документов
archive.file('Форма Р11001 (бланк).pdf', fs.readFileSync(path.join(root, 'public/forms/R11001.pdf')))
fs.mkdirSync(OUT_DIR, { recursive: true })
fs.writeFileSync(OUT_ZIP, archive.generate({ type: 'nodebuffer', compression: 'DEFLATE' }))
console.log(`Шаблоны собраны: ${path.relative(root, OUT_ZIP)}`)
