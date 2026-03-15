import { LayoutGroup } from 'framer-motion'

import { TokenChip } from '@/components/ui/TokenChip'

type TokenBankProps = {
  tokens: string[]
  selectedTokens: string[]
  onAddToken: (token: string, index: number) => void
  onRemoveToken: (index: number) => void
}

export const TokenBank = ({ tokens, selectedTokens, onAddToken, onRemoveToken }: TokenBankProps) => {
  const availableByWord = tokens.reduce<Record<string, number[]>>((acc, token, index) => {
    if (!acc[token]) {
      acc[token] = []
    }
    acc[token].push(index)
    return acc
  }, {})

  const usedIndexes = new Set<number>()
  const selectedInstances = selectedTokens.map((token, selectedOrderIndex) => {
    const queue = availableByWord[token]
    const sourceIndex = queue?.find((index) => !usedIndexes.has(index))
    if (typeof sourceIndex === 'number') {
      usedIndexes.add(sourceIndex)
    }

    return {
      token,
      selectedOrderIndex,
      sourceIndex: sourceIndex ?? 10_000 + selectedOrderIndex,
    }
  })

  const bankInstances = tokens
    .map((token, index) => ({ token, index }))
    .filter((instance) => !usedIndexes.has(instance.index))

  return (
    <LayoutGroup id="token-bank">
      <div className="space-y-3">
        <div className="min-h-16 rounded-2xl border-2 border-dashed border-ink/20 bg-white/80 p-3">
          <div className="flex flex-wrap gap-2">
            {selectedTokens.length === 0 ? (
              <span className="text-sm font-bold text-ink/40">Toque para montar a resposta</span>
            ) : (
              selectedInstances.map((instance) => (
                <TokenChip
                  key={`selected-${instance.sourceIndex}`}
                  token={instance.token}
                  selected
                  layoutId={`token-bank-item-${instance.sourceIndex}`}
                  onClick={() => onRemoveToken(instance.selectedOrderIndex)}
                />
              ))
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {bankInstances.map((instance) => (
            <TokenChip
              key={`bank-${instance.index}`}
              token={instance.token}
              layoutId={`token-bank-item-${instance.index}`}
              onClick={() => onAddToken(instance.token, instance.index)}
            />
          ))}
        </div>
      </div>
    </LayoutGroup>
  )
}
