import StatusCard from '@/components/StatusCard'

export default function StatusPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-text-primary">Claim Status</h1>
        <p className="text-text-secondary text-sm">
          Check if an agent is registered and whether the associated human has claimed.
        </p>
      </div>

      <StatusCard />
    </div>
  )
}
