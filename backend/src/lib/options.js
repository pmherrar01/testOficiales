export const ALL_LETTERS = ['A', 'B', 'C', 'D']

function hasText(value) {
  return value !== null && value !== undefined && String(value).trim() !== ''
}

// Letras (en el orden original A-D de la BD) que tienen texto real.
// La mayoría de preguntas son Verdadero/Falso -> solo A y B.
export function getPopulatedLetters(row) {
  return ALL_LETTERS.filter((letter) => hasText(row[`option_${letter.toLowerCase()}`]))
}

// Para Verdadero/Falso (2 opciones) no barajamos: el orden natural
// "Verdadero, Falso" es más claro y no aporta nada ocultar cuál es cuál
// ya que las propias etiquetas son el contenido. Con 3-4 opciones sí
// barajamos para que no se memorice la posición.
export function shuffleOptionOrder(row) {
  const letters = getPopulatedLetters(row)
  if (letters.length <= 2) return letters.join('')
  const shuffled = [...letters]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.join('')
}

export function buildDisplayOptions(row, optionOrder) {
  const textByLetter = {
    A: row.option_a,
    B: row.option_b,
    C: row.option_c,
    D: row.option_d,
  }
  return optionOrder.split('').map((originalLetter, idx) => ({
    letter: ALL_LETTERS[idx],
    text: textByLetter[originalLetter],
  }))
}

export function displayLetterToOriginal(optionOrder, displayLetter) {
  const idx = ALL_LETTERS.indexOf(displayLetter)
  if (idx === -1 || idx >= optionOrder.length) return null
  return optionOrder[idx]
}
