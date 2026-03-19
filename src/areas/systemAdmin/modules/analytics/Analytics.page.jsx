import { useEffect, useMemo, useState } from "react";
import axios from "../../../../api/axios";
import Dashboard from "../../../dashboard-components/dashboard.component";
import {
  DASHBOARD_STATISTICS_URL,
  DASHBOARD_SCHEME_BENEFICIARIES_URL,
  DASHBOARD_FRAUD_ALERTS_URL,
} from "../../../../api/api_routing_urls";

const ANALYTICS_APPLICATIONS_TRENDS_URL =
  "/admin/dashboard/analytics/applications-trends";
const ANALYTICS_STAGE_BREAKDOWN_URL =
  "/admin/dashboard/analytics/stage-breakdown";
const ANALYTICS_FRAUD_TRENDS_URL =
  "/admin/dashboard/analytics/fraud-trends";
const ANALYTICS_REJECTION_REASONS_URL =
  "/admin/dashboard/analytics/rejection-reasons";

const cardClass = "bg-white rounded-lg border border-gray-200 shadow-sm p-5";

const formatYYYYMMDD = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const safeNumber = (v) => {
  if (v === undefined || v === null) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function PlaceholderKpiCard({ title, value, sub }) {
  return (
    <div className={cardClass}>
      <p className="text-sm text-slate-500">{title}</p>
      <div className="mt-2 text-3xl font-bold text-slate-900">{value}</div>
      {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}

function LineChart({
  title,
  subtitle,
  labels,
  series,
  tickCount = 0,
  rangeStart,
  rangeEnd,
  showAllDayLabels = false,
}) {
  const width = 720;
  const height = 260;
  const padLeft = 60;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 40;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const nLabels = labels?.length || 0;
  const seriesLengths = Object.values(series || {}).map((arr) => (Array.isArray(arr) ? arr.length : 0));
  const nSeries = seriesLengths.length ? Math.max(...seriesLengths) : 0;
  // In day-mode we will pad series so the x-axis spans full month-to-date.
  let plotSeries = series;
  let n = nSeries > 0 ? nSeries : nLabels;

  const yLabel = height - 12; // room under x-axis

  const parseYYYYMMDD = (s) => {
    const str = String(s || "");
    // Expect YYYY-MM-DD
    const m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    // Use local time consistently for display
    return new Date(y, mo, d);
  };

  // Month-to-date padding:
  // If backend returns fewer buckets (e.g. starting at 18th), we still plot from 1st by
  // placing values into their correct day index relative to rangeStart.
  if (showAllDayLabels && rangeStart && rangeEnd && Array.isArray(labels)) {
    const start = parseYYYYMMDD(rangeStart);
    const end = parseYYYYMMDD(rangeEnd);
    if (start && end) {
      const startMs = start.getTime();
      const endMs = end.getTime();
      const dayCount = Math.floor((endMs - startMs) / 86400000) + 1;

      if (dayCount > 1) {
        const padded = {};
        const keys = Object.keys(series || {});

        keys.forEach((key) => {
          const srcArr = Array.isArray(series?.[key]) ? series[key] : [];
          const dstArr = Array.from({ length: dayCount }, () => 0);

          for (let j = 0; j < Math.min(srcArr.length, labels.length); j++) {
            const labelDate = parseYYYYMMDD(labels[j]);
            if (!labelDate) continue;
            const diffDays = Math.round((labelDate.getTime() - startMs) / 86400000);
            if (diffDays >= 0 && diffDays < dayCount) {
              dstArr[diffDays] = safeNumber(srcArr[j]);
            }
          }

          padded[key] = dstArr;
        });

        plotSeries = padded;
        n = dayCount;
      }
    }
  }

  const formatShortDate = (d) => {
    if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    return dd;
  };

  const xTicks = (() => {
    if (!tickCount || tickCount <= 0) return [];
    if (!n || n <= 0) return [];
    if (tickCount === 1) return [{ plotIndex: Math.floor((n - 1) / 2), label: "" }];

    const start = parseYYYYMMDD(rangeStart);
    const end = parseYYYYMMDD(rangeEnd);
    const startMs = start ? start.getTime() : null;
    const endMs = end ? end.getTime() : null;

    return Array.from({ length: tickCount }).map((_, tickPos) => {
      const plotIndex = Math.round((tickPos * (n - 1)) / (tickCount - 1));
      const label =
        startMs !== null && endMs !== null
          ? formatShortDate(new Date(startMs + ((endMs - startMs) * tickPos) / (tickCount - 1)))
          : "";
      return { plotIndex, label };
    });
  })();

  const formatLabel = (v) => {
    const s = String(v ?? "");
    const m1 = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m1) return m1[3]; // day only
    // If already something like "03-17" or "03/17", return the last 2 digits (day)
    const m2 = s.match(/(\d{2})[\/-]\d{2}$/);
    if (m2) return m2[2];

    if (s.length <= 10) return s;
    return s.slice(-2);
  };

  const allValues = [];
  Object.values(plotSeries || {}).forEach((arr) => {
    if (Array.isArray(arr)) allValues.push(...arr.map(safeNumber));
  });
  const maxVal = Math.max(1, ...allValues);

  const xAt = (i) =>
    padLeft + (n <= 1 ? plotW / 2 : (i * plotW) / (n - 1));
  const yAt = (val) => padTop + plotH * (1 - safeNumber(val) / maxVal);

  const seriesColor = (key) => {
    if (key === "created") return "#d85a30";
    if (key === "approved") return "#68d388";
    if (key === "rejected") return "#fca5a5";
    if (key === "total") return "#d85a30";
    if (key === "duplicate") return "#68d388";
    if (key === "ineligible") return "#fca5a5";
    return "#c2edda";
  };

  const seriesLabel = (key) => {
    if (key === "created") return "Created";
    if (key === "approved") return "Approved";
    if (key === "rejected") return "Rejected";
    if (key === "total") return "Total";
    if (key === "duplicate") return "Duplicate";
    if (key === "ineligible") return "Ineligible";
    return key;
  };

  const [hoverIndex, setHoverIndex] = useState(null);

  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <span className="text-xs text-slate-500">{subtitle}</span>
      </div>

      {n === 0 ? (
        <div className="text-sm text-slate-500">No data available.</div>
      ) : (
        <>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-[220px]"
            role="img"
            aria-label={`${title} line chart`}
            onMouseLeave={() => setHoverIndex(null)}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clientX = e.clientX - rect.left;
              const svgX = (clientX / Math.max(1, rect.width)) * width;
              const idx =
                n <= 1
                  ? 0
                  : Math.round(((svgX - padLeft) / plotW) * (n - 1));
              const clamped = Math.max(0, Math.min(n - 1, idx));
              if (Number.isFinite(clamped)) setHoverIndex(clamped);
            }}
          >
            {/* Gradient fill (area chart style) */}
            {(() => {
              const keys = Object.keys(series || {});
              const primaryKey =
                keys.includes("created")
                  ? "created"
                  : keys.includes("total")
                    ? "total"
                    : keys[0];
              // Use the padded plotSeries values (month-to-date) so the shading matches the drawn points.
              const primaryArr =
                primaryKey &&
                Array.isArray(plotSeries?.[primaryKey])
                  ? plotSeries[primaryKey]
                  : null;
              if (!primaryKey || !primaryArr || primaryArr.length < 2) return null;
              const gradientId = `areaGrad-${String(title).replace(/\W/g, "")}`;
              const baselineY = height - padBottom;
              const startI = 0;
              const endI = Math.min(primaryArr.length - 1, n - 1);
              const x0 = xAt(startI);
              const y0 = yAt(primaryArr[startI]);
              const xLast = xAt(endI);
              const d = [
                `M ${x0} ${baselineY}`,
                `L ${x0} ${y0}`,
                ...primaryArr
                  .slice(startI + 1, endI + 1)
                  .map((v, i) => {
                    const ii = startI + i + 1;
                  return `L ${xAt(ii)} ${yAt(v)}`;
                  }),
                `L ${xLast} ${baselineY}`,
                "Z",
              ].join(" ");
              const color = seriesColor(primaryKey);
              return (
                <>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                      <stop offset="100%" stopColor={color} stopOpacity="0.03" />
                    </linearGradient>
                  </defs>
                  {/* Keep shading inside the plot area */}
                  <clipPath id={`clip-${gradientId}`}>
                    <rect x={padLeft} y={padTop} width={plotW} height={plotH} />
                  </clipPath>
                  <path
                    d={d}
                    fill={`url(#${gradientId})`}
                    clipPath={`url(#clip-${gradientId})`}
                  />
                </>
              );
            })()}

            {/* grid */}
            {Array.from({ length: 6 }).map((_, i) => {
              const y = padTop + (i * plotH) / 5;
              return (
                <line
                  key={i}
                  x1={padLeft}
                  x2={width - padRight}
                  y1={y}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
              );
            })}
            {/* axes */}
            <line
              x1={padLeft}
              x2={padLeft}
              y1={padTop}
              y2={height - padBottom}
              stroke="#cbd5e1"
              strokeWidth="1"
            />
            <line
              x1={padLeft}
              x2={width - padRight}
              y1={height - padBottom}
              y2={height - padBottom}
              stroke="#cbd5e1"
              strokeWidth="1"
            />

            {Object.entries(plotSeries || {}).map(([key, arr]) => {
              if (!Array.isArray(arr)) return null;
              const color = seriesColor(key);

              const points = arr
                .map((v, i) => `${xAt(i)},${yAt(v)}`)
                .join(" ");

              return (
                <g key={key}>
                  <polyline
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    points={points}
                  />
                  {arr.map((v, i) => (
                    <circle
                      key={i}
                      cx={xAt(i)}
                      cy={yAt(v)}
                      r="3.5"
                      fill={color}
                      opacity="0.95"
                    />
                  ))}
                </g>
              );
            })}

            {/* X-axis labels */}
            {n > 0 && showAllDayLabels
              ? (() => {
                  const tickIndices = [];
                  for (let i = 0; i < n; i += 5) {
                    tickIndices.push(i);
                  }
                  if (n - 1 >= 0 && !tickIndices.includes(n - 1)) {
                    tickIndices.push(n - 1);
                  }

                  return tickIndices.map((i, idx) => {
                    const x = xAt(i);
                    return (
                      <g key={`dayTick-${idx}`}>
                        <line
                          x1={x}
                          x2={x}
                          y1={height - padBottom}
                          y2={height - padBottom + 4}
                          stroke="#e2e8f0"
                          strokeWidth="1"
                        />
                        <text
                          x={x}
                          y={yLabel}
                          textAnchor="middle"
                          fontSize="10"
                          fill="#64748b"
                        >
                          {i + 1}
                        </text>
                      </g>
                    );
                  });
                })()
              : n > 0 && xTicks.length > 0
                ? xTicks.map((t, idx) => {
                    const x = xAt(t.plotIndex);
                    return (
                      <g key={`tick-${idx}`}>
                        <line
                          x1={x}
                          x2={x}
                          y1={height - padBottom}
                          y2={height - padBottom + 4}
                          stroke="#e2e8f0"
                          strokeWidth="1"
                        />
                        <text
                          x={x}
                          y={yLabel}
                          textAnchor="middle"
                          fontSize="10"
                          fill="#64748b"
                        >
                          {t.label || ""}
                        </text>
                      </g>
                    );
                  })
                : null}

            {/* Tooltip (hover) */}
            {hoverIndex !== null && Number.isFinite(hoverIndex) && n > 0 ? (
              (() => {
                const i = hoverIndex;
                const x = xAt(i);
                const baselineY = height - padBottom;
                let dateLabel = "";
                if (showAllDayLabels) {
                  // day-mode is always month-to-date, so x-index maps to day-of-month
                  dateLabel = String(i + 1);
                } else {
                  // Prefer backend bucket labels; fallback to date range interpolation.
                  const fallbackDateLabel = (() => {
                    const start = parseYYYYMMDD(rangeStart);
                    const end = parseYYYYMMDD(rangeEnd);
                    if (!start || !end) return "";
                    const startMs = start.getTime();
                    const endMs = end.getTime();
                    const ms =
                      startMs +
                      ((endMs - startMs) * (n <= 1 ? 0 : i / (n - 1)));
                    return formatShortDate(new Date(ms));
                  })();
                  dateLabel =
                    Array.isArray(labels) && labels[i]
                      ? formatLabel(labels[i])
                      : fallbackDateLabel;
                }

                const tooltipW = 200;
                const tooltipH = 70;
                const tx = Math.min(width - padRight - 10 - tooltipW, Math.max(padLeft, x - tooltipW / 2));
                const ty = padTop + 8;

                const keys = Object.keys(plotSeries || {});
                return (
                  <>
                    <line
                      x1={x}
                      x2={x}
                      y1={padTop}
                      y2={baselineY}
                      stroke="#94a3b8"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                      opacity="0.9"
                    />
                    <g transform={`translate(${tx}, ${ty})`} pointerEvents="none">
                      <rect
                        x={0}
                        y={0}
                        width={tooltipW}
                        height={tooltipH}
                        rx={10}
                        fill="white"
                        stroke="#e2e8f0"
                        strokeWidth="1"
                      />
                      <text x={12} y={20} fontSize="12" fill="#0f172a" fontWeight="700">
                        {dateLabel}
                      </text>

                      {keys.slice(0, 3).map((k, idx) => {
                        const arr = plotSeries?.[k];
                        const val = Array.isArray(arr) && i < arr.length ? arr[i] : null;
                        const color = seriesColor(k);
                        const y = 38 + idx * 14;
                        return (
                          <g key={`${k}-${idx}`}>
                            <circle cx={12} cy={y - 2} r={4} fill={color} opacity="0.9" />
                            <text x={24} y={y} fontSize="11" fill="#334155">
                              {seriesLabel(k)}: {val === null ? "—" : safeNumber(val)}
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  </>
                );
              })()
            ) : null}
          </svg>

          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-xs">
            {Object.keys(plotSeries || {}).map((k) => {
              const color = seriesColor(k);
              const label = seriesLabel(k);
              return (
                <div key={k} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-slate-600">{label}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function DonutChart({ title, approved, pending, rejected }) {
  const total = approved + pending + rejected;
  const approvedPct = total ? (approved / total) * 100 : 0;
  const r = 80;
  const c = 2 * Math.PI * r;

  const segments = [
    { key: "approved", value: approved, color: "#68d388" },
    { key: "pending", value: pending, color: "#c2edda" },
    { key: "rejected", value: rejected, color: "#fca5a5" },
  ];

  let offset = 0;

  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <span className="text-xs text-slate-500">Approved / Pending / Rejected</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="flex justify-center">
          <svg
            viewBox="0 0 220 220"
            className="w-[180px] h-[180px]"
            role="img"
            aria-label="Status distribution donut chart"
          >
            <defs>
              <filter
                id="softShadow"
                x="-20%"
                y="-20%"
                width="140%"
                height="140%"
              >
                <feDropShadow
                  dx="0"
                  dy="2"
                  stdDeviation="3"
                  floodColor="#000"
                  floodOpacity="0.12"
                />
              </filter>
            </defs>

            <circle
              cx="110"
              cy="110"
              r={r}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="18"
            />

            {segments.map((seg) => {
              const pct = total ? seg.value / total : 0;
              const dash = pct * c;
              const dasharray = `${dash} ${Math.max(0, c - dash)}`;
              const dashoffset = -offset * c;
              offset += pct;

              return (
                <circle
                  key={seg.key}
                  cx="110"
                  cy="110"
                  r={r}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="18"
                  strokeLinecap="round"
                  strokeDasharray={dasharray}
                  strokeDashoffset={dashoffset}
                  transform="rotate(-90 110 110)"
                  filter={seg.key === "approved" ? "url(#softShadow)" : undefined}
                />
              );
            })}

            <text
              x="110"
              y="116"
              textAnchor="middle"
              fontSize="20"
              fontWeight="700"
              fill="#0f172a"
            >
              {Math.round(approvedPct)}%
            </text>
            <text
              x="110"
              y="140"
              textAnchor="middle"
              fontSize="11"
              fill="#64748b"
            >
              Approved
            </text>
          </svg>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: "#68d388" }}
            />
            <span className="text-sm text-slate-700">Approved: {approved}</span>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: "#c2edda" }}
            />
            <span className="text-sm text-slate-700">Pending: {pending}</span>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: "#fca5a5" }}
            />
            <span className="text-sm text-slate-700">Rejected: {rejected}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StageBreakdownBarList({ title, stages }) {
  const safeStages = Array.isArray(stages) ? stages : [];
  const topStages = safeStages
    .slice()
    .sort((a, b) => safeNumber(b.count) - safeNumber(a.count))
    .slice(0, 8);

  const maxCount = Math.max(1, ...topStages.map((s) => safeNumber(s.count)));

  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <span className="text-xs text-slate-500">Top stages</span>
      </div>

      {topStages.length === 0 ? (
        <div className="text-sm text-slate-500">No stage breakdown data.</div>
      ) : (
        <div className="space-y-3">
          {topStages.map((s) => {
            const stageLabel = s.stageLabel || s.stageKey || s.stage || "N/A";
            const count = safeNumber(s.count);
            const w = Math.round((count / maxCount) * 100);
            const color =
              s.stageKey && String(s.stageKey).startsWith("Level")
                ? "#d85a30"
                : s.stageLabel && String(s.stageLabel).toLowerCase().includes("post")
                  ? "#ffb766"
                  : "#68d388";

            return (
              <div key={`${stageLabel}-${s.stageKey || ""}`} className="flex items-center gap-3">
                <div className="w-[210px] text-xs text-slate-600">{stageLabel}</div>
                <div className="flex-1 h-4 bg-slate-100 rounded overflow-hidden">
                  <div
                    className="h-full rounded"
                    style={{ width: `${w}%`, backgroundColor: color }}
                  />
                </div>
                <div className="w-12 text-right text-xs text-slate-500">{count}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RejectionReasonsBarList({ reasons }) {
  const safeReasons = Array.isArray(reasons) ? reasons : [];
  const sorted = safeReasons
    .slice()
    .sort((a, b) => safeNumber(b.count) - safeNumber(a.count))
    .slice(0, 7);

  const maxCount = Math.max(1, ...sorted.map((r) => safeNumber(r.count)));

  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900">
          Rejection Reasons (Static Preview)
        </h3>
        <span className="text-xs text-slate-500">Top reasons</span>
      </div>

      {sorted.length === 0 ? (
        <div className="text-sm text-slate-500">No rejection reasons found.</div>
      ) : (
        <div className="space-y-3">
          {sorted.map((r) => {
            const w = Math.round((safeNumber(r.count) / maxCount) * 100);
            return (
              <div key={r.reason} className="flex items-center gap-3">
                <div className="w-[220px] text-xs text-slate-600">{r.reason || "N/A"}</div>
                <div className="flex-1 h-4 bg-slate-100 rounded overflow-hidden">
                  <div
                    className="h-full rounded"
                    style={{ width: `${w}%`, backgroundColor: "#fca5a5" }}
                  />
                </div>
                <div className="w-12 text-right text-xs text-slate-500">
                  {safeNumber(r.count)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SchemesPerformanceTable({ rows }) {
  const safeRows = Array.isArray(rows) ? rows : [];
  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900">
          Schemes Performance
        </h3>
        <span className="text-xs text-slate-500">Top schemes snapshot</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-slate-600 border-b border-gray-100">
              <th className="py-2">Scheme</th>
              <th className="py-2">Pending</th>
              <th className="py-2">Approved</th>
              <th className="py-2">Rejected</th>
            </tr>
          </thead>
          <tbody>
            {safeRows.map((r) => (
              <tr key={r.schemeId || r.scheme || `${r.schemeId}-${r.scheme}`} className="border-b border-gray-50">
                <td className="py-3 pr-2 text-slate-800 font-medium">
                  {r.schemeName || r.scheme || "N/A"}
                </td>
                <td className="py-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-[#68d388]/25 text-black text-xs font-medium">
                    {r.pending}
                  </span>
                </td>
                <td className="py-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-[#c2edda]/30 text-black text-xs font-medium">
                    {r.approved}
                  </span>
                </td>
                <td className="py-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-100 text-red-800 text-xs font-medium">
                    {r.rejected}
                  </span>
                </td>
              </tr>
            ))}
            {safeRows.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-slate-500">
                  No scheme data available.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FraudAlertsList({ alerts }) {
  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const top = safeAlerts.slice(0, 6);

  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900">
          Fraud & Rejections
        </h3>
        <span className="text-xs text-slate-500">Recent alerts</span>
      </div>

      {top.length === 0 ? (
        <div className="text-sm text-slate-500">No alerts found.</div>
      ) : (
        <div className="space-y-3">
          {top.map((a, idx) => {
            const isDuplicate =
              String(a.type || "").toLowerCase() === "duplicate";
            const pillBg = isDuplicate ? "bg-[#68d388]/20" : "bg-red-50";
            const pillBorder = isDuplicate
              ? "border-[#68d388]/40"
              : "border-red-200";
            const pillText = isDuplicate ? "text-black" : "text-red-800";

            return (
              <div
                key={a.applicationId || a.application_id || idx}
                className={`flex items-start justify-between gap-4 bg-slate-50 border border-slate-100 rounded-lg p-4 ${pillBg} ${pillBorder}`}
              >
                <div className="min-w-0">
                  <p className={`text-sm font-semibold ${pillText}`}>
                    {a.title || a.type || "Alert"}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    {a.description || a.action || "—"}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {a.applicationId || a.application_id || "Application"} •{" "}
                    {a.detectedAt ? String(a.detectedAt) : ""}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-medium ${pillText}`}>
                    {isDuplicate ? "Duplicate" : "Fraud"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const [granularity, setGranularity] = useState("day"); // day | week
  const [range, setRange] = useState("30d"); // 30d or 12w

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statistics, setStatistics] = useState(null);
  const [schemes, setSchemes] = useState([]);
  const [fraudAlerts, setFraudAlerts] = useState([]);

  const [applicationsTrends, setApplicationsTrends] = useState({
    labels: [],
    series: { created: [], approved: [], rejected: [] },
  });
  const [stageBreakdown, setStageBreakdown] = useState([]);
  const [fraudTrends, setFraudTrends] = useState({
    labels: [],
    series: { total: [], duplicate: [], ineligible: [] },
  });
  const [rejectionReasons, setRejectionReasons] = useState([]);

  const rangeParams = useMemo(() => {
    const today = new Date();
    let from;
    if (granularity === "day") {
      // Month-to-date for stable 1..30/31 x-axis labels.
      from = new Date(today.getFullYear(), today.getMonth(), 1);
    } else {
      // last 12 weeks
      from = new Date(today);
      from.setDate(today.getDate() - 84);
    }

    const to =
      granularity === "day"
        ? new Date(today.getFullYear(), today.getMonth() + 1, 0)
        : today;

    return {
      from: formatYYYYMMDD(from),
      to: formatYYYYMMDD(to),
    };
  }, [granularity]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const from = rangeParams.from;
        const to = rangeParams.to;

        const statisticsPromise = axios.get(DASHBOARD_STATISTICS_URL);
        const schemePromise = axios.get(
          `${DASHBOARD_SCHEME_BENEFICIARIES_URL}?limit=50&skip=0`
        );
        const fraudAlertsPromise = axios.get(
          `${DASHBOARD_FRAUD_ALERTS_URL}?limit=10&type=all&status=active`
        );

        const applicationsTrendsPromise = axios.get(
          `${ANALYTICS_APPLICATIONS_TRENDS_URL}?from=${encodeURIComponent(
            from
          )}&to=${encodeURIComponent(to)}&granularity=${encodeURIComponent(
            granularity
          )}`
        );

        // stage-breakdown supports omitting dates.
        const stageBreakdownPromise = axios.get(ANALYTICS_STAGE_BREAKDOWN_URL);

        const fraudTrendsPromise = axios.get(
          `${ANALYTICS_FRAUD_TRENDS_URL}?from=${encodeURIComponent(
            from
          )}&to=${encodeURIComponent(to)}&granularity=${encodeURIComponent(
            granularity
          )}`
        );

        const rejectionReasonsPromise = axios.get(
          `${ANALYTICS_REJECTION_REASONS_URL}?from=${encodeURIComponent(
            from
          )}&to=${encodeURIComponent(to)}`
        );

        const results = await Promise.allSettled([
          statisticsPromise,
          schemePromise,
          fraudAlertsPromise,
          applicationsTrendsPromise,
          stageBreakdownPromise,
          fraudTrendsPromise,
          rejectionReasonsPromise,
        ]);

        const [
          statisticsRes,
          schemeRes,
          fraudAlertsRes,
          applicationsTrendsRes,
          stageBreakdownRes,
          fraudTrendsRes,
          rejectionReasonsRes,
        ] = results.map((r) => (r.status === "fulfilled" ? r.value : null));

        if (statisticsRes) {
          const s = statisticsRes.data?.data || {};
          setStatistics({
            totalApplicants: safeNumber(s.totalApplicants),
            approved: safeNumber(s.approved),
            pending: safeNumber(s.pending),
            rejected: safeNumber(s.rejected),
          });
        }

        if (schemeRes) {
          const schemesPayload = schemeRes.data?.data || {};
          const schemeRows = Array.isArray(schemesPayload.schemes)
            ? schemesPayload.schemes.map((sc) => ({
                schemeId: sc.schemeId || sc.scheme_id || sc._id,
                schemeName:
                  sc.schemeName || sc.scheme_name || sc.scheme || "",
                total: safeNumber(
                  sc.totalBeneficiaries ||
                    sc.total_beneficiaries ||
                    sc.total
                ),
                approved: safeNumber(sc.approved),
                pending: safeNumber(sc.pending),
                rejected: safeNumber(sc.rejected),
              }))
            : [];
          setSchemes(schemeRows);
        }

        if (fraudAlertsRes) {
          setFraudAlerts(fraudAlertsRes.data?.data?.alerts || []);
        }

        if (applicationsTrendsRes) {
          const appTrendsPayload = applicationsTrendsRes.data?.data || {};
          setApplicationsTrends({
            labels: appTrendsPayload.labels || [],
            series: appTrendsPayload.series || {
              created: [],
              approved: [],
              rejected: [],
            },
          });
        }

        if (stageBreakdownRes) {
          setStageBreakdown(stageBreakdownRes.data?.data?.stages || []);
        }

        if (fraudTrendsRes) {
          const fraudTrendsPayload = fraudTrendsRes.data?.data || {};
          setFraudTrends({
            labels: fraudTrendsPayload.labels || [],
            series: fraudTrendsPayload.series || {
              total: [],
              duplicate: [],
              ineligible: [],
            },
          });
        }

        if (rejectionReasonsRes) {
          setRejectionReasons(
            rejectionReasonsRes.data?.data?.reasons || []
          );
        }
      } catch (e) {
        console.error("Analytics fetch error:", e);
        setError(e?.response?.data?.message || e?.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [granularity, rangeParams.from, rangeParams.to]);

  const labelsCount = applicationsTrends.labels.length;
  const monthShort = (() => {
    try {
      const d = new Date(rangeParams.from);
      if (Number.isNaN(d.getTime())) return "This month";
      return d.toLocaleString("en-US", { month: "short" });
    } catch {
      return "This month";
    }
  })();
  const analyticsSubtitle =
    granularity === "week" ? "Last 12 weeks" : `This month (${monthShort})`;

  const approved = statistics ? statistics.approved : 0;
  const pending = statistics ? statistics.pending : 0;
  const rejected = statistics ? statistics.rejected : 0;

  return (
    <Dashboard sidebarType="System Admin">
      <div className="p-6 bg-slate-50 min-h-screen">
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Analytics
              </h1>
              <p className="text-sm text-slate-600 mt-2">
                Charts wired to admin analytics endpoints.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setGranularity("day")}
                className={`px-3 py-2 rounded-md border text-sm ${
                  granularity === "day"
                    ? "bg-[#d85a30] text-white border-[#d85a30]"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Last 30d
              </button>
              <button
                type="button"
                onClick={() => setGranularity("week")}
                className={`px-3 py-2 rounded-md border text-sm ${
                  granularity === "week"
                    ? "bg-[#d85a30] text-white border-[#d85a30]"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Last 12w
              </button>
            </div>
          </div>

          {error ? (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          ) : null}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d85a30]" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
              <PlaceholderKpiCard
                title="Total Applications"
                value={statistics ? statistics.totalApplicants : 0}
                sub="Across all schemes (dashboard statistics)"
              />
              <PlaceholderKpiCard
                title="Approved"
                value={approved}
                sub="Verified & approved"
              />
              <PlaceholderKpiCard
                title="Pending"
                value={pending}
                sub="Applied + Under Review + Pending buckets"
              />
              <PlaceholderKpiCard
                title="Rejected"
                value={rejected}
                sub="Rejected applications"
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
              <LineChart
                title="Applications Trends"
                subtitle={analyticsSubtitle}
                labels={applicationsTrends.labels}
                series={applicationsTrends.series}
                tickCount={granularity === "day" ? 0 : 5}
                rangeStart={rangeParams.from}
                rangeEnd={rangeParams.to}
                showAllDayLabels={granularity === "day"}
              />
              <DonutChart
                title="Status Distribution"
                approved={approved}
                pending={pending}
                rejected={rejected}
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
              <StageBreakdownBarList
                title="Stage Breakdown"
                stages={stageBreakdown}
              />
              <FraudAlertsList alerts={fraudAlerts} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
              <LineChart
                title="Fraud Trends"
                subtitle={analyticsSubtitle}
                labels={fraudTrends.labels}
                series={{
                  total: fraudTrends.series?.total || [],
                  duplicate: fraudTrends.series?.duplicate || [],
                  ineligible: fraudTrends.series?.ineligible || [],
                }}
                tickCount={granularity === "day" ? 0 : 5}
                rangeStart={rangeParams.from}
                rangeEnd={rangeParams.to}
                showAllDayLabels={granularity === "day"}
              />
              <RejectionReasonsBarList reasons={rejectionReasons} />
            </div>

            <SchemesPerformanceTable rows={schemes} />
          </>
        )}
      </div>
    </Dashboard>
  );
}

