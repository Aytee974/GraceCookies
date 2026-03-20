import { Spinner } from '@/components/Spinner'

export default function AdminLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size="lg" />
    </div>
  )
}
