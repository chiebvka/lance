import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OgInput = {
  title?: string | null
  subtitle?: string | null
  orgName?: string | null
  orgLogoUrl?: string | null
};

async function fetchPreviewData(type?: string | null, id?: string | null): Promise<OgInput> {
  if (!type || !id) return {};

  const supabase = await createClient();
  const t = String(type).toLowerCase();

  try {
    if (t === "project" || t === "projects") {
      const { data } = await supabase
        .from("projects")
        .select("name, organization:organizationId(name, logoUrl)")
        .eq("id", id)
        .single();
      if (data) return {
        title: (data as any).name,
        subtitle: "Project",
        orgName: (data as any).organization?.name ?? null,
        orgLogoUrl: (data as any).organization?.logoUrl ?? null,
      };
    }

    if (t === "wall" || t === "walls") {
      const { data } = await supabase
        .from("walls")
        .select("name, organization:organizationId(name, logoUrl)")
        .eq("id", id)
        .single();
      if (data) return {
        title: data.name,
        subtitle: "Wall",
        orgName: (data as any).organization?.name ?? null,
        orgLogoUrl: (data as any).organization?.logoUrl ?? null,
      };
    }

    if (t === "path" || t === "paths") {
      const { data } = await supabase
        .from("paths")
        .select("name, organization:organizationId(name, logoUrl)")
        .eq("id", id)
        .single();
      if (data) return {
        title: data.name,
        subtitle: "Path",
        orgName: (data as any).organization?.name ?? null,
        orgLogoUrl: (data as any).organization?.logoUrl ?? null,
      };
    }

    if (t === "invoice" || t === "invoices") {
      const { data } = await supabase
        .from("invoices")
        .select("invoiceNumber, organization:organizationId(name, logoUrl)")
        .eq("id", id)
        .single();
      if (data) return {
        title: (data as any).invoiceNumber,
        subtitle: "Invoice",
        orgName: (data as any).organization?.name ?? null,
        orgLogoUrl: (data as any).organization?.logoUrl ?? null,
      };
    }

    if (t === "receipt" || t === "receipts") {
      const { data } = await supabase
        .from("receipts")
        .select("receiptNumber, organization:organizationId(name, logoUrl)")
        .eq("id", id)
        .single();
      if (data) return {
        title: (data as any).receiptNumber,
        subtitle: "Receipt",
        orgName: (data as any).organization?.name ?? null,
        orgLogoUrl: (data as any).organization?.logoUrl ?? null,
      };
    }

    if (t === "feedback" || t === "feedbacks") {
      const { data } = await supabase
        .from("feedbacks")
        .select("name, organization:organizationId(name, logoUrl)")
        .eq("id", id)
        .single();
      if (data) return {
        title: data.name,
        subtitle: "Feedback",
        orgName: (data as any).organization?.name ?? null,
        orgLogoUrl: (data as any).organization?.logoUrl ?? null,
      };
    }
  } catch (_) {
    // ignore
  }

  return {};
}

function hsl(h: number, s: number, l: number) {
  return `hsl(${h} ${s}% ${l}%)`;
}

function generateSVG(data: OgInput): string {
  const fallbackBrand = {
    platform: "bexforte",
    primary: hsl(267, 95.2, 65),
    bg: "#fff8e7",
    fg: "#1a202c",
    subtle: "#4a5568",
  };

  const title = data.title || "Bexforte";
  const subtitle = data.subtitle || "";
  const orgName = data.orgName || "bexforte";
  const hasLogo = !!data.orgLogoUrl;

  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#fff8e7;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#fef3c7;stop-opacity:1" />
      </linearGradient>
    </defs>
    
    <!-- Background -->
    <rect width="100%" height="100%" fill="url(#bg)"/>
    
    <!-- Logo/Icon Area -->
    <g transform="translate(48, 48)">
      ${hasLogo ? 
        `<rect x="0" y="0" width="88" height="88" fill="#111" stroke="${fallbackBrand.primary}" stroke-width="2"/>
         <text x="44" y="52" font-family="Arial, sans-serif" font-size="32" fill="${fallbackBrand.primary}" text-anchor="middle" font-weight="bold">LOGO</text>` :
        `<rect x="0" y="0" width="88" height="88" fill="${fallbackBrand.primary}"/>
         <text x="44" y="52" font-family="Arial, sans-serif" font-size="40" fill="white" text-anchor="middle" font-weight="bold">B</text>`
      }
    </g>
    
    <!-- Organization Name -->
    <text x="156" y="80" font-family="Arial, sans-serif" font-size="22" fill="${fallbackBrand.subtle}">
      ${orgName}
    </text>
    
    <!-- Main Title -->
    <text x="156" y="140" font-family="Arial, sans-serif" font-size="56" fill="${fallbackBrand.fg}" font-weight="bold">
      ${title}
    </text>
    
    <!-- Subtitle -->
    ${subtitle ? 
      `<text x="156" y="180" font-family="Arial, sans-serif" font-size="28" fill="${fallbackBrand.subtle}">${subtitle}</text>` : 
      ''
    }
    
    <!-- Bottom Right Branding -->
    <g transform="translate(1104, 558)">
      <circle cx="7" cy="7" r="7" fill="${fallbackBrand.primary}"/>
      <text x="28" y="12" font-family="Arial, sans-serif" font-size="24" fill="${fallbackBrand.subtle}">bexforte.com</text>
    </g>
    
    <!-- Decorative Elements -->
    <circle cx="1000" cy="100" r="3" fill="${fallbackBrand.primary}" opacity="0.3"/>
    <circle cx="1050" cy="150" r="2" fill="${fallbackBrand.primary}" opacity="0.2"/>
    <circle cx="950" cy="200" r="4" fill="${fallbackBrand.primary}" opacity="0.4"/>
  </svg>`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    const overrideTitle = searchParams.get("title");
    const overrideSubtitle = searchParams.get("subtitle");
    const overrideOrgName = searchParams.get("org");
    const overrideLogo = searchParams.get("logo");

    const fetched = await fetchPreviewData(type, id);

    const data: OgInput = {
      title: overrideTitle ?? fetched.title ?? "",
      subtitle: overrideSubtitle ?? fetched.subtitle ?? "",
      orgName: overrideOrgName ?? fetched.orgName ?? "bexforte",
      orgLogoUrl: overrideLogo ?? fetched.orgLogoUrl ?? null,
    };

    const svg = generateSVG(data);

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=600, s-maxage=600, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("OG generation error:", error);
    
    // Return a simple error image as SVG
    const errorSvg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#fff8e7"/>
      <text x="600" y="315" font-family="Arial, sans-serif" font-size="48" fill="#1a202c" text-anchor="middle">
        Error generating image
      </text>
      <text x="600" y="365" font-family="Arial, sans-serif" font-size="24" fill="#4a5568" text-anchor="middle">
        Please check server logs
      </text>
    </svg>`;
    
    return new NextResponse(errorSvg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "no-cache",
      },
    });
  }
}
