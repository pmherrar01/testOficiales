export const DISPLAY_LETTERS = ['A', 'B', 'C', 'D']

export function shuffleOptionOrder() {
  const letters = ['A', 'B', 'C', 'D']
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[letters[i], letters[j]] = [letters[j], letters[i]]
  }
  return letters.join('')
}

export function buildDisplayOptions(row, optionOrder) {
  const textByLetter = {
    A: row.option_a,
    B: row.option_b,
    C: row.option_c,
    D: row.option_d,
  }
  return DISPLAY_LETTERS.map((displayLetter, idx) => ({
    letter: displayLetter,
    text: textByLetter[optionOrder[idx]],
  }))
}

export function displayLetterToOriginal(optionOrder, displayLetter) {
  const idx = DISPLAY_LETTERS.indexOf(displayLetter)
  if (idx === -1) return null
  return optionOrder[idx]
}
