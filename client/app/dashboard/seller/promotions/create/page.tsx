"use client";

import { Suspense } from "react";
import { PageShell } from "./components/PageShell";
import dynamic from "next/dynamic";

const FormOrchestrator = dynamic(() => import("./components/FormOrchestrator").then(mod => mod.FormOrchestrator), { ssr: false });
export default function CreatePromotionPage() {
  return (
    <PageShell>
      <Suspense fallback={<div>Loading...</div>}>
        <FormOrchestrator />
      </Suspense>
    </PageShell>
  );
}
