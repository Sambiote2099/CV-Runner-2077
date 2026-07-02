import { auth, signOut } from "@/auth"
import Link from "next/link"

export default async function Header() {
  const session = await auth()

  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <Link href="/" className="font-bold">
        CV Management System
      </Link>
      <Link href="/positions" className="text-sm">
        Positions
      </Link>

      {session?.user ? (
        <div className="flex items-center gap-4">
          <Link href="/profile" className="text-sm underline">
            Profile
          </Link>
          <span className="text-sm text-gray-600">
            {session.user.name} · {session.user.role}
          </span>
          
          <form
            action={async () => {
              "use server"
              await signOut()
            }}
          >
            <button className="text-sm underline">Sign out</button>
          </form>
        </div>
      ) : (
        <Link href="/signin" className="text-sm underline">
          Sign in
        </Link>
      )}
    </header>
  )
}