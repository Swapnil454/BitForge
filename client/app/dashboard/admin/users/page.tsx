"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  UserDirectoryPage,
  UserDirectorySkeleton,
  buyerDirectoryConfig,
} from "./components/UserDirectoryPage";

function BuyersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role");

  useEffect(() => {
    if (role === "seller") {
      router.replace("/dashboard/admin/users/sellers");
    }
  }, [role, router]);

  if (role === "seller") {
    return <UserDirectorySkeleton />;
  }

  return <UserDirectoryPage config={buyerDirectoryConfig} />;
}

export default function BuyersPage() {
  return (
    <Suspense fallback={<UserDirectorySkeleton />}>
      <BuyersPageContent />
    </Suspense>
  );
}
