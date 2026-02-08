"use client";

import { useState } from "react";
import Link from "next/link";

export default function AuthenticationAPIPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-white/60">
          <Link href="/docs" className="hover:text-cyan-400">
            Documentation
          </Link>
          <span className="mx-2">/</span>
          <Link href="/docs" className="hover:text-cyan-400">
            API Reference
          </Link>
          <span className="mx-2">/</span>
          <span className="text-white">Authentication API</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold text-indigo-400 bg-indigo-500/10 rounded-full border border-indigo-500/20">
            API Reference
          </span>
          <h1 className="text-4xl font-bold text-white mb-4">
            Authentication API
          </h1>
          <p className="text-lg text-white/70">
            Complete API reference for user authentication, registration, OAuth flows, and session management in ContentSellify.
          </p>
        </div>

        {/* Base URL */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Base URL</h2>
          <CodeBlock code="http://localhost:5000/api/auth" language="bash" />
          <p className="text-white/60 text-sm mt-2">
            Production: <code className="text-cyan-300 bg-slate-950/50 px-2 py-1 rounded">https://api.contentsellify.com/api/auth</code>
          </p>
        </section>

        {/* Authentication Methods */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Authentication Methods</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
              <div className="text-3xl mb-2">🔐</div>
              <h3 className="text-white font-semibold">JWT Tokens</h3>
              <p className="text-white/60 text-sm mt-2">Bearer token authentication</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
              <div className="text-3xl mb-2">🍪</div>
              <h3 className="text-white font-semibold">HTTP Cookies</h3>
              <p className="text-white/60 text-sm mt-2">Secure session cookies</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
              <div className="text-3xl mb-2">🔑</div>
              <h3 className="text-white font-semibold">OAuth 2.0</h3>
              <p className="text-white/60 text-sm mt-2">Google & GitHub</p>
            </div>
          </div>
        </section>

        {/* Register User */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">POST /register</h2>
          <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
            <p className="text-white/80 mb-4">Register a new user with email and password.</p>
            
            <h3 className="text-white font-semibold mb-3">Request Body</h3>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-white/80 py-2 pr-4">Parameter</th>
                    <th className="text-left text-white/80 py-2 pr-4">Type</th>
                    <th className="text-left text-white/80 py-2 pr-4">Required</th>
                    <th className="text-left text-white/80 py-2">Description</th>
                  </tr>
                </thead>
                <tbody className="text-white/60">
                  <tr className="border-b border-white/5">
                    <td className="py-3 pr-4"><code className="text-cyan-300">name</code></td>
                    <td className="py-3 pr-4">string</td>
                    <td className="py-3 pr-4"><span className="text-green-400">Yes</span></td>
                    <td className="py-3">Full name (2-50 characters)</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 pr-4"><code className="text-cyan-300">email</code></td>
                    <td className="py-3 pr-4">string</td>
                    <td className="py-3 pr-4"><span className="text-green-400">Yes</span></td>
                    <td className="py-3">Valid email address</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 pr-4"><code className="text-cyan-300">password</code></td>
                    <td className="py-3 pr-4">string</td>
                    <td className="py-3 pr-4"><span className="text-green-400">Yes</span></td>
                    <td className="py-3">Minimum 8 characters</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 pr-4"><code className="text-cyan-300">role</code></td>
                    <td className="py-3 pr-4">string</td>
                    <td className="py-3 pr-4"><span className="text-yellow-400">Optional</span></td>
                    <td className="py-3">"seller" or "buyer" (default: "buyer")</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-white font-semibold mb-3">Example Request</h3>
            <CodeBlock 
              code={`curl -X POST http://localhost:5000/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Swapnil Shelke",
    "email": "swapnil@example.com",
    "password": "SecurePass123!",
    "role": "seller"
  }'`}
              language="bash"
            />

            <h3 className="text-white font-semibold mb-3 mt-6">Success Response (201 Created)</h3>
            <CodeBlock 
              code={`{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Swapnil Shelke",
      "email": "swapnil@example.com",
      "role": "seller",
      "isVerified": false,
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}`}
              language="json"
            />

            <h3 className="text-white font-semibold mb-3 mt-6">Error Responses</h3>
            <div className="space-y-3">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 font-semibold mb-2">400 Bad Request</p>
                <CodeBlock 
                  code={`{
  "success": false,
  "error": "Email already registered"
}`}
                  language="json"
                />
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 font-semibold mb-2">422 Validation Error</p>
                <CodeBlock 
                  code={`{
  "success": false,
  "error": "Validation failed",
  "details": {
    "email": "Invalid email format",
    "password": "Password must be at least 8 characters"
  }
}`}
                  language="json"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Login */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">POST /login</h2>
          <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
            <p className="text-white/80 mb-4">Login with email and password to receive a JWT token.</p>
            
            <h3 className="text-white font-semibold mb-3">Request Body</h3>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-white/80 py-2 pr-4">Parameter</th>
                    <th className="text-left text-white/80 py-2 pr-4">Type</th>
                    <th className="text-left text-white/80 py-2 pr-4">Required</th>
                    <th className="text-left text-white/80 py-2">Description</th>
                  </tr>
                </thead>
                <tbody className="text-white/60">
                  <tr className="border-b border-white/5">
                    <td className="py-3 pr-4"><code className="text-cyan-300">email</code></td>
                    <td className="py-3 pr-4">string</td>
                    <td className="py-3 pr-4"><span className="text-green-400">Yes</span></td>
                    <td className="py-3">Registered email address</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 pr-4"><code className="text-cyan-300">password</code></td>
                    <td className="py-3 pr-4">string</td>
                    <td className="py-3 pr-4"><span className="text-green-400">Yes</span></td>
                    <td className="py-3">User password</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-white font-semibold mb-3">Example Request</h3>
            <CodeBlock 
              code={`curl -X POST http://localhost:5000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "swapnil@example.com",
    "password": "SecurePass123!"
  }'`}
              language="bash"
            />

            <h3 className="text-white font-semibold mb-3 mt-6">Success Response (200 OK)</h3>
            <CodeBlock 
              code={`{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Swapnil Shelke",
      "email": "swapnil@example.com",
      "role": "seller",
      "isVerified": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "7d"
  }
}`}
              language="json"
            />

            <h3 className="text-white font-semibold mb-3 mt-6">Error Responses</h3>
            <div className="space-y-3">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 font-semibold mb-2">401 Unauthorized</p>
                <CodeBlock 
                  code={`{
  "success": false,
  "error": "Invalid email or password"
}`}
                  language="json"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Get Current User */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">GET /me</h2>
          <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
            <p className="text-white/80 mb-4">Get the currently authenticated user's profile.</p>
            
            <h3 className="text-white font-semibold mb-3">Headers</h3>
            <CodeBlock code="Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." language="bash" />

            <h3 className="text-white font-semibold mb-3 mt-6">Example Request</h3>
            <CodeBlock 
              code={`curl -X GET http://localhost:5000/api/auth/me \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`}
              language="bash"
            />

            <h3 className="text-white font-semibold mb-3 mt-6">Success Response (200 OK)</h3>
            <CodeBlock 
              code={`{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Swapnil Shelke",
      "email": "swapnil@example.com",
      "role": "seller",
      "isVerified": true,
      "profile": {
        "avatar": "https://cdn.contentsellify.com/avatars/user123.jpg",
        "bio": "Digital content creator",
        "website": "https://bitforge.in"
      },
      "stats": {
        "totalSales": 150,
        "totalEarnings": 75000,
        "productsListed": 25
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}`}
              language="json"
            />

            <h3 className="text-white font-semibold mb-3 mt-6">Error Response</h3>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 font-semibold mb-2">401 Unauthorized</p>
              <CodeBlock 
                code={`{
  "success": false,
  "error": "Invalid or expired token"
}`}
                language="json"
              />
            </div>
          </div>
        </section>

        {/* OAuth Google */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">GET /google</h2>
          <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
            <p className="text-white/80 mb-4">Initiate Google OAuth 2.0 authentication flow.</p>
            
            <h3 className="text-white font-semibold mb-3">Usage</h3>
            <p className="text-white/60 text-sm mb-4">Redirect user to this endpoint to start Google login:</p>
            <CodeBlock code="window.location.href = 'http://localhost:5000/api/auth/google';" language="javascript" />

            <h3 className="text-white font-semibold mb-3 mt-6">Flow</h3>
            <ol className="space-y-2 text-white/70">
              <li className="flex items-start gap-3">
                <span className="font-bold text-cyan-400">1.</span>
                <span>User clicks "Continue with Google" button</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-bold text-cyan-400">2.</span>
                <span>Browser redirects to <code className="text-cyan-300 bg-slate-950/50 px-2 py-1 rounded">/api/auth/google</code></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-bold text-cyan-400">3.</span>
                <span>Server redirects to Google's OAuth consent screen</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-bold text-cyan-400">4.</span>
                <span>User authorizes application</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-bold text-cyan-400">5.</span>
                <span>Google redirects to <code className="text-cyan-300 bg-slate-950/50 px-2 py-1 rounded">/api/auth/google/callback</code></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-bold text-cyan-400">6.</span>
                <span>Server creates/finds user and issues JWT token</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-bold text-cyan-400">7.</span>
                <span>User redirected to dashboard with auth cookie</span>
              </li>
            </ol>
          </div>
        </section>

        {/* OAuth GitHub */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">GET /github</h2>
          <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
            <p className="text-white/80 mb-4">Initiate GitHub OAuth 2.0 authentication flow.</p>
            
            <h3 className="text-white font-semibold mb-3">Usage</h3>
            <p className="text-white/60 text-sm mb-4">Redirect user to this endpoint to start GitHub login:</p>
            <CodeBlock code="window.location.href = 'http://localhost:5000/api/auth/github';" language="javascript" />

            <p className="text-white/60 text-sm mt-4">
              Flow is identical to Google OAuth. GitHub redirects to <code className="text-cyan-300 bg-slate-950/50 px-2 py-1 rounded">/api/auth/github/callback</code> after authorization.
            </p>
          </div>
        </section>

        {/* Logout */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">POST /logout</h2>
          <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
            <p className="text-white/80 mb-4">Logout user and invalidate session/token.</p>
            
            <h3 className="text-white font-semibold mb-3">Headers</h3>
            <CodeBlock code="Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." language="bash" />

            <h3 className="text-white font-semibold mb-3 mt-6">Example Request</h3>
            <CodeBlock 
              code={`curl -X POST http://localhost:5000/api/auth/logout \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`}
              language="bash"
            />

            <h3 className="text-white font-semibold mb-3 mt-6">Success Response (200 OK)</h3>
            <CodeBlock 
              code={`{
  "success": true,
  "message": "Logged out successfully"
}`}
              language="json"
            />
          </div>
        </section>

        {/* Refresh Token */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">POST /refresh</h2>
          <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
            <p className="text-white/80 mb-4">Refresh an expired JWT token using a refresh token.</p>
            
            <h3 className="text-white font-semibold mb-3">Request Body</h3>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-white/80 py-2 pr-4">Parameter</th>
                    <th className="text-left text-white/80 py-2 pr-4">Type</th>
                    <th className="text-left text-white/80 py-2 pr-4">Required</th>
                    <th className="text-left text-white/80 py-2">Description</th>
                  </tr>
                </thead>
                <tbody className="text-white/60">
                  <tr className="border-b border-white/5">
                    <td className="py-3 pr-4"><code className="text-cyan-300">refreshToken</code></td>
                    <td className="py-3 pr-4">string</td>
                    <td className="py-3 pr-4"><span className="text-green-400">Yes</span></td>
                    <td className="py-3">Valid refresh token</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-white font-semibold mb-3">Example Request</h3>
            <CodeBlock 
              code={`curl -X POST http://localhost:5000/api/auth/refresh \\
  -H "Content-Type: application/json" \\
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'`}
              language="bash"
            />

            <h3 className="text-white font-semibold mb-3 mt-6">Success Response (200 OK)</h3>
            <CodeBlock 
              code={`{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "7d"
  }
}`}
              language="json"
            />
          </div>
        </section>

        {/* JWT Token Structure */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-cyan-400">🎫</span> JWT Token Structure
          </h2>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <p className="text-white/80 mb-4">JWT tokens are returned upon successful login/registration. Include them in the Authorization header for protected endpoints.</p>
            
            <h3 className="text-white font-semibold mb-3">Token Payload</h3>
            <CodeBlock 
              code={`{
  "userId": "507f1f77bcf86cd799439011",
  "email": "swapnil@example.com",
  "role": "seller",
  "iat": 1705315800,
  "exp": 1705920600
}`}
              language="json"
            />

            <h3 className="text-white font-semibold mb-3 mt-6">Using Tokens</h3>
            <p className="text-white/60 text-sm mb-3">Include the JWT in the Authorization header of protected API requests:</p>
            <CodeBlock code="Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." language="bash" />

            <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-200 text-sm flex items-start gap-2">
                <span className="text-xl">⚠️</span>
                <span>
                  <strong>Important:</strong> Tokens expire after 7 days. Use the refresh endpoint to get a new token without re-authenticating.
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* Error Codes */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Common Error Codes</h2>
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center bg-red-500/20 rounded-lg">
                  <span className="text-red-400 font-bold text-lg">400</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Bad Request</h3>
                  <p className="text-white/60 text-sm">Invalid input data or missing required fields</p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center bg-orange-500/20 rounded-lg">
                  <span className="text-orange-400 font-bold text-lg">401</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Unauthorized</h3>
                  <p className="text-white/60 text-sm">Invalid credentials or missing/expired token</p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center bg-red-500/20 rounded-lg">
                  <span className="text-red-400 font-bold text-lg">403</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Forbidden</h3>
                  <p className="text-white/60 text-sm">Insufficient permissions for requested resource</p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center bg-yellow-500/20 rounded-lg">
                  <span className="text-yellow-400 font-bold text-lg">422</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Validation Error</h3>
                  <p className="text-white/60 text-sm">Request data failed validation rules</p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center bg-red-500/20 rounded-lg">
                  <span className="text-red-400 font-bold text-lg">500</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Internal Server Error</h3>
                  <p className="text-white/60 text-sm">Unexpected server error occurred</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related APIs */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-6">Related APIs</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <NextStepCard
              title="Products API"
              description="Manage digital products and listings"
              href="/docs/api/products"
              icon="📦"
            />
            <NextStepCard
              title="Payouts API"
              description="Process seller payouts and withdrawals"
              href="/docs/api/payouts"
              icon="💸"
            />
            <NextStepCard
              title="Orders API"
              description="Track purchases and transaction history"
              href="/docs/api/orders"
              icon="🛒"
            />
            <NextStepCard
              title="OAuth Setup Guide"
              description="Configure Google and GitHub OAuth"
              href="/docs/oauth-setup"
              icon="🔐"
            />
          </div>
        </section>

        {/* Support CTA */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-3">Need Help with Authentication?</h3>
          <p className="text-white/70 mb-6">
            Having trouble integrating authentication? Contact our API support team.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/contact"
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors"
            >
              Contact Support
            </Link>
            <Link
              href="/docs/quick-start"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg border border-white/10 transition-colors"
            >
              View Quick Start Guide
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable Components
function CodeBlock({ code, language = "bash" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group mb-4">
      <pre className="bg-slate-950/50 border border-white/10 rounded-lg p-4 overflow-x-auto">
        <code className="text-cyan-300 text-sm font-mono">{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? "✓ Copied" : "Copy"}
      </button>
    </div>
  );
}

function NextStepCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="group block bg-white/5 border border-white/10 rounded-xl p-6 hover:border-cyan-400/40 hover:bg-white/10 transition-all"
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-300">
        {title}
      </h3>
      <p className="text-white/60 text-sm group-hover:text-white/70">{description}</p>
      <span className="inline-block mt-3 text-cyan-400 text-sm group-hover:translate-x-1 transition-transform">
        Learn more →
      </span>
    </Link>
  );
}
