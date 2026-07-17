"use client"

import { useRouter } from "next/navigation"
import { TagCloud as ReactTagCloud } from "react-tagcloud"

type Tag = { value: string; count: number }

const colorClasses = [
  "bg-red-100 text-red-700 hover:bg-red-500 hover:text-white dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-500",
  "bg-orange-100 text-orange-700 hover:bg-orange-500 hover:text-white dark:bg-orange-900/30 dark:text-orange-300 dark:hover:bg-orange-500",
  "bg-amber-100 text-amber-700 hover:bg-amber-500 hover:text-white dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-500",
  "bg-yellow-100 text-yellow-700 hover:bg-yellow-500 hover:text-white dark:bg-yellow-900/30 dark:text-yellow-300 dark:hover:bg-yellow-500",
  "bg-lime-100 text-lime-700 hover:bg-lime-500 hover:text-white dark:bg-lime-900/30 dark:text-lime-300 dark:hover:bg-lime-500",
  "bg-green-100 text-green-700 hover:bg-green-500 hover:text-white dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-500",
  "bg-emerald-100 text-emerald-700 hover:bg-emerald-500 hover:text-white dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-500",
  "bg-teal-100 text-teal-700 hover:bg-teal-500 hover:text-white dark:bg-teal-900/30 dark:text-teal-300 dark:hover:bg-teal-500",
  "bg-cyan-100 text-cyan-700 hover:bg-cyan-500 hover:text-white dark:bg-cyan-900/30 dark:text-cyan-300 dark:hover:bg-cyan-500",
  "bg-sky-100 text-sky-700 hover:bg-sky-500 hover:text-white dark:bg-sky-900/30 dark:text-sky-300 dark:hover:bg-sky-500",
  "bg-blue-100 text-blue-700 hover:bg-blue-500 hover:text-white dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-500",
  "bg-indigo-100 text-indigo-700 hover:bg-indigo-500 hover:text-white dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-500",
  "bg-violet-100 text-violet-700 hover:bg-violet-500 hover:text-white dark:bg-violet-900/30 dark:text-violet-300 dark:hover:bg-violet-500",
  "bg-purple-100 text-purple-700 hover:bg-purple-500 hover:text-white dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-500",
  "bg-fuchsia-100 text-fuchsia-700 hover:bg-fuchsia-500 hover:text-white dark:bg-fuchsia-900/30 dark:text-fuchsia-300 dark:hover:bg-fuchsia-500",
  "bg-pink-100 text-pink-700 hover:bg-pink-500 hover:text-white dark:bg-pink-900/30 dark:text-pink-300 dark:hover:bg-pink-500",
  "bg-rose-100 text-rose-700 hover:bg-rose-500 hover:text-white dark:bg-rose-900/30 dark:text-rose-300 dark:hover:bg-rose-500",
]

function getColorClass(value: string) {
  let hash = 0

  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash)
  }

  return colorClasses[Math.abs(hash) % colorClasses.length]
}

export default function TagCloud({
  tags,
  isRecruiterOrAdmin,
}: {
  tags: Tag[]
  isRecruiterOrAdmin: boolean
}) {
  const router = useRouter()

  function handleClick(tag: Tag) {
    router.push(`/search?tag=${encodeURIComponent(tag.value)}`)
  }

  return (
    <ReactTagCloud
      minSize={18}
      maxSize={18}
      tags={tags}
      onClick={handleClick}
      renderer={(tag, size) => (
        <span
          key={tag.value}
          onClick={() => handleClick(tag as Tag)}
          style={{ fontSize: `${size}px` }}
          className={`inline-block m-1 px-3 py-1 rounded-full cursor-pointer transition-all duration-300 font-medium hover:scale-110 ${getColorClass(
            tag.value
          )}`}
        >
          {tag.value}
        </span>
      )}
    />
  )
}