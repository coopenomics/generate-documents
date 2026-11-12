'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { ArrowLeftIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { NewCooperativeData, Member, GarantLetterData } from '../../../../../packages/shared/src'
import { generateNewCooperative, saveBlob, SHOW_TEST_BUTTON } from '../../lib/generator'

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
    setValue('chairman_full_name', 'Иванов Иван Иванович')
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
    setValue('index_and_full_address', '123456, г. Москва, ул. Тестовая, д. 1, оф. 101')
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
                  <label className="form-label">ФИО председателя *</label>
                  <input
                    type="text"
                    className="form-input"
                    {...register('chairman_full_name', { required: 'ФИО председателя обязательно' })}
                    placeholder="Иванов Иван Иванович"
                  />
                  {errors.chairman_full_name && (
                    <p className="form-error">{errors.chairman_full_name.message}</p>
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Финансовые параметры
              </h3>
              
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
                  <label className="form-label">Адрес проведения</label>
                  <input
                    type="text"
                    className="form-input"
                    {...register('index_and_full_address')}
                    placeholder="123456, г. Москва, ул. Примерная, д. 1"
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

          {/* Учредители */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Учредители
              </h3>
              {/* Убираем кнопку добавления */}
            </div>

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