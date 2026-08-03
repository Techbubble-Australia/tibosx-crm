export default function DatabaseDashboardPage() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Overview of profiles, applications, and hiring pipeline metrics.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total profiles", value: "—" },
          { label: "Applications (30d)", value: "—" },
          { label: "Open roles", value: "—" },
          { label: "Placements", value: "—" },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {card.label}
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{card.value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-600 dark:bg-gray-900">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Charts & analytics</p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Graphs and reporting widgets will be added here as profile data grows.
        </p>
      </div>
    </div>
  );
}
