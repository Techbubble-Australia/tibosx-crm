import type { Metadata } from "next";
import "./globals.css";
import { portalEnvLabel, resolvePortalEnv } from "@/lib/portal-env";

const portalEnv = resolvePortalEnv(process.env.NEXT_PUBLIC_APP_ENV ?? process.env.APP_ENV);
const envLabel = portalEnvLabel(portalEnv);

export const metadata: Metadata = {
  title: `Debug tickets · ${envLabel} | TechBubble`,
  description: "Review debug capture tickets from TBOS",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-portal-env={portalEnv}>
      <body>
        {/* Prefer hostname when NEXT_PUBLIC_APP_ENV was not baked at build time. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var h=(location.hostname||"").toLowerCase();var e=document.documentElement.getAttribute("data-portal-env")||"staging";if(h.indexOf("staging")>=0||h.indexOf("stage")>=0)e="staging";else if(h.indexOf("production")>=0||h.indexOf("prod")>=0)e="production";else if(h.indexOf("development")>=0||h.indexOf("dev.")>=0)e="development";document.documentElement.setAttribute("data-portal-env",e);}catch(x){}})();`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
