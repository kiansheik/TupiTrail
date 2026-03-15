import type { CourseData, LessonMapNode } from '@/core/lesson-engine/types'
import { lesson1 } from '@/data/course/en/unit1/lesson1'

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
  {
    id: 'node-2',
    unitId: 'unit1',
    lessonId: 'unit1-lesson2',
    x: -28,
    y: 96,
    type: 'checkpoint',
    unlocked: false,
    completed: false,
  },
  {
    id: 'node-3',
    unitId: 'unit1',
    lessonId: 'unit1-lesson3',
    x: 18,
    y: 188,
    type: 'lesson',
    unlocked: false,
    completed: false,
  },
  {
    id: 'node-4',
    unitId: 'unit1',
    lessonId: 'unit1-lesson4',
    x: -12,
    y: 284,
    type: 'chest',
    unlocked: false,
    completed: false,
  },
  {
    id: 'node-5',
    unitId: 'unit1',
    lessonId: 'unit1-lesson5',
    x: 6,
    y: 376,
    type: 'lesson',
    unlocked: false,
    completed: false,
  },
]

export const lessonById = new Map(
  courseEn.units.flatMap((unit) => unit.lessons.map((lesson) => [lesson.id, lesson] as const)),
)
