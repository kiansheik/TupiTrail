export type CharacterDef = {
  id: 'bird' | 'woman' | 'man' | 'nonbinary' | 'bear'
  name: string
  accentColor: string
}

export const characters: CharacterDef[] = [
  { id: 'bird', name: 'Tama', accentColor: '#2eb489' },
  { id: 'woman', name: 'Lia', accentColor: '#ff8c61' },
  { id: 'man', name: 'Cau', accentColor: '#4c78ff' },
  { id: 'nonbinary', name: 'Aru', accentColor: '#ffbe0b' },
  { id: 'bear', name: 'Poti', accentColor: '#8d6e63' },
]

export const characterById = Object.fromEntries(characters.map((item) => [item.id, item]))
