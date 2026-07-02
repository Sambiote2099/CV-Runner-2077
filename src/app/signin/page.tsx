import { signIn } from "@/auth"

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Sign in</h1>

      <form
        action={async () => {
          "use server"
          await signIn("google")
        }}
      >
        <button className="rounded bg-blue-600 px-4 py-2 text-white">
          Sign in with Google
        </button>
      </form>

      <form
        action={async () => {
          "use server"
          await signIn("github")
        }}
      >
        <button className="rounded bg-gray-800 px-4 py-2 text-white">
          Sign in with GitHub
        </button>
      </form>
    </div>
  )
}