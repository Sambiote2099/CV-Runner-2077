import type { Metadata } from "next"
import "./globals.css"
import Header from "@/components/header"
import ThemeProvider from "@/components/theme-provider"
import { cookies } from "next/headers"
import { NextIntlClientProvider } from "next-intl"
import { getMessages, getLocale } from "next-intl/server"
import Footer from "@/components/footer"
import SmoothScroll from "@/components/SmoothScroll"
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner"

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "CV Runner | 2077",
  description: "Manage CVs, positions and candidates",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const theme = (cookieStore.get("theme")?.value ?? "light") as "light" | "dark"

  // next-intl reads locale + messages from src/i18n/request.ts automatically
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} className={cn(theme === "dark" ? "dark" : "", "font-sans", geist.variable)}>
    
      <body className="min-h-screen">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider initialTheme={theme}>
            <Header />
            <SmoothScroll>
            <main className="pt-24 sm:pt-16">{children}</main>
            <Footer/>
            </SmoothScroll>
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
      
    </html>
  )
}