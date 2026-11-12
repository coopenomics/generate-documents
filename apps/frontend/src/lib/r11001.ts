// Заявление о государственной регистрации юридического лица при создании,
// форма Р11001 (приложение № 1 к приказу ФНС России от 31.08.2020
// № ЕД-7-14/617@), для потребительского кооператива.
//
// Шаблон public/forms/R11001-fillable.pdf — заполняемая форма КонсультантПлюс
// без данных: 10 страниц, титульная часть (001–004), лист Е (005–006),
// лист Ж (007), лист И (008–010). Листы А–Д для потребительского кооператива
// не заполняются (п. 43 требований), лист И — на каждого учредителя (п. 47).
//
// Требования к печати (приложение № 13): заглавные буквы, Courier New 18 пт,
// чёрный цвет, по знаку в клетке. Courier New распространять с сайтом нельзя,
// поэтому печать идёт шрифтом Liberation Mono — он совпадает с Courier New по
// ширине знаков (0,6 em), клетки заполняются так же.
//
// Перенос текста между строками — как в бланке, по которому зарегистрирован
// ПК «ВОСХОД»: знаки идут в клетки подряд и продолжаются на следующей строке
// даже посреди слова, пробел на границе строк опускается. Так строки,
// прочитанные подряд, дают исходный текст.
//
// fillR11001 — чистая функция: данные формы → значения полей и список
// незаполненного. Её проверяет сверка с принятым бланком ВОСХОДа.
import type { GarAddress, Member, NewCooperativeData } from '../../../../packages/shared/src'

export type FieldValues = Record<string, string>

export interface R11001Fill {
  title: FieldValues // титульная часть, лист Е, лист Ж (страницы 001–007)
  applicants: FieldValues[] // лист И на каждого учредителя
  missing: string[] // чего не хватает для подачи
}

// Учредитель 2 — председатель совета по протоколу № 1
export const CHAIRMAN_INDEX = 2
// Субъекты, где в п. 3 указывается только код (п. 29 требований)
const FEDERAL_CITIES = new Set(['77', '78', '92', '99'])

const up = (s?: string) => (s || '').trim().replace(/\s+/g, ' ').toUpperCase()
const digits = (s?: string) => (s || '').replace(/\D/g, '')

// Знаки подряд по строкам заданной длины; пробел на границе строк опускается.
// null — текст не помещается в отведённые строки.
export function flow(text: string, lens: number[]): string[] | null {
  const lines: string[] = []
  let rest = up(text)
  for (const len of lens) {
    rest = rest.replace(/^ /, '')
    lines.push(rest.slice(0, len))
    rest = rest.slice(len)
  }
  return rest.replace(/^ /, '') ? null : lines
}

function isoParts(value?: string): [string, string, string] | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((value || '').trim())
  return m ? [m[3], m[2], m[1]] : null
}

// Серия и номер паспорта гражданина РФ: «12 34 567890»
function passport(series?: string, number?: string): string | null {
  const s = digits(series)
  const n = digits(number)
  return s.length === 4 && n.length === 6 ? `${s.slice(0, 2)} ${s.slice(2)} ${n}` : null
}

function splitName(full?: string) {
  const [last = '', first = '', ...middle] = up(full).split(' ')
  return { last, first, middle: middle.join(' ') }
}

// Телефон: «+7…»; 8XXXXXXXXXX и XXXXXXXXXX приводятся к +7
function phone(value?: string): string {
  const raw = (value || '').trim()
  const d = digits(raw)
  if (d.length === 11 && (d[0] === '7' || d[0] === '8')) return `+7${d.slice(1)}`
  if (d.length === 10) return `+7${d}`
  return raw.startsWith('+') ? `+${d}` : d
}

// Коды ОКВЭД: «58.12.2» → ['58','12','2']; не меньше четырёх цифр (XX.XX)
export function parseOkved(text?: string): { codes: string[][]; bad: string[] } {
  const codes: string[][] = []
  const bad: string[] = []
  for (const token of (text || '').split(/[\s,;]+/).filter(Boolean)) {
    if (/^\d{2}\.\d{1,2}(\.\d{1,2}){0,2}$/.test(token) && digits(token).length >= 4) {
      const parts = token.split('.')
      // Форма даёт три группы по две клетки: XX.XX.XX
      if (parts.length <= 3) codes.push(parts)
      else bad.push(token)
    } else {
      bad.push(token)
    }
  }
  return { codes, bad }
}

// Строка адреса для протокола и гарантийного письма
export function addressText(a: GarAddress = {}): string {
  const pair = (t?: string, v?: string) => [t, v].map((s) => (s || '').trim()).filter(Boolean).join(' ')
  return [
    a.postal_index,
    a.region_name,
    a.mo_name,
    a.settlement_name,
    pair(a.locality_type, a.locality_name),
    pair(a.plan_type, a.plan_name),
    pair(a.street_type, a.street_name),
    pair(a.building_type, a.building_number),
    pair(a.building2_type, a.building2_number),
    pair(a.building3_type, a.building3_number),
    pair(a.room_type, a.room_number),
    pair(a.flat_room_type, a.flat_room_number),
    a.extra,
  ]
    .map((s) => (s || '').trim())
    .filter(Boolean)
    .join(', ')
}

class Builder {
  values: FieldValues = {}
  missing: string[] = []

  constructor(readonly where: string) {}

  set(field: string, value: string) {
    if (value) this.values[field] = up(value)
  }

  // Многострочный показатель: текст по строкам полей
  lines(fields: [string, number][], value: string | undefined, label: string, required = true) {
    if (!up(value)) {
      if (required) this.missing.push(`${this.where}: ${label}`)
      return
    }
    const parts = flow(value!, fields.map(([, len]) => len))
    if (!parts) {
      this.missing.push(`${this.where}: ${label} — не помещается в клетки формы`)
      return
    }
    fields.forEach(([name], i) => this.set(name, parts[i]))
  }

  one(field: string, len: number, value: string | undefined, label: string, required = true) {
    this.lines([[field, len]], value, label, required)
  }

  date(fields: [string, string, string], value: string | undefined, label: string) {
    const p = isoParts(value)
    if (!p) {
      this.missing.push(`${this.where}: ${label}`)
      return
    }
    fields.forEach((f, i) => this.set(f, p[i]))
  }
}

// Общие сведения о физическом лице: листы Е и И устроены одинаково,
// отличаются только имена полей.
interface PersonFields {
  last: string
  first: string
  middle: string
  inn: string
  birth: [string, string, string]
  birthplace: [string, string]
  docType: string
  passport: string
  issued: [string, string, string]
  issuedBy: [string, string, string]
  code: [string, string]
}

const SHEET_E: PersonFields = {
  last: 'Text926.0',
  first: 'Text926.1',
  middle: 'Text926.2',
  inn: 'Text923.1.1',
  birth: ['Text927', 'Text928', 'Text929'],
  birthplace: ['Text925.0', 'Text925.1'],
  docType: 'Text937',
  passport: 'Text940',
  issued: ['Text932', 'Text933', 'Text934'],
  issuedBy: ['Text942.0.0', 'Text942.1.0', 'Text942.2.0'],
  code: ['Text935', 'Text936'],
}

const SHEET_I: PersonFields = {
  last: 'Text184.0',
  first: 'Text184.1',
  middle: 'Text184.2',
  inn: 'Text184.3',
  birth: ['Text185.0', 'Text185.1', 'Text185.2'],
  birthplace: ['Text183.0', 'Text183.1'],
  docType: 'Text188',
  passport: 'Text189',
  issued: ['Text190.0', 'Text190.1', 'Text190.2'],
  issuedBy: ['Text191.1.0', 'Text191.1.1', 'Text191.1.2'],
  code: ['Text192.0', 'Text192.1'],
}

function person(b: Builder, f: PersonFields, m: Member | undefined) {
  const name = splitName(m?.full_name)
  b.one(f.last, 34, name.last, 'фамилия')
  b.one(f.first, 34, name.first, 'имя')
  if (name.middle) b.one(f.middle, 34, name.middle, 'отчество')
  if (digits(m?.inn)) {
    if (digits(m?.inn).length === 12) b.set(f.inn, digits(m?.inn))
    else b.missing.push(`${b.where}: ИНН — 12 цифр`)
  }
  b.date(f.birth, m?.birthday, 'дата рождения')
  b.lines([[f.birthplace[0], 40], [f.birthplace[1], 40]], m?.birthplace, 'место рождения')
  b.set(f.docType, '21') // паспорт гражданина Российской Федерации
  const p = passport(m?.passport_series, m?.passport_number)
  if (p) b.set(f.passport, p)
  else b.missing.push(`${b.where}: серия (4 цифры) и номер (6 цифр) паспорта`)
  b.date(f.issued, m?.passport_issue_date, 'дата выдачи паспорта')
  b.lines(f.issuedBy.map((n) => [n, 40] as [string, number]), m?.passport_issued_by, 'кем выдан паспорт')
  const code = digits(m?.passport_code)
  if (code.length === 6) {
    b.set(f.code[0], code.slice(0, 3))
    b.set(f.code[1], code.slice(3))
  } else {
    b.missing.push(`${b.where}: код подразделения (6 цифр)`)
  }
}

// Элементы адреса: вид или тип и наименование
function addressFields(b: Builder, a: GarAddress, withSubject: boolean, fields: {
  subject: string
  moType: string
  moName: [string, number][]
  settlementType: string
  settlementName: [string, number][]
  localityType: string
  localityName: [string, number][]
}) {
  const code = digits(a.region_code)
  if (code.length === 2) b.set(fields.subject, code)
  else b.missing.push(`${b.where}: код субъекта РФ (две цифры)`)
  if (!withSubject) return
  if (a.mo_type || a.mo_name) {
    if (!/^[1-4]$/.test(a.mo_type || '')) b.missing.push(`${b.where}: вид муниципального образования`)
    else b.set(fields.moType, a.mo_type!)
    b.lines(fields.moName, a.mo_name, 'наименование муниципального образования')
  }
  if (a.settlement_type || a.settlement_name) {
    if (!/^[1-4]$/.test(a.settlement_type || '')) b.missing.push(`${b.where}: вид поселения`)
    else b.set(fields.settlementType, a.settlement_type!)
    b.lines(fields.settlementName, a.settlement_name, 'наименование поселения')
  }
  if (a.locality_type || a.locality_name) {
    b.one(fields.localityType, 10, a.locality_type, 'вид населённого пункта')
    b.lines(fields.localityName, a.locality_name, 'наименование населённого пункта')
  }
}

// Сетка дополнительных кодов листа Ж: [строка][колонка][группа] → имя поля.
// Имена полей в форме нерегулярны, таблица снята по положению клеток.
const OKVED_GRID: string[][][] = [
  [["Text165.0.0", "Text165.1.0", "Text165.2.0"], ["Text165.3.0", "Text165.4.0", "Text165.5.0"], ["Text165.6.0", "Text165.7.0", "Text165.8.0"], ["Text165.9.0", "Text165.10.0", "Text165.11.0"]],
  [["Text165.0.1", "Text165.1.1", "Text165.2.1"], ["Text165.3.1", "Text165.4.1", "Text165.5.1"], ["Text165.6.1", "Text165.7.1", "Text165.8.1"], ["Text165.9.1", "Text165.10.1", "Text165.11.1"]],
  [["Text165.0.2", "Text165.1.2", "Text165.2.2"], ["Text165.3.2", "Text165.4.2", "Text165.5.2"], ["Text165.6.2", "Text165.7.2", "Text165.8.2"], ["Text165.9.2", "Text165.10.2", "Text165.11.2"]],
  [["Text165.0.3", "Text165.1.3", "Text165.2.3"], ["Text165.3.3", "Text165.4.3", "Text165.5.3"], ["Text165.6.3", "Text165.7.3", "Text165.8.3"], ["Text165.9.3", "Text165.10.3", "Text165.11.3"]],
  [["Text165.0.4", "Text165.1.4", "Text165.2.4"], ["Text165.3.4", "Text165.4.4", "Text165.5.4"], ["Text165.6.4", "Text165.7.4", "Text165.8.4"], ["Text165.9.4", "Text165.10.4", "Text165.11.4"]],
  [["Text165.0.5", "Text165.1.5", "Text165.2.5"], ["Text165.3.5", "Text165.4.5", "Text165.5.5"], ["Text165.6.5", "Text165.7.5", "Text165.8.5"], ["Text165.9.5", "Text165.10.5", "Text165.11.5"]],
  [["Text165.0.6", "Text165.1.6", "Text165.2.6"], ["Text165.3.6", "Text165.4.6", "Text165.5.6"], ["Text165.6.6", "Text165.7.6", "Text165.8.6"], ["Text165.9.6", "Text165.10.6", "Text165.11.6"]],
  [["Text165.0.7", "Text165.1.7", "Text165.2.7"], ["Text165.3.7", "Text165.4.7", "Text165.5.7"], ["Text165.6.7", "Text165.7.7", "Text165.8.7"], ["Text165.9.7", "Text165.10.7", "Text165.11.7"]],
  [["Text165.0.8", "Text165.1.8", "Text165.2.8"], ["Text165.3.8", "Text165.4.8", "Text165.5.8"], ["Text165.6.8", "Text165.7.8", "Text165.8.8"], ["Text165.9.8", "Text165.10.8", "Text165.11.8"]],
  [["Text165.0.9", "Text165.1.9", "Text165.2.9"], ["Text165.3.9", "Text165.4.9", "Text165.5.9"], ["Text165.6.9", "Text165.7.9", "Text165.8.9"], ["Text165.9.9", "Text165.10.9", "Text165.11.9"]],
  [["Text165.0.10", "Text165.1.10", "Text165.2.10"], ["Text165.3.10", "Text165.4.10", "Text165.5.10"], ["Text165.6.10", "Text165.7.10", "Text165.8.10"], ["Text165.9.10", "Text165.10.10", "Text165.11.10"]],
  [["Text165.0.11", "Text165.1.11", "Text165.2.11"], ["Text165.3.11", "Text165.4.11", "Text165.5.11"], ["Text165.6.11", "Text165.7.11", "Text165.8.11"], ["Text165.9.11", "Text165.10.11", "Text165.11.11"]],
  [["Text165.0.12", "Text165.1.12", "Text165.2.12"], ["Text165.3.12", "Text165.4.12", "Text165.5.12"], ["Text165.6.12", "Text165.7.12", "Text165.8.12"], ["Text165.9.12", "Text165.10.12", "Text165.11.12"]],
  [["Text165.0.13.0", "Text165.1.13.0", "Text165.2.13.0"], ["Text165.3.13.0", "Text165.4.13.0", "Text165.5.13.0"], ["Text165.6.13.0", "Text165.7.13.0", "Text165.8.13.0"], ["Text165.9.13.0", "Text165.10.13.0", "Text165.11.13.0"]],
  [["Text165.0.13.1", "Text165.1.13.1", "Text165.2.13.1"], ["Text165.3.13.1", "Text165.4.13.1", "Text165.5.13.1"], ["Text165.6.13.1", "Text165.7.13.1", "Text165.8.13.1"], ["Text165.9.13.1", "Text165.10.13.1", "Text165.11.13.1"]],
  [["Text165.0.13.2", "Text165.1.13.2", "Text165.2.13.2"], ["Text165.3.13.2", "Text165.4.13.2", "Text165.5.13.2"], ["Text165.6.13.2", "Text165.7.13.2", "Text165.8.13.2"], ["Text165.9.13.2", "Text165.10.13.2", "Text165.11.13.2"]],
  [["Text165.0.13.3", "Text165.1.13.3", "Text165.2.13.3"], ["Text165.3.13.3", "Text165.4.13.3", "Text165.5.13.3"], ["Text165.6.13.3", "Text165.7.13.3", "Text165.8.13.3"], ["Text165.9.13.3", "Text165.10.13.3", "Text165.11.13.3"]],
]

export function fillR11001(data: NewCooperativeData): R11001Fill {
  const t = new Builder('Титульная часть')
  const name = up(data.name)

  // п. 1 — наименование на русском языке
  const full = `${up(data.full_abbr || 'Потребительский кооператив')} «${name}»`
  const short = `${up(data.short_abbr || 'ПК')} «${name}»`
  if (!name) t.missing.push('Титульная часть: название кооператива')
  else {
    t.lines(['Text1.0.0', 'Text1.0.1', 'Text1.0.2', 'Text1.0.3', 'Text1.0.4', 'Text1.0.5'].map((n) => [n, 40] as [string, number]), full, 'полное наименование')
    t.lines(['Text2.0', 'Text2.1', 'Text2.2', 'Text2.3'].map((n) => [n, 40] as [string, number]), short, 'сокращённое наименование')
  }

  // п. 2 — наименование на английском языке (код 016), если указано латиницей
  const eng = up(data.eng_name)
  if (eng && /^[A-Z0-9 .,«»"'&()-]+$/.test(eng)) {
    t.set('Text4.0.0', '016')
    t.lines(['Text12.0', 'Text12.1', 'Text12.2', 'Text12.3', 'Text12.4', 'Text12.5'].map((n) => [n, 40] as [string, number]), `${up(data.full_abbr_eng || 'Consumer Benefit Society')} «${eng}»`, 'полное наименование на английском языке')
    t.lines(['Text12.6', 'Text12.7', 'Text12.8', 'Text12.9'].map((n) => [n, 40] as [string, number]), `${up(data.short_abbr_eng || 'CBS')} «${eng}»`, 'сокращённое наименование на английском языке')
  }

  // п. 3 — место нахождения; для Москвы, Санкт-Петербурга, Севастополя
  // и Байконура только код субъекта
  const a = data.address || {}
  const federal = FEDERAL_CITIES.has(digits(a.region_code))
  addressFields(t, a, !federal, {
    subject: 'Text32.1',
    moType: 'Text18',
    moName: [['Text33.0', 19], ['Text12.10', 40]],
    settlementType: 'Text21',
    settlementName: [['Text33.1', 19], ['Text12.11', 40]],
    localityType: 'Text40.2.1',
    localityName: [['Text33.2', 19], ['Text47.0', 34]],
  })

  // п. 4 — адрес в пределах места нахождения по ГАР
  addressFields(t, a, true, {
    subject: 'Text50.1',
    moType: 'Text38.0.1.0',
    moName: [['Text51.1.0.0', 19], ['Text51.0.1.0.0', 40]],
    settlementType: 'Text38.0.1.1',
    settlementName: [['Text51.1.0.1.0', 19], ['Text51.0.1.0.1.0', 40]],
    localityType: 'Text51.0.0.0.0',
    localityName: [['Text51.1.0.1.1.0', 19], ['Text51.1.1', 34]],
  })
  if (a.plan_type || a.plan_name) {
    t.one('Text51.0.0.0.1', 10, a.plan_type, 'тип элемента планировочной структуры')
    t.lines([['Text51.1.0.1.1.1', 19], ['Text51.0.1.0.1.1.0', 40], ['Text51.0.1.0.1.2.0', 40]], a.plan_name, 'наименование элемента планировочной структуры')
  }
  if (a.street_type || a.street_name) {
    t.one('Text51.0.0.0.2', 10, a.street_type, 'тип улицы')
    t.lines([['Text51.1.0.1.1.2', 19], ['Text51.0.1.0.1.1.1', 40], ['Text51.0.1.0.1.2.1', 40]], a.street_name, 'наименование улицы')
  }
  if (!a.street_name && !a.plan_name) t.missing.push('Титульная часть: улица или элемент планировочной структуры')
  const buildings: [string | undefined, string | undefined][] = [
    [a.building_type, a.building_number],
    [a.building2_type, a.building2_number],
    [a.building3_type, a.building3_number],
  ]
  buildings.forEach(([type, num], i) => {
    if (!type && !num) return
    t.one(`Text52.0.${i}`, 10, type, 'тип здания')
    t.one(`Text52.2.${i}`, 20, num, 'номер здания')
  })
  if (!a.building_number) t.missing.push('Титульная часть: номер здания')
  if (a.room_type || a.room_number) {
    t.one('Text52.0.3', 10, a.room_type, 'тип помещения')
    t.one('Text52.2.3', 20, a.room_number, 'номер помещения')
  }
  if (a.flat_room_type || a.flat_room_number) {
    t.one('Text52.0.4', 10, a.flat_room_type, 'тип помещения в квартире')
    t.one('Text52.2.4', 20, a.flat_room_number, 'номер помещения в квартире')
  }

  // п. 5 — адрес электронной почты юридического лица
  t.one('Text54.0', 40, data.contact_email, 'адрес электронной почты кооператива')

  // Лист Е — председатель совета (право действовать без доверенности)
  const e = new Builder('Лист Е (председатель совета, учредитель 2)')
  const chairman = (data as any)[`member_${CHAIRMAN_INDEX}`] as Member | undefined
  person(e, SHEET_E, chairman)
  if (chairman?.gender === '1' || chairman?.gender === '2') e.set('Text924.2', chairman.gender)
  else e.missing.push('Лист Е (председатель совета, учредитель 2): пол')
  e.set('Text939.0', '1') // гражданин Российской Федерации
  e.lines([['Text942.0.1', 40], ['Text942.1.1', 40]], 'ПРЕДСЕДАТЕЛЬ СОВЕТА', 'должность')

  // Лист Ж — коды ОКВЭД: основной и до 68 дополнительных
  const z = new Builder('Лист Ж')
  const { codes, bad } = parseOkved(data.okved)
  if (bad.length) z.missing.push(`Лист Ж: неверные коды ОКВЭД — ${bad.join(', ')}`)
  if (!codes.length) z.missing.push('Лист Ж: код основного вида деятельности')
  else {
    codes[0].forEach((part, i) => z.set(`Text164.${i}`, part))
    const extra = codes.slice(1)
    if (extra.length > 68) z.missing.push('Лист Ж: больше 68 дополнительных кодов, второй лист Ж генератор не заполняет')
    extra.slice(0, 68).forEach((code, k) => {
      // Колонки заполняются сверху вниз, затем следующая колонка
      const col = Math.floor(k / 17)
      const row = k % 17
      code.forEach((part, i) => z.set(OKVED_GRID[row][col][i], part))
    })
  }

  // Номера страниц: 001–004 напечатаны в форме, дальше поля
  const title: FieldValues = {
    ...t.values,
    ...e.values,
    ...z.values,
    Text921: '005',
    Text931: '006',
    Text163: '007',
  }

  // Лист И — на каждого учредителя, страницы по три подряд. Первым идёт
  // председатель совета, как в бланке ВОСХОДа, затем остальные по порядку.
  const applicants: FieldValues[] = []
  const missing = [...t.missing, ...e.missing, ...z.missing]
  const order = [CHAIRMAN_INDEX, ...[1, 2, 3, 4, 5, 6].filter((n) => n !== CHAIRMAN_INDEX)]
  order.forEach((n, pos) => {
    const m = (data as any)[`member_${n}`] as Member | undefined
    const b = new Builder(`Лист И (учредитель ${n})`)
    b.set('Text179', '1') // учредитель юридического лица — физическое лицо
    person(b, SHEET_I, m)
    const email = (m?.email || data.contact_email || '').trim()
    b.one('Text200.0', 38, email, 'адрес электронной почты для документов')
    if (n === CHAIRMAN_INDEX && data.paper_copy) b.set('Text203.0', '1')
    const tel = phone(m?.phone)
    b.one('Text200.2', 20, tel, 'номер контактного телефона')
    const first = 8 + pos * 3
    b.values.Text178 = String(first).padStart(3, '0')
    b.values.Text187 = String(first + 1).padStart(3, '0')
    b.values.Text201 = String(first + 2).padStart(3, '0')
    applicants.push(b.values)
    missing.push(...b.missing)
  })

  // Пункты 3 и 4 проверяют одни и те же элементы адреса — без повторов
  return { title, applicants, missing: [...new Set(missing)] }
}

// ── Сборка PDF ──────────────────────────────────────────────────────────────
// Каждый экземпляр (титульная часть с листами Е и Ж, затем лист И на каждого
// учредителя) заполняется в своей копии шаблона и превращается в обычный
// текст страницы (flatten). Затем генератор переносит страницы копий в один файл.

const TITLE_PAGES = [0, 1, 2, 3, 4, 5, 6]
const APPLICANT_PAGES = [7, 8, 9]

export async function buildR11001Pdf(fill: R11001Fill, template: ArrayBuffer, fontBytes: ArrayBuffer): Promise<Uint8Array> {
  const { PDFDocument } = await import('pdf-lib')
  const fontkit = (await import('@pdf-lib/fontkit')).default

  async function filledCopy(values: FieldValues, pages: number[]) {
    const doc = await PDFDocument.load(template)
    doc.registerFontkit(fontkit)
    const font = await doc.embedFont(fontBytes, { subset: true })
    const form = doc.getForm()
    for (const [name, value] of Object.entries(values)) {
      const field = form.getTextField(name)
      // Оформление в форме задано только у виджетов; pdf-lib читает его
      // у поля — прописываем то же: 18 пт, чёрный цвет
      field.acroField.setDefaultAppearance('/CourierNewPSMT 18 Tf 0 g')
      field.setText(value)
    }
    form.updateFieldAppearances(font)
    form.flatten()
    // Лишние страницы копии удаляются с конца, чтобы не сбить индексы
    for (let i = doc.getPageCount() - 1; i >= 0; i--) {
      if (!pages.includes(i)) doc.removePage(i)
    }
    return PDFDocument.load(await doc.save())
  }

  const out = await PDFDocument.create()
  const parts = [await filledCopy(fill.title, TITLE_PAGES)]
  for (const values of fill.applicants) parts.push(await filledCopy(values, APPLICANT_PAGES))
  for (const part of parts) {
    const pages = await out.copyPages(part, part.getPageIndices())
    pages.forEach((p) => out.addPage(p))
  }
  out.setTitle('Заявление о государственной регистрации юридического лица при создании (форма Р11001)')
  out.setProducer('')
  out.setCreator('')
  return out.save()
}
