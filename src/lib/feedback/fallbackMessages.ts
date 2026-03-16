// Generic feedback messages shown when the exercise has no custom explanation text.
// Pool is large enough that it feels varied; stable per render via useState initializer.

export const CORRECT_MESSAGES = [
  'Perfeito! Continue assim!',
  'Muito bem! Você está arrasando!',
  'Excelente! Seu progresso é incrível!',
  'Ótimo trabalho! Você consegue!',
  'Mandou bem! Cada acerto conta.',
  'Show! Você está aprendendo rápido!',
  'Parabéns! Cada acerto te aproxima da fluência.',
  'Isso aí! Você está no caminho certo.',
  'Incrível! Assim se aprende.',
  'Brilhante! Guarda essa palavra.',
] as const

export const INCORRECT_MESSAGES = [
  'Quase! Você vai chegar lá.',
  'Não foi dessa vez, mas você está melhorando!',
  'Tudo bem errar — é assim que se aprende.',
  'Boa tentativa! Olha a resposta correta e tenta de novo.',
  'Não desanima! Cada erro ensina algo novo.',
  'Continua! A próxima você acerta.',
  'Tá chegando lá! Não para não.',
  'Faz parte! Todo mundo erra no começo.',
  'Você está no caminho certo, precisa de mais prática.',
  'Não foi dessa, mas a gente aprende errando também!',
] as const

export function randomCorrectMessage(): string {
  return CORRECT_MESSAGES[Math.floor(Math.random() * CORRECT_MESSAGES.length)]
}

export function randomIncorrectMessage(): string {
  return INCORRECT_MESSAGES[Math.floor(Math.random() * INCORRECT_MESSAGES.length)]
}
