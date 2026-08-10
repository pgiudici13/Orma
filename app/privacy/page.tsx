import { readFile } from "fs/promises";
import path from "path";

export const metadata = { title: "ORMA — Informativa Privacy" };

export default async function PrivacyPage() {
  const content = await readFile(
    path.join(process.cwd(), "docs/legal/PRIVACY_POLICY.md"),
    "utf-8",
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-800 dark:text-zinc-200">
        {content}
      </pre>
    </div>
  );
}
