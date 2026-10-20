import {redirect} from "next/navigation";
import {LockKeyhole,ShieldCheck} from "lucide-react";
import {hasPreviewSession,previewLoginEnabled} from "@/lib/temporary-preview-auth";
import {previewSignInAction} from "@/lib/actions/temporary-preview-auth";

export const dynamic="force-dynamic";
export const metadata={title:"Castaneda Strings | Temporary Admin Access"};

export default async function PreviewAccess({searchParams}:{searchParams:{error?:string}}){
  if(!previewLoginEnabled())return <main className="min-h-screen bg-[#f5f7f6] flex items-center justify-center p-6">
    <div className="max-w-md rounded-2xl border border-[#e4eae5] bg-white p-7">
      <h1 className="text-xl font-semibold">Temporary access unavailable</h1>
      <p className="text-sm text-neutral-600 mt-2">The temporary account only runs on the dedicated feature-branch preview. The real admin still requires Supabase.</p>
    </div>
  </main>;
  if(hasPreviewSession())redirect("/preview/workspace");
  return <main className="cs-admin min-h-screen bg-[#f5f7f6] flex justify-center items-center p-5">
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <span className="inline-flex rounded-2xl bg-[#e4f4ed] text-[#087c68] p-4 mb-4"><LockKeyhole size={28}/></span>
        <p className="tracking-[0.18em] uppercase font-semibold text-xs text-[#087c68]">Castaneda Strings</p>
        <h1 className="text-[30px] tracking-tight font-semibold text-[#153127] mt-1">Temporary Studio Access</h1>
        <p className="text-sm text-neutral-500 mt-2">Sign in to review the workspace while Supabase is being connected.</p>
      </div>
      <form action={previewSignInAction} className="bg-white border border-[#e6eae8] shadow-sm rounded-2xl p-6 sm:p-8 space-y-5">
        {searchParams.error&&<p role="alert" className="rounded-xl bg-red-50 text-red-700 p-3 text-sm">Invalid email or password. Please try again.</p>}
        <label htmlFor="preview-email" className="block text-sm font-semibold text-neutral-700">Email
          <input id="preview-email" name="email" type="email" autoComplete="username" required
          className="mt-2 block w-full border border-neutral-200 rounded-xl p-3.5 text-base focus:outline-none focus:border-[#009f87]" placeholder="Admin email"/>
        </label>
        <label htmlFor="preview-password" className="block text-sm font-semibold text-neutral-700">Password
          <input id="preview-password" name="password" type="password" autoComplete="current-password" required
           className="mt-2 block w-full border border-neutral-200 rounded-xl p-3.5 text-base focus:outline-none focus:border-[#009f87]" placeholder="Password"/>
        </label>
        <button type="submit" className="w-full bg-[#008b77] text-white font-semibold py-3.5 rounded-xl hover:bg-[#007863]">Sign in</button>
        <p className="text-xs text-neutral-500 flex items-start gap-2"><ShieldCheck size={16} className="shrink-0"/>Preview access only. Live client information, saving, emails and payments are not connected yet.</p>
      </form>
    </div>
  </main>;
}
