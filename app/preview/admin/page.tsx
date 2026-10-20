import {redirect} from "next/navigation";
/** Legacy demo link now enters the real, authenticated Castaneda Strings admin. */
export default function AdminPreviewRedirect(){redirect("/dashboard");}
