'use client'

import Link from 'next/link'
import { BASE_PATH } from '../lib/generator'

// Шаблоны Word собирает scripts/make-samples.mjs перед сборкой сайта
const SAMPLES_URL = `${BASE_PATH}/samples/shablony-novyy-kooperativ.zip`
const SOURCE_URL = 'https://github.com/coopenomics/generate-documents'

const DOCUMENTS = [
  {
    title: 'Устав',
    text: 'Цели кооператива, порядок вступления и выхода пайщиков, взносы и органы управления.',
  },
  {
    title: 'Протокол № 1 учредительного собрания',
    text: 'Решение учредителей о создании кооператива, утверждение устава и выборы совета.',
  },
  {
    title: 'Гарантийное письмо собственника помещения',
    text: 'Согласие собственника на размещение кооператива по адресу регистрации.',
  },
  {
    title: 'Заявление по форме Р11001',
    text: 'Бланк ФНС для регистрации юридического лица. Его заполняют вручную или в программе ФНС.',
  },
]

// Веер листов в первом экране: четыре документа пакета, верхний лист — устав
// с жёлтыми полями, как в шаблонах Word.
const SHEETS = [
  { label: 'Форма Р11001', rotate: -9, x: '-14%', y: '6%' },
  { label: 'Гарантийное письмо', rotate: -3.5, x: '-5%', y: '2%' },
  { label: 'Протокол № 1', rotate: 3, x: '5%', y: '4%' },
]

const Field = ({ children }: { children: React.ReactNode }) => (
  <mark className="rounded-[3px] bg-marker px-1 text-ink">{children}</mark>
)

function Line({ w }: { w: string }) {
  return <span className="block h-[7px] rounded-full bg-rule" style={{ width: w }} />
}

function PaperStack() {
  return (
    <div className="group relative mx-auto aspect-[4/5] w-full max-w-[440px]" aria-hidden="true">
      {SHEETS.map((s, i) => (
        <div
          key={s.label}
          className="rise absolute inset-0 rounded-[18px] border border-rule bg-sheet shadow-[0_1px_0_rgba(28,27,25,0.04),0_18px_40px_-24px_rgba(28,27,25,0.35)]"
          style={{
            transform: `translate(${s.x}, ${s.y}) rotate(${s.rotate}deg)`,
            animationDelay: `${150 + i * 90}ms`,
          }}
        >
          <span className="absolute left-7 top-6 text-[11px] font-medium uppercase tracking-[0.18em] text-graphite">
            {s.label}
          </span>
        </div>
      ))}

      {/* Верхний лист — устав с полями */}
      <div
        className="rise absolute inset-0 flex flex-col rounded-[18px] border border-rule bg-sheet p-9 shadow-[0_1px_0_rgba(28,27,25,0.05),0_30px_60px_-30px_rgba(28,27,25,0.45)] transition-transform duration-700 ease-out group-hover:-translate-y-2 group-hover:rotate-[-1deg]"
        style={{ animationDelay: '450ms' }}
      >
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-graphite">Утверждён протоколом № 1</span>
        <span className="mt-10 text-center font-serif text-[30px] tracking-[0.35em] text-ink">УСТАВ</span>
        <span className="mt-2 text-center text-[13px] text-graphite">
          Потребительского кооператива «<Field>[название]</Field>»
        </span>
        <div className="mt-10 space-y-3">
          <Line w="92%" />
          <Line w="100%" />
          <Line w="78%" />
        </div>
        <p className="mt-6 text-[12.5px] leading-6 text-graphite">
          1.9. Местонахождение Общества: РФ, г. <Field>[город]</Field>.
        </p>
        <div className="mt-6 space-y-3">
          <Line w="100%" />
          <Line w="88%" />
          <Line w="95%" />
          <Line w="60%" />
        </div>
        <span className="mt-auto self-end font-serif text-sm text-graphite">с. 1</span>
      </div>
    </div>
  )
}

function Arrow() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 10h12M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M10 3v10M5.5 8.5 10 13l4.5-4.5M4 16.5h12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16">
        {/* Шапка */}
        <header className="flex h-20 items-center justify-between border-b border-rule">
          <span className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-full border border-seal font-serif text-[15px] text-seal">К</span>
            <span className="text-[15px] font-medium tracking-tight">Документы кооператива</span>
          </span>
          <a href={SOURCE_URL} className="text-sm text-graphite transition-colors hover:text-ink">
            Исходный код
          </a>
        </header>

        {/* Первый экран */}
        <section className="grid items-center gap-16 py-16 lg:grid-cols-12 lg:gap-10 lg:py-28">
          <div className="lg:col-span-7">
            <p className="rise text-xs font-medium uppercase tracking-[0.22em] text-seal">
              Потребительский кооператив · Закон № 3085-1
            </p>
            <h1
              className="rise mt-6 font-serif text-[44px] font-normal leading-[1.04] tracking-[-0.02em] sm:text-6xl xl:text-[84px]"
              style={{ animationDelay: '80ms' }}
            >
              Пакет документов для регистрации кооператива
            </h1>
            <p className="rise mt-8 max-w-[34rem] text-lg leading-8 text-graphite sm:text-xl sm:leading-9" style={{ animationDelay: '160ms' }}>
              Устав, протокол учредительного собрания, гарантийное письмо и бланк заявления Р11001.
              Заполните их онлайн или скачайте шаблоны Word.
            </p>
            <div className="rise mt-10 flex flex-wrap items-center gap-4" style={{ animationDelay: '240ms' }}>
              <Link
                href="/new-cooperative"
                className="group inline-flex items-center gap-3 rounded-full bg-seal px-7 py-4 text-[15px] font-medium text-paper transition-colors hover:bg-seal-dark"
              >
                Заполнить онлайн
                <Arrow />
              </Link>
              <a
                href={SAMPLES_URL}
                download
                className="group inline-flex items-center gap-3 rounded-full border border-ink/15 px-7 py-4 text-[15px] font-medium transition-colors hover:border-ink/40 hover:bg-sheet"
              >
                Скачать шаблоны Word
                <DownloadIcon />
              </a>
            </div>
            <p className="rise mt-8 flex items-center gap-2.5 text-sm text-graphite" style={{ animationDelay: '320ms' }}>
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-seal" />
              Браузер заполняет документы на вашем устройстве. Данные формы остаются у вас.
            </p>
          </div>
          <div className="lg:col-span-5">
            <PaperStack />
          </div>
        </section>

        {/* Два способа */}
        <section className="grid gap-6 pb-24 md:grid-cols-2">
          <div className="flex flex-col rounded-[28px] bg-ink p-10 text-paper lg:p-14">
            <span className="font-serif text-lg text-paper/50">01</span>
            <h2 className="mt-6 font-serif text-4xl tracking-[-0.01em] lg:text-5xl">Заполнить онлайн</h2>
            <p className="mt-5 max-w-md text-lg leading-8 text-paper/70">
              Заполните форму один раз. Браузер подставит данные во все документы и сохранит архив
              на ваш компьютер.
            </p>
            <ol className="mt-10 space-y-4 border-t border-paper/15 pt-8 text-[15px] text-paper/80">
              <li className="flex gap-4"><span className="font-serif text-paper/40">1</span>Данные кооператива и учредителей</li>
              <li className="flex gap-4"><span className="font-serif text-paper/40">2</span>Собственник помещения по желанию</li>
              <li className="flex gap-4"><span className="font-serif text-paper/40">3</span>Архив с четырьмя документами</li>
            </ol>
            <div className="mt-auto pt-12">
              <Link
                href="/new-cooperative"
                className="group inline-flex items-center gap-3 rounded-full bg-paper px-7 py-4 text-[15px] font-medium text-ink transition-colors hover:bg-white"
              >
                Открыть форму
                <Arrow />
              </Link>
            </div>
          </div>

          <div className="flex flex-col rounded-[28px] border border-rule bg-sheet p-10 lg:p-14">
            <span className="font-serif text-lg text-graphite/60">02</span>
            <h2 className="mt-6 font-serif text-4xl tracking-[-0.01em] lg:text-5xl">Скачать шаблоны Word</h2>
            <p className="mt-5 max-w-md text-lg leading-8 text-graphite">
              Четыре файла для заполнения вручную. Места для данных выделены жёлтым и подписаны
              в квадратных скобках.
            </p>
            <figure className="mt-10 border-t border-rule pt-8">
              <p className="font-serif text-[17px] leading-8 text-ink">
                Потребительский Кооператив «<Field>[название]</Field>», именуемый в дальнейшем «Общество»,
                создан и действует в соответствии с Конституцией Российской Федерации…
              </p>
              <figcaption className="mt-3 text-sm text-graphite">Первый абзац устава в шаблоне</figcaption>
            </figure>
            <div className="mt-auto pt-12">
              <a
                href={SAMPLES_URL}
                download
                className="group inline-flex items-center gap-3 rounded-full border border-ink/15 px-7 py-4 text-[15px] font-medium transition-colors hover:border-ink/40 hover:bg-paper"
              >
                Скачать архив
                <DownloadIcon />
              </a>
            </div>
          </div>
        </section>

        {/* Состав пакета */}
        <section className="border-t border-rule py-24">
          <h2 className="font-serif text-4xl tracking-[-0.01em] lg:text-5xl">Что входит в пакет</h2>
          <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {DOCUMENTS.map((d, i) => (
              <div key={d.title} className="border-t border-ink pt-6">
                <span className="font-serif text-sm text-graphite">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="mt-3 text-lg font-medium leading-snug">{d.title}</h3>
                <p className="mt-3 text-[15px] leading-7 text-graphite">{d.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Приватность */}
        <section className="pb-24">
          <div className="grid gap-8 rounded-[28px] bg-seal px-10 py-14 text-paper lg:grid-cols-12 lg:px-14 lg:py-16">
            <h2 className="font-serif text-3xl leading-tight tracking-[-0.01em] lg:col-span-6 lg:text-4xl">
              Данные остаются на вашем устройстве
            </h2>
            <p className="text-lg leading-8 text-paper/80 lg:col-span-6">
              Сайт работает без сервера. Браузер сам заполняет шаблоны и сохраняет архив, поэтому ФИО,
              паспорта и ИНН учредителей остаются у вас.
            </p>
          </div>
        </section>

        {/* Подвал */}
        <footer className="flex flex-col gap-3 border-t border-rule py-10 text-sm text-graphite sm:flex-row sm:items-center sm:justify-between">
          <span>Документы для регистрации потребительского кооператива</span>
          <a href={SOURCE_URL} className="transition-colors hover:text-ink">
            Исходный код открыт на GitHub
          </a>
        </footer>
      </div>
    </div>
  )
}
