import { ExternalLink } from "lucide-react";
import { useTaskPreview } from "@/hooks/useTaskPreview";

interface TaskPreviewCardProps {
  taskId: string;
}

export const TaskPreviewCard = ({ taskId }: TaskPreviewCardProps) => {
  const { data, loading } = useTaskPreview(taskId);

  if (loading && !data) {
    return (
      <div
        style={{
          marginTop: 8,
          height: 80,
          borderRadius: 12,
          border: "0.5px solid hsla(18,52%,82%,0.15)",
          background: "hsla(18,52%,82%,0.04)",
        }}
      />
    );
  }

  if (!data) return null;

  return (
    <a
      href={data.link}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        gap: 12,
        marginTop: 8,
        padding: 10,
        borderRadius: 12,
        border: "0.5px solid hsla(18,52%,82%,0.3)",
        background: "hsla(18,52%,82%,0.04)",
        color: "#f0ede8",
        textDecoration: "none",
        transition: "border-color 0.15s, background 0.15s",
        alignItems: "stretch",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "hsla(18,52%,82%,0.55)";
        e.currentTarget.style.background = "hsla(18,52%,82%,0.07)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "hsla(18,52%,82%,0.3)";
        e.currentTarget.style.background = "hsla(18,52%,82%,0.04)";
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          flexShrink: 0,
          borderRadius: 8,
          overflow: "hidden",
          background:
            "linear-gradient(135deg, hsla(18,52%,82%,0.12), hsla(18,52%,82%,0.04))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {data.og_image ? (
          <img
            src={data.og_image}
            alt=""
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <span style={{ color: "hsla(18,52%,82%,0.4)", fontSize: 11 }}>REI</span>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "#f0ede8",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {data.title}
        </div>
        {data.company_name && (
          <div style={{ fontSize: 11, color: "#a09e9a" }}>{data.company_name}</div>
        )}
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          {data.compensation && (
            <span
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 100,
                border: "0.5px solid #ed565a",
                color: "#ed565a",
                fontWeight: 500,
              }}
            >
              {data.compensation}
            </span>
          )}
          <span
            style={{
              marginLeft: "auto",
              fontSize: 11,
              color: "hsla(18,52%,82%,0.7)",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            Open <ExternalLink style={{ width: 10, height: 10 }} />
          </span>
        </div>
      </div>
    </a>
  );
};
