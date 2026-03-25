// Pure helper — extracted for testing (matches project pattern)

function isSent(confirmation_sent_at: string | null): boolean {
  return confirmation_sent_at !== null
}

function formatSentTimestamp(confirmation_sent_at: string): string {
  const date = new Date(confirmation_sent_at)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  }) + ' at ' + date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

describe('isSent', () => {
  it('returns false when confirmation_sent_at is null', () => {
    expect(isSent(null)).toBe(false)
  })
  it('returns true when confirmation_sent_at is a timestamp string', () => {
    expect(isSent('2026-03-23T14:00:00Z')).toBe(true)
  })
})

describe('formatSentTimestamp', () => {
  it('formats an ISO timestamp into a readable label', () => {
    const result = formatSentTimestamp('2026-03-23T14:14:00Z')
    expect(result).toMatch(/Mar/)
    expect(result).toMatch(/at/)
  })
})
