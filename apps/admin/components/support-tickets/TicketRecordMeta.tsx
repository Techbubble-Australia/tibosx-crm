type Person = { name: string; email?: string } | null | undefined;

type Props = {
  createdBy?: Person;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: Person;
};

function formatWhen(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function formatWho(person?: Person) {
  if (!person?.name) return "—";
  return person.name;
}

export function TicketRecordMeta({ createdBy, createdAt, updatedAt, updatedBy }: Props) {
  return (
    <section className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 sm:grid-cols-2 lg:grid-cols-4">
      <MetaField label="Created by" value={formatWho(createdBy)} />
      <MetaField label="Created" value={formatWhen(createdAt)} />
      <MetaField label="Updated" value={formatWhen(updatedAt)} />
      <MetaField label="Updated by" value={formatWho(updatedBy)} />
    </section>
  );
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}
