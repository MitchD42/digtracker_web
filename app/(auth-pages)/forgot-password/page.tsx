'use client'

import { forgotPasswordAction } from "@/actions"
import { FormMessage } from "@/components/form-message"
import { SubmitButton } from "@/components/submit-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"
import { UI } from "@/lib/constants/ui"
import { SmtpMessage } from "../smtp-message"
import { useSearchParams } from 'next/navigation'

export default function ForgotPassword() {
  const searchParams = useSearchParams()
  
  const message = searchParams.get('error') 
    ? { error: searchParams.get('error')! }
    : searchParams.get('success')
    ? { success: searchParams.get('success')! }
    : null;

  return (
    <div className="flex items-center justify-center w-full">
      <div className="w-full max-w-4xl p-4">
        <Card className="overflow-hidden shadow-lg">
          <div className="md:grid md:grid-cols-2">
            {/* Left side: Decorative */}
            <div className="relative hidden md:block bg-gradient-to-br from-blue-600 via-teal-600 to-emerald-700">
              <div className="absolute inset-0 bg-grid-white/10 backdrop-blur-sm" />
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-blue-950/50" />
              <div className="relative h-full flex flex-col justify-center p-12">
                <h2 className="text-4xl font-bold text-white mb-6 tracking-tight">
                  Dig Tracker
                </h2>
                <p className="text-lg text-blue-100/90 leading-relaxed">
                  Reset your password to regain access to your account
                </p>
              </div>
            </div>

            {/* Right side: Form */}
            <div className="p-8">
              <CardHeader className="space-y-1 px-0">
                <CardTitle className={UI.text.title + " text-2xl mb-2"}>
                  Reset Password
                </CardTitle>
                <p className={UI.text.subtitle}>
                  Enter your email to receive reset instructions
                </p>
              </CardHeader>
              <CardContent className="px-0">
                <form className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className={UI.text.label}>Email</Label>
                    <Input 
                      id="email"
                      name="email" 
                      placeholder="you@example.com"
                      type="email"
                      required 
                      className={UI.inputs.select}
                    />
                  </div>

                  <SubmitButton 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" 
                    pendingText="Sending reset link..." 
                    formAction={forgotPasswordAction}
                  >
                    Send Reset Link
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </SubmitButton>

                  <FormMessage message={message} />

                  <p className={UI.text.subtitle + " text-center"}>
                    Remember your password?{" "}
                    <Link 
                      className="text-primary hover:text-primary/90 underline underline-offset-4" 
                      href="/sign-in"
                    >
                      Sign in
                    </Link>
                  </p>
                </form>
              </CardContent>
            </div>
          </div>
        </Card>
        <SmtpMessage />
      </div>
    </div>
  );
}
