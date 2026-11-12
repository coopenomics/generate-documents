/** @type {import('next').NextConfig} */
// Статический сайт без сервера: next build выгружает HTML, JS и шаблоны
// в каталог out/, GitHub Pages раздаёт его как есть. basePath задаёт
// подкаталог репозитория на github.io (переменная NEXT_PUBLIC_BASE_PATH).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

const nextConfig = {
  output: 'export',
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
}

module.exports = nextConfig
