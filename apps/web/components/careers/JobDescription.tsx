import { sanitizeJobHtml, isHtmlContent } from "@/lib/sanitize-html";

type Props = {
  description: string;
};

export function JobDescription({ description }: Props) {
  const trimmed = description?.trim() ?? "";
  if (!trimmed) {
    return (
      <p className="text-[16px] leading-7 text-[#666666]">
        Full description coming soon. Apply below and mention this role in your message.
      </p>
    );
  }

  if (isHtmlContent(trimmed)) {
    const safe = sanitizeJobHtml(trimmed);
    return (
      <div
        className="job-description prose prose-gray max-w-none text-[16px] leading-7 text-[#333] [&_a]:text-[#111111] [&_a]:underline [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:mb-1 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6"
        dangerouslySetInnerHTML={{ __html: safe }}
      />
    );
  }

  return (
    <div className="prose prose-gray max-w-none text-[16px] leading-7 text-[#333]">
      {trimmed.split("\n\n").map((para, i) => (
        <p key={i} className="mb-4">
          {para}
        </p>
      ))}
    </div>
  );
}
