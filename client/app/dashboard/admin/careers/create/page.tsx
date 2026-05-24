"use client";

import PageHeader from "@/app/dashboard/buyer/transactions/components/PageHeader";
import CareerForm from "../components/CareerForm";

export default function CreateCareerPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white">
      <PageHeader
        backHref="/dashboard/admin/careers"
        backLabel="Back to Careers"
        title="Create Career"
        subtitle="Post a new job opening to attract top talent"
      />

      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <CareerForm />
        </div>
      </main>
    </div>
  );
}
