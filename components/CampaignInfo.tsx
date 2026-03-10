export default function CampaignInfo() {
  return (
    <div className="rounded-xl border border-border bg-surface-raised p-5">
      <h2 className="text-sm font-semibold text-text-primary mb-3">Campaign</h2>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-text-muted mb-0.5">Per claim</p>
          <p className="text-lg font-semibold text-text-primary">1.0 DROP</p>
        </div>
        <div>
          <p className="text-xs text-text-muted mb-0.5">Network</p>
          <p className="text-lg font-semibold text-text-primary">Base</p>
        </div>
        <div>
          <p className="text-xs text-text-muted mb-0.5">Limit</p>
          <p className="text-lg font-semibold text-text-primary">1 / human</p>
        </div>
      </div>
    </div>
  )
}
