import { auth, signOut } from "@/auth"
import Link from "next/link"
import { Suspense } from "react"
import SearchBar from "./search-bar"
import ThemeToggle from "./theme-toggle"
import LangToggle from "./lang-toggle"
import { getTranslations } from "next-intl/server"
import Image from "next/image"
import MobileMenu from "./mobile-menu"
import { LogIn, LogOut } from "lucide-react"

export default async function Header() {
  const session = await auth()
  const t = await getTranslations("Nav")
  const role = session?.user?.role

  return (
    <>
      <header className="bg-amber-50 dark:bg-slate-900 fixed z-10 opacity-95 transition-all duration-500 top-0 left-0 w-full shadow-md border-b border-amber-200 dark:border-slate-700">
        <span className="absolute left-0 right-0 h-[2px] bottom-1.5 bg-amber-400 dark:bg-amber-300" />
        <div className="flex items-center gap-3 px-4 h-16">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="https://res.cloudinary.com/diasvvkil/image/upload/v1783927959/logo-dark-transparent_p39mxc.png"
              alt="CV Runner | 2077"
              height={100}
              width={200}
              className="block dark:hidden"
            />
            <Image
              src="https://res.cloudinary.com/diasvvkil/image/upload/v1783927959/logo-light-transparent_snz77d.png"
              alt="CV Runner | 2077"
              height={100}
              width={200}
              className="hidden dark:block"
            />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden sm:flex items-center ml-2 mr-auto gap-1">
            <Link href="/positions" className="text-sm text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-800 hover:text-amber-400 dark:hover:bg-amber-500 dark:hover:text-slate-900 rounded-full px-3 py-1 transition-all duration-300">
              {t("positions")}
            </Link>
            {(role === "RECRUITER" || role === "ADMIN") && (
              <Link href="/attributes" className="text-sm text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-800 hover:text-amber-400 dark:hover:bg-amber-500 dark:hover:text-slate-900 rounded-full px-3 py-1 transition-all duration-300">
                {t("attributes")}
              </Link>
            )}
            {role === "ADMIN" && (
              <Link href="/admin/users" className="text-sm text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-800 hover:text-amber-400 dark:hover:bg-amber-500 dark:hover:text-slate-900 rounded-full px-3 py-1 transition-all duration-300">
                {t("users")}
              </Link>
            )}
            {session?.user && (
              <Link href="/profile" className="text-sm text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-800 hover:text-amber-400 dark:hover:bg-amber-500 dark:hover:text-slate-900 rounded-full px-3 py-1 transition-all duration-300">
                {t("profile")}
              </Link>
            )}
          </div>

          

          {/* Spacer on mobile */}
          <div className="flex-1 sm:hidden" />

          {/* Right controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
          <div className="hidden md:block">
            <Suspense fallback={<div className="h-8 animate-pulse rounded bg-amber-100 dark:bg-slate-700 w-full" />}>
              <SearchBar
                placeholder={
                  role === "RECRUITER" || role === "ADMIN"
                    ? t("searchRecruiter")
                    : t("searchCandidate")
                }
              />
            </Suspense>
          </div>
            <LangToggle />
            <ThemeToggle />

            {/* Desktop: avatar + name + sign out */}
            {session?.user ? (
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 hidden md:inline whitespace-nowrap">
                  {session.user.name} | {role}
                </span>
                <Image
                  src={session.user.image ?? "/default-avatar.png"}
                  alt="profile pic"
                  height={32}
                  width={32}
                  className="rounded-full ring-2 ring-amber-300 dark:ring-amber-300"
                />
                <form action={async () => { "use server"; await signOut() }}>
                  <button className="flex items-center hover:translate-x-2 gap-1.5 text-sm bg-rose-500 text-white hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-800 rounded-2xl px-3 py-1 whitespace-nowrap transition-all duration-300 font-semibold">
                    <LogOut size={14} />
                    {t("signOut")}
                  </button>
                </form>
              </div>
            ) : (
              <Link href="/signin" className="hidden hover:-translate-x-2 sm:flex items-center gap-1.5 text-sm transition-all duration-300 font-semibold bg-amber-500 text-white px-3 py-1 rounded-2xl hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-900">
                <LogIn size={14} />
                {t("signIn")}
              </Link>
            )}

            {/* Mobile hamburger — always rightmost */}
            <MobileMenu
              role={role}
              isLoggedIn={!!session?.user}
              userName={session?.user?.name ?? null}
              userImage={session?.user?.image ?? null}
              positions={t("positions")}
              attributes={t("attributes")}
              users={t("users")}
              profile={t("profile")}
              signIn={t("signIn")}
              signOut={t("signOut")}
            />
          </div>

        </div>
      </header>

      {/* Mobile search bar — fixed below header */}
      <div className="sm:hidden fixed top-16 left-0 w-full z-10 px-2 py-2">
        <Suspense fallback={<div className="h-8 animate-pulse rounded bg-amber-100 dark:bg-slate-700 w-full" />}>
          <SearchBar
            placeholder={
              role === "RECRUITER" || role === "ADMIN"
                ? t("searchRecruiter")
                : t("searchCandidate")
            }
          />
        </Suspense>
      </div>
    </>
  )
}
