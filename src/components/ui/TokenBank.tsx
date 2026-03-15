import { TokenChip } from '@/components/ui/TokenChip'

type TokenBankProps = {
  tokens: string[]
  selectedTokens: string[]
  onAddToken: (token: string, index: number) => void
  onRemoveToken: (index: number) => void
}

export const TokenBank = ({ tokens, selectedTokens, onAddToken, onRemoveToken }: TokenBankProps) => {
  return (
    <div className="space-y-3">
      <div className="min-h-16 rounded-2xl border-2 border-dashed border-ink/20 bg-white/80 p-3">
        <div className="flex flex-wrap gap-2">
          {selectedTokens.length === 0 ? (
            <span className="text-sm font-bold text-ink/40">Toque para montar a resposta</span>
          ) : (
            selectedTokens.map((token, index) => (
              <TokenChip key={`${token}-${index}`} token={token} selected onClick={() => onRemoveToken(index)} />
            ))
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tokens.map((token, index) => {
          const alreadySelected = selectedTokens.includes(token)
          return (
            <TokenChip
              key={`${token}-${index}`}
              token={token}
              disabled={alreadySelected}
              onClick={() => onAddToken(token, index)}
            />
          )
        })}
      </div>
    </div>
  )
}
