import Link from "next/link";
import {redirect} from "next/navigation";
import {LockKeyhole,MailCheck,ShieldCheck} from "lucide-react";
import {previewLoginEnabled} from "@/lib/temporary-preview-auth";
import {registerOwnerAccountAction} from "@/lib/actions/register-owner";

export const dynamic="force-dynamic";
export const metadata={title:"Castaneda Strings | Owner Account Setup"};
export default function RegisterOwner({searchParams}:{searchParams:{status?:string;error?:string}}){
 if(!previewLoginEnabled())redirect("/login");
 return <main className="cs-admin min-h-screen bg-[#f5f7f6] flex items-center justify-center px-4 py-10">
  <div className="w-full max-w-md">
   <div className="text-center mb-7">
    <span className="rounded-2xl bg-[#e5f5ef] text-[#087b68] p-4 inline-flex"><LockKeyhole size={24}/></span>
    <h1 className="text-2xl font-semibold mt-4">Create your permanent owner login</h1>
    <p className="text-sm text-neutral-500 mt-2">Castaneda Strings · Supabase authentication</p>
   </div>
   {searchParams.status==="check-email"?
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-7 text-sm space-y-4">
     <MailCheck size={30} className="text-[#087b68]"/>
     <h2 className="text-lg font-semibold">Check your email</h2>
     <p>Check <strong>castanedaeli0@gmail.com</strong> for a Supabase account confirmation message, if email confirmation is enabled. Follow the verification instructions and return to this admin.</p>
     <p className="rounded-xl bg-amber-50 p-3 text-amber-900">Creating your account does not yet grant access to client data. An owner membership must be assigned after the account is verified.</p>
     <Link href="/login" className="block text-center bg-[#008b77] text-white rounded-xl px-4 py-3 font-semibold">Return to sign in</Link>
    </div>
   :<form action={registerOwnerAccountAction} className="bg-white border border-neutral-200 shadow-sm rounded-2xl p-6 space-y-5">
    {searchParams.error&&<p className="bg-red-50 text-red-700 p-3 rounded-xl text-sm" role="alert">{searchParams.error}</p>}
    <div className="text-sm"><p className="font-semibold mb-1">Admin email</p><p className="rounded-xl p-3 bg-neutral-50 border border-neutral-200 break-words">castanedaeli0@gmail.com</p></div>
    <label className="block text-sm font-semibold" htmlFor="new-password">New secure password
     <input id="new-password" name="password" type="password" required autoComplete="new-password" minLength={12} maxLength={128}
      placeholder="12+ characters" className="block mt-2 p-3 w-full rounded-xl border border-neutral-200 bg-white text-base"/>
    </label>
    <label className="block text-sm font-semibold" htmlFor="confirm-password">Confirm new password
     <input id="confirm-password" name="confirm" type="password" required autoComplete="new-password" minLength={12} maxLength={128}
      placeholder="Repeat password" className="block mt-2 p-3 w-full rounded-xl border border-neutral-200 bg-white text-base"/>
    </label>
    <p className="text-xs text-neutral-600 flex items-start gap-2"><ShieldCheck size={16} className="shrink-0"/>Choose a new password, not the temporary preview password shared earlier. It is sent directly to Supabase Auth and never stored in GitHub.</p>
    <button type="submit" className="w-full rounded-xl bg-[#008b77] text-white font-semibold py-3.5">Create account</button>
    <Link href="/login" className="block text-center text-sm text-[#087b68]">Already have an account? Sign in</Link>
   </form>}
  </div>
 </main>;
}
