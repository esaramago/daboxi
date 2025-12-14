import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, mkdirSync, readdirSync, copyFileSync, statSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')
const sourceDir = resolve(rootDir, 'node_modules/@shoelace-style/shoelace/dist/assets/icons')
const targetDir = resolve(rootDir, 'public/assets/icons')

function copyRecursive(src, dest) {
  // Criar diretório de destino se não existir
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true })
  }

  // Ler conteúdo do diretório fonte
  const entries = readdirSync(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = resolve(src, entry.name)
    const destPath = resolve(dest, entry.name)

    if (entry.isDirectory()) {
      // Se for diretório, criar recursivamente
      copyRecursive(srcPath, destPath)
    } else {
      // Se for arquivo, copiar
      copyFileSync(srcPath, destPath)
    }
  }
}

try {
  // Verificar se o diretório fonte existe
  if (!existsSync(sourceDir)) {
    console.warn(`Diretório fonte não encontrado: ${sourceDir}`)
    console.warn('Os ícones do Shoelace podem não estar instalados.')
    process.exit(0)
  }

  // Copiar arquivos
  console.log('Copiando ícones do Shoelace...')
  copyRecursive(sourceDir, targetDir)
  console.log(`Ícones copiados com sucesso para: ${targetDir}`)
} catch (error) {
  console.error('Erro ao copiar ícones do Shoelace:', error)
  process.exit(1)
}

