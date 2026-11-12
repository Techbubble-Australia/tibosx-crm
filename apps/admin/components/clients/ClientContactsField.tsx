"use client";

import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { PHONE_COUNTRY_CODES } from "@/lib/phone-country-codes";

export type ClientContactInput = {
  id?: string;
  name: string;
  email: string;
  position: string;
  phoneCountryCode: string;
  phoneNumber: string;
  adminUserId?: string | null;
  /** The contact's portal account can open the Client workspace overview. */
  clientWorkspaceAccess?: boolean;
};

type ClientContactsFieldProps = {
  contacts: ClientContactInput[];
  onChange: (contacts: ClientContactInput[]) => void;
  inputClassName?: string;
  labelClassName?: string;
  onCreateUser?: (contact: ClientContactInput, index: number) => void;
  creatingUserIndex?: number | null;
};

const emptyContact = (): ClientContactInput => ({
  name: "",
  email: "",
  position: "",
  phoneCountryCode: "+61",
  phoneNumber: "",
});

export function ClientContactsField({
  contacts,
  onChange,
  inputClassName = "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-white",
  labelClassName = "mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100",
  onCreateUser,
  creatingUserIndex = null,
}: ClientContactsFieldProps) {
  function updateContact(index: number, patch: Partial<ClientContactInput>) {
    onChange(contacts.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addContact() {
    onChange([...contacts, emptyContact()]);
  }

  function removeContact(index: number) {
    onChange(contacts.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Contacts</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Related contacts for this client.</p>
        </div>
        <button
          type="button"
          onClick={addContact}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add contact
        </button>
      </div>

      {contacts.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
          No contacts yet. Add at least one contact for this client.
        </p>
      ) : (
        <ul className="space-y-4">
          {contacts.map((contact, index) => (
            <li
              key={index}
              className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-700 dark:bg-gray-800/40"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Contact {index + 1}
                </p>
                <div className="flex items-center gap-2">
                  {onCreateUser ? (
                    contact.adminUserId ? (
                      <Link
                        href={`/users/${contact.adminUserId}`}
                        className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        View user record
                      </Link>
                    ) : contact.id ? (
                      <button
                        type="button"
                        disabled={creatingUserIndex === index}
                        onClick={() => onCreateUser(contact, index)}
                        className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium hover:bg-white dark:border-gray-600"
                      >
                        {creatingUserIndex === index ? "Creating…" : "Create user"}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">Save client first</span>
                    )
                  ) : null}
                  <button
                    type="button"
                    onClick={() => removeContact(index)}
                    className="inline-flex items-center gap-1 rounded p-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    aria-label={`Remove contact ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                    Remove
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className={labelClassName}>Contact name <span className="text-red-500">*</span></label>
                  <input
                    required
                    value={contact.name}
                    onChange={(e) => updateContact(index, { name: e.target.value })}
                    className={inputClassName}
                    placeholder="Jane Smith"
                  />
                </div>
                <div>
                  <label className={labelClassName}>Contact email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    required
                    value={contact.email}
                    onChange={(e) => updateContact(index, { email: e.target.value })}
                    className={inputClassName}
                    placeholder="jane@company.com"
                  />
                </div>
                <div>
                  <label className={labelClassName}>Contact position</label>
                  <input
                    value={contact.position}
                    onChange={(e) => updateContact(index, { position: e.target.value })}
                    className={inputClassName}
                    placeholder="e.g. Hiring manager"
                    maxLength={200}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,140px)_1fr]">
                  <div>
                    <label className={labelClassName}>Country code <span className="text-red-500">*</span></label>
                    <select
                      required
                      value={contact.phoneCountryCode}
                      onChange={(e) => updateContact(index, { phoneCountryCode: e.target.value })}
                      className={inputClassName}
                      aria-label={`Contact ${index + 1} phone country code`}
                    >
                      {PHONE_COUNTRY_CODES.map((option) => (
                        <option key={`${option.code}-${option.dialCode}`} value={option.dialCode}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClassName}>Contact phone <span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      required
                      value={contact.phoneNumber}
                      onChange={(e) => updateContact(index, { phoneNumber: e.target.value })}
                      className={inputClassName}
                      placeholder="412 345 678"
                    />
                  </div>
                </div>
                <label className="flex items-start gap-2 text-sm text-gray-800 dark:text-gray-200">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={Boolean(contact.clientWorkspaceAccess)}
                    onChange={(e) => updateContact(index, { clientWorkspaceAccess: e.target.checked })}
                  />
                  <span>
                    <span className="font-medium">Access to client workspace</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">
                      Lets this contact&apos;s portal account see the Client workspace: projects, timesheets, invoices and
                      payments for this client.
                    </span>
                  </span>
                </label>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
