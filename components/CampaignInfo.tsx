export default function CampaignInfo() {
  return (
    <div className="rounded-2xl border border-border p-4">
      <h2 className="mb-4 text-sm font-semibold text-text-primary">Campaign</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-text-muted">Per claim</p>
          <p className="text-base font-semibold text-text-primary">1.0 DROP</p>
        </div>
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-text-muted">Network</p>
          <p className="text-base font-semibold text-text-primary">Base</p>
        </div>
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-text-muted">Limit</p>
          <p className="text-base font-semibold text-text-primary">1 / human</p>
        </div>
      </div>
    </div>
  )
}
