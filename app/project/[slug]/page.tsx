import Link from "next/link";
import { getProject, projects } from "@/data/projects";
import BadgeClaim from "@/components/BadgeClaim";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project) {
    return (
      <main className="min-h-screen p-4">
        <div className="project-page">
          <h1>WILD MISSINGNO APPEARED</h1>
          <p>That building does not exist in this town.</p>
          <p>
            <Link href="/">← BACK TO MONTERREY TOWN</Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4">
      <article className="project-page">
        <p>
          <Link href="/">← BACK TO MONTERREY TOWN</Link>
        </p>
        <h1 style={{ marginTop: 12 }}>{project.title}</h1>
        <p style={{ marginTop: 8 }}>{project.long}</p>
        <BadgeClaim slug={project.slug} title={project.navLabel} />
        <h2 style={{ marginTop: 16, fontSize: 13 }}>STACK</h2>
        <ul style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8, padding: 0, listStyle: "none" }}>
          {project.stack.map((s) => (
            <li key={s} style={{ border: "2px solid currentColor", padding: "4px 8px", fontSize: 12 }}>
              {s}
            </li>
          ))}
        </ul>
        <nav style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
          {projects
            .filter((p) => p.slug !== project.slug)
            .map((p) => (
              <Link key={p.slug} href={`/project/${p.slug}`}>
                ▶ {p.navLabel}
              </Link>
            ))}
        </nav>
      </article>
    </main>
  );
}
