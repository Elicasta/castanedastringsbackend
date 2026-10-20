import {redirect} from "next/navigation";
/** Temporary entry. Never bypasses the real Supabase admin authentication. */
export default function AdminPreviewRedirect(){redirect("/preview/access");}
