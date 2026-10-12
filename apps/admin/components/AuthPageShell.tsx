"use client";

import { TechBubbleLogo } from "@/components/TechBubbleLogo";

type Props = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthPageShell({ title, subtitle, children }: Props) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-neutral-950">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg dark:bg-neutral-900">
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center">
            <TechBubbleLogo />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
