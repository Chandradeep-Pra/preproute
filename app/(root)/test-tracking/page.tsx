export default function TestTracking() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
          Test-tracking
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Track test progress
        </h1>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm leading-6 text-slate-600">
          This section will show the test tracking UI.
        </p>
      </div>
    </section>
  );
}
