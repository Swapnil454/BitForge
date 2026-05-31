"use client";

import { Suspense } from "react";
import { PageShell } from "./components/PageShell";
import { FormOrchestrator } from "./components/FormOrchestrator";

export default function CreatePromotionPage() {
  return (
    <PageShell>
      <Suspense fallback={<div>Loading...</div>}>
        <FormOrchestrator />
      </Suspense>
    </PageShell>
  );
}
