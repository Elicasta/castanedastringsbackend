"use server";
import {redirect} from "next/navigation";
import {
  checkPreviewCredentials,startPreviewSession,endPreviewSession
} from "@/lib/temporary-preview-auth";

export async function previewSignInAction(formData:FormData){
  const email=String(formData.get("email")||"").slice(0,255);
  const password=String(formData.get("password")||"").slice(0,129);
  if(!checkPreviewCredentials(email,password)){
    redirect("/preview/access?error=invalid");
  }
  startPreviewSession();
  redirect("/preview/workspace");
}
export async function previewSignOutAction(){
  endPreviewSession();
  redirect("/preview/access");
}
