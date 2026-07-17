"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts"
import { useTranslations } from "next-intl";

type Tag = { value: string; count: number }

const COLORS = [
  "#f59e0b", "#10b981", "#3b82f6", "#f43f5e", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
]

type RoleSplit = { name: string; value: number }
type ActivityPoint = { hour: string; cvs: number }

type OverviewData = {
  totalPositions: number
  publishedCVs: number
}

export default function StatsCharts({
  tagCloudData,
  roleSplit,
  activityData,
  overviewData,
}: {
  tagCloudData: Tag[]
  roleSplit: RoleSplit[]
  activityData: ActivityPoint[]
  overviewData: OverviewData
}) {
  const t = useTranslations("Stats");
  const topTags = [...tagCloudData]
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((t) => ({ name: t.value, value: t.count }))

  const overviewBarData = [
    {
      name: t("positions"),
      value: overviewData.totalPositions,
      fill: "#3b82f6",
    },
    {
      name: t("publishedCvs"),
      value: overviewData.publishedCVs,
      fill: "#f59e0b",
    },
  ]
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Activity Sparkline */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-amber-100 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-amber-100">
            {t("activity")}
          </h2>

          <div className="text-right">
            <p className="text-2xl font-bold text-slate-800 dark:text-amber-100">
              {activityData.reduce((sum, p) => sum + p.cvs, 0)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("submittedCvs")}
            </p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={activityData}>
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              interval={3}
            />
            <YAxis hide />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="cvs"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top Tags */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-amber-100 dark:border-slate-700 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-amber-100">
          {t("tagCloud")}
        </h2>

        {topTags.length === 0 ? (
          <p className="text-sm text-slate-400">No data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={topTags}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {topTags.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Overview */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-amber-100 dark:border-slate-700 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-amber-100">
          {t("overview")}
        </h2>

        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={overviewBarData}>
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />

            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {overviewBarData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.fill}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Candidates vs Recruiters */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-amber-100 dark:border-slate-700 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-amber-100">
          {t("roleSplit")}
        </h2>

        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={roleSplit}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={95}
              dataKey="value"
              paddingAngle={2}
            >
              <Cell fill="#f59e0b" />
              <Cell fill="#3b82f6" />
            </Pie>

            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}