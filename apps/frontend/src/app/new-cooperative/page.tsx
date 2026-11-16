'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { ArrowLeftIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { NewCooperativeData, Member, GarantLetterData, GarAddress } from '../../../../../packages/shared/src'
import { generateNewCooperative, saveBlob, SHOW_TEST_BUTTON } from '../../lib/generator'
import { addressText, CHAIRMAN_INDEX, fillR11001 } from '../../lib/r11001'
import { CHAIR_OPTIONS, chairPowersData, DEFAULT_CHAIR_POWERS, keepsZh } from '../../lib/chair-powers.mjs'

// Коды ОКВЭД по умолчанию: основной 94.99 и набор потребительского кооператива
const DEFAULT_OKVED =
  '94.99, 58.12.2, 58.19, 58.29, 62.01, 62.02, 62.03, 62.09, 63.11, 63.12, 63.99, 68.10, 68.20, 68.31, 68.32, 69.10, 69.20, 70.22, 72.20, 73.20, 74.90.9, 77.29, 77.39, 77.40, 81.10, 98.10, 98.20'

// Элементы адреса по ГАР (п. 3 и 4 формы Р11001)
const ADDRESS_FIELDS: { key: keyof GarAddress; label: string; placeholder?: string; span?: 2 | 4; options?: [string, string][] }[] = [
  { key: 'postal_index', label: 'Индекс', placeholder: '123456' },
  { key: 'region_code', label: 'Код субъекта РФ', placeholder: '77' },
  { key: 'region_name', label: 'Субъект РФ (как в адресе)', placeholder: 'г. Москва', span: 2 },
  { key: 'mo_type', label: 'Вид муниципального образования', span: 2, options: [['1', 'муниципальный район'], ['2', 'городской округ'], ['3', 'внутригородская территория города федерального значения'], ['4', 'муниципальный округ']] },
  { key: 'mo_name', label: 'Муниципальное образование', placeholder: 'муниципальный округ Тестовый', span: 2 },
  { key: 'settlement_type', label: 'Вид поселения', span: 2, options: [['1', 'городское поселение'], ['2', 'сельское поселение'], ['3', 'межселенная территория'], ['4', 'внутригородской район городского округа']] },
  { key: 'settlement_name', label: 'Поселение', span: 2 },
  { key: 'locality_type', label: 'Населённый пункт: вид', placeholder: 'г.' },
  { key: 'locality_name', label: 'Населённый пункт', span: 2 },
  { key: 'plan_type', label: 'Планировочная структура: тип', placeholder: 'мкр.' },
  { key: 'plan_name', label: 'Элемент планировочной структуры', span: 2 },
  { key: 'street_type', label: 'Улица: тип', placeholder: 'ул.' },
  { key: 'street_name', label: 'Улица', placeholder: 'Тестовая', span: 2 },
  { key: 'building_type', label: 'Здание: тип', placeholder: 'д.' },
  { key: 'building_number', label: 'Номер здания', placeholder: '1' },
  { key: 'building2_type', label: 'Корпус, строение: тип', placeholder: 'корп.' },
  { key: 'building2_number', label: 'Номер', placeholder: '2' },
  { key: 'room_type', label: 'Помещение: тип', placeholder: 'помещение' },
  { key: 'room_number', label: 'Номер помещения', placeholder: '1' },
  { key: 'extra', label: 'Уточнение для протокола и письма', placeholder: 'комната № 1', span: 2 },
]

// Поля гарантийного письма собственника помещения (раздел необязательный)
const GARANT_FIELDS: { key: keyof GarantLetterData; label: string; placeholder?: string; date?: boolean; wide?: boolean }[] = [
  { key: 'tax_authority', label: 'Регистрирующий орган (кому)', placeholder: 'Межрайонную ИФНС России № 46 по г. Москве', wide: true },
  { key: 'owner_full_name', label: 'ФИО собственника', placeholder: 'Петров Пётр Петрович' },
  { key: 'owner_birthday', label: 'Дата рождения', date: true },
  { key: 'owner_address', label: 'Адрес регистрации собственника', placeholder: 'г. Москва, ул. Примерная, д. 1, кв. 1', wide: true },
  { key: 'owner_inn', label: 'ИНН собственника', placeholder: '000000000000' },
  { key: 'owner_passport', label: 'Паспорт: серия и номер', placeholder: '0000 000000' },
  { key: 'owner_passport_issued_by', label: 'Кем выдан', placeholder: 'ГУ МВД России по г. Москве', wide: true },
  { key: 'owner_passport_issue_date', label: 'Дата выдачи', date: true },
  { key: 'owner_passport_code', label: 'Код подразделения', placeholder: '000-000' },
  { key: 'premises_part', label: 'Что предоставляется', placeholder: 'комнату № 1' },
  { key: 'premises_area', label: 'Площадь, кв. м', placeholder: '20' },
  { key: 'egrn_record', label: 'Номер государственной регистрации права (из выписки ЕГРН)', placeholder: '77:00:0000000:0000-77/000/2020-1', wide: true },
  { key: 'egrn_date', label: 'Дата регистрации права', date: true },
  { key: 'letter_date', label: 'Дата письма', date: true },
]

export default function NewCooperativePage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationResult, setGenerationResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  // Убираем activeMembers state - теперь всегда 6 учредителей

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue
  } = useForm<NewCooperativeData>({
    defaultValues: {
      name: '',
      city: '',
      website: '',
      short_abbr: 'ПК',
      full_abbr: 'Потребительский Кооператив',
      full_abbr_genitive: 'Потребительского Кооператива',
      full_abbr_dative: 'Потребительском Кооперативе',
      big_full_abbr: 'ПОТРЕБИТЕЛЬСКИЙ КООПЕРАТИВ',
      full_abbr_eng: 'Consumer Benefit Society',
      short_abbr_eng: 'CBS',
      eng_name: '',
      chairman_full_name: '',
      okved: DEFAULT_OKVED,
      chair_powers: DEFAULT_CHAIR_POWERS,
      paper_copy: false,
      address: {},
      contact_email: '',
      confidential_email: '',
      confidential_link: '',
      founding_date: new Date().toISOString().split('T')[0],
      initial_individuals_and_entprs: 100,
      initial_individuals_and_entprs_text: 'Сто',
      initial_organizations: 1000,
      initial_organizations_text: 'Одна тысяча',
      minimum_individuals_and_entprs: 300,
      minimum_individuals_and_entprs_text: 'Триста',
      minimum_organizations: 3000,
      minimum_organizations_text: 'Три тысячи',
      protocol_1_date: new Date().toISOString().split('T')[0],
      index_and_full_address: '',
      protocol_1_open_time: '10:00',
      protocol_1_close_time: '11:00',
      member_1: {
        full_name: '',
        birthday: '',
        passport_series: '',
        passport_number: '',
        passport_issue_date: '',
        passport_issued_by: '',
        passport_code: '',
        passport_address: '',
        inn: ''
      },
      member_2: {
        full_name: '',
        birthday: '',
        passport_series: '',
        passport_number: '',
        passport_issue_date: '',
        passport_issued_by: '',
        passport_code: '',
        passport_address: '',
        inn: ''
      },
      member_3: {
        full_name: '',
        birthday: '',
        passport_series: '',
        passport_number: '',
        passport_issue_date: '',
        passport_issued_by: '',
        passport_code: '',
        passport_address: '',
        inn: ''
      },
      member_4: {
        full_name: '',
        birthday: '',
        passport_series: '',
        passport_number: '',
        passport_issue_date: '',
        passport_issued_by: '',
        passport_code: '',
        passport_address: '',
        inn: ''
      },
      member_5: {
        full_name: '',
        birthday: '',
        passport_series: '',
        passport_number: '',
        passport_issue_date: '',
        passport_issued_by: '',
        passport_code: '',
        passport_address: '',
        inn: ''
      },
      member_6: {
        full_name: '',
        birthday: '',
        passport_series: '',
        passport_number: '',
        passport_issue_date: '',
        passport_issued_by: '',
        passport_code: '',
        passport_address: '',
        inn: ''
      }
    }
  })

  // Выбранные подпункты для председателя (галочки а–и)
  const chairPowers: string[] = (watch('chair_powers') as string[] | undefined) || []

  // Хватает ли данных для формы Р11001 — пересчёт при каждом изменении формы
  const r11001Missing = fillR11001(watch() as NewCooperativeData).missing

  const onSubmit = async (data: NewCooperativeData) => {
    setIsGenerating(true)
    setError(null)
    setGenerationResult(null)

    try {
      // Браузер заполняет шаблоны сам, данные формы на сервер не отправляются
      const result = await generateNewCooperative(data)
      setGenerationResult(result)
    } catch (err: any) {
      console.error('Ошибка генерации:', err)
      setError(
        err.message || 
        'Произошла ошибка при генерации документов'
      )
    } finally {
      setIsGenerating(false)
    }
  }

  // Повторное сохранение уже собранного архива
  const downloadFiles = () => {
    if (generationResult?.blob) saveBlob(generationResult.blob, 'documents.zip')
  }

  // Убираем функции addMember и removeMember
  
  const fillTestData = () => {
    // Основная информация
    setValue('name', 'ТЕСТ')
    setValue('city', 'Москва')
    setValue('website', 'https://test.coop')
    setValue('contact_email', 'info@test.coop')
    setValue('confidential_email', 'privacy@test.coop')
    setValue('confidential_link', 'https://test.coop/privacy')
    setValue('founding_date', '2024-01-15')
    
    // Финансовые параметры
    setValue('initial_individuals_and_entprs', 100)
    setValue('initial_individuals_and_entprs_text', 'Сто')
    setValue('initial_organizations', 1000)
    setValue('initial_organizations_text', 'Одна тысяча')
    setValue('minimum_individuals_and_entprs', 300)
    setValue('minimum_individuals_and_entprs_text', 'Триста')
    setValue('minimum_organizations', 3000)
    setValue('minimum_organizations_text', 'Три тысячи')
    
    // Данные протокола
    setValue('protocol_1_date', '2024-01-15')
    setValue('address', {
      postal_index: '123456', region_code: '77', region_name: 'г. Москва', mo_type: '3', mo_name: 'муниципальный округ Тестовый',
      street_type: 'ул.', street_name: 'Тестовая', building_type: 'д.', building_number: '1', room_type: 'помещение', room_number: '1',
    })
    for (let n = 1; n <= 6; n++) {
      setValue(`member_${n}.birthplace` as any, 'гор. Москва')
      setValue(`member_${n}.phone` as any, '+79000000000')
    }
    setValue('member_2.gender' as any, '1')
    setValue('protocol_1_open_time', '10:00')
    setValue('protocol_1_close_time', '11:00')
    
    // Учредитель 1 (член совета)
    setValue('member_1.full_name', 'Иванов Иван Иванович')
    setValue('member_1.birthday', '1980-05-15')
    setValue('member_1.passport_series', '1234')
    setValue('member_1.passport_number', '567890')
    setValue('member_1.passport_issue_date', '2010-05-20')
    setValue('member_1.passport_issued_by', 'ОУФМС России по г. Москва')
    setValue('member_1.passport_code', '123-456')
    setValue('member_1.passport_address', 'г. Москва, ул. Тестовая, д. 1, кв. 1')
    setValue('member_1.inn', '123456789012')
    
    // Учредитель 2 (председатель совета)
    setValue('member_2.full_name', 'Петров Петр Петрович')
    setValue('member_2.birthday', '1975-08-22')
    setValue('member_2.passport_series', '2345')
    setValue('member_2.passport_number', '678901')
    setValue('member_2.passport_issue_date', '2015-08-25')
    setValue('member_2.passport_issued_by', 'ОУФМС России по г. Москва')
    setValue('member_2.passport_code', '234-567')
    setValue('member_2.passport_address', 'г. Москва, ул. Тестовая, д. 2, кв. 2')
    setValue('member_2.inn', '234567890123')
    
    // Учредитель 3 (член совета)
    setValue('member_3.full_name', 'Сидоров Сидор Сидорович')
    setValue('member_3.birthday', '1982-12-10')
    setValue('member_3.passport_series', '3456')
    setValue('member_3.passport_number', '789012')
    setValue('member_3.passport_issue_date', '2012-12-15')
    setValue('member_3.passport_issued_by', 'ОУФМС России по г. Москва')
    setValue('member_3.passport_code', '345-678')
    setValue('member_3.passport_address', 'г. Москва, ул. Тестовая, д. 3, кв. 3')
    setValue('member_3.inn', '345678901234')
    
    // Учредитель 4 (член совета)
    setValue('member_4.full_name', 'Козлов Козел Козелович')
    setValue('member_4.birthday', '1978-03-05')
    setValue('member_4.passport_series', '4567')
    setValue('member_4.passport_number', '890123')
    setValue('member_4.passport_issue_date', '2018-03-10')
    setValue('member_4.passport_issued_by', 'ОУФМС России по г. Москва')
    setValue('member_4.passport_code', '456-789')
    setValue('member_4.passport_address', 'г. Москва, ул. Тестовая, д. 4, кв. 4')
    setValue('member_4.inn', '456789012345')
    
    // Учредитель 5 (член совета)
    setValue('member_5.full_name', 'Волков Волк Волкович')
    setValue('member_5.birthday', '1985-07-18')
    setValue('member_5.passport_series', '5678')
    setValue('member_5.passport_number', '901234')
    setValue('member_5.passport_issue_date', '2020-07-20')
    setValue('member_5.passport_issued_by', 'ОУФМС России по г. Москва')
    setValue('member_5.passport_code', '567-890')
    setValue('member_5.passport_address', 'г. Москва, ул. Тестовая, д. 5, кв. 5')
    setValue('member_5.inn', '567890123456')
    
    // Учредитель 6 (ревизор)
    setValue('member_6.full_name', 'Медведев Медведь Медведевич')
    setValue('member_6.birthday', '1983-11-30')
    setValue('member_6.passport_series', '6789')
    setValue('member_6.passport_number', '012345')
    setValue('member_6.passport_issue_date', '2016-12-01')
    setValue('member_6.passport_issued_by', 'ОУФМС России по г. Москва')
    setValue('member_6.passport_code', '678-901')
    setValue('member_6.passport_address', 'г. Москва, ул. Тестовая, д. 6, кв. 6')
    setValue('member_6.inn', '678901234567')
  }
  
  const getRoleText = (index: number) => {
    switch (index) {
      case 0: return 'член совета'
      case 1: return 'председатель совета'
      case 2: return 'член совета'
      case 3: return 'член совета'
      case 4: return 'член совета'
      case 5: return 'ревизор'
      default: return ''
    }
  }

  const renderMemberForm = (index: number) => {
    const memberKey = `member_${index + 1}` as keyof NewCooperativeData
    
    return (
      <div key={index} className="card border-gray-200">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">
              Учредитель {index + 1} ({getRoleText(index)})
            </h4>
            {/* Убираем кнопку удаления */}
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="form-label">
                ФИО полностью {index === 0 ? '*' : ''}
              </label>
              <input
                type="text"
                className="form-input"
                {...register(`${memberKey}.full_name` as any, index === 0 ? { 
                  required: 'ФИО первого учредителя обязательно'
                } : {})}
                placeholder="Иванов Иван Иванович"
              />
              {errors[memberKey] && (errors[memberKey] as any)?.full_name && (
                <p className="form-error">{(errors[memberKey] as any)?.full_name?.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">Дата рождения</label>
              <input
                type="date"
                className="form-input"
                {...register(`${memberKey}.birthday` as any)}
              />
            </div>

            <div>
              <label className="form-label">ИНН</label>
              <input
                type="text"
                className="form-input"
                {...register(`${memberKey}.inn` as any)}
                placeholder="123456789012"
              />
            </div>

            {index + 1 === CHAIRMAN_INDEX && (
              <div>
                <label className="form-label">Пол (для листа Е)</label>
                <select className="form-select" {...register(`${memberKey}.gender` as any)}>
                  <option value="">—</option>
                  <option value="1">мужской</option>
                  <option value="2">женский</option>
                </select>
              </div>
            )}

            <div className={index + 1 === CHAIRMAN_INDEX ? undefined : 'md:col-span-2'}>
              <label className="form-label">Место рождения (как в паспорте)</label>
              <input
                type="text"
                className="form-input"
                {...register(`${memberKey}.birthplace` as any)}
                placeholder="гор. Москва"
              />
            </div>

            <div>
              <label className="form-label">Телефон</label>
              <input
                type="tel"
                className="form-input"
                {...register(`${memberKey}.phone` as any)}
                placeholder="+7 900 000-00-00"
              />
            </div>

            <div>
              <label className="form-label">E-mail для документов о регистрации</label>
              <input
                type="email"
                className="form-input"
                {...register(`${memberKey}.email` as any)}
                placeholder="пусто — e-mail кооператива"
              />
            </div>

            <div>
              <label className="form-label">Серия паспорта</label>
              <input
                type="text"
                className="form-input"
                {...register(`${memberKey}.passport_series` as any)}
                placeholder="1234"
              />
            </div>

            <div>
              <label className="form-label">Номер паспорта</label>
              <input
                type="text"
                className="form-input"
                {...register(`${memberKey}.passport_number` as any)}
                placeholder="567890"
              />
            </div>

            <div>
              <label className="form-label">Дата выдачи паспорта</label>
              <input
                type="date"
                className="form-input"
                {...register(`${memberKey}.passport_issue_date` as any)}
              />
            </div>

            <div>
              <label className="form-label">Код подразделения</label>
              <input
                type="text"
                className="form-input"
                {...register(`${memberKey}.passport_code` as any)}
                placeholder="123-456"
              />
            </div>

            <div className="md:col-span-2">
              <label className="form-label">Кем выдан паспорт</label>
              <input
                type="text"
                className="form-input"
                {...register(`${memberKey}.passport_issued_by` as any)}
                placeholder="ОУФМС России по г. Москва"
              />
            </div>

            <div className="md:col-span-2">
              <label className="form-label">Адрес регистрации</label>
              <input
                type="text"
                className="form-input"
                {...register(`${memberKey}.passport_address` as any)}
                placeholder="г. Москва, ул. Примерная, д. 1, кв. 1"
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Навигация */}
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-primary-600 hover:text-primary-700">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Вернуться к выбору
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Тестовая кнопка для загрузки данных */}
        {SHOW_TEST_BUTTON && (
          <div className="text-center mb-6">
            <button
              type="button"
              onClick={fillTestData}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              🧪 Загрузить тестовые данные
            </button>
          </div>
        )}

        {/* Форма */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Основная информация */}
          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Основная информация
              </h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="form-label">Название кооператива *</label>
                  <input
                    type="text"
                    className="form-input"
                    {...register('name', { required: 'Название обязательно' })}
                    placeholder="ТЕСТ"
                  />
                  {errors.name && (
                    <p className="form-error">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Город *</label>
                  <input
                    type="text"
                    className="form-input"
                    {...register('city', { required: 'Город обязателен' })}
                    placeholder="Москва"
                  />
                  {errors.city && (
                    <p className="form-error">{errors.city.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Сайт</label>
                  <input
                    type="url"
                    className="form-input"
                    {...register('website')}
                    placeholder="https://test.coop"
                  />
                </div>

                <div>
                  <label className="form-label">Дата учредительного собрания *</label>
                  <input
                    type="date"
                    className="form-input"
                    {...register('founding_date', { required: 'Дата обязательна' })}
                  />
                  {errors.founding_date && (
                    <p className="form-error">{errors.founding_date.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Email для связи</label>
                  <input
                    type="email"
                    className="form-input"
                    {...register('contact_email')}
                    placeholder="info@test.coop"
                  />
                </div>

                <div>
                  <label className="form-label">Email конфиденциальности</label>
                  <input
                    type="email"
                    className="form-input"
                    {...register('confidential_email')}
                    placeholder="privacy@test.coop"
                  />
                </div>

                <div>
                  <label className="form-label">Ссылка на политику конфиденциальности</label>
                  <input
                    type="url"
                    className="form-input"
                    {...register('confidential_link')}
                    placeholder="https://test.coop/privacy"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Финансовые параметры */}
          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                Финансовые параметры
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                <a href="https://blog.blago.coop/paevoy-vznos/" className="text-primary-600 underline">
                  Что такое паевой взнос и чем он отличается от вступительного
                </a>
              </p>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="form-label">Первоначальный взнос физ. лиц (руб.)</label>
                  <input
                    type="number"
                    className="form-input"
                    {...register('initial_individuals_and_entprs', { 
                      required: 'Размер взноса обязателен',
                      min: { value: 0, message: 'Размер взноса не может быть отрицательным' }
                    })}
                  />
                  {errors.initial_individuals_and_entprs && (
                    <p className="form-error">{errors.initial_individuals_and_entprs.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Размер взноса физ. лиц (прописью)</label>
                  <input
                    type="text"
                    className="form-input"
                    {...register('initial_individuals_and_entprs_text')}
                    placeholder="Сто"
                  />
                </div>

                <div>
                  <label className="form-label">Первоначальный взнос юр. лиц (руб.)</label>
                  <input
                    type="number"
                    className="form-input"
                    {...register('initial_organizations', { 
                      required: 'Размер взноса обязателен',
                      min: { value: 0, message: 'Размер взноса не может быть отрицательным' }
                    })}
                  />
                  {errors.initial_organizations && (
                    <p className="form-error">{errors.initial_organizations.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Размер взноса юр. лиц (прописью)</label>
                  <input
                    type="text"
                    className="form-input"
                    {...register('initial_organizations_text')}
                    placeholder="Одна тысяча"
                  />
                </div>

                <div>
                  <label className="form-label">Минимальный взнос физ. лиц (руб.)</label>
                  <input
                    type="number"
                    className="form-input"
                    {...register('minimum_individuals_and_entprs')}
                  />
                </div>

                <div>
                  <label className="form-label">Минимальный взнос физ. лиц (прописью)</label>
                  <input
                    type="text"
                    className="form-input"
                    {...register('minimum_individuals_and_entprs_text')}
                    placeholder="Триста"
                  />
                </div>

                <div>
                  <label className="form-label">Минимальный взнос юр. лиц (руб.)</label>
                  <input
                    type="number"
                    className="form-input"
                    {...register('minimum_organizations')}
                  />
                </div>

                <div>
                  <label className="form-label">Минимальный взнос юр. лиц (прописью)</label>
                  <input
                    type="text"
                    className="form-input"
                    {...register('minimum_organizations_text')}
                    placeholder="Три тысячи"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Данные протокола */}
          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Данные протокола №1
              </h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="form-label">Дата проведения</label>
                  <input
                    type="date"
                    className="form-input"
                    {...register('protocol_1_date')}
                  />
                </div>

                <div>
                  <label className="form-label">Время начала</label>
                  <input
                    type="time"
                    className="form-input"
                    {...register('protocol_1_open_time')}
                  />
                </div>

                <div>
                  <label className="form-label">Время окончания</label>
                  <input
                    type="time"
                    className="form-input"
                    {...register('protocol_1_close_time')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Адрес кооператива по ГАР — один на все документы */}
          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-medium text-gray-900 mb-1">Адрес кооператива</h3>
              <p className="text-sm text-gray-500 mb-3">
                Адрес попадёт в форму Р11001, протокол и гарантийное письмо. Налоговая принимает адрес
                только в том виде, как он записан в Государственном адресном реестре (ГАР).
              </p>
              <ol className="mb-3 list-decimal space-y-1 pl-5 text-sm text-gray-600">
                <li>
                  Откройте{' '}
                  <a href="https://fias.nalog.ru" target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">fias.nalog.ru</a>{' '}
                  — официальный сайт ГАР, поиск бесплатный и без регистрации.
                </li>
                <li>Найдите адрес без индекса или по кадастровому номеру помещения из выписки ЕГРН.</li>
                <li>Откройте карточку объекта и смотрите адрес в муниципальном делении.</li>
                <li>Перепишите элементы в поля ниже, сокращения типов («ул.», «д.», «помещение») — как в карточке.</li>
              </ol>
              <p className="mb-4 text-sm text-gray-500">
                Если адрес не находится, попросите у собственника помещения акт о присвоении адреса. Пустые поля пропустите.
              </p>
              <div className="grid gap-4 md:grid-cols-4">
                {ADDRESS_FIELDS.map((f) => (
                  <div key={f.key} className={f.span === 2 ? 'md:col-span-2' : f.span === 4 ? 'md:col-span-4' : undefined}>
                    <label className="form-label">{f.label}</label>
                    {f.options ? (
                      <select className="form-select" {...register(`address.${f.key}` as const)}>
                        <option value="">—</option>
                        {f.options.map(([v, l]) => <option key={v} value={v}>{v} — {l}</option>)}
                      </select>
                    ) : (
                      <input type="text" className="form-input" {...register(`address.${f.key}` as const)} placeholder={f.placeholder} />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Адрес в документах: <span className="text-gray-800">{addressText(watch('address')) || '—'}</span>
              </p>
            </div>
          </div>

          {/* Полномочия председателя без кворума — п. 13.2 и 13.4 устава */}
          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-medium text-gray-900 mb-1">Полномочия председателя совета</h3>
              <p className="text-sm text-gray-500 mb-4">
                Вопросы пункта 13.4 устава, которые председатель решает единолично, когда у совета нет кворума.
                Если выбраны а) или е), подпункт ж) о приостановлении полномочий председателя исключается из устава,
                а буквы подпунктов после него сдвигаются.
              </p>
              <div className="grid gap-2 md:grid-cols-2">
                {CHAIR_OPTIONS.map(([letter, label]: string[]) => (
                  <label key={letter} className="flex items-start gap-2 text-sm text-gray-700">
                    <input type="checkbox" value={letter} className="mt-1" {...register('chair_powers')} />
                    <span><b>{letter})</b> {label}</span>
                  </label>
                ))}
                <label className="flex items-start gap-2 text-sm text-gray-400">
                  <input type="checkbox" className="mt-1" checked={keepsZh(chairPowers)} disabled readOnly />
                  <span><b>ж)</b> приостановление полномочий председателя советом — {keepsZh(chairPowers) ? 'остаётся в уставе' : 'исключён, выбраны а) или е)'}</span>
                </label>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                В уставе:{' '}
                <span className="text-gray-800">
                  {chairPowersData(chairPowers).chair_has
                    ? `«…по вопросам, перечисленным в ${chairPowersData(chairPowers).chair_abzac} подпункта 13.4 настоящего Устава, при отсутствии кворума…»`
                    : 'предложения о единоличных решениях председателя нет'}
                </span>
              </p>
            </div>
          </div>

          {/* Данные только для заявления Р11001 */}
          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-medium text-gray-900 mb-1">Для заявления Р11001</h3>
              <p className="text-sm text-gray-500 mb-4">
                Коды ОКВЭД через запятую, первый — основной вид деятельности. По умолчанию стоит набор
                кодов потребительского кооператива, его можно изменить.
              </p>
              <textarea className="form-textarea" rows={3} {...register('okved')} />
              <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" {...register('paper_copy')} />
                Выдать председателю документы о регистрации ещё и на бумаге
              </label>
            </div>
          </div>

          {/* Учредители */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Учредители
              </h3>
              {/* Убираем кнопку добавления */}
            </div>
            <p className="text-sm text-gray-500">
              Протокол избирает учредителя 2 председателем совета, учредителя 6 — ревизором, остальных — членами совета.{' '}
              <a href="https://blog.blago.coop/organy-kooperativa/" className="text-primary-600 underline">
                Органы кооператива: совет, председатель, ревизионная комиссия
              </a>
            </p>

            {Array.from({ length: 6 }).map((_, index) => 
              renderMemberForm(index)
            )}
          </div>

          {/* Гарантийное письмо собственника помещения — необязательно */}
          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                Собственник помещения
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Необязательно. Данные для гарантийного письма собственника помещения. Пустые поля
                останутся в письме жёлтыми подсказками, их можно заполнить в Word.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                {GARANT_FIELDS.map((f) => (
                  <div key={f.key} className={f.wide ? 'md:col-span-2' : undefined}>
                    <label className="form-label">{f.label}</label>
                    <input
                      type={f.date ? 'date' : 'text'}
                      className="form-input"
                      {...register(`garant.${f.key}` as const)}
                      placeholder={f.placeholder}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Хватает ли данных для заявления Р11001 */}
          <div className={`card ${r11001Missing.length ? 'border-yellow-300 bg-yellow-50' : 'border-success-200 bg-success-50'}`}>
            <div className="card-body">
              {r11001Missing.length === 0 ? (
                <p className="text-success-800">Данных хватает: форма Р11001 будет заполнена.</p>
              ) : (
                <details>
                  <summary className="cursor-pointer text-yellow-900">
                    Для заполнения формы Р11001 не хватает данных ({r11001Missing.length}). Остальные документы будут готовы,
                    а в архив попадёт пустой бланк Р11001 и список недостающего.
                  </summary>
                  <ul className="mt-3 list-disc pl-5 text-sm text-yellow-900 space-y-1">
                    {r11001Missing.map((m) => <li key={m}>{m}</li>)}
                  </ul>
                </details>
              )}
            </div>
          </div>

          {/* Кнопка отправки / плашка с результатом */}
          <div>
            {generationResult ? (
              <div className="card border-success-200 bg-success-50">
                <div className="card-body text-center">
                  <div className="flex justify-center mb-4">
                    <DocumentArrowDownIcon className="h-12 w-12 text-success-600" />
                  </div>
                  <h3 className="text-lg font-medium text-success-800 mb-2">
                    Документы успешно сгенерированы!
                  </h3>
                  <p className="text-success-700 mb-4">
                    Сгенерировано {generationResult.files?.length || 0} документов
                  </p>
                  <p className="text-success-700 mb-4 text-sm">
                    {generationResult.r11001Missing?.length
                      ? 'Форма Р11001 — пустой бланк и список недостающих данных.'
                      : 'Форма Р11001 заполнена.'}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      type="button"
                      onClick={downloadFiles}
                      className="btn-success inline-flex items-center justify-center"
                    >
                      <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                      Скачать документы
                    </button>
                    <button
                      type="button"
                      onClick={() => setGenerationResult(null)}
                      className="px-4 py-2 border border-success-300 text-success-800 rounded hover:bg-success-100 transition-colors"
                    >
                      Сгенерировать ещё раз
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="btn-success px-8 py-3 text-lg"
                >
                  {isGenerating ? 'Генерация...' : 'Сгенерировать документы'}
                </button>
                <p className="text-sm text-gray-500 mt-3">
                  Браузер заполняет документы на вашем устройстве. Данные формы не передаются на сервер.
                </p>
              </div>
            )}
          </div>
        </form>

        {/* Ошибка */}
        {error && (
          <div className="card mt-6 border-error-200 bg-error-50">
            <div className="card-body">
              <h3 className="text-lg font-medium text-error-800 mb-2">
                Ошибка генерации
              </h3>
              <p className="text-error-700">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 