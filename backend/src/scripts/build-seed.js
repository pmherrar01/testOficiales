// Fusiona las preguntas Verdadero/Falso generadas automáticamente (a partir de
// database/seed/raw-vf-result.json) con las preguntas ya presentes en
// database/seed/questions.json (incluidas las que el usuario haya curado a
// mano), evitando duplicados por texto de pregunta. NO modifica ni reordena
// las preguntas ya existentes en questions.json.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SEED_DIR = path.resolve(__dirname, '../../../database/seed')
const RAW_FILE = path.join(SEED_DIR, 'raw-vf-result.json')
const OUT_FILE = path.join(SEED_DIR, 'questions.json')

function normalizeKey(text) {
  return String(text || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function statementToRow(item, source) {
  return {
    question_text: item.statement,
    option_a: 'Verdadero',
    option_b: 'Falso',
    option_c: '',
    option_d: '',
    correct_option: item.isTrue ? 'a' : 'b',
    reference: item.reference || '',
    category: item.category || '',
    difficulty: item.difficulty || 'media',
    source: item.source || source,
    source_page: item.sourcePage ?? null,
  }
}

function main() {
  const existing = existsSync(OUT_FILE) ? JSON.parse(readFileSync(OUT_FILE, 'utf-8')) : []
  if (!existsSync(RAW_FILE)) {
    throw new Error(`No existe ${RAW_FILE}. Genera primero el resultado del workflow de conversión a V/F.`)
  }
  const raw = JSON.parse(readFileSync(RAW_FILE, 'utf-8'))

  const seen = new Set(existing.map((q) => normalizeKey(q.question_text)))
  const merged = [...existing]

  let added = 0
  let skippedDupe = 0
  let skippedInvalid = 0

  const candidates = [
    ...(raw.oficialesVF || []).map((s) => statementToRow(s, 'oficiales')),
    ...(raw.normasVF || []).map((s) => statementToRow(s, 'normas_2026')),
  ]

  for (const row of candidates) {
    if (!row.question_text || !row.correct_option) {
      skippedInvalid += 1
      continue
    }
    const key = normalizeKey(row.question_text)
    if (seen.has(key)) {
      skippedDupe += 1
      continue
    }
    seen.add(key)
    merged.push(row)
    added += 1
  }

  writeFileSync(OUT_FILE, JSON.stringify(merged, null, 2), 'utf-8')
  console.log(`questions.json: ${existing.length} ya existentes + ${added} nuevas = ${merged.length} totales.`)
  console.log(`Descartadas: ${skippedDupe} duplicadas, ${skippedInvalid} inválidas.`)
}

main()
