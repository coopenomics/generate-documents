// Подсказки вместо полей: «[город]», «[ФИО собственника]» с жёлтой заливкой.
//
// Общий модуль для двух мест:
//   - scripts/make-samples.mjs — шаблоны для ручного заполнения, где подсказка
//     стоит вместо каждого поля;
//   - src/lib/generator.ts — заполнение онлайн, где подсказка остаётся только
//     там, где у формы нет данных (собственник помещения в гарантийном письме).
//
// Поле подставляется как «⟦[подпись]⟧»; highlightHints находит метки в XML
// документа, выделяет текст между ними жёлтым и убирает сами метки.

export const OPEN = '⟦'
export const CLOSE = '⟧'
export const hint = (label) => `${OPEN}[${label}]${CLOSE}`

// Поля гарантийного письма собственника помещения. В форме сайта таких
// данных нет, поэтому и в заполненном онлайн письме они остаются подсказками.
export const GARANT_HINTS = {
  tax_authority: hint('наименование регистрирующего органа, в Москве — Межрайонную ИФНС России № 46 по г. Москве'),
  owner_full_name: hint('ФИО собственника помещения'),
  owner_birthday: hint('ДД.ММ.ГГГГ'),
  owner_address: hint('адрес регистрации собственника'),
  owner_inn: hint('ИНН'),
  owner_passport: hint('серия и номер'),
  owner_passport_issued_by: hint('кем выдан'),
  owner_passport_issue_date: hint('дата выдачи'),
  owner_passport_code: hint('код подразделения'),
  premises_part: hint('комнату № / помещение'),
  premises_area: hint('площадь'),
  egrn_record: hint('номер государственной регистрации права'),
  egrn_date: hint('дата'),
  owner_short_name: hint('И. О. Фамилия'),
  letter_date: hint('дата письма'),
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

const textRun = (rPr, text) => `<w:r>${rPr}<w:t xml:space="preserve">${text}</w:t></w:r>`

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

// Выделяет подсказки в XML части документа. Прежнюю заливку не трогает.
export function highlightHints(xml) {
  return xml.replace(/<w:r(?: [^>]*)?>[\s\S]*?<\/w:r>/g, (run) => (run.includes(OPEN) ? splitRun(run) : run))
}

// Выделяет подсказки во всех частях заполненного документа (PizZip).
export function highlightDocx(zip) {
  for (const name of Object.keys(zip.files)) {
    if (!/^word\/(document|header\d*|footer\d*)\.xml$/.test(name)) continue
    const xml = zip.file(name).asText()
    if (!xml.includes(OPEN)) continue
    const out = highlightHints(xml)
    if (out.includes(OPEN) || out.includes(CLOSE)) throw new Error(`В ${name} осталась невыделенная подсказка`)
    zip.file(name, out)
  }
}
