"use client";

import { Plus, Trash2 } from "lucide-react";
import { PHONE_COUNTRY_CODES } from "@/lib/phone-country-codes";

export type ClientContactInput = {
  name: string;
  email: string;
  phoneCountryCode: string;
  phoneNumber: string;
};

type ClientContactsFieldProps = {
  contacts: ClientContactInput[];
  onChange: (contacts: ClientContactInput[]) => void;
  inputClassName?: string;
  labelClassName?: string;
};

const emptyContact = (): ClientContactInput => ({
  name: "",
  email: "",
  phoneCountryCode: "+61",
  phoneNumber: "",
});

export function ClientContactsField({
  contacts,
  onChange,
  inputClassName = "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-white",
  labelClassName = "mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100",
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
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Contact {index + 1}
                </p>
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
              <div className="space-y-3">
                <div>
                  <label className={labelClassName}>Contact name *</label>
                  <input
                    required
                    value={contact.name}
                    onChange={(e) => updateContact(index, { name: e.target.value })}
                    className={inputClassName}
                    placeholder="Jane Smith"
                  />
                </div>
                <div>
                  <label className={labelClassName}>Contact email *</label>
                  <input
                    type="email"
                    required
                    value={contact.email}
                    onChange={(e) => updateContact(index, { email: e.target.value })}
                    className={inputClassName}
                    placeholder="jane@company.com"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,140px)_1fr]">
                  <div>
                    <label className={labelClassName}>Country code *</label>
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
                    <label className={labelClassName}>Contact phone *</label>
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
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
