'use client'

import { signInAction } from "@/actions"
import { FormMessage } from "@/components/form-message"
import { SubmitButton } from "@/components/submit-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { Eye, EyeOff, ArrowRight } from "lucide-react"
import { UI } from "@/lib/constants/ui"
import { useSearchParams } from 'next/navigation'

export default function SignIn() {
  const [showPassword, setShowPassword] = useState(false)
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
                  Streamline your operations with our comprehensive tracking solution
                </p>
              </div>
            </div>

            {/* Right side: Form */}
            <div className="p-8">
              <CardHeader className="space-y-1 px-0">
                <CardTitle className={UI.text.title + " text-2xl mb-2"}>
                  Welcome back
                </CardTitle>
                <p className={UI.text.subtitle}>
                  Enter your credentials to access your account
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

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password" className={UI.text.label}>Password</Label>
                      <Link
                        className="text-sm text-primary hover:text-primary/90 underline-offset-4 underline"
                        href="/forgot-password"
                      >
                        Forgot Password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Enter your password"
                        required
                        className={UI.inputs.select + " pr-10"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <SubmitButton 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" 
                    pendingText="Signing In..." 
                    formAction={signInAction}
                  >
                    Sign in
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </SubmitButton>

                  <FormMessage message={message} />

                  <p className={UI.text.subtitle + " text-center"}>
                    Don't have an account?{" "}
                    <Link 
                      className="text-primary hover:text-primary/90 underline underline-offset-4" 
                      href="/sign-up"
                    >
                      Sign up
                    </Link>
                  </p>
                </form>
              </CardContent>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
