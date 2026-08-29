import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, mkdirSync, readdirSync, copyFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')
const targetDir = resolve(rootDir, 'public/assets/icons')

// Ensure target icons directory exists
if (!existsSync(targetDir)) {
  mkdirSync(targetDir, { recursive: true })
}

console.log('Verificação de ícones concluída.')

