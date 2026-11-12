import './globals.css'
import { Golos_Text, Literata } from 'next/font/google'

// Golos Text — основной текст (шрифт создан для русских государственных
// сервисов), Literata — заголовки: книжная антиква под тему документов.
const golos = Golos_Text({ subsets: ['latin', 'cyrillic'], variable: '--font-golos', display: 'swap', adjustFontFallback: false })
const literata = Literata({ subsets: ['latin', 'cyrillic'], variable: '--font-literata', display: 'swap' })

export const metadata = {
  title: 'Документы для регистрации кооператива',
  description:
    'Устав, протокол учредительного собрания, гарантийное письмо и бланк Р11001 для регистрации потребительского кооператива. Заполните онлайн или скачайте шаблоны Word.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${golos.variable} ${literata.variable}`}>
      <body className="font-sans bg-gray-50 min-h-screen antialiased">{children}</body>
    </html>
  )
}
