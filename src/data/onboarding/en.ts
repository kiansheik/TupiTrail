export type IntroStep = {
  id: 'mascot' | 'quick-questions'
  title: string
  description: string
  mascotMood?: 'happy' | 'encouraging'
  nextPath: string
}

export const introSteps: IntroStep[] = [
  {
    id: 'mascot',
    title: 'Oi, eu sou a Tama!',
    description: 'Vou te acompanhar em cada lição para manter ritmo e constância.',
    mascotMood: 'happy',
    nextPath: '/onboarding/intro/quick-questions',
  },
  {
    id: 'quick-questions',
    title: 'Só 8 perguntas rápidas',
    description: 'Isso ajuda a personalizar seu começo e manter o hábito diário.',
    mascotMood: 'encouraging',
    nextPath: '/onboarding/confidence',
  },
]

export const confidenceOptions = [
  { id: 'level1', label: 'Sou iniciante (recomendado)', description: 'Quero começar do zero' },
  { id: 'level2', label: 'Sei um pouco', description: 'Já vi algumas palavras' },
  { id: 'level3', label: 'Tenho confiança', description: 'Consigo formar frases simples' },
]

export const threeMonthBenefits = [
  'Falar com mais confiança em situações reais.',
  'Construir vocabulário útil para o dia a dia.',
  'Consolidar um hábito consistente de estudo.',
]
