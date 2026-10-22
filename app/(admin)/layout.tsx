import {AdminShell} from "@/components/admin/nav";
export default function AdminLayout({children}:{children:React.ReactNode}){
 return <AdminShell>{children}</AdminShell>;
}
