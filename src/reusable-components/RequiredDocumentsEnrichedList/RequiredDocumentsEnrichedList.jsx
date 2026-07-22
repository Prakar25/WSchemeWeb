/* eslint-disable react/prop-types */
import { FiFileText, FiUser } from "react-icons/fi";

function isTextDoc(doc) {
  return doc.isCustom || doc.isTextDocument;
}

function partitionDocuments(documents) {
  const profile = documents.filter((d) => d.profileReusable && !isTextDoc(d));
  const upload = documents.filter((d) => isTextDoc(d) || !d.profileReusable);
  return { profile, upload };
}

/**
 * Display required documents with profile / upload grouping and badges.
 */
export default function RequiredDocumentsEnrichedList({
  documents = [],
  variant = "list",
  title = "All required documents on this scheme",
  emptyText = "No required documents",
}) {
  if (!documents.length) {
    return <p className="text-sm text-gray-500">{emptyText}</p>;
  }

  if (variant === "summary") {
    return (
      <SummaryPanel documents={documents} title={title} />
    );
  }

  if (variant === "inline") {
    return (
      <div className="flex flex-wrap gap-2">
        {documents.map((doc) => (
          <DocumentChip key={doc.key || doc.label} doc={doc} />
        ))}
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {documents.map((doc) => (
        <DocumentRow key={doc.key || doc.label} doc={doc} compact />
      ))}
    </ul>
  );
}

function SummaryPanel({ documents, title }) {
  const { profile, upload } = partitionDocuments(documents);

  return (
    <div className="rounded-xl border border-[#c2edda]/80 bg-gradient-to-br from-white to-[#c2edda]/20 overflow-hidden shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-[#c2edda]/60 bg-white/70">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#d85a30]/10 text-[#d85a30]">
            <FiFileText className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            <p className="text-xs text-gray-500">
              Saved configuration for this scheme
            </p>
          </div>
        </div>
        <span className="inline-flex items-center rounded-full bg-[#d85a30] px-3 py-1 text-xs font-semibold text-white shadow-sm">
          {documents.length} total
        </span>
      </div>

      <div className="p-4 space-y-4">
        {profile.length > 0 && (
          <DocumentGroup
            icon={<FiUser className="h-3.5 w-3.5" />}
            title="Profile pre-fill"
            subtitle="Loaded automatically from applicant profile"
            count={profile.length}
            tone="profile"
            documents={profile}
          />
        )}
        {upload.length > 0 && (
          <DocumentGroup
            icon={<FiFileText className="h-3.5 w-3.5" />}
            title="Custom upload"
            subtitle="Applicants must upload for each application"
            count={upload.length}
            tone="upload"
            documents={upload}
          />
        )}
      </div>
    </div>
  );
}

function DocumentGroup({ icon, title, subtitle, count, tone, documents }) {
  const tones = {
    profile: {
      header: "text-emerald-900",
      sub: "text-emerald-700/80",
      pill: "bg-emerald-100 text-emerald-800",
      box: "border-emerald-200/70 bg-emerald-50/40",
      icon: "bg-emerald-100 text-emerald-700",
    },
    upload: {
      header: "text-violet-900",
      sub: "text-violet-700/80",
      pill: "bg-violet-100 text-violet-800",
      box: "border-violet-200/70 bg-violet-50/30",
      icon: "bg-violet-100 text-violet-700",
    },
  };
  const t = tones[tone] || tones.upload;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${t.icon}`}>
            {icon}
          </span>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wide ${t.header}`}>
              {title}
            </p>
            <p className={`text-[11px] ${t.sub}`}>{subtitle}</p>
          </div>
        </div>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${t.pill}`}>
          {count}
        </span>
      </div>
      <ul className={`rounded-lg border divide-y divide-white/80 ${t.box}`}>
        {documents.map((doc, index) => (
          <li key={doc.key || doc.label}>
            <DocumentRow
              doc={doc}
              compact={false}
              showIndex={documents.length > 1}
              index={index + 1}
              tone={tone}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function DocumentRow({ doc, compact, showIndex, index, tone }) {
  const Icon = tone === "profile" || doc.profileReusable ? FiUser : FiFileText;
  const iconTone =
    tone === "profile" || doc.profileReusable
      ? "bg-emerald-100 text-emerald-600"
      : "bg-violet-100 text-violet-600";

  return (
    <div
      className={`flex items-start gap-3 ${
        compact ? "py-1" : "px-3 py-2.5"
      }`}
    >
      {showIndex && (
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/80 text-[10px] font-bold text-gray-500 border border-gray-200">
          {index}
        </span>
      )}
      <span
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${iconTone}`}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 leading-snug break-words">
          {doc.label}
        </p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {doc.profileReusable && !isTextDoc(doc) && (
            <Badge tone="emerald">Pre-fills from profile</Badge>
          )}
          {isTextDoc(doc) && <Badge tone="violet">Required upload</Badge>}
        </div>
      </div>
    </div>
  );
}

function DocumentChip({ doc }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 px-2.5 py-1 text-xs bg-gray-100 border border-gray-200 rounded-full text-gray-800">
      <span>{doc.label}</span>
      {doc.profileReusable && !isTextDoc(doc) && (
        <Badge tone="emerald">Pre-fills from profile</Badge>
      )}
      {isTextDoc(doc) && <Badge tone="violet">Required upload</Badge>}
    </span>
  );
}

function Badge({ children, tone }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
    violet: "bg-violet-50 text-violet-800 border-violet-200",
  };
  return (
    <span
      className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded border ${tones[tone] || tones.emerald}`}
    >
      {children}
    </span>
  );
}
