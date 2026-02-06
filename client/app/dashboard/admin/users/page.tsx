// "use client";

// import { useEffect, useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { motion } from "framer-motion";
// import { adminAPI } from "@/lib/api";
// import toast from "react-hot-toast";
// import { Store, ShoppingCart, ShieldCheck, Users } from "lucide-react";

// interface User {
//   _id: string;
//   name: string;
//   email: string;
//   role: "buyer" | "seller" | "admin";
//   isVerified: boolean;
//   createdAt: string;
// }

// export default function AllUsersPage() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const roleParam = searchParams.get("role") as User["role"] | null;

//   const isSpecificRolePage =
//     roleParam === "buyer" || roleParam === "seller" || roleParam === "admin";

//   const [users, setUsers] = useState<User[]>([]);
//   const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [roleFilter, setRoleFilter] = useState<"all" | User["role"]>("all");

//   /* ---------------- FETCH ---------------- */
//   useEffect(() => {
//     const fetchUsers = async () => {
//       try {
//         const data = await adminAPI.getAllUsers();
//         setUsers(data || []);
//       } catch {
//         toast.error("Failed to load users");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchUsers();
//   }, []);

//   /* ---------------- ROLE LOCK ---------------- */
//   useEffect(() => {
//     if (isSpecificRolePage && roleParam) setRoleFilter(roleParam);
//     else setRoleFilter("all");
//   }, [roleParam]);

//   /* ---------------- FILTER + SEARCH ---------------- */
//   useEffect(() => {
//     let list =
//       roleFilter === "all"
//         ? users
//         : users.filter((u) => u.role === roleFilter);

//     if (searchTerm.trim()) {
//       const t = searchTerm.toLowerCase();
//       list = list.filter(
//         (u) =>
//           u.name.toLowerCase().includes(t) ||
//           u.email.toLowerCase().includes(t)
//       );
//     }

//     setFilteredUsers(list);
//   }, [users, roleFilter, searchTerm]);

//   const buyerCount = users.filter((u) => u.role === "buyer").length;
//   const sellerCount = users.filter((u) => u.role === "seller").length;
//   const adminCount = users.filter((u) => u.role === "admin").length;

//   const headerConfig = {
//     all: { title: "👥 All Users", subtitle: "Manage all users", icon: Users, value: users.length },
//     buyer: { title: "🛒 Buyers", subtitle: "Manage all buyer accounts", icon: ShoppingCart, value: buyerCount },
//     seller: { title: "🧑‍💼 Sellers", subtitle: "Manage all seller accounts", icon: Store, value: sellerCount },
//     admin: { title: "🛡️ Admins", subtitle: "Manage admin accounts", icon: ShieldCheck, value: adminCount },
//   }[roleFilter];

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center text-white">
//         Loading users...
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-[#0a0a14] via-[#0f0f1e] to-[#14142b] text-white p-6">
//       <div className="max-w-7xl mx-auto">

//         {/* Back */}
//         <button
//           onClick={() => router.push("/dashboard/admin")}
//           className="mb-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm"
//         >
//           ← Back to Dashboard
//         </button>

//         {/* 🔥 HEADER + KPI ROW */}
//         <div className="flex items-start justify-between gap-4 mb-6">
//           <div>
//             <h1 className="text-3xl font-bold">{headerConfig.title}</h1>
//             <p className="text-white/60 mt-1">{headerConfig.subtitle}</p>
//           </div>

//           {/* Compact KPI */}
//           <HeaderKPI
//             icon={headerConfig.icon}
//             label={`Total ${roleFilter === "all" ? "Users" : roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1)}`}
//             value={headerConfig.value}
//           />
//         </div>

//         {/* Search */}
//         <input
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           placeholder="Search by name or email..."
//           className="w-full mb-8 px-4 py-2 bg-white/5 border border-white/10 rounded-lg"
//         />

//         {/* USERS LIST */}
//         <div className="grid gap-4">
//           {filteredUsers.map((user) => (
//             <motion.div
//               key={user._id}
//               initial={{ opacity: 0, y: 10 }}
//               animate={{ opacity: 1, y: 0 }}
//               className="bg-white/5 border border-white/10 rounded-xl p-6"
//             >
//               <div className="flex gap-4 items-center">
//                 <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center font-bold text-xl">
//                   {user.name[0].toUpperCase()}
//                 </div>

//                 <div className="flex-1">
//                   <div className="flex gap-2 items-center">
//                     <h3 className="text-lg font-semibold">{user.name}</h3>
//                     <span className="text-xs px-2 py-1 rounded-full bg-white/10">
//                       {user.role}
//                     </span>
//                     {user.isVerified && <span className="text-green-400">✓</span>}
//                   </div>
//                   <p className="text-white/60">{user.email}</p>
//                 </div>
//               </div>
//             </motion.div>
//           ))}
//         </div>

//       </div>
//     </div>
//   );
// }

// /* ---------------- COMPACT HEADER KPI ---------------- */
// function HeaderKPI({
//   icon: Icon,
//   label,
//   value,
// }: {
//   icon: any;
//   label: string;
//   value: number;
// }) {
//   return (
//     <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-w-[180px]">
//       <div className="w-9 h-9 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
//         <Icon className="w-5 h-5" />
//       </div>
//       <div className="text-right">
//         <p className="text-xs text-white/60">{label}</p>
//         <p className="text-2xl font-bold leading-tight">{value}</p>
//       </div>
//     </div>
//   );
// }







"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { adminAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { Store, ShoppingCart, ShieldCheck, Users } from "lucide-react";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "buyer" | "seller" | "admin";
  isVerified: boolean;
  createdAt: string;
}

function AllUsersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role") as User["role"] | null;

  const isSpecificRolePage =
    roleParam === "buyer" || roleParam === "seller" || roleParam === "admin";

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | User["role"]>("all");

  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await adminAPI.getAllUsers();
        setUsers(data || []);
      } catch {
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  /* ---------------- ROLE LOCK ---------------- */
  useEffect(() => {
    if (isSpecificRolePage && roleParam) setRoleFilter(roleParam);
    else setRoleFilter("all");
  }, [roleParam]);

  /* ---------------- FILTER + SEARCH ---------------- */
  useEffect(() => {
    let list =
      roleFilter === "all"
        ? users
        : users.filter((u) => u.role === roleFilter);

    if (searchTerm.trim()) {
      const t = searchTerm.toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(t) ||
          u.email.toLowerCase().includes(t)
      );
    }

    setFilteredUsers(list);
  }, [users, roleFilter, searchTerm]);

  const buyerCount = users.filter((u) => u.role === "buyer").length;
  const sellerCount = users.filter((u) => u.role === "seller").length;
  const adminCount = users.filter((u) => u.role === "admin").length;

  const headerConfig = {
    all: { title: "👥 All Users", subtitle: "Manage all users", icon: Users, value: users.length },
    buyer: { title: "🛒 Buyers", subtitle: "Manage all buyer accounts", icon: ShoppingCart, value: buyerCount },
    seller: { title: "🧑‍💼 Sellers", subtitle: "Manage all seller accounts", icon: Store, value: sellerCount },
    admin: { title: "🛡️ Admins", subtitle: "Manage admin accounts", icon: ShieldCheck, value: adminCount },
  }[roleFilter];

  /* ---------------- SKELETON STATE ---------------- */
  if (loading) {
    return <SkeletonPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a14] via-[#0f0f1e] to-[#14142b] text-white p-6">
      <div className="max-w-7xl mx-auto">

        {/* Back */}
        <button
          onClick={() => router.push("/dashboard/admin")}
          className="mb-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm"
        >
          ← Back to Dashboard
        </button>

        {/* HEADER + SMALL KPI */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">{headerConfig.title}</h1>
            <p className="text-white/60 mt-1">{headerConfig.subtitle}</p>
          </div>

          <HeaderKPI
            icon={headerConfig.icon}
            label={`Total ${roleFilter === "all" ? "Users" : roleFilter}`}
            value={headerConfig.value}
          />
        </div>

        {/* Search */}
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full mb-8 px-4 py-2 bg-white/5 border border-white/10 rounded-lg"
        />

        {/* USERS LIST */}
        <div className="grid gap-4">
          {filteredUsers.map((user) => (
            <motion.div
              key={user._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-xl p-5"
            >
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center font-bold">
                  {user.name[0].toUpperCase()}
                </div>

                <div className="flex-1">
                  <div className="flex gap-2 items-center">
                    <h3 className="font-semibold">{user.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10">
                      {user.role}
                    </span>
                    {user.isVerified && <span className="text-green-400">✓</span>}
                  </div>
                  <p className="text-sm text-white/60">{user.email}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AllUsersPage() {
  return (
    <Suspense fallback={<SkeletonPage />}>
      <AllUsersPageContent />
    </Suspense>
  );
}

/* ---------------- ULTRA COMPACT KPI ---------------- */
function HeaderKPI({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg px-3 py-2 min-w-[120px]">
      
      {/* Icon */}
      <div className="w-7 h-7 rounded-md bg-purple-500/20 text-purple-400 flex items-center justify-center">
        <Icon className="w-4 h-4" />
      </div>

      {/* Centered Text */}
      <div className="flex flex-col items-center justify-center flex-1 leading-none">
        <span className="text-[11px] text-white/60">{label}</span>
        <span className="text-lg font-semibold">{value}</span>
      </div>

    </div>
  );
}


/* ---------------- SKELETON PAGE ---------------- */
function SkeletonPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a14] via-[#0f0f1e] to-[#14142b] p-6 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-6">

        <div className="w-40 h-8 bg-white/10 rounded-lg" />

        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="w-48 h-6 bg-white/10 rounded" />
            <div className="w-64 h-4 bg-white/10 rounded" />
          </div>
          <div className="w-36 h-10 bg-white/10 rounded-lg" />
        </div>

        <div className="w-full h-10 bg-white/10 rounded-lg" />

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-white/5 border border-white/10 rounded-xl"
            />
          ))}
        </div>

      </div>
    </div>
  );
}
