import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  PROJECTS,
  getProjectById,
  getProjectNeighbors,
  type V3Project,
} from "@/components/v3/data/projects";

type ProjectPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return PROJECTS.map((project) => ({ id: project.id }));
}

export async function generateMetadata({ params }: ProjectPageProps) {
  const { id } = await params;
  const project = getProjectById(id);

  if (!project) {
    return {
      title: "Project not found",
    };
  }

  return {
    title: `${project.title} | Alexis Reyna`,
    description: project.description.en,
  };
}

function ProjectMedia({ project }: { project: V3Project }) {
  if (!project.media) return null;

  if (project.mediaType === "video") {
    return (
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={project.title}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          background: "rgba(8,8,10,0.38)",
        }}
      >
        <source src={project.media} type="video/mp4" />
      </video>
    );
  }

  return (
    <Image
      src={project.media}
      alt={project.title}
      fill
      sizes="(min-width: 960px) 58vw, 100vw"
      style={{ objectFit: "contain" }}
      unoptimized={project.media.startsWith("http")}
      priority
    />
  );
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const project = getProjectById(id);

  if (!project) notFound();

  const { previous, next } = getProjectNeighbors(project.id);

  return (
    <div
      className="project-detail-page"
      style={{
        minHeight: "100svh",
        paddingTop: 56,
        background: "var(--gic-night-sky)",
        color: "#f8f5ea",
      }}
    >
      <section
        className="project-detail-shell"
        style={{
          minHeight: "calc(100svh - 56px)",
          display: "grid",
          gridTemplateColumns: "minmax(260px, 0.78fr) minmax(0, 1.42fr)",
          gap: "clamp(28px, 5vw, 72px)",
          alignItems: "center",
          padding: "clamp(32px, 6vw, 72px) clamp(24px, 6vw, 80px)",
          borderTop: "1px solid rgba(248,245,234,0.12)",
          animation: "project-detail-enter 780ms cubic-bezier(0.16, 1, 0.3, 1) both",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: "clamp(24px, 4vh, 42px)",
            }}
          >
            {project.badge.split("·").map((part) => (
              <span
                key={part.trim()}
                style={{
                  border: "1px solid rgba(248,245,234,0.2)",
                  borderRadius: 999,
                  color: "rgba(248,245,234,0.82)",
                  fontFamily: "var(--gic-font-comic)",
                  fontSize: "0.64rem",
                  letterSpacing: "0.14em",
                  padding: "6px 12px",
                  textTransform: "uppercase",
                }}
              >
                {part.trim()}
              </span>
            ))}
          </div>

          <p
            style={{
              color: "rgba(248,245,234,0.45)",
              fontFamily: "var(--font-space-mono, ui-monospace, monospace)",
              fontSize: "0.56rem",
              letterSpacing: "0.28em",
              margin: "0 0 12px",
              textTransform: "uppercase",
            }}
          >
            Project / {project.ghost}
          </p>

          <h1
            style={{
              color: "#ffffff",
              fontFamily: "var(--font-cormorant, serif)",
              fontSize: "clamp(4rem, 8vw, 8.8rem)",
              fontWeight: 600,
              letterSpacing: "-0.055em",
              lineHeight: 0.83,
              margin: "0 0 clamp(24px, 4vh, 36px)",
              textTransform: "uppercase",
            }}
          >
            {project.title}
          </h1>

          <p
            style={{
              color: "rgba(248,245,234,0.78)",
              fontSize: "clamp(1rem, 1.35vw, 1.22rem)",
              lineHeight: 1.7,
              margin: "0 0 clamp(24px, 4vh, 36px)",
              maxWidth: "38ch",
            }}
          >
            {project.description.en}
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: "clamp(26px, 5vh, 48px)",
            }}
          >
            {project.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  border: "1px solid rgba(248,245,234,0.28)",
                  borderRadius: 999,
                  color: "rgba(248,245,234,0.76)",
                  fontFamily: "var(--gic-font-comic)",
                  fontSize: "0.62rem",
                  letterSpacing: "0.14em",
                  padding: "6px 12px",
                  textTransform: "uppercase",
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 18 }}>
            <Link href="/" className="project-detail-link">
              Back to work
            </Link>
            {project.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="project-detail-link"
              >
                {link.label.en}
              </a>
            ))}
          </div>
        </div>

        <div
          style={{
            border: "1px solid rgba(248,245,234,0.18)",
            boxShadow: "0 36px 90px rgba(0,0,0,0.32)",
            minHeight: "min(68svh, 760px)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <ProjectMedia project={project} />
        </div>
      </section>

      <div
        style={{
          borderTop: "1px solid rgba(248,245,234,0.12)",
          display: "flex",
          justifyContent: "space-between",
          padding: "18px clamp(24px, 6vw, 80px)",
        }}
      >
        {previous ? (
          <Link className="project-detail-link" href={`/projects/${previous.id}`}>
            Prev / {previous.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link className="project-detail-link" href={`/projects/${next.id}`}>
            Next / {next.title}
          </Link>
        ) : (
          <span />
        )}
      </div>

      <style>{`
        .project-detail-link {
          color: rgba(248,245,234,0.82);
          font-family: var(--gic-font-comic);
          font-size: 0.68rem;
          letter-spacing: 0.16em;
          text-decoration: none;
          text-transform: uppercase;
        }

        .project-detail-link:hover {
          color: #ffffff;
          text-decoration: underline;
          text-underline-offset: 4px;
        }

        @keyframes project-detail-enter {
          from {
            opacity: 0;
            transform: translateY(28px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 900px) {
          .project-detail-shell {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
