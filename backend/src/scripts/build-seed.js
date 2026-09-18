// Convierte el JSON crudo extraído del PDF (question/correctAnswer/distractors)
// en el formato final de siembra (optionA..D + correctOption), colocando la
// respuesta correcta en una posición aleatoria entre las 4 opciones.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const RAW_FILE = path.resolve(__dirname, '../../../database/seed/raw-extracted.json')
const OUT_FILE = path.resolve(__dirname, '../../../database/seed/questions.json')

const LETTERS = ['A', 'B', 'C', 'D']

function shuffle(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function main() {
  const raw = JSON.parse(readFileSync(RAW_FILE, 'utf-8'))
  const items = [...(raw.oficiales || []), ...(raw.normas || [])]

  const seen = new Set()
  const output = []

  for (const item of items) {
    if (!item.question || !item.correctAnswer || !Array.isArray(item.distractors) || item.distractors.length !== 3) {
      continue
    }
    const key = item.question.trim().toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    const options = shuffle([
      { text: item.correctAnswer, correct: true },
      ...item.distractors.map((d) => ({ text: d, correct: false })),
    ])

    const correctIndex = options.findIndex((o) => o.correct)

    output.push({
      question: item.question,
      optionA: options[0].text,
      optionB: options[1].text,
      optionC: options[2].text,
      optionD: options[3].text,
      correctOption: LETTERS[correctIndex],
      reference: item.reference || '',
      category: item.category || '',
      difficulty: item.difficulty || 'media',
      source: item.source || 'oficiales',
      sourcePage: item.sourcePage || null,
    })
  }

  writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf-8')
  console.log(`Escritas ${output.length} preguntas en ${OUT_FILE} (de ${items.length} extraídas, ${items.length - output.length} descartadas por duplicado/incompletas)`)
}

main()
