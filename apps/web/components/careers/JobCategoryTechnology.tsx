import {
  formatJobCategoryTechnology,
  getJobCategoryTechnologyParts,
} from "@/lib/job-taxonomy";

type JobCategoryTechnologyProps = {
  category?: string | null;
  technology?: string | null;
  className?: string;
};

const valueClassName =
  "text-[12px] font-semibold uppercase tracking-wide text-[#111111] dark:text-zinc-200";
const labelClassName =
  "font-medium normal-case tracking-normal text-[#7a7f8e] dark:text-zinc-500";

export function JobCategoryTechnology({
  category,
  technology,
  className = "",
}: JobCategoryTechnologyProps) {
  const { category: cat, technology: tech, sameValue } = getJobCategoryTechnologyParts(
    category,
    technology,
  );

  if (!cat && !tech) {
    return null;
  }

  if (sameValue) {
    return (
      <div className={`space-y-1 ${className}`.trim()}>
        <p className={valueClassName}>
          <span className={labelClassName}>Category: </span>
          {cat}
        </p>
        <p className={valueClassName}>
          <span className={labelClassName}>Technology: </span>
          {tech}
        </p>
      </div>
    );
  }

  return (
    <p className={`${valueClassName} ${className}`.trim()}>{formatJobCategoryTechnology(category, technology)}</p>
  );
}
