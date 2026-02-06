"use client";

import { Suspense, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { clearAuthStorage, setCookie } from "@/lib/cookies";

function AuthSuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error) {
      toast.error("Authentication failed. Please try again.");
      clearAuthStorage();
      router.push("/login");
      return;
    }

    if (token) {
      
      try {
        // Decode JWT token to get user data
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const tokenData = JSON.parse(jsonPayload);

        // Create user object from token data
        const user = {
          id: tokenData.userId,
          name: tokenData.name,
          email: tokenData.email,
          phone: tokenData.phone,
          role: tokenData.role || 'buyer',
          isVerified: tokenData.isVerified
        };
        
        // Store token and user data
        setCookie("token", token, 7);
        setCookie("user", JSON.stringify(user), 7);
        
        toast.success("Successfully logged in!");
        router.push(`/dashboard/${user.role}`);
      } catch (error) {
        console.error('❌ Error decoding token:', error);
        toast.error("Authentication failed. Invalid token.");
        clearAuthStorage();
        router.push("/login");
      }
    } else {
      toast.error("Authentication failed. No token received.");
      clearAuthStorage();
      router.push("/login");
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-linear-to-br from-indigo-200 via-purple-200 to-pink-200">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl px-8 py-7 text-center">
        
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-linear-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
            <div className="flex flex-col items-center justify-center ">
                      <Image
                        src="/bitforge_logo1.png"
                        alt="BitForge logo"
                        width={512}
                        height={512}
                        className="
                          h-24        
                          sm:h-32    
                          md:h-40    
                          lg:h-48     
                          w-auto
                          object-contain
                          -mt-8
                          block
                        "
                        priority
                      />
                    </div>
          </div>
        </div>

        <h1 className="text-xl font-semibold text-gray-900 mb-4">
          Processing Authentication...
        </h1>
        
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
        
        <p className="text-sm text-gray-500 mt-4">
          Please wait while we complete your login.
        </p>
      </div>
    </div>
  );
}

function AuthSuccessFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-linear-to-br from-indigo-200 via-purple-200 to-pink-200">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
    </div>
  );
}

export default function AuthSuccessPage() {
  return (
    <Suspense fallback={<AuthSuccessFallback />}>
      <AuthSuccessPageContent />
    </Suspense>
  );
}