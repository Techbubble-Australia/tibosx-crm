import { formatJobCategoryTechnology } from "@/lib/job-taxonomy";

type JobCategoryTechnologyProps = {
  category?: string | null;
  technology?: string | null;
  className?: string;
};

export function JobCategoryTechnology({
  category,
  technology,
  className = "",
}: JobCategoryTechnologyProps) {
  const text = formatJobCategoryTechnology(category, technology);

  if (!text) {
    return null;
  }

  return (
    <p
      className={`text-[12px] font-semibold uppercase tracking-wide text-[#111111] dark:text-zinc-200 ${className}`.trim()}
    >
      {text}
    </p>
  );
}
