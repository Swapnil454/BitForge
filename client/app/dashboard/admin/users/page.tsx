"use client";

import {
  UserDirectoryPage,
  allDirectoryConfig,
} from "./components/UserDirectoryPage";

export default function AllUsersPage() {
  return <UserDirectoryPage config={allDirectoryConfig} />;
}
