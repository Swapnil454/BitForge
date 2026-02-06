// "use client";

// import { useEffect, useState, useRef } from "react";
// import { useRouter } from "next/navigation";
// import { getStoredUser, clearAuthStorage, setCookie } from "@/lib/cookies";
// import { userAPI } from "@/lib/api";
// import { motion } from "framer-motion";
// import toast from "react-hot-toast";

// export default function PendingApprovalPage() {
//   const [user, setUser] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [checking, setChecking] = useState(false);
//   const [shouldRender, setShouldRender] = useState(false);
//   const prevStatus = useRef<string | undefined>(undefined);
//   const router = useRouter();

//   const fetchUserStatus = async () => {
//     try {
//       setChecking(true);
//       const fresh = await userAPI.getCurrentUser();
//       // Update stored user data
//       setCookie("user", JSON.stringify(fresh), 7);
//       if (typeof localStorage !== "undefined") {
//         localStorage.setItem("user", JSON.stringify(fresh));
//       }
//       setUser(fresh);
//       // Detect status change from pending to approved
//       const wasPending = prevStatus.current === "pending";
//       const isNowApproved = fresh.role === "seller" && (fresh.approvalStatus === "approved" || fresh.isApproved);
//       const congratsFlag = typeof window !== 'undefined' ? localStorage.getItem('sellerApprovedCongratsShown') : null;
//       // Only show popup if status actually transitions from pending to approved and flag is not set
//       if (wasPending && isNowApproved && !congratsFlag) {
//         toast.success("Congratulations! Your account has been approved! Redirecting to your dashboard...");
//         if (typeof window !== 'undefined') {
//           localStorage.setItem('sellerApprovedCongratsShown', 'true');
//         }
//         setTimeout(() => {
//           router.replace("/dashboard/seller");
//         }, 2000);
//         setShouldRender(false);
//         setLoading(false);
//         prevStatus.current = fresh.approvalStatus;
//         return;
//       }
//       // If already approved (not a transition), just redirect and set flag silently
//       if (isNowApproved) {
//         if (typeof window !== 'undefined' && !congratsFlag) {
//           localStorage.setItem('sellerApprovedCongratsShown', 'true');
//         }
//         router.replace("/dashboard/seller");
//         setShouldRender(false);
//         setLoading(false);
//         prevStatus.current = fresh.approvalStatus;
//         return;
//       }
//       // Only render if pending or rejected
//       setShouldRender(true);
//       if (fresh.approvalStatus === "rejected") {
//         toast.error("Your account application was not approved.");
//       } else if (fresh.approvalStatus === "pending" || (!fresh.isApproved && !fresh.approvalStatus)) {
//         toast("Your account is still pending approval. Please wait for admin review.", {
//           icon: "⏳",
//           duration: 4000,
//         });
//       }
//       setLoading(false);
//       prevStatus.current = fresh.approvalStatus;
//     } catch (error) {
//       console.error("Failed to fetch user status:", error);
//       toast.error("Failed to check status");
//       setLoading(false);
//       setShouldRender(false);
//     } finally {
//       setChecking(false);
//     }
//   };

//   useEffect(() => {
//     const stored = getStoredUser();
//     if (!stored) {
//       router.replace("/login");
//       return;
//     }
//     if (stored.role !== "seller") {
//       router.replace("/dashboard");
//       return;
//     }
//     prevStatus.current = stored.approvalStatus;
//     fetchUserStatus();
//   }, [router]);

//   const handleLogout = () => {
//     clearAuthStorage();
//     router.push("/login");
//   };

//   const handleCheckStatus = () => {
//     fetchUserStatus();
//   };

//   if (loading || !user) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-black/80">
//         <div className="text-white text-lg animate-pulse">Checking your approval status...</div>
//       </div>
//     );
//   }

//   if (!shouldRender) {
//     // Don't render anything if not pending/rejected
//     return null;
//   }

//   const isPending = user.approvalStatus === "pending" || (!user.isApproved && !user.approvalStatus);
//   const isRejected = user.approvalStatus === "rejected";

//   return (
//     <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden font-sans">
//       {/* Glassmorphism background */}
//       <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#e0e7ef] via-[#f8fafc] to-[#dbeafe] dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0e1726] transition-colors duration-500" />
//       {/* Subtle floating glass shapes */}
//       <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-200 dark:bg-cyan-900 opacity-10 rounded-full blur-3xl" />
//       <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-200 dark:bg-blue-900 opacity-10 rounded-full blur-2xl" />
//       <motion.div
//         initial={{ opacity: 0, y: 24 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="max-w-xl w-full z-10"
//       >
//         <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl border border-slate-200 dark:border-slate-800 rounded-3xl px-10 py-14 md:py-16 text-center flex flex-col items-center gap-8 transition-all duration-500">
//           {isPending && (
//             <>
//               {/* Modern illustration */}
//               <div className="w-32 h-32 mx-auto mb-2 flex items-center justify-center">
//                 <img
//                   src="/illustrations/reviewing-docs.svg"
//                   alt="Account under review"
//                   className="w-full h-full object-contain select-none pointer-events-none"
//                   style={{ filter: 'drop-shadow(0 4px 24px rgba(0,180,255,0.10))' }}
//                   loading="lazy"
//                 />
//               </div>
//               <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
//                 Seller Account Review
//               </h1>
//               <p className="text-lg text-slate-600 dark:text-slate-300 mb-6 max-w-lg mx-auto">
//                 Thank you for registering, <span className="font-semibold text-cyan-700 dark:text-cyan-300">{user.name}</span>.<br />
//                 Your seller account is being reviewed by our compliance team.<br />
//                 You will be notified as soon as your account is approved.
//               </p>
//               <div className="flex flex-col md:flex-row gap-4 justify-center w-full mb-2">
//                 <button
//                   onClick={handleCheckStatus}
//                   disabled={checking}
//                   className="px-7 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-semibold text-base shadow-lg transition disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
//                 >
//                   {checking ? (
//                     <span className="flex items-center gap-2"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>Checking...</span>
//                   ) : "Check Status"}
//                 </button>
//                 <button
//                   onClick={handleLogout}
//                   className="px-7 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-xl font-semibold text-base shadow-lg transition focus:outline-none focus:ring-2 focus:ring-cyan-400"
//                 >
//                   Logout
//                 </button>
//               </div>
//               <div className="w-full flex flex-col items-center gap-2 mt-6">
//                 <div className="w-2/3 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
//                   <div className="h-full bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-600 animate-progress-bar" />
//                 </div>
//                 <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 tracking-wide">Waiting for admin approval</span>
//               </div>
//               <div className="w-full mt-8 text-left">
//                 <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
//                   <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6m9-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
//                   What happens next?
//                 </h3>
//                 <ul className="space-y-2 text-slate-700 dark:text-slate-300 text-base">
//                   <li className="flex items-start gap-2">
//                     <span className="text-cyan-500 mt-1">•</span>
//                     <span>Your application is being reviewed by our compliance team</span>
//                   </li>
//                   <li className="flex items-start gap-2">
//                     <span className="text-cyan-500 mt-1">•</span>
//                     <span>You will receive an email once your account is approved</span>
//                   </li>
//                   <li className="flex items-start gap-2">
//                     <span className="text-cyan-500 mt-1">•</span>
//                     <span>After approval, you can access your seller dashboard and start listing products</span>
//                   </li>
//                   <li className="flex items-start gap-2">
//                     <span className="text-cyan-500 mt-1">•</span>
//                     <span>Set up your payment details and bank account for payouts</span>
//                   </li>
//                 </ul>
//               </div>
//             </>
//           )}

//           {isRejected && (
//             <>
//               <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-linear-to-br from-red-400 to-red-600 flex items-center justify-center">
//                 <svg
//                   className="w-12 h-12 text-white"
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M6 18L18 6M6 6l12 12"
//                   />
//                 </svg>
//               </div>
              
//               <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
//                 Application Not Approved
//               </h1>
              
//               <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-6">
//                 <h2 className="text-xl font-semibold text-red-400 mb-2">
//                   Account Rejected
//                 </h2>
//                 <p className="text-white/70 leading-relaxed mb-4">
//                   Unfortunately, your seller account application was not approved at this time.
//                 </p>
//                 {user.approvalReason && (
//                   <div className="bg-white/5 rounded-lg p-4 text-left">
//                     <p className="text-sm text-white/60 mb-1">Reason:</p>
//                     <p className="text-white/90">{user.approvalReason}</p>
//                   </div>
//                 )}
//               </div>

//               <div className="bg-white/5 rounded-xl p-6 mb-8 text-left">
//                 <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
//                   <span className="text-2xl">💡</span>
//                   What can you do?
//                 </h3>
//                 <ul className="space-y-3 text-white/70">
//                   <li className="flex items-start gap-3">
//                     <span className="text-cyan-400 mt-1">•</span>
//                     <span>Contact our support team for more information</span>
//                   </li>
//                   <li className="flex items-start gap-3">
//                     <span className="text-cyan-400 mt-1">•</span>
//                     <span>Address the concerns mentioned in the rejection reason</span>
//                   </li>
//                   <li className="flex items-start gap-3">
//                     <span className="text-cyan-400 mt-1">•</span>
//                     <span>You can create a new account and reapply in the future</span>
//                   </li>
//                 </ul>
//               </div>

//               <div className="flex flex-col sm:flex-row gap-3 justify-center">
//                 <button
//                   onClick={() => router.push("/dashboard")}
//                   className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-semibold transition"
//                 >
//                   Browse as Buyer
//                 </button>
//                 <button
//                   onClick={handleLogout}
//                   className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition"
//                 >
//                   Logout
//                 </button>
//               </div>
//             </>
//           )}
//         </div>

//         <p className="text-center text-white/60 text-base mt-8">
//           Need help? <a href="mailto:support@sellify.com" className="underline text-cyan-300 hover:text-cyan-400 transition">Contact us at support@sellify.com</a>
//         </p>
//       </motion.div>
//     </div>
//   );
// }



"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, clearAuthStorage, setCookie } from "@/lib/cookies";
import { userAPI } from "@/lib/api";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function PendingApprovalPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const prevStatus = useRef<string | undefined>(undefined);
  const router = useRouter();

  const fetchUserStatus = async () => {
    try {
      setChecking(true);
      const fresh = await userAPI.getCurrentUser();

      setCookie("user", JSON.stringify(fresh), 7);
      localStorage.setItem("user", JSON.stringify(fresh));
      setUser(fresh);

      const wasPending = prevStatus.current === "pending";
      const isNowApproved =
        fresh.role === "seller" &&
        (fresh.approvalStatus === "approved" || fresh.isApproved);

      const congratsFlag = localStorage.getItem(
        "sellerApprovedCongratsShown"
      );

      if (wasPending && isNowApproved && !congratsFlag) {
        toast.success(
          "Congratulations! Your account has been approved. Redirecting to your dashboard..."
        );
        localStorage.setItem("sellerApprovedCongratsShown", "true");

        setTimeout(() => {
          router.replace("/dashboard/seller");
        }, 2000);

        setShouldRender(false);
        setLoading(false);
        prevStatus.current = fresh.approvalStatus;
        return;
      }

      if (isNowApproved) {
        router.replace("/dashboard/seller");
        setShouldRender(false);
        setLoading(false);
        prevStatus.current = fresh.approvalStatus;
        return;
      }

      setShouldRender(true);

      if (fresh.approvalStatus === "rejected") {
        toast.error("Your account application was not approved.");
      } else {
        toast("Your account is still pending approval.", {
          icon: "⏳",
        });
      }

      setLoading(false);
      prevStatus.current = fresh.approvalStatus;
    } catch (error) {
      console.error(error);
      toast.error("Failed to check status");
      setLoading(false);
      setShouldRender(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    const stored = getStoredUser();

    if (!stored) {
      router.replace("/login");
      return;
    }

    if (stored.role !== "seller") {
      router.replace("/dashboard");
      return;
    }

    prevStatus.current = stored.approvalStatus;
    fetchUserStatus();
  }, [router]);

  const handleLogout = () => {
    clearAuthStorage();
    router.push("/login");
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <p className="text-white/70">Checking approval status…</p>
      </div>
    );
  }

  if (!shouldRender) return null;

  const isPending =
    user.approvalStatus === "pending" ||
    (!user.isApproved && !user.approvalStatus);

  const isRejected = user.approvalStatus === "rejected";

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        {isPending && (
          <>
            <h1 className="text-3xl font-bold text-white mb-4 text-center">
              Seller Account Under Review
            </h1>

            <p className="text-slate-400 text-center mb-8">
              Dear{" "}
              <span className="font-semibold text-cyan-400">
                {user.name}
              </span>
              , your seller account is currently under administrative review.
            </p>

            <div className="space-y-3 text-slate-400 mb-10">
              <p>
                During this process, your submitted information is verified to
                ensure compliance with platform requirements.
              </p>

              <p>
                Reviews are typically completed within <strong>24–48 hours</strong>.
                No action is required from you at this time.
              </p>

              <p>
                Upon approval, you will gain access to the seller dashboard and
                related features.
              </p>
            </div>

            <div className="mb-10">
              <h2 className="text-lg font-semibold text-white mb-3">
                Review Process
              </h2>
              <ul className="list-disc list-inside space-y-2 text-slate-400">
                <li>Application review by an administrator</li>
                <li>Status update upon completion</li>
                <li>Dashboard access if approved</li>
                <li>Rejection reason displayed if declined</li>
              </ul>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={fetchUserStatus}
                disabled={checking}
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md font-semibold disabled:opacity-50"
              >
                {checking ? "Checking…" : "Check Status"}
              </button>

              <button
                onClick={handleLogout}
                className="px-6 py-2 border border-slate-700 text-slate-300 rounded-md"
              >
                Logout
              </button>
            </div>
          </>
        )}

        {isRejected && (
          <>
            <h1 className="text-3xl font-bold text-white mb-4 text-center">
              Application Not Approved
            </h1>

            <p className="text-slate-400 text-center mb-8">
              Your seller account application was not approved at this time.
            </p>

            {user.approvalReason && (
              <div className="mb-8">
                <p className="text-sm text-slate-500 mb-1">
                  Reason for rejection
                </p>
                <p className="text-slate-300">{user.approvalReason}</p>
              </div>
            )}

            <div className="mb-10">
              <h2 className="text-lg font-semibold text-white mb-3">
                Next Steps
              </h2>
              <ul className="list-disc list-inside space-y-2 text-slate-400">
                <li>Review the provided reason carefully</li>
                <li>Contact support for clarification if required</li>
                <li>Reapply after addressing the identified issues</li>
                <li>Continue using the platform as a buyer</li>
              </ul>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md font-semibold"
              >
                Browse as Buyer
              </button>

              <button
                onClick={handleLogout}
                className="px-6 py-2 border border-slate-700 text-slate-300 rounded-md"
              >
                Logout
              </button>
            </div>
          </>
        )}

        <p className="mt-16 text-center text-slate-500">
          Need assistance?{" "}
          <a
            href="mailto:support@bitforge.com"
            className="underline hover:text-slate-300"
          >
            support@bitforge.com
          </a>
        </p>
      </motion.div>
    </div>
  );
}
