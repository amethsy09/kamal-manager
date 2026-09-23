import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kamal Manager",
  description: "Gestion des Kamal pour un dahira",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: `(()=>{try{let t=localStorage.getItem("kamal-theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch{}})()` }} /></head><body>{children}</body></html>;

}
