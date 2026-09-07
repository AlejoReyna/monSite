export interface Project {
  slug: string;
  index: number;
  navLabel: string;
  title: string;
  short: string;
  long: string;
  stack: string[];
  // Posición en el mapa 320x276 (port fiel del HTML original)
  x: number;
  y: number;
  w: number;
  h: number;
  door: number;
  dest: number;
}

export const TRAINER = {
  name: "ALEXIS",
  role: "Full-stack developer · Monterrey",
  bio: "Full-stack developer in Monterrey. I build interfaces, APIs, and cloud infrastructure. Open to my next software development role.",
};

export const projects: Project[] = [
  {
    slug: "inverater",
    index: 0,
    navLabel: "INVERATER",
    title: "INVERATER HOUSE",
    short:
      "Professional experience: manual sale links, Mailjet and Truora integrations, Go, Redis, AWS management, and migration to Atlantic.net.",
    long: "Mi trabajo en Inverater: links de venta manual, integraciones con Mailjet y Truora, servicios en Go, caché con Redis, administración en AWS y migración hacia Atlantic.net. Enfoque en backend sólido y entregas que sí llegan a producción.",
    stack: ["Go", "Redis", "AWS", "Atlantic.net", "Mailjet", "Truora"],
    x: 54,
    y: 29,
    w: 67,
    h: 77,
    door: 85,
    dest: 119,
  },
  {
    slug: "monetta",
    index: 1,
    navLabel: "MONETTA",
    title: "MONETTA MART",
    short:
      "Commerce from interface to data: a Flutter shopping app, React dashboard, Shopify integration, and synchronized product catalogs.",
    long: "Monetta de la interfaz al dato: app de compras en Flutter, dashboard en React, integración con Shopify y catálogos sincronizados. Todo el flujo commerce en un solo pueblo.",
    stack: ["Flutter", "React", "Shopify", "Product Catalogs"],
    x: 203,
    y: 29,
    w: 67,
    h: 77,
    door: 235,
    dest: 119,
  },
  {
    slug: "artisanalbrew",
    index: 2,
    navLabel: "ARTISANALBREW",
    title: "ARTISANALBREW CAFÉ",
    short:
      "A .NET and Blazor coffee storefront, PostgreSQL, order validation, and a playful world of pixel robots.",
    long: "Café ArtisanalBrew: storefront de café en .NET y Blazor, PostgreSQL, validación de órdenes y un mundo jugable de robots pixel. El edificio más acogedor del pueblo.",
    stack: [".NET", "Blazor", "PostgreSQL", "Order Validation"],
    x: 203,
    y: 142,
    w: 69,
    h: 57,
    door: 236,
    dest: 214,
  },
];

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}
