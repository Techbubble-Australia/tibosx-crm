"use client";

import { resolveDocumentHref } from "@/lib/media-url";

type UserFileRow = { name?: string; url?: string };

type Props = {
  agreementDocumentUrl?: string | null;
  idProofUrl?: string | null;
  addressProofUrl?: string | null;
  userFiles?: UserFileRow[] | null;
};

function FileLink({ label, url }: { label: string; url: string }) {
  return (
    <li>
      <a
        href={resolveDocumentHref(url)}
        target="_blank"
        rel="noreferrer"
        className="text-sm text-blue-600 hover:underline dark:text-blue-400"
      >
        {label}
      </a>
    </li>
  );
}

export function UserFilesSection({
  agreementDocumentUrl,
  idProofUrl,
  addressProofUrl,
  userFiles,
}: Props) {
  const extraFiles = (userFiles ?? []).filter((f) => typeof f?.url === "string" && f.url.trim());
  const hasAny =
    Boolean(agreementDocumentUrl?.trim()) ||
    Boolean(idProofUrl?.trim()) ||
    Boolean(addressProofUrl?.trim()) ||
    extraFiles.length > 0;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Files</h3>
      {hasAny ? (
        <ul className="list-inside list-disc space-y-1 text-gray-700 dark:text-gray-300">
          {agreementDocumentUrl?.trim() ? (
            <FileLink label="Signed contract / agreement" url={agreementDocumentUrl} />
          ) : null}
          {idProofUrl?.trim() ? <FileLink label="ID proof" url={idProofUrl} /> : null}
          {addressProofUrl?.trim() ? <FileLink label="Address proof" url={addressProofUrl} /> : null}
          {extraFiles.map((file, index) => (
            <FileLink
              key={`${file.url}-${index}`}
              label={file.name?.trim() || `File ${index + 1}`}
              url={file.url!}
            />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">No files on record yet.</p>
      )}
    </section>
  );
}
