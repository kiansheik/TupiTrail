# Tupi Trail (PoC)

Aplicativo web estático, mobile-first, inspirado no flow de apps de idiomas, com arquitetura orientada por dados para evoluir um curso de Tupi sem reescrever o core.

## Stack

- Vite + React + TypeScript
- Tailwind CSS
- Framer Motion
- Zustand (persistência em `localStorage`)
- React Router (`HashRouter`, compatível com GitHub Pages)
- `vite-plugin-pwa`
- Vitest
- Web Speech API (TTS)
- Web Audio API (SFX originais)

## Arquitetura

`src/` foi organizado em 3 camadas principais:

1. `app/`: shell da aplicação, roteamento e bootstrap.
2. `core/lesson-engine/`: engine puro de lições (tipos, evaluator, fila de erros, combo, XP, progresso).
3. `data/`: curso, onboarding, personagens e strings de UI (camada editável).

Camadas de suporte:

- `screens/`: fluxo de telas
- `components/`: layout/UI/exercícios
- `store/`: estado global e sessão de lição
- `lib/`: áudio, storage, PWA, utilitários
- `styles/`: tema global

## Fluxo implementado

- Welcome
- Onboarding (intro, confiança, preview semanal, notificações, benefícios)
- Intro da lição
- Runner da lição com 5 tipos de exercício
- Revisão de erros em fila
- Conclusão (XP, accuracy, duração, combo)
- Celebração de streak
- Definição de meta (3/5/7 dias)
- Prompt de instalação
- Mapa de trilha

## Engine de lição

### Tipos de exercício suportados

- `select_image`
- `token_translate`
- `multiple_choice_translation`
- `dialogue_choice`
- `listening_tap`

### Regras implementadas

- Avaliação pura via `evaluateExercise(exercise, userAnswer)`
- Fila principal + fila de revisão
- Erros da primeira passagem reordenados e revisados
- Errou na revisão -> volta para o final da fila até acertar
- Combo sobe em acertos consecutivos da primeira passagem
- Combo reseta no erro
- Feedback especial a partir de `x3`

## Camada de dados

Principais arquivos:

- Curso + lookup: `src/data/course/en/course.ts`
- Lição seed (template linguístico): `src/data/course/en/unit1/lesson1.ts`
- Onboarding: `src/data/onboarding/en.ts`
- Strings UI: `src/data/ui/strings.en.ts`
- Personagens: `src/data/characters/characters.ts`
- Lexicon e mapeamento: `src/data/lexicon/*`

Regra prática: se algo puder mudar no futuro sem alterar lógica, coloque em `data/`.

## Como adicionar nova lição

1. Crie um arquivo em `src/data/course/en/unitX/lessonY.ts` com `LessonTemplateData`.
2. Marque cada termo/frase com idioma (`enText`, `ptBrText`, `tupiText`).
3. Materialize com `materializeLesson(...)` ao montar o `courseEn`.
3. Garanta IDs únicos para `lesson.id` e `exercise.id`.
4. Ajuste `pathNodesSeed` para refletir desbloqueios no mapa.
5. Se necessário, inclua novas strings em `src/data/ui/strings.en.ts`.

Sem mudanças no `LessonRunnerScreen`, a engine renderiza qualquer lição compatível com os tipos.

## Camada linguística (`en -> tupi`)

O conteúdo linguístico agora aceita metadados de idioma por termo/frase:

- `enText('coffee')`
- `ptBrText('por favor')`
- `tupiText('...')`

Isso permite:

- continuar definindo lições em inglês;
- traduzir depois via mapa único;
- propagar a tradução automaticamente em todo lugar onde a expressão aparece.

Arquivos principais:

- `src/data/lexicon/types.ts`
- `src/data/lexicon/helpers.ts`
- `src/data/lexicon/enToTupi.map.ts`
- `src/data/lexicon/materializeLesson.ts`

Target de build para o lexicon:

- padrão: `en` (sem substituição)
- para ativar substituição: `VITE_LEXICON_TARGET_LANG=tupi`

Exemplo:

```bash
VITE_LEXICON_TARGET_LANG=tupi npm run build
```

Inventário lexical único extraído da lição:

- `lessonLexiconInventory` em `src/data/course/en/course.ts`

## Áudio

- TTS: `src/lib/audio/speech.ts`
- SFX originais: `src/lib/audio/sfx.ts`

### Trocar TTS por áudio gravado

No dado do exercício, troque:

```ts
audio: { mode: 'tts', text: 'tea', lang: 'en-US' }
```

por:

```ts
audio: { mode: 'file', src: '/audio/tea.mp3', slowSrc: '/audio/tea-slow.mp3' }
```

A UI e a engine permanecem iguais.

## Persistência

Fonte de verdade: `localStorage` via Zustand persist.

Persistimos:

- perfil/visitor
- onboarding concluído
- XP total / gems
- streak / meta de streak
- lições concluídas e desbloqueadas
- posição do mapa
- estado resumido de sessão (`lessonResume`)

Cookies mínimos opcionais:

- `tupi_app_seen`
- `tupi_visitor_id`

## PWA

Configuração em `vite.config.ts` (`VitePWA`).

- manifest gerado
- service worker (`generateSW`)
- ícones SVG em `public/icons/`

## Executar localmente

```bash
npm install
npm run dev
```

## Testes

```bash
npm run test:run
```

Cobertura mínima implementada para:

- evaluator
- fila de erros
- combo
- helpers de persistência local

## Build

```bash
npm run build
npm run preview
```

## Deploy no GitHub Pages

Como o app usa `HashRouter` e `base: './'`, ele funciona em Pages sem rewrite server-side.

Fluxo típico:

1. `make deploy-gh-pages COMMIT_MSG="chore: release" PAGES_MSG="deploy: release"`
2. Isso executa: `lint` -> `build` -> `test:run` -> `git add/commit/push` -> publish da branch `gh-pages`.
