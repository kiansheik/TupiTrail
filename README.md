
# Tupi Trail

**Official site:** [https://tama.academiatupi.com](https://tama.academiatupi.com)

---

## About / Sobre

**EN:**
Tupi Trail is a static, mobile-first web app for learning the Tupi language, with a data-driven architecture that allows the course to evolve without rewriting the core. This project is not affiliated with Duolingo or any other language app.

**PT:**
Tupi Trail é um aplicativo web estático, mobile-first, para aprender a língua Tupi, com arquitetura orientada por dados para evoluir o curso sem reescrever o core. Este projeto não é afiliado ao Duolingo ou a qualquer outro app de idiomas.

---

## Features / Funcionalidades

**EN:**
- Welcome and onboarding flow (intro, confidence, weekly preview, notifications, benefits)
- Lesson intro and runner with 5 exercise types
- Error review queue
- Lesson completion summary (XP, accuracy, duration, combo)
- Streak celebration and goal setting (3/5/7 days)
- Install prompt (PWA)
- Trail map with unlockable lessons
- Audio playback and original SFX
- Full offline support (PWA)

**PT:**
- Fluxo de boas-vindas e onboarding (intro, confiança, preview semanal, notificações, benefícios)
- Intro e execução de lição com 5 tipos de exercício
- Fila de revisão de erros
- Resumo de conclusão (XP, acertos, duração, combo)
- Celebração de streak e definição de meta (3/5/7 dias)
- Prompt de instalação (PWA)
- Mapa de trilha com lições desbloqueáveis
- Reprodução de áudio e SFX originais
- Suporte offline completo (PWA)

---

## How to Use / Como Usar

**EN:**
1. Visit [https://tama.academiatupi.com](https://tama.academiatupi.com)
2. Complete onboarding and start your first lesson.
3. Progress through lessons, review mistakes, and unlock new content on the trail map.
4. Set your streak goal and track your progress.
5. Optionally, install the app as a PWA for offline use.

**PT:**
1. Acesse [https://tama.academiatupi.com](https://tama.academiatupi.com)
2. Complete o onboarding e inicie sua primeira lição.
3. Prossiga pelas lições, revise erros e desbloqueie novos conteúdos no mapa da trilha.
4. Defina sua meta de streak e acompanhe seu progresso.
5. Opcionalmente, instale o app como PWA para uso offline.

---

## Developer Guide / Guia do Desenvolvedor

**EN:**
### Stack
- Vite + React + TypeScript
- Tailwind CSS
- Zustand (localStorage persistence)
- React Router (HashRouter, GitHub Pages compatible)
- Vitest (tests)
- Web Speech API (TTS)
- Web Audio API (SFX)

### Architecture
Three main layers in `src/`:
1. `app/`: app shell, routing, bootstrap
2. `core/lesson-engine/`: pure lesson engine (types, evaluator, error queue, combo, XP, progress)
3. `data/`: course, onboarding, characters, UI strings (editable layer)

Support layers:
- `screens/`: screen flows
- `components/`: layout/UI/exercises
- `store/`: global state and lesson session
- `lib/`: audio, storage, PWA, utilities
- `styles/`: global theme

### Key Commands
```bash
make dev                        # Start dev server
make build                      # TypeScript check + Vite build
make test                       # Run all tests
make lint                       # ESLint
make import-lesson ZIP=path/to/export.zip   # Import lesson ZIP
make delete-lesson LESSON=unit1-my-lesson   # Delete lesson and assets
make check-required-audio        # List missing audio files
make deploy-gh-pages             # Deploy to GitHub Pages
```

### Local Development
```bash
npm install
npm run dev
```

### Tests
```bash
npm run test:run
```

### Build
```bash
npm run build
npm run preview
```

### Deploy
See `make deploy-gh-pages` above. Uses HashRouter and works on GitHub Pages without server rewrites.

---

**PT:**
### Stack
- Vite + React + TypeScript
- Tailwind CSS
- Zustand (persistência localStorage)
- React Router (HashRouter, compatível com GitHub Pages)
- Vitest (testes)
- Web Speech API (TTS)
- Web Audio API (SFX)

### Arquitetura
Três camadas principais em `src/`:
1. `app/`: shell da aplicação, roteamento, bootstrap
2. `core/lesson-engine/`: engine puro de lições (tipos, evaluator, fila de erros, combo, XP, progresso)
3. `data/`: curso, onboarding, personagens, strings de UI (camada editável)

Camadas de suporte:
- `screens/`: fluxo de telas
- `components/`: layout/UI/exercícios
- `store/`: estado global e sessão de lição
- `lib/`: áudio, storage, PWA, utilitários
- `styles/`: tema global

### Comandos principais
```bash
make dev                        # Iniciar servidor de desenvolvimento
make build                      # Checagem TypeScript + build Vite
make test                       # Rodar todos os testes
make lint                       # ESLint
make import-lesson ZIP=path/to/export.zip   # Importar lição ZIP
make delete-lesson LESSON=unit1-my-lesson   # Remover lição e assets
make check-required-audio        # Listar áudios obrigatórios faltantes
make deploy-gh-pages             # Deploy no GitHub Pages
```

### Desenvolvimento local
```bash
npm install
npm run dev
```

### Testes
```bash
npm run test:run
```

### Build
```bash
npm run build
npm run preview
```

### Deploy
Veja `make deploy-gh-pages` acima. Usa HashRouter e funciona no GitHub Pages sem rewrites no servidor.

---

## Legal / Aviso Legal

**EN:** This project is not affiliated with, endorsed by, or connected to Duolingo, Inc. or any other language learning company. For the official project and more information, visit: [https://tama.academiatupi.com](https://tama.academiatupi.com)

**PT:** Este projeto não é afiliado, endossado ou conectado ao Duolingo, Inc. ou qualquer outra empresa de ensino de idiomas. Para o projeto oficial e mais informações, acesse: [https://tama.academiatupi.com](https://tama.academiatupi.com)
