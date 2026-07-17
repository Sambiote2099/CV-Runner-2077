import { signIn } from "@/auth"
import { getTranslations } from "next-intl/server"
import Image from "next/image"

export default async function SignInPage() {
  const t = await getTranslations("SignIn")

  return (
    
      <div className="relative flex flex-col sm:flex-row items-center justify-center min-h-screen w-full">
  <h1 className="absolute top-4 left-0 right-0 z-10 flex items-center pointer-events-none justify-center text-3xl font-semibold text-white">
    <div className="rounded-3xl dark:border-white dark:text-white dark:bg-[#2e2e2e] bg-white text-[#2e2e2e] py-2 px-3 gap-2 flex">
      {t("title")}
    </div>
  </h1>

  <form action={async () => { "use server"; await signIn("google") }}>
    <button className="cursor-pointer bg-linear-to-l hover:bg-teal-200 dark:hover:bg-emerald-200 bg-emerald-100 to-yellow-100 transition-all duration-500">
      <Image
        src="https://res.cloudinary.com/diasvvkil/image/upload/v1783940756/channels4_profile-Photoroom_zjnhsc.png"
        alt="Google"
        width={670}
        height={80}
        className="hover:scale-105 transition-all duration-500 w-full max-w-[670px]"
      />
    </button>
  </form>

 <form action={async () => { "use server"; await signIn("github") }}>
  <button className="group relative overflow-hidden cursor-pointer">
    <Image
      src="https://cdn.pixabay.com/photo/2022/01/30/13/33/github-6980894_960_720.png"
      alt="GitHub"
      width={670}
      height={80}
      className="group-hover:opacity-0 group-hover:scale-105 transition-all duration-500 w-full max-w-[670px]"
    />

    <Image
      src="https://res.cloudinary.com/diasvvkil/image/upload/v1783941064/image_bvd0ka.jpg"
      alt="GitHub Hover"
      width={670}
      height={80}
      className="absolute transition-all duration-500 inset-0 opacity-0 group-hover:scale-105 group-hover:opacity-100 w-full max-w-[670px]"
    />
  </button>
</form>
</div>
    
  )
}