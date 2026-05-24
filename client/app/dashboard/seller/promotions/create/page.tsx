"use client";

import { PageShell } from "./components/PageShell";
import { FormOrchestrator } from "./components/FormOrchestrator";

export default function CreatePromotionPage() {
  return (
    <PageShell>
      <FormOrchestrator />
    </PageShell>
  );
}
