import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { auth } from "@/auth"

export default async function header() {
    const t = await getTranslations('Nav')
    const session = await auth()
    const role = session?.user?.role

  return (
    <div className="h-12 w-screen items-center gap-3 bg-amber-200 dark:bg-emerald-400 transition-all duration-700 flex">
        <h6 className="ml-4 font-semibold text-white">CV Runner | 2077</h6>
        <Link href={'/positions'} className="text-white text-sm">{t('positions')}</Link>
        {(role === "ADMIN" || role === "RECRUITER") &&(
        <Link href={'/attributes'} className="text-white text-sm">{t('attributes')}</Link>)
        }
    </div>
  )
}
