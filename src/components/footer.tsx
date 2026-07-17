"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";

const Footer: React.FC = () => {
  const t = useTranslations("Footer");

  return (
    <footer className="dark:bg-[#f3ecd8] bg-[#0e100f] relative text-gray-300 text-sm pt-10 pb-0.5 dark:text-black transition-colors duration-300">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      <div className="max-w-7xl mx-auto mb-6 px-4 space-y-8 relative">

        {/* Social Media Icons */}
        <div className="flex justify-center gap-5 text-[#c3aa88] text-lg dark:text-black">
          <a href="#" aria-label="Facebook" className="hover:bg-blue-600 hover:text-black dark:hover:text-white p-2 rounded-full transition">
            <i className="fa-brands fa-facebook-f"></i>
          </a>
          <a href="#" aria-label="Instagram" className="hover:bg-purple-500 hover:text-black dark:hover:text-white p-2 rounded-full transition">
            <i className="fa-brands fa-instagram"></i>
          </a>
          <a href="#" aria-label="LinkedIn" className="hover:bg-blue-700 hover:text-black dark:hover:text-white p-2 rounded-full transition">
            <i className="fa-brands fa-linkedin-in"></i>
          </a>
          <a href="#" aria-label="X / Twitter" className="hover:text-black hover:bg-white dark:hover:bg-black dark:hover:text-white p-2 rounded-full transition">
            <i className="fa-brands fa-x-twitter"></i>
          </a>
          <a href="#" aria-label="YouTube" className="hover:bg-red-600 hover:text-black dark:hover:text-white p-2 rounded-full transition">
            <i className="fa-brands fa-youtube"></i>
          </a>
        </div>

         {/* Logo */}
        <div className="flex justify-center">
          <Link href="/">
            <Image
              src="https://res.cloudinary.com/diasvvkil/image/upload/v1783927959/logo-dark-transparent_p39mxc.png"
              alt="CV Runner | 2077"
              height={100}
              width={200}
              className="hidden dark:block"
            />
            <Image
              src="https://res.cloudinary.com/diasvvkil/image/upload/v1783927959/logo-light-transparent_snz77d.png"
              alt="CV Runner | 2077"
              height={100}
              width={200}
              className="block dark:hidden"
            />
          </Link>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-center font-medium">
          {[
            { label: t("positions"), href: "/positions" },
            { label: t("profile"), href: "/profile" },
            { label: t("search"), href: "/search" },
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="hover:text-[#c3aa88] dark:hover:text-[#b3956d] transition-colors duration-300"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Site Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <h3 className="font-bold dark:text-black text-[#c3aa88] mb-2">{t("forCandidates")}</h3>
            <div className="flex flex-col items-center gap-2">
              <Link href="/positions" className="hover:text-[#c3aa88] dark:hover:text-[#b3956d] transition-colors duration-300">{t("browsePositions")}</Link>
              <Link href="/profile" className="hover:text-[#c3aa88] dark:hover:text-[#b3956d] transition-colors duration-300">{t("myProfile")}</Link>
              <Link href="/profile?tab=cvs" className="hover:text-[#c3aa88] dark:hover:text-[#b3956d] transition-colors duration-300">{t("myCvs")}</Link>
              <Link href="/profile?tab=projects" className="hover:text-[#c3aa88] dark:hover:text-[#b3956d] transition-colors duration-300">{t("myProjects")}</Link>
            </div>
          </div>

          <div>
            <h3 className="font-bold dark:text-black text-[#c3aa88] mb-2">{t("forRecruiters")}</h3>
            <div className="flex flex-col items-center gap-2">
              <Link href="/positions/new" className="hover:text-[#c3aa88] dark:hover:text-[#b3956d] transition-colors duration-300">{t("createPosition")}</Link>
              <Link href="/positions" className="hover:text-[#c3aa88] dark:hover:text-[#b3956d] transition-colors duration-300">{t("managePositions")}</Link>
              <Link href="/attributes" className="hover:text-[#c3aa88] dark:hover:text-[#b3956d] transition-colors duration-300">{t("attributeLibrary")}</Link>
            </div>
          </div>

          <div>
            <h3 className="font-bold dark:text-black text-[#c3aa88] mb-2">{t("account")}</h3>
            <div className="flex flex-col items-center gap-2">
              <Link href="/signin" className="hover:text-[#c3aa88] dark:hover:text-[#b3956d] transition-colors duration-300">{t("signIn")}</Link>
              <Link href="/profile?tab=info" className="hover:text-[#c3aa88] dark:hover:text-[#b3956d] transition-colors duration-300">{t("editProfile")}</Link>
              <Link href="/profile?tab=me" className="hover:text-[#c3aa88] dark:hover:text-[#b3956d] transition-colors duration-300">{t("personalInfo")}</Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="text-center text-xs text-gray-500 border-t border-[#c3aa88] dark:border-black pt-4 space-y-1">
          <p>
            &copy; {new Date().getFullYear()}{" "}
            <Link href="/" className="underline text-[#c3aa88] hover:text-[#b3956d] dark:text-gray-700 dark:hover:text-[#b3956d] transition-colors duration-300">
              CV Runner 2077
            </Link>
            . {t("rights")}
          </p>
          <p className="text-[10px] text-gray-500">{t("tagline")}</p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
