import { loginAction } from "@/lib/actions/auth";
import { Input, Label } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold">Castaneda Strings</h1>
          <p className="text-muted text-sm mt-1">Admin sign in</p>
        </div>
        {error && (
          <p className="text-sm text-rose-600 bg-rose-50 rounded-xl p-3 mb-4">{error}</p>
        )}
        <form action={loginAction} className="space-y-4 bg-white border border-border rounded-2xl p-6">
          <input type="hidden" name="next" value={next ?? "/dashboard"} />
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>
          <Button type="submit" className="w-full">Sign in</Button>
        </form>
      </div>
    </div>
  );
}
