'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { updateOrderStatus } from '@/app/actions/orders'

interface OrderActionsProps {
  orderId: string
  status: 'paid' | 'ready' | 'fulfilled'
}

export function OrderActions({ orderId, status }: OrderActionsProps) {
  const [isPending, startTransition] = useTransition()

  if (status === 'paid') {
    return (
      <Button
        size="sm"
        variant="secondary"
        disabled={isPending}
        onClick={() =>
          startTransition(() => updateOrderStatus(orderId, 'ready'))
        }
      >
        {isPending ? 'Updating…' : 'Mark Ready'}
      </Button>
    )
  }

  if (status === 'ready') {
    return (
      <Button
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(() => updateOrderStatus(orderId, 'fulfilled'))
        }
      >
        {isPending ? 'Updating…' : 'Mark Fulfilled'}
      </Button>
    )
  }

  return <span className="text-xs text-gray-400">—</span>
}
