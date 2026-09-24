import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Lock, Mail, Snowflake } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { useDmsStore } from '@/store/dms-store'
import { usePrefsStore } from '@/store/prefs-store'
import { cn } from '@/utils/cn'

const loginSchema = z.object({
  username: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
})

type LoginForm = z.infer<typeof loginSchema>

const demoUsers = [
  { label: 'Super Admin', username: 'superadmin', password: 'admin123' },
  { label: 'Admin', username: 'admin', password: 'admin123' },
  { label: 'Manager', username: 'manager', password: 'manager123' },
  { label: 'Sales', username: 'sales', password: 'sales123' },
  { label: 'Stock', username: 'stock', password: 'stock123' },
  { label: 'Accounts', username: 'accounts', password: 'accounts123' },
  { label: 'Viewer', username: 'viewer', password: 'viewer123' },
] as const

export default function LoginPage() {
  const session = useDmsStore((s) => s.session)
  const login = useDmsStore((s) => s.login)
  const landingPage = usePrefsStore((s) => s.landingPage)
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '', remember: true },
  })

  const home =
    typeof landingPage === 'string' && landingPage.startsWith('/') ? landingPage : '/dashboard'

  useEffect(() => {
    const reason = (location.state as { reason?: string } | null)?.reason
    if (reason === 'timeout') {
      toast({
        title: 'Session expired',
        description: 'Please sign in again to continue.',
        variant: 'warning',
      })
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.pathname, location.state, navigate, toast])

  if (session) return <Navigate to={home} replace />

  const onSubmit = form.handleSubmit((values) => {
    setSubmitting(true)
    const result = login(values.username.trim(), values.password)
    setSubmitting(false)
    if (!result.ok) {
      toast({ title: 'Sign in failed', description: result.message, variant: 'error' })
      return
    }
    toast({ title: 'Welcome back', variant: 'success' })
    navigate(home, { replace: true })
  })

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden flex-1 flex-col justify-between bg-sidebar p-10 text-sidebar-fg lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(600px 320px at 20% 15%, color-mix(in srgb, var(--color-brand-500) 35%, transparent), transparent)',
          }}
          aria-hidden
        />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-500/25 ring-1 ring-brand-300/30">
            <Snowflake className="h-6 w-6 text-brand-200" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-white">DMS.SHEETAL</p>
            <p className="text-sm tracking-widest text-brand-300">COOL</p>
          </div>
        </div>
        <div className="relative max-w-md">
          <h1 className="font-display text-3xl font-semibold leading-tight text-white">
            Distribution management for cooling &amp; appliances
          </h1>
          <p className="mt-4 text-sidebar-muted">
            Track inventory, sales, purchases, and receivables across Indore and your dealer network — all in one
            workspace.
          </p>
        </div>
        <p className="relative text-xs text-sidebar-muted">Secure demo environment · data persists in your browser</p>
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12">
        <main className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <h1 className="font-display text-xl font-semibold text-brand-900 lg:text-2xl lg:text-ink">
              <span className="lg:hidden">DMS.SHEETAL COOL</span>
              <span className="hidden lg:inline">Sign in</span>
            </h1>
            <p className="mt-1 text-sm text-ink-muted lg:hidden">Sign in to continue</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-border bg-surface-elevated p-6 shadow-card">
            <FormField label="Email or username" error={form.formState.errors.username?.message}>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" aria-hidden />
                <Input className="pl-9" autoComplete="username" {...form.register('username')} />
              </div>
            </FormField>
            <FormField label="Password" error={form.formState.errors.password?.message}>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" aria-hidden />
                <Input
                  className="pl-9 pr-10"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...form.register('password')}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-ink-muted hover:bg-surface-muted hover:text-ink"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                </button>
              </div>
            </FormField>
            <div className="flex items-center justify-between gap-2">
              <Checkbox label="Remember me" {...form.register('remember')} />
              <button
                type="button"
                className="text-sm font-medium text-brand-700 hover:text-brand-800"
                onClick={() =>
                  toast({
                    title: 'Password reset',
                    description: 'Please contact your administrator to reset your password.',
                    variant: 'info',
                  })
                }
              >
                Forgot password?
              </button>
            </div>
            <Button type="submit" className="w-full" loading={submitting}>
              Sign in
            </Button>
          </form>

          <div className="mt-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Quick demo login</p>
            <div className="flex flex-wrap gap-2">
              {demoUsers.map((u) => (
                <button
                  key={u.username}
                  type="button"
                  className={cn(
                    'rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800',
                    'hover:bg-brand-100',
                  )}
                  onClick={() => {
                    form.setValue('username', u.username)
                    form.setValue('password', u.password)
                  }}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
