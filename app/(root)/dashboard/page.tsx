export default function Dashboard() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
          Dashboard
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Overview
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-600">
          This is the main dashboard area shown after login.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {["Active tests", "Pending reviews", "Recent activity"].map((item) => (
          <div
            key={item}
            className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">{item}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">01</p>
          </div>
        ))}
      </div>
    </section>
  );
}
