"use client"

import { CldUploadWidget } from "next-cloudinary"
import Image from "next/image"
import { useTranslations } from "next-intl"

type Props = {
  value: string
  onChange: (url: string) => void
  disabled?: boolean
}

export default function ImageUpload({ value, onChange, disabled }: Props) {
  const t = useTranslations("Common")

  return (
    <div className="flex flex-col gap-3">
      {value && (
        <div className="relative h-42 w-42 rounded-4xl border overflow-hidden">
          <Image
            src={value}
            alt="Uploaded image"
            fill
            className="object-cover"
          />
        </div>
      )}

      <CldUploadWidget
        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!}
        onSuccess={(result) => {
          if (
            result.info &&
            typeof result.info === "object" &&
            "secure_url" in result.info
          ) {
            onChange(result.info.secure_url as string)
          }
        }}
      >
        {({ open }) => (
          <button
            type="button"
            onClick={() => open()}
            disabled={disabled}
            className="rounded-full border border-amber-300 bg-white dark:bg-[#2e2e2e] px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-600 dark:text-gray-300 disabled:opacity-50"
          >
            {value ? t("changeImage") : t("uploadImage")}
          </button>
        )}
      </CldUploadWidget>
    </div>
  )
}
