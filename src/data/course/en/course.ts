import type { CourseData, LessonMapNode } from '@/core/lesson-engine/types'
import { lesson1Template } from '@/data/course/en/unit1/lesson1'
import { extractLessonLexiconInventory, materializeLesson } from '@/data/lexicon'

const lesson1 = materializeLesson(lesson1Template)
export const lessonLexiconInventory = extractLessonLexiconInventory(lesson1Template)

export const courseEn: CourseData = {
  id: 'tupi-proto',
  language: 'en',
  units: [
    {
      id: 'unit1',
      title: 'Unit 1: Drinks & Polite Words',
      lessons: [lesson1],
    },
  ],
}

export const pathNodesSeed: LessonMapNode[] = [
  {
    id: 'node-1',
    unitId: 'unit1',
    lessonId: 'unit1-lesson1',
    x: 0,
    y: 0,
    type: 'lesson',
    unlocked: true,
    completed: false,
  },
]

export const lessonById = new Map(
  courseEn.units.flatMap((unit) => unit.lessons.map((lesson) => [lesson.id, lesson] as const)),
)
