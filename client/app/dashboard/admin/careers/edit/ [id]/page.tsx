"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import PageHeader from "@/app/dashboard/buyer/transactions/components/PageHeader";
import CareerForm, { Career } from "../../components/CareerForm";
import { showError } from "@/lib/toast";

export default function EditCareerPage() {
  const { id } = useParams();
  const [career, setCareer] = useState<Career | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCareer();
    }
  }, [id]);

  const fetchCareer = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/careers/admin/${id}`);
      setCareer(response.data.data);
    } catch (error) {
      console.error("Error fetching career:", error);
      showError("Failed to fetch career details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white">
      <PageHeader
        backHref="/dashboard/admin/careers"
        backLabel="Back to Careers"
        title="Edit Career"
        subtitle={career ? `Editing: ${career.title}` : "Updating job opening"}
      />

      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {loading ? (
            <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-3xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 backdrop-blur-sm">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
              <p className="text-sm text-slate-400 dark:text-white/50">Fetching job details...</p>
            </div>
          ) : career ? (
            <CareerForm initialData={career} isEditing />
          ) : (
            <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-3xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 backdrop-blur-sm">
              <p className="text-slate-600 dark:text-white/70">Career not found</p>
              <button 
                onClick={() => window.location.reload()}
                className="text-sm text-cyan-400 hover:underline"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
