import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Initializing distinct authentic block content for the 5 visual pages...");

  const pages = await prisma.pageContent.findMany();

  for (const page of pages) {
    const slug = page.slug;
    const ts = Date.now();
    let blocks = [];

    if (slug === "about") {
      blocks = [
        {
          id: `about_hero_${ts}`,
          type: "hero",
          label: "About Hero",
          props: {
            badge: "Institutional Identity",
            headline: page.title || "About Youth Spark India Foundation",
            subheadline: page.subtitle || "A civic non-profit organization dedicated to youth leadership, digital access, and grassroots community upliftment.",
            coverImage: page.heroImage || "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=80",
            ctaPrimaryText: "Our Initiatives",
            ctaPrimaryUrl: "/programmes",
            ctaSecondaryText: "Contact Us",
            ctaSecondaryUrl: "/contact",
            align: "left",
          },
        },
        {
          id: `about_intro_${ts}`,
          type: "intro",
          label: "Institutional Purpose",
          props: {
            title: "Guiding Mission & Focus",
            leadText: "Youth Spark India Foundation was established with an enduring dedication: to unlock the latent potential of youth, women, and marginalized rural communities through accessible education, technological skills, sustainable livelihood training, and dignified community participation.",
            focusAreas: ["Youth Leadership", "Digital Inclusion", "Women's Skilling", "Ecological Stewardship"],
          },
        },
        {
          id: `about_values_${ts}`,
          type: "two_column",
          label: "Core Values",
          props: {
            ratio: "50-50",
            col1Heading: "Grounded Integrity",
            col1Text: "We report strictly what has been executed. No inflated metrics, unearned awards, or premature partnership claims. Every initiative is documented openly.",
            col2Heading: "Youth Agency",
            col2Text: "Young people are positioned as active leaders and co-designers in every community intervention, shaping outcomes for their own neighborhoods.",
          },
        },
        {
          id: `about_content_${ts}`,
          type: "rich_text",
          label: "Foundational Vision",
          props: {
            content: page.content || "### Our Foundational Vision\n\nYouth Spark India Foundation was established to bridge systemic gaps in youth development across India. Starting at state level, we work directly with rural and semi-urban communities to build self-sustaining educational and vocational models.",
          },
        },
        {
          id: `about_quote_${ts}`,
          type: "quote_presentation",
          label: "Leadership Statement",
          props: {
            quote: "Geography and socioeconomic status must never constrain a young citizen's ability to innovate, contribute, and build a dignified future.",
            authorName: "Board of Trustees",
            authorTitle: "Youth Spark India Foundation",
            avatarUrl: "/brand/executive-reference.png",
          },
        },
        {
          id: `about_cta_${ts}`,
          type: "cta_banner",
          label: "Join Our Mission",
          props: {
            headline: "Collaborate with Youth Spark India Foundation",
            subheadline: "Whether as a volunteer, institutional partner, or community coordinator, help us ignite youth potential.",
            buttonText: "Join Our Team",
            buttonUrl: "/join-us",
            backgroundTone: "brand",
          },
        },
      ];
    } else if (slug === "impact") {
      blocks = [
        {
          id: `impact_hero_${ts}`,
          type: "hero",
          label: "Impact Hero",
          props: {
            badge: "Evidence & Accountability",
            headline: page.title || "Our Impact & Measurable Outcomes",
            subheadline: page.subtitle || "Transparent, verifiable metrics and community outcomes across all operational districts.",
            coverImage: page.heroImage || "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1600&q=80",
            ctaPrimaryText: "View Disclosures",
            ctaPrimaryUrl: "/transparency",
            ctaSecondaryText: "Partner With Us",
            ctaSecondaryUrl: "/contact",
            align: "left",
          },
        },
        {
          id: `impact_intro_${ts}`,
          type: "intro",
          label: "Measurement Rationale",
          props: {
            title: "Evidence-Based Community Progress",
            leadText: "At Youth Spark India Foundation, impact is neither a marketing slogan nor an unsubstantiated statistic. We maintain rigorous documentation, beneficiary verification logs, and continuous post-programme feedback loops.",
            focusAreas: ["Verified Attendance", "Longitudinal Tracking", "Third-Party Scrutiny", "Open Reporting"],
          },
        },
        {
          id: `impact_stats_${ts}`,
          type: "stats_metrics",
          label: "Ground Statistics",
          props: {
            items: [
              { id: "s1", value: "1,200+", label: "Youth Directly Trained", note: "Verified attendance records" },
              { id: "s2", value: "14", label: "Learning Circles", note: "Active ground cohorts" },
              { id: "s3", value: "65%", label: "Women Participation", note: "Prioritizing gender inclusion" },
              { id: "s4", value: "100%", label: "Verified Data Reporting", note: "Zero synthetic inflation" },
            ],
          },
        },
        {
          id: `impact_content_${ts}`,
          type: "rich_text",
          label: "Measurement Framework",
          props: {
            content: page.content || "### Transparent Measurement Framework\n\nWe conduct cohort-based baseline assessments before each intervention and follow up at 90-day intervals. All findings are summarized in our public transparency documents.",
          },
        },
        {
          id: `impact_cards_${ts}`,
          type: "card_grid",
          label: "Assessment Pillars",
          props: {
            columns: 3,
            cards: [
              {
                id: "ic1",
                title: "Rigor & Integrity",
                text: "Attendance rosters, geo-tagged photo audits, and direct participant interviews verify every session.",
                linkText: "Read Transparency",
                linkUrl: "/transparency",
              },
              {
                id: "ic2",
                title: "Longitudinal Outcomes",
                text: "We measure whether vocational training leads to verifiable income increments and sustained employment.",
                linkText: "View Programmes",
                linkUrl: "/programmes",
              },
              {
                id: "ic3",
                title: "Open Governance",
                text: "Annual filings, programme reports, and operational audits are open for public download.",
                linkText: "Download Reports",
                linkUrl: "/transparency",
              },
            ],
          },
        },
        {
          id: `impact_cta_${ts}`,
          type: "cta_banner",
          label: "Support Ground Operations",
          props: {
            headline: "Support Verified Community Interventions",
            subheadline: "Your collaboration enables us to expand high-integrity youth and community initiatives.",
            buttonText: "Get in Touch",
            buttonUrl: "/contact",
            backgroundTone: "brand",
          },
        },
      ];
    } else if (slug === "privacy-policy") {
      blocks = [
        {
          id: `privacy_heading_${ts}`,
          type: "section_heading",
          label: "Policy Heading",
          props: {
            badge: "Legal & Data Protection",
            title: page.title || "Privacy Policy",
            subtitle: page.subtitle || "Compliance with Digital Personal Data Protection Act (DPDP Act) 2023 • Last Updated: October 2026",
            align: "left",
          },
        },
        {
          id: `privacy_content_${ts}`,
          type: "rich_text",
          label: "Legal Privacy Policy Document",
          props: {
            content: page.content || "### 1. Commitment to Privacy\n\nYouth Spark India Foundation respects the privacy of our website visitors, volunteers, partners, and community members. We adhere strictly to the Digital Personal Data Protection Act, 2023 (DPDP Act) regarding data minimisation, purpose limitation, and consent.",
          },
        },
        {
          id: `privacy_faq_${ts}`,
          type: "faq_accordion",
          label: "Privacy Questions",
          props: {
            items: [
              { id: "pf1", question: "How does YSIF protect personal information?", answer: "We implement SSL encryption, restricted server access, and strict internal authorization policies. Data is retained only as long as necessary for the stated purpose." },
              { id: "pf2", question: "Can I request deletion of my contact information?", answer: "Yes. You may email privacy@youthsparkindia.org at any time to request complete erasure of your contact submission." },
              { id: "pf3", question: "Does YSIF use commercial advertising trackers?", answer: "No. We do not use third-party behavioral advertising or cross-site tracking scripts." },
            ],
          },
        },
      ];
    } else if (slug === "terms-of-use") {
      blocks = [
        {
          id: `terms_heading_${ts}`,
          type: "section_heading",
          label: "Terms Heading",
          props: {
            badge: "Institutional Guidelines",
            title: page.title || "Terms of Use",
            subtitle: page.subtitle || "Stipulations Governing Usage of YSIF Digital Platforms • Status: Official Draft",
            align: "left",
          },
        },
        {
          id: `terms_content_${ts}`,
          type: "rich_text",
          label: "Terms of Use Legal Document",
          props: {
            content: page.content || "### 1. Acceptance of Terms\n\nBy accessing or using the Youth Spark India Foundation website, you agree to comply with and be bound by these Terms of Use. If you do not agree, please refrain from using our digital properties.",
          },
        },
        {
          id: `terms_faq_${ts}`,
          type: "faq_accordion",
          label: "Common Legal Inquiries",
          props: {
            items: [
              { id: "tf1", question: "Can educational institutions use YSIF materials?", answer: "Yes, non-commercial educational use is permitted with clear attribution to Youth Spark India Foundation." },
              { id: "tf2", question: "How are volunteer submissions governed?", answer: "Volunteer registrations constitute an expression of interest and do not establish an employer-employee relationship." },
            ],
          },
        },
      ];
    } else if (slug === "accessibility") {
      blocks = [
        {
          id: `a11y_heading_${ts}`,
          type: "section_heading",
          label: "Accessibility Heading",
          props: {
            badge: "Inclusive Digital Standard",
            title: page.title || "Accessibility Statement",
            subtitle: page.subtitle || "Our Commitment to Universal Web Access • WCAG 2.1 Level AA Standard",
            align: "left",
          },
        },
        {
          id: `a11y_content_${ts}`,
          type: "rich_text",
          label: "Accessibility Standards Document",
          props: {
            content: page.content || "### Our Universal Access Commitment\n\nYouth Spark India Foundation believes digital empowerment must be universally accessible to everyone, regardless of physical ability, assistive technology, or device type. Our portal is engineered in strict compliance with the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA.",
          },
        },
        {
          id: `a11y_cards_${ts}`,
          type: "card_grid",
          label: "Compliance Pillars",
          props: {
            columns: 3,
            cards: [
              {
                id: "ac1",
                title: "Keyboard Operability",
                text: "Tab indices, skip-to-content links, and keyboard shortcuts allow seamless site navigation.",
                linkText: "Read Policy",
                linkUrl: "/accessibility",
              },
              {
                id: "ac2",
                title: "Screen Reader Ready",
                text: "ARIA labels, live regions, and descriptive alt texts communicate state changes cleanly.",
                linkText: "Read Policy",
                linkUrl: "/accessibility",
              },
              {
                id: "ac3",
                title: "Continuous Audit",
                text: "We test across assistive technologies to proactively eliminate navigation barriers.",
                linkText: "Report an Issue",
                linkUrl: "/contact",
              },
            ],
          },
        },
        {
          id: `a11y_cta_${ts}`,
          type: "cta_banner",
          label: "Feedback & Assistance",
          props: {
            headline: "Encountering an Accessibility Barrier?",
            subheadline: "If you experience any accessibility difficulty on our website, please let us know so we can assist promptly.",
            buttonText: "Report Accessibility Issue",
            buttonUrl: "/contact",
            backgroundTone: "brand",
          },
        },
      ];
    }

    if (blocks.length > 0) {
      await prisma.pageContent.update({
        where: { slug },
        data: {
          draftContent: blocks,
          publishedContent: blocks,
          publishedAt: page.publishedAt || new Date(),
          publishedBy: page.publishedBy || "System Administrator",
          draftUpdatedAt: new Date(),
          draftUpdatedBy: "System Administrator",
        },
      });
      console.log(`✓ Initialized ${slug} with ${blocks.length} authentic blocks.`);
    }
  }

  console.log("Visual pages initialization completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
