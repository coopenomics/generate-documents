'use client'

import { BuildingOfficeIcon, DocumentArrowDownIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { BASE_PATH } from '../lib/generator'

// Шаблоны Word собирает scripts/make-samples.mjs перед сборкой сайта
const SAMPLES_URL = `${BASE_PATH}/samples/shablony-novyy-kooperativ.zip`

export default function HomePage() {
  return (
    <div className="px-4 sm:px-0">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Генерация документов для кооперативов
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Скачайте шаблоны в формате Word и заполните их сами или заполните форму онлайн,
          и система подставит данные в документы.
        </p>
        <p className="text-sm text-gray-500 max-w-2xl mx-auto mt-3">
          Браузер заполняет документы на вашем устройстве. Данные формы не передаются на сервер и нигде не сохраняются.
        </p>
      </div>

      <div className="max-w-xl mx-auto">
        <div className="card">
          <div className="card-body flex flex-col">
            <div className="flex justify-center mb-4">
              <BuildingOfficeIcon className="h-12 w-12 text-success-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
              Регистрация нового кооператива
            </h3>
            <p className="text-gray-600 mb-4 text-center">
              Учредительные документы для юридической регистрации потребительского кооператива
            </p>
            <ul className="text-sm text-gray-500 space-y-2 text-left">
              <li>• Типовой Устав кооператива</li>
              <li>• Протокол №1 учредительного собрания</li>
            </ul>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col items-center text-center">
                <a href={SAMPLES_URL} download className="btn-secondary w-full justify-center">
                  <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                  Скачать шаблоны
                </a>
                <p className="text-xs text-gray-500 mt-2">
                  Документы Word. Места для заполнения выделены жёлтым и подписаны в квадратных скобках.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <Link href="/new-cooperative" className="btn-success w-full justify-center">
                  <PencilSquareIcon className="h-5 w-5 mr-2" />
                  Заполнить онлайн
                </Link>
                <p className="text-xs text-gray-500 mt-2">
                  Заполните форму, и браузер подставит данные в устав и протокол.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
