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
    title: 'Só umas perguntas rápidas',
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

export type ThreeMonthBenefit = {
  id: 'confidence' | 'vocabulary' | 'habit'
  title: string
  description: string
  tone: 'mint' | 'amber' | 'sky'
}

export const threeMonthBenefits: ThreeMonthBenefit[] = [
  {
    id: 'confidence',
    title: 'Falar com mais confiança',
    description: 'Você responde com naturalidade em situações reais.',
    tone: 'mint',
  },
  {
    id: 'vocabulary',
    title: 'Vocabulário útil no dia a dia',
    description: 'Mais palavras práticas para conversar sem travar.',
    tone: 'amber',
  },
  {
    id: 'habit',
    title: 'Hábito consistente de estudo',
    description: 'Sessões curtas viram rotina sem desgaste mental.',
    tone: 'sky',
  },
]
