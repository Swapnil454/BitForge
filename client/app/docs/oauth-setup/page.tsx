"use client";

import { useState } from "react";
import Link from "next/link";

export default function OAuthSetupPage() {
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
            Getting Started
          </Link>
          <span className="mx-2">/</span>
          <span className="text-white">OAuth Setup</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold text-cyan-400 bg-cyan-500/10 rounded-full border border-cyan-500/20">
            Getting Started
          </span>
          <h1 className="text-4xl font-bold text-white mb-4">
            OAuth Authentication Setup
          </h1>
          <p className="text-lg text-white/70">
            Enable Google and GitHub OAuth for seamless user registration and login. This guide covers complete OAuth integration for both providers.
          </p>
        </div>

        {/* Overview */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Overview</h2>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <p className="text-white/80 mb-4">
              ContentSellify supports OAuth 2.0 authentication with Google and GitHub, allowing users to:
            </p>
            <ul className="space-y-2 text-white/70">
              <li className="flex items-start gap-3">
                <span className="text-green-400">✓</span>
                <span>Register and log in without creating passwords</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400">✓</span>
                <span>Link multiple authentication providers to one account</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400">✓</span>
                <span>Improve security with industry-standard OAuth flows</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400">✓</span>
                <span>Reduce friction in the registration process</span>
              </li>
            </ul>
          </div>
        </section>

        {/* How OAuth Works */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-cyan-400">🔄</span> How OAuth Works
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-5 text-center">
              <div className="text-3xl mb-3">👤</div>
              <h3 className="text-white font-semibold mb-2">1. User Clicks Login</h3>
              <p className="text-white/60 text-sm">User chooses Google or GitHub</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-5 text-center">
              <div className="text-3xl mb-3">🔀</div>
              <h3 className="text-white font-semibold mb-2">2. Redirect to Provider</h3>
              <p className="text-white/60 text-sm">User authenticates with provider</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-5 text-center">
              <div className="text-3xl mb-3">🎫</div>
              <h3 className="text-white font-semibold mb-2">3. Authorization Code</h3>
              <p className="text-white/60 text-sm">Provider returns auth code</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-5 text-center">
              <div className="text-3xl mb-3">✅</div>
              <h3 className="text-white font-semibold mb-2">4. Create Session</h3>
              <p className="text-white/60 text-sm">User logged in successfully</p>
            </div>
          </div>
        </section>

        {/* Google OAuth Setup */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">
            <span className="text-cyan-400">1.</span> Google OAuth Setup
          </h2>
          
          {/* Step 1.1 */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-white mb-3">1.1 Create Google Cloud Project</h3>
            <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
              <ol className="space-y-4 text-white/80">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold">
                    1
                  </span>
                  <div>
                    <p>Go to <a href="https://console.cloud.google.com/" target="_blank" className="text-cyan-400 hover:underline">Google Cloud Console</a></p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold">
                    2
                  </span>
                  <div>
                    <p>Click <strong className="text-white">Select a project</strong> → <strong className="text-white">New Project</strong></p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold">
                    3
                  </span>
                  <div>
                    <p>Enter project name (e.g., "ContentSellify") and click <strong className="text-white">Create</strong></p>
                  </div>
                </li>
              </ol>
            </div>
          </div>

          {/* Step 1.2 */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-white mb-3">1.2 Configure OAuth Consent Screen</h3>
            <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
              <ol className="space-y-4 text-white/80">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold">
                    1
                  </span>
                  <div>
                    <p>Navigate to <strong className="text-white">APIs & Services</strong> → <strong className="text-white">OAuth consent screen</strong></p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold">
                    2
                  </span>
                  <div>
                    <p>Select <strong className="text-white">External</strong> user type and click <strong className="text-white">Create</strong></p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold">
                    3
                  </span>
                  <div>
                    <p>Fill in required fields:</p>
                    <ul className="mt-2 ml-4 space-y-2 text-sm">
                      <li>• App name: <code className="text-cyan-300 bg-slate-950/50 px-2 py-1 rounded">ContentSellify</code></li>
                      <li>• User support email: Your email</li>
                      <li>• Developer contact: Your email</li>
                    </ul>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold">
                    4
                  </span>
                  <div>
                    <p>Click <strong className="text-white">Save and Continue</strong> through remaining screens</p>
                  </div>
                </li>
              </ol>
            </div>
          </div>

          {/* Step 1.3 */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-white mb-3">1.3 Create OAuth Credentials</h3>
            <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
              <ol className="space-y-4 text-white/80">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold">
                    1
                  </span>
                  <div>
                    <p>Go to <strong className="text-white">APIs & Services</strong> → <strong className="text-white">Credentials</strong></p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold">
                    2
                  </span>
                  <div>
                    <p>Click <strong className="text-white">Create Credentials</strong> → <strong className="text-white">OAuth client ID</strong></p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold">
                    3
                  </span>
                  <div>
                    <p>Select <strong className="text-white">Web application</strong> as application type</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold">
                    4
                  </span>
                  <div>
                    <p>Add Authorized redirect URIs:</p>
                    <CodeBlock code="http://localhost:3000/api/auth/google/callback" language="bash" />
                    <CodeBlock code="https://yourdomain.com/api/auth/google/callback" language="bash" />
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold">
                    5
                  </span>
                  <div>
                    <p>Click <strong className="text-white">Create</strong> and copy your <strong>Client ID</strong> and <strong>Client Secret</strong></p>
                  </div>
                </li>
              </ol>
            </div>
          </div>

          {/* Step 1.4 */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-3">1.4 Add to Environment Variables</h3>
            <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
              <p className="text-white/80 mb-4">Add these to your <code className="text-cyan-300 bg-slate-950/50 px-2 py-1 rounded">server/.env</code> file:</p>
              <CodeBlock 
                code={`GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback`}
                language="bash"
              />
            </div>
          </div>
        </section>

        {/* GitHub OAuth Setup */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">
            <span className="text-cyan-400">2.</span> GitHub OAuth Setup
          </h2>
          
          {/* Step 2.1 */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-white mb-3">2.1 Register OAuth App on GitHub</h3>
            <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
              <ol className="space-y-4 text-white/80">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold">
                    1
                  </span>
                  <div>
                    <p>Go to <a href="https://github.com/settings/developers" target="_blank" className="text-cyan-400 hover:underline">GitHub Developer Settings</a></p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold">
                    2
                  </span>
                  <div>
                    <p>Click <strong className="text-white">OAuth Apps</strong> → <strong className="text-white">New OAuth App</strong></p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold">
                    3
                  </span>
                  <div>
                    <p>Fill in application details:</p>
                    <ul className="mt-2 ml-4 space-y-2 text-sm">
                      <li>• <strong>Application name:</strong> <code className="text-cyan-300 bg-slate-950/50 px-2 py-1 rounded">ContentSellify</code></li>
                      <li>• <strong>Homepage URL:</strong> <code className="text-cyan-300 bg-slate-950/50 px-2 py-1 rounded">http://localhost:3000</code></li>
                      <li>• <strong>Authorization callback URL:</strong> <code className="text-cyan-300 bg-slate-950/50 px-2 py-1 rounded">http://localhost:3000/api/auth/github/callback</code></li>
                    </ul>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold">
                    4
                  </span>
                  <div>
                    <p>Click <strong className="text-white">Register application</strong></p>
                  </div>
                </li>
              </ol>
            </div>
          </div>

          {/* Step 2.2 */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-white mb-3">2.2 Generate Client Secret</h3>
            <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
              <ol className="space-y-4 text-white/80">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold">
                    1
                  </span>
                  <div>
                    <p>On the OAuth App page, copy your <strong className="text-white">Client ID</strong></p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold">
                    2
                  </span>
                  <div>
                    <p>Click <strong className="text-white">Generate a new client secret</strong></p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold">
                    3
                  </span>
                  <div>
                    <p>Copy the generated secret immediately (you won't be able to see it again)</p>
                  </div>
                </li>
              </ol>
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-200 text-sm flex items-start gap-2">
                  <span className="text-xl">⚠️</span>
                  <span>
                    <strong>Important:</strong> Save your client secret securely. GitHub won't show it again.
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Step 2.3 */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-3">2.3 Add to Environment Variables</h3>
            <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
              <p className="text-white/80 mb-4">Add these to your <code className="text-cyan-300 bg-slate-950/50 px-2 py-1 rounded">server/.env</code> file:</p>
              <CodeBlock 
                code={`GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback`}
                language="bash"
              />
            </div>
          </div>
        </section>

        {/* Complete Environment Variables */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">
            <span className="text-cyan-400">3.</span> Complete Environment Variables
          </h2>
          <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-6">
            <p className="text-white/80 mb-4">Your final <code className="text-cyan-300 bg-slate-950/50 px-2 py-1 rounded">server/.env</code> should include:</p>
            <CodeBlock 
              code={`# OAuth - Google
GOOGLE_CLIENT_ID=1234567890-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# OAuth - GitHub
GITHUB_CLIENT_ID=Iv1.abcd1234efgh5678
GITHUB_CLIENT_SECRET=abcdef1234567890abcdef1234567890abcdef12
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback

# JWT Secret (generate a strong random string)
JWT_SECRET=your_super_secret_jwt_key_here

# Session Secret (generate a strong random string)
SESSION_SECRET=your_super_secret_session_key_here`}
              language="bash"
            />
          </div>
        </section>

        {/* Testing OAuth */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-cyan-400">🧪</span> Testing OAuth Integration
          </h2>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <ol className="space-y-4 text-white/70">
              <li className="flex items-start gap-3">
                <span className="font-bold text-cyan-400">1.</span>
                <div>
                  <p className="text-white/80 mb-2">Start your application:</p>
                  <CodeBlock code="npm run dev" language="bash" />
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-bold text-cyan-400">2.</span>
                <span>Navigate to the login page: <code className="text-cyan-300 bg-slate-950/50 px-2 py-1 rounded">http://localhost:3000/login</code></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-bold text-cyan-400">3.</span>
                <span>Click <strong className="text-white">"Continue with Google"</strong> or <strong className="text-white">"Continue with GitHub"</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-bold text-cyan-400">4.</span>
                <span>Authorize the application when prompted</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-bold text-cyan-400">5.</span>
                <span>Verify you're redirected back and logged in successfully</span>
              </li>
            </ol>
          </div>
        </section>

        {/* Production Deployment */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-cyan-400">🚀</span> Production Deployment
          </h2>
          <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl p-6">
            <p className="text-white/80 mb-4">Before deploying to production:</p>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-white font-semibold mb-2">1. Update OAuth Apps with Production URLs</h3>
                <p className="text-white/60 text-sm mb-2">Add your production domain to authorized redirect URIs:</p>
                <CodeBlock code="https://yourdomain.com/api/auth/google/callback" language="bash" />
                <CodeBlock code="https://yourdomain.com/api/auth/github/callback" language="bash" />
              </div>

              <div>
                <h3 className="text-white font-semibold mb-2">2. Update Environment Variables</h3>
                <p className="text-white/60 text-sm mb-2">Update callback URLs in production <code className="text-cyan-300 bg-slate-950/50 px-2 py-1 rounded">.env</code>:</p>
                <CodeBlock 
                  code={`GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
GITHUB_CALLBACK_URL=https://yourdomain.com/api/auth/github/callback`}
                  language="bash"
                />
              </div>

              <div>
                <h3 className="text-white font-semibold mb-2">3. Verify OAuth Apps</h3>
                <ul className="space-y-2 text-white/70 text-sm ml-6 list-disc">
                  <li>Google: Complete app verification (mandatory for scaling beyond 100 users)</li>
                  <li>Add privacy policy and terms of service URLs</li>
                  <li>Test OAuth flow on production domain before launch</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Troubleshooting */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-cyan-400">🔧</span> Troubleshooting
          </h2>
          <div className="space-y-4">
            <details className="bg-white/5 border border-white/10 rounded-xl p-5 cursor-pointer">
              <summary className="text-white font-semibold">Invalid Redirect URI Error</summary>
              <div className="mt-4 space-y-2 text-white/70 text-sm">
                <p><strong className="text-white">Problem:</strong> "redirect_uri_mismatch" error during OAuth flow</p>
                <p><strong className="text-white">Solution:</strong></p>
                <ul className="ml-6 list-disc space-y-1">
                  <li>Verify redirect URI in OAuth app matches exactly (including protocol and port)</li>
                  <li>Check for trailing slashes (http://localhost:3000/ vs http://localhost:3000)</li>
                  <li>Ensure environment variable matches OAuth app callback URL</li>
                  <li>Clear browser cache and try again</li>
                </ul>
              </div>
            </details>

            <details className="bg-white/5 border border-white/10 rounded-xl p-5 cursor-pointer">
              <summary className="text-white font-semibold">OAuth App Not Approved (Google)</summary>
              <div className="mt-4 space-y-2 text-white/70 text-sm">
                <p><strong className="text-white">Problem:</strong> "This app isn't verified" warning on Google login</p>
                <p><strong className="text-white">Solution:</strong></p>
                <ul className="ml-6 list-disc space-y-1">
                  <li>During development, click "Advanced" → "Go to [App] (unsafe)"</li>
                  <li>Add test users in Google Cloud Console (OAuth consent screen → Test users)</li>
                  <li>For production, submit app for verification via Google Cloud Console</li>
                  <li>Verification typically takes 2-4 weeks</li>
                </ul>
              </div>
            </details>

            <details className="bg-white/5 border border-white/10 rounded-xl p-5 cursor-pointer">
              <summary className="text-white font-semibold">User Already Exists Error</summary>
              <div className="mt-4 space-y-2 text-white/70 text-sm">
                <p><strong className="text-white">Problem:</strong> User tries OAuth but email is already registered</p>
                <p><strong className="text-white">Solution:</strong></p>
                <ul className="ml-6 list-disc space-y-1">
                  <li>Implement account linking to merge OAuth with existing account</li>
                  <li>Show message: "Email already registered. Please log in with password"</li>
                  <li>Allow users to link OAuth providers in account settings</li>
                </ul>
              </div>
            </details>

            <details className="bg-white/5 border border-white/10 rounded-xl p-5 cursor-pointer">
              <summary className="text-white font-semibold">Session Not Persisting</summary>
              <div className="mt-4 space-y-2 text-white/70 text-sm">
                <p><strong className="text-white">Problem:</strong> User logged out immediately after OAuth login</p>
                <p><strong className="text-white">Solution:</strong></p>
                <ul className="ml-6 list-disc space-y-1">
                  <li>Verify JWT_SECRET and SESSION_SECRET are set in environment</li>
                  <li>Check cookie settings (httpOnly, secure, sameSite)</li>
                  <li>Ensure cookies are enabled in browser</li>
                  <li>Check if session store (Redis/MongoDB) is configured correctly</li>
                </ul>
              </div>
            </details>
          </div>
        </section>

        {/* Security Best Practices */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-cyan-400">🛡️</span> Security Best Practices
          </h2>
          <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-xl p-6">
            <ul className="space-y-3 text-white/80">
              <li className="flex items-start gap-3">
                <span className="text-red-400">🔒</span>
                <span><strong className="text-white">Never commit secrets:</strong> Keep OAuth client secrets out of version control</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400">🔒</span>
                <span><strong className="text-white">Validate state parameter:</strong> Prevent CSRF attacks by verifying state tokens</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400">🔒</span>
                <span><strong className="text-white">Use HTTPS in production:</strong> Always use secure connections for OAuth flows</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400">🔒</span>
                <span><strong className="text-white">Rotate secrets regularly:</strong> Update OAuth secrets periodically for security</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400">🔒</span>
                <span><strong className="text-white">Minimal scopes:</strong> Only request necessary user permissions</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Next Steps */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-6">Next Steps</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <NextStepCard
              title="Complete Quick Start"
              description="Finish setting up your development environment"
              href="/docs/quick-start"
              icon="🚀"
            />
            <NextStepCard
              title="Authentication API"
              description="Learn about JWT tokens and session management"
              href="/docs/api/authentication"
              icon="🔐"
            />
            <NextStepCard
              title="User Management"
              description="Admin guide for managing user accounts"
              href="/docs/admin/users"
              icon="👥"
            />
            <NextStepCard
              title="Security Guide"
              description="Best practices for securing your application"
              href="/docs/security"
              icon="🛡️"
            />
          </div>
        </section>

        {/* Support CTA */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-3">Need Help with OAuth?</h3>
          <p className="text-white/70 mb-6">
            Having trouble setting up OAuth authentication? Our support team can help.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/contact"
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors"
            >
              Contact Support
            </Link>
            <Link
              href="/docs/troubleshooting"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg border border-white/10 transition-colors"
            >
              View Troubleshooting Guide
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
