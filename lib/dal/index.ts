import { prisma, isDatabaseConfigured } from "../db/prisma";

export interface DatabaseHealthStatus {
  isConfigured: boolean;
  isConnected: boolean;
  provider: string;
  error?: string;
  latencyMs?: number;
}

let cachedHealth: { status: DatabaseHealthStatus; expiresAt: number } | null = null;
const HEALTH_CACHE_TTL_MS = 15000; // 15 seconds in-memory TTL

export async function checkDatabaseHealth(): Promise<DatabaseHealthStatus> {
  const now = Date.now();
  if (cachedHealth && cachedHealth.expiresAt > now) {
    return cachedHealth.status;
  }

  const isConfigured = isDatabaseConfigured();
  if (!isConfigured) {
    const unconfiguredStatus: DatabaseHealthStatus = {
      isConfigured: false,
      isConnected: false,
      provider: "Neon PostgreSQL",
      error: "DATABASE_URL is not configured or contains placeholder values. Set a valid Neon connection string.",
    };
    cachedHealth = { status: unconfiguredStatus, expiresAt: now + HEALTH_CACHE_TTL_MS };
    return unconfiguredStatus;
  }

  const start = Date.now();
  try {
    // Run lightweight query to check Neon connectivity
    await prisma.$queryRaw`SELECT 1 as connected`;
    const latencyMs = Date.now() - start;
    const connectedStatus: DatabaseHealthStatus = {
      isConfigured: true,
      isConnected: true,
      provider: "Neon PostgreSQL",
      latencyMs,
    };
    cachedHealth = { status: connectedStatus, expiresAt: now + HEALTH_CACHE_TTL_MS };
    return connectedStatus;
  } catch (error: any) {
    console.error("Neon database connection error:", error?.message || error);
    const errorStatus: DatabaseHealthStatus = {
      isConfigured: true,
      isConnected: false,
      provider: "Neon PostgreSQL",
      error: error?.message || "Failed to establish connection with Neon PostgreSQL server.",
    };
    // Cache failures for only 3 seconds so recovery is detected quickly
    cachedHealth = { status: errorStatus, expiresAt: now + 3000 };
    return errorStatus;
  }
}

// -------------------------------------------------------------
// PROGRAMMES DAL
// -------------------------------------------------------------
export async function getProgrammes(options?: {
  status?: "PUBLISHED" | "DRAFT" | "ARCHIVED" | "ALL";
  category?: string;
  featuredOnly?: boolean;
}) {
  if (isDatabaseConfigured()) {
    try {
      const where: any = {};
      if (options?.status && options.status !== "ALL") {
        where.status = options.status;
      } else if (!options?.status) {
        where.status = "PUBLISHED";
      }
      if (options?.category) {
        where.category = options.category;
      }
      if (options?.featuredOnly) {
        where.isFeatured = true;
      }

      return await prisma.programme.findMany({
        where,
        orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
      });
    } catch (e) {
      console.warn("Failed to fetch programmes from DB:", e);
      return [];
    }
  }

  return [];
}

export async function getProgrammeBySlug(slug: string) {
  if (isDatabaseConfigured()) {
    try {
      const item = await prisma.programme.findUnique({
        where: { slug },
      });
      return item || null;
    } catch (e) {
      console.warn("Programme lookup failed in DB:", e);
      return null;
    }
  }
  return null;
}

// -------------------------------------------------------------
// STORIES / NEWS DAL
// -------------------------------------------------------------
export async function getStories(options?: {
  status?: "PUBLISHED" | "DRAFT" | "ALL";
  limit?: number;
}) {
  if (isDatabaseConfigured()) {
    try {
      const where: any = {};
      if (options?.status && options.status !== "ALL") {
        where.status = options.status;
      } else if (!options?.status) {
        where.status = "PUBLISHED";
      }

      return await prisma.story.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        take: options?.limit,
      });
    } catch (e) {
      console.warn("Failed to fetch stories from DB:", e);
      return [];
    }
  }

  return [];
}

export async function getStoryBySlug(slug: string) {
  if (isDatabaseConfigured()) {
    try {
      const item = await prisma.story.findUnique({
        where: { slug },
      });
      return item || null;
    } catch (e) {
      console.warn("Story lookup failed in DB:", e);
      return null;
    }
  }
  return null;
}

// -------------------------------------------------------------
// EVENTS DAL
// -------------------------------------------------------------
export async function getEvents(options?: {
  status?: "PUBLISHED" | "DRAFT" | "ALL";
  upcomingOnly?: boolean;
}) {
  if (isDatabaseConfigured()) {
    try {
      const where: any = {};
      if (options?.status && options.status !== "ALL") {
        where.status = options.status;
      } else if (!options?.status) {
        where.status = "PUBLISHED";
      }
      if (options?.upcomingOnly) {
        where.startDate = { gte: new Date() };
      }

      return await prisma.event.findMany({
        where,
        orderBy: { startDate: "asc" },
      });
    } catch (e) {
      console.warn("Failed to fetch events from DB:", e);
      return [];
    }
  }

  return [];
}

export async function getEventBySlug(slug: string) {
  if (isDatabaseConfigured()) {
    try {
      const item = await prisma.event.findUnique({
        where: { slug },
      });
      return item || null;
    } catch (e) {
      console.warn("Event lookup failed in DB:", e);
      return null;
    }
  }
  return null;
}

// -------------------------------------------------------------
// IMPACT METRICS DAL
// -------------------------------------------------------------
export async function getImpactMetrics() {
  if (isDatabaseConfigured()) {
    try {
      return await prisma.impactMetric.findMany({
        orderBy: { displayOrder: "asc" },
      });
    } catch (e) {
      console.warn("Failed to fetch impact metrics from DB:", e);
      return [];
    }
  }
  return [];
}

// -------------------------------------------------------------
// PUBLIC DOCUMENTS DAL
// -------------------------------------------------------------
export async function getPublicDocuments(options?: { category?: string }) {
  if (isDatabaseConfigured()) {
    try {
      const where: any = { status: "PUBLISHED" };
      if (options?.category) {
        where.category = options.category;
      }
      return await prisma.publicDocument.findMany({
        where,
        orderBy: { publishedAt: "desc" },
      });
    } catch (e) {
      console.warn("Failed to fetch public documents from DB:", e);
      return [];
    }
  }

  return [];
}

// -------------------------------------------------------------
// SITE SETTINGS DAL
// -------------------------------------------------------------
export async function getSiteSettings() {
  const defaultSettings = {
    id: "default",
    orgName: "YOUTH SPARK INDIA FOUNDATION",
    tagline: "Igniting Potential, Empowering Futures.",
    noticeBanner: "Registration & Pilot Phase 2025–2026: Working on grassroots youth empowerment and skill development.",
    noticeActive: true,
    contactEmail: "contact@youthsparkindia.org",
    contactPhone: "+91 (Editorial Placeholder: Official Helpline)",
    officeAddress: "State Project Office, (Editorial Placeholder: Official Address to be published upon registration completion)",
    facebookUrl: "https://facebook.com",
    instagramUrl: "https://instagram.com",
    linkedinUrl: "https://linkedin.com",
    twitterUrl: "https://x.com",
    youtubeUrl: "https://youtube.com",
  };

  if (isDatabaseConfigured()) {
    try {
      const item = await prisma.siteSetting.findUnique({
        where: { id: "default" },
      });
      if (item) return item;
    } catch (e) {
      console.warn("Fallback to default site settings:", e);
    }
  }
  return defaultSettings;
}

// -------------------------------------------------------------
// CONTACT ENQUIRIES DAL
// -------------------------------------------------------------
export async function createContactEnquiry(data: {
  fullName: string;
  email: string;
  phone?: string;
  type: string;
  subject: string;
  message: string;
  ipHash?: string;
}) {
  if (isDatabaseConfigured()) {
    try {
      return await prisma.contactEnquiry.create({
        data: {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone || null,
          type: data.type,
          subject: data.subject,
          message: data.message,
          ipHash: data.ipHash || null,
        },
      });
    } catch (error) {
      console.error("Failed to save enquiry to Neon database:", error);
    }
  }
  // If database is not configured, simulate successful receipt for form UX
  return {
    id: "mock-" + Date.now(),
    ...data,
    isRead: false,
    createdAt: new Date(),
  };
}

export async function getContactEnquiries() {
  if (isDatabaseConfigured()) {
    try {
      return await prisma.contactEnquiry.findMany({
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      console.error("Failed to fetch enquiries from Neon database:", error);
    }
  }
  return [];
}

// -------------------------------------------------------------
// HOMEPAGE SECTIONS DAL
// -------------------------------------------------------------
export async function getHomepageSections() {
  if (isDatabaseConfigured()) {
    try {
      const items = await prisma.homepageSection.findMany({
        orderBy: { displayOrder: "asc" },
      });
      if (items.length > 0) return items;
    } catch (error) {
      console.warn("Failed to fetch homepage sections from Neon:", error);
    }
  }

  // Resilient defaults
  return [
    {
      id: "hero",
      title: "Hero Section",
      subtitle: "Main mission headline and call to actions",
      displayOrder: 0,
      isVisible: true,
      content: {
        badgeText: "STATE-LEVEL YOUTH & COMMUNITY INITIATIVE • FOUNDED 2025",
        headline: "Igniting Potential,\nEmpowering Futures.",
        subtext: "Youth Spark India Foundation is dedicated to unlocking the leadership, digital capabilities, and vocational vitality of India's youth. We partner with rural and peri-urban communities to build self-reliant change agents.",
        primaryCtaLabel: "Explore Our Programmes",
        primaryCtaUrl: "/programmes",
        secondaryCtaLabel: "Join Our Mission",
        secondaryCtaUrl: "/join-us",
        supportCtaLabel: "Support Our Initiatives",
        supportCtaUrl: "/donate",
        desktopImage: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=2000&q=80",
      },
    },
    {
      id: "intro",
      title: "Introduction & Mission Pillars",
      subtitle: "Why We Exist narrative and 6 key focus domains",
      displayOrder: 1,
      isVisible: true,
      content: {
        badge: "Our Core Purpose",
        heading: "Catalysing Community Leadership From Within",
        leadText: "India is home to the world's largest youth cohort. While immense energy resides in our tier-2, tier-3 cities and villages, opportunities for structured leadership development, digital education, and vocational mentorship remain unevenly distributed.",
        ctaLabel: "Read Our Full Story & Principles",
        ctaUrl: "/about",
      },
    },
    {
      id: "programmes",
      title: "Featured Programmes",
      subtitle: "Showcases active ground initiatives",
      displayOrder: 2,
      isVisible: true,
      content: {
        badge: "Action on the Ground",
        heading: "Featured Programmes",
        subtext: "Structured initiatives active across pilot blocks, focused on tangible outcomes and community ownership.",
        visibleCount: 3,
        ctaLabel: "View All 8 Focus Areas",
        ctaUrl: "/programmes",
      },
    },
    {
      id: "impact",
      title: "Impact & Evidence Metrics",
      subtitle: "Verified indicators and accountability standard",
      displayOrder: 3,
      isVisible: true,
      content: {
        badge: "Accountability Standard",
        heading: "Operational Scope & Integrity",
        subtext: "We uphold complete honesty: no fabricated beneficiary numbers, no simulated live counters, and no unverified claims.",
        linkText: "Learn about our reporting methodology & reporting cycle",
        linkUrl: "/impact",
      },
    },
    {
      id: "stories",
      title: "Stories & Field Reflections",
      subtitle: "Editorial articles and perspectives from the ground",
      displayOrder: 4,
      isVisible: true,
      content: {
        badge: "Perspectives & Updates",
        heading: "Stories From the Field",
        subtext: "Essays, program reflections, and field reports authored by our coordinators and volunteers.",
        visibleCount: 2,
        ctaLabel: "Read All Stories",
        ctaUrl: "/stories",
      },
    },
    {
      id: "events",
      title: "Upcoming Community Events",
      subtitle: "Workshops and round-tables",
      displayOrder: 5,
      isVisible: true,
      content: {
        badge: "Community Participation",
        heading: "Events & Round-Tables",
        visibleCount: 2,
        ctaLabel: "View All Events",
        ctaUrl: "/events",
      },
    },
    {
      id: "transparency",
      title: "Transparency & Public Governance",
      subtitle: "Open disclosures callout box",
      displayOrder: 6,
      isVisible: true,
      content: {
        badge: "OPEN DISCLOSURES & GOVERNANCE",
        heading: "Public Trust Built on Radical Transparency",
        subtext: "As an organisation serving the public interest, Youth Spark India Foundation maintains an open repository of our charter, child protection policies, volunteer ethics guidelines, and reporting disclosures.",
        primaryButtonLabel: "Browse Public Documents",
        primaryButtonUrl: "/transparency",
        secondaryButtonLabel: "Donation Policy & Giving Info",
        secondaryButtonUrl: "/donate",
      },
    },
    {
      id: "volunteer",
      title: "Engagement & Volunteer Banner",
      subtitle: "Bottom mission call to action",
      displayOrder: 7,
      isVisible: true,
      content: {
        badge: "Join the Movement",
        heading: "Ready to Ignite Change in Your Community?",
        subtext: "Whether you want to volunteer as a digital literacy mentor, coordinate a neighborhood environmental drive, or partner as an institutional collaborator, your spark matters.",
        primaryLabel: "Volunteer With Us",
        primaryUrl: "/join-us",
        secondaryLabel: "Contact Our Office",
        secondaryUrl: "/contact",
      },
    },
  ];
}

// -------------------------------------------------------------
// NAVIGATION ITEMS DAL
// -------------------------------------------------------------
export async function getNavigationItems() {
  if (isDatabaseConfigured()) {
    try {
      const items = await prisma.navigationItem.findMany({
        where: { parentId: null, isVisible: true },
        include: {
          children: {
            where: { isVisible: true },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      });
      if (items.length > 0) return items;
    } catch (e) {
      console.warn("Fallback to baseline navigation:", e);
    }
  }

  return [
    { id: "nav-about", label: "About Us", href: "/about", order: 1, isVisible: true, isExternal: false, children: [] },
    { id: "nav-prog", label: "Programmes", href: "/programmes", order: 2, isVisible: true, isExternal: false, children: [] },
    { id: "nav-impact", label: "Impact", href: "/impact", order: 3, isVisible: true, isExternal: false, children: [] },
    { id: "nav-stories", label: "Stories", href: "/stories", order: 4, isVisible: true, isExternal: false, children: [] },
    { id: "nav-gallery", label: "Gallery", href: "/gallery", order: 5, isVisible: true, isExternal: false, children: [] },
    { id: "nav-events", label: "Events", href: "/events", order: 6, isVisible: true, isExternal: false, children: [] },
    { id: "nav-trans", label: "Transparency", href: "/transparency", order: 7, isVisible: true, isExternal: false, children: [] },
    { id: "nav-contact", label: "Contact", href: "/contact", order: 8, isVisible: true, isExternal: false, children: [] },
  ];
}

// -------------------------------------------------------------
// SOCIAL PROFILES DAL
// -------------------------------------------------------------
export async function getSocialProfiles() {
  if (isDatabaseConfigured()) {
    try {
      const items = await prisma.socialProfile.findMany({
        where: { isVisible: true },
        orderBy: { displayOrder: "asc" },
      });
      if (items.length > 0) return items;
    } catch (e) {
      console.warn("Fallback to default social profiles:", e);
    }
  }

  return [
    { id: "s-li", platform: "LinkedIn", url: "https://linkedin.com/company/youthsparkindia", displayOrder: 1, isVisible: true },
    { id: "s-ig", platform: "Instagram", url: "https://instagram.com/youthsparkindia", displayOrder: 2, isVisible: true },
    { id: "s-fb", platform: "Facebook", url: "https://facebook.com/youthsparkindia", displayOrder: 3, isVisible: true },
    { id: "s-tw", platform: "X", url: "https://x.com/youthsparkindia", displayOrder: 4, isVisible: true },
    { id: "s-yt", platform: "YouTube", url: "https://youtube.com/@youthsparkindia", displayOrder: 5, isVisible: true },
  ];
}

// -------------------------------------------------------------
// LEADERSHIP PROFILES DAL
// -------------------------------------------------------------
export async function getLeadershipProfiles(options?: {
  roleType?: string;
  isFeatured?: boolean;
}) {
  if (isDatabaseConfigured()) {
    try {
      const where: any = { status: "PUBLISHED" };
      if (options?.roleType) where.roleType = options.roleType;
      if (options?.isFeatured !== undefined) where.isFeatured = options.isFeatured;

      return await prisma.leadershipProfile.findMany({
        where,
        orderBy: { displayOrder: "asc" },
      });
    } catch (e) {
      console.warn("Failed to fetch leadership profiles from DB:", e);
      return [];
    }
  }

  return [];
}

export async function getLeadershipProfileBySlug(slug: string) {
  if (isDatabaseConfigured()) {
    try {
      const item = await prisma.leadershipProfile.findFirst({
        where: { slug, status: "PUBLISHED" },
      });
      return item || null;
    } catch (e) {
      console.warn("Leadership profile lookup failed in DB:", e);
      return null;
    }
  }

  return null;
}

// -------------------------------------------------------------
// PARTNERS DAL
// -------------------------------------------------------------
export async function getPartners() {
  if (isDatabaseConfigured()) {
    try {
      return await prisma.partner.findMany({
        where: { isVisible: true },
        orderBy: { displayOrder: "asc" },
      });
    } catch (e) {
      console.warn("Failed to fetch partners from DB:", e);
      return [];
    }
  }

  return [];
}

// -------------------------------------------------------------
// GALLERY ALBUMS DAL
// -------------------------------------------------------------
export async function getGalleryAlbums() {
  if (isDatabaseConfigured()) {
    try {
      return await prisma.galleryAlbum.findMany({
        where: { status: "PUBLISHED" },
        include: {
          items: {
            orderBy: { order: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (e) {
      console.warn("Failed to fetch gallery albums from DB:", e);
      return [];
    }
  }

  return [];
}

// -------------------------------------------------------------
// TESTIMONIALS DAL
// -------------------------------------------------------------
export async function getTestimonials(onlyVisible = true) {
  if (isDatabaseConfigured()) {
    try {
      return await prisma.testimonial.findMany({
        where: onlyVisible ? { isVisible: true } : undefined,
        orderBy: { displayOrder: "asc" },
      });
    } catch (e) {
      console.warn("Failed to fetch testimonials from DB:", e);
      return [];
    }
  }

  return [];
}

// -------------------------------------------------------------
// PAGE CONTENT DAL (About, Impact, Privacy, Terms, Accessibility)
// -------------------------------------------------------------
export async function getPageContent(slug: string) {
  if (isDatabaseConfigured()) {
    try {
      const page = await prisma.pageContent.findUnique({
        where: { slug },
      });
      if (page) return page;
    } catch (e) {
      console.warn(`Fallback to default page content for ${slug}:`, e);
    }
  }

  return null;
}


