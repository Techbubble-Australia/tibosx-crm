/** Wireframe callout under the Opportunities board (reference screenshot). */
export function OpportunitiesWhatChanged() {
  return (
    <section className="rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-700 dark:bg-gray-900">
      <h2 className="text-sm font-semibold text-gray-950 dark:text-gray-100">
        What changed from the current Opportunities page
      </h2>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-snug text-gray-800 dark:text-gray-300">
        <li>Single &quot;In progress&quot; status is replaced by stages with probability, so forecast is weighted.</li>
        <li>
          Free-text Comments is replaced by a mandatory next step and date; cards with none are flagged.
        </li>
        <li>
          &quot;Type: T&amp;M&quot; becomes Engagement model (T&amp;M, fixed price, support, placement).
        </li>
        <li>Active jobs becomes linked Recruitment roles on the detail page.</li>
        <li>Pipelines are configurable, so a staffing pipeline and a services pipeline can coexist.</li>
      </ul>
    </section>
  );
}
