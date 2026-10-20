import {Suspense} from "react";
import {Sidebar,BottomNav,WorkspaceHeader} from "@/components/admin/nav";
import {logoutAction} from "@/lib/actions/auth";
import {LogOut} from "lucide-react";
export default function AdminLayout({children}:{children:React.ReactNode}){
 return <div className="cs-admin min-h-screen flex bg-[#f7f8f8]">
  <Sidebar/>
  <div className="flex flex-1 flex-col min-w-0 min-h-screen">
   <Suspense fallback={<div className="h-[110px] border-b border-[#e5eae7] bg-white"/>}>
     <WorkspaceHeader/>
   </Suspense>
   <main id="workspace-content" className="flex-1 w-full max-w-[1540px] px-4 sm:px-7 lg:px-9 pt-7 pb-32 lg:pb-12 mx-auto">
    {children}
   </main>
   <footer className="hidden lg:flex border-t border-[#e4eae6] px-9 py-3 justify-between text-[11px] text-[#809089]">
     <span>Castaneda Strings · Studio Office</span>
     <form action={logoutAction}><button type="submit" className="inline-flex gap-2 items-center hover:text-[#097d67]"><LogOut size={13}/>Sign out</button></form>
   </footer>
  </div>
  <BottomNav/>
 </div>;
}
