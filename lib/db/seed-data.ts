export interface SeedProgramme {
  slug: string;
  title: string;
  tagline: string;
  category:
    | "YOUTH_EMPOWERMENT"
    | "EDUCATION_DIGITAL_LITERACY"
    | "SKILL_DEVELOPMENT"
    | "WOMEN_EMPOWERMENT"
    | "RURAL_DEVELOPMENT"
    | "ENVIRONMENT_SUSTAINABILITY"
    | "COMMUNITY_DEVELOPMENT"
    | "ANIMAL_WELFARE";
  summary: string;
  description: string;
  objectives: string[];
  targetGroup: string;
  location: string;
  coverImage: string;
  status: "PUBLISHED" | "DRAFT" | "ARCHIVED";
  isFeatured: boolean;
  displayOrder: number;
}

export interface SeedStory {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  authorName: string;
  status: "PUBLISHED" | "DRAFT";
  publishedAt: string;
}

export interface SeedEvent {
  slug: string;
  title: string;
  summary: string;
  description: string;
  location: string;
  startDate: string;
  endDate?: string;
  isVirtual: boolean;
  coverImage: string;
  rsvpLink?: string | null;
  status: "PUBLISHED" | "DRAFT";
}

export interface SeedImpactMetric {
  label: string;
  value: string;
  description: string;
  isVerified: boolean;
  period: string;
  displayOrder: number;
}

export interface SeedPublicDocument {
  title: string;
  category: "Policy" | "Governance" | "Annual Report" | "Compliance";
  fileUrl: string;
  fileSize: string;
  fileType: string;
  version: string;
  status: "PUBLISHED" | "DRAFT";
}

export const INITIAL_PROGRAMMES: SeedProgramme[] = [
  {
    slug: "yuva-netritva-youth-leadership",
    title: "Yuva Netritva: Grassroots Leadership Forum",
    tagline: "Empowering young voices to spearhead civic initiatives in local communities.",
    category: "YOUTH_EMPOWERMENT",
    summary:
      "A structured mentorship pathway designed to equip youth aged 16–25 with community organizing skills, ethical leadership principles, and civic problem-solving methodologies.",
    description:
      "The Yuva Netritva Initiative brings together young individuals from peri-urban and rural clusters. Through peer-led discussion circles, experiential leadership camps, and local community immersion, participants identify pressing neighborhood challenges and develop collaborative action plans.",
    objectives: [
      "Cultivate self-reliance, civic awareness, and leadership confidence among young participants.",
      "Facilitate peer-to-peer dialogue on community responsibility and positive social change.",
      "Support youth-led micro-initiatives addressing neighborhood hygiene, education, and digital access.",
      "Build a statewide alumni network of empathetic change agents.",
    ],
    targetGroup: "Youth aged 16–25 years across district partner colleges and community youth clubs.",
    location: "State Pilot Hubs & Rural Learning Clusters",
    coverImage: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80",
    status: "PUBLISHED",
    isFeatured: true,
    displayOrder: 1,
  },
  {
    slug: "digital-shiksha-digital-literacy",
    title: "Digital Shiksha: Accessible Computing for Learners",
    tagline: "Bridging the digital divide for first-generation learners and rural students.",
    category: "EDUCATION_DIGITAL_LITERACY",
    summary:
      "Hands-on foundational digital learning labs introducing school-going children and young adults to computers, safe internet exploration, and digital public goods.",
    description:
      "Digital Shiksha operates community-centered learning spaces where students without household internet or computers can gain foundational keyboarding, office software, and online research skills. The curriculum emphasizes cyber safety and educational utility.",
    objectives: [
      "Deliver foundational computer literacy to underserved schoolchildren.",
      "Introduce students to digital state portals, educational resources, and encyclopedias.",
      "Foster awareness of cyber hygiene, digital privacy, and online fraud prevention.",
      "Prepare young learners for tech-enabled vocational pursuits.",
    ],
    targetGroup: "Primary and secondary school students and out-of-school youth in partner villages.",
    location: "Community Centers & Rural Panchayat Learning Labs",
    coverImage: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80",
    status: "PUBLISHED",
    isFeatured: true,
    displayOrder: 2,
  },
  {
    slug: "kaushal-vikas-skill-development",
    title: "Kaushal Vikas: Practical Skill Workshops",
    tagline: "Career readiness, communication, and vocational orientations for youth.",
    category: "SKILL_DEVELOPMENT",
    summary:
      "Targeted vocational orientation and soft-skills bootcamps aimed at enhancing employability and entrepreneurial readiness among young job seekers.",
    description:
      "In collaboration with local industry mentors and experienced vocational trainers, Kaushal Vikas conducts intensive modular workshops on professional etiquette, resume crafting, basic accounting tools, and vocational trades.",
    objectives: [
      "Enhance professional communication, presentation, and interview skills.",
      "Provide practical orientation to local vocational opportunities and micro-enterprises.",
      "Connect aspiring candidates with structured career guidance counselors.",
    ],
    targetGroup: "Vocational diploma students, college graduates, and young job seekers.",
    location: "District Skill Training Hubs",
    coverImage: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80",
    status: "PUBLISHED",
    isFeatured: true,
    displayOrder: 3,
  },
  {
    slug: "shakti-pragati-womens-empowerment",
    title: "Shakti Pragati: Women's Financial & Social Inclusion",
    tagline: "Strengthening financial literacy and self-reliance among women.",
    category: "WOMEN_EMPOWERMENT",
    summary:
      "Community workshops focusing on household budgeting, digital banking access, government welfare scheme navigation, and micro-entrepreneurship.",
    description:
      "Shakti Pragati partners with self-help groups and grassroots women's collectives to demystify formal banking, digital payment security, savings instruments, and state welfare programs.",
    objectives: [
      "Promote basic banking knowledge and digital payments security among women.",
      "Provide step-by-step guidance on accessing public welfare schemes and artisan credit.",
      "Foster mutual support circles for local women aspiring to start home-based micro-enterprises.",
    ],
    targetGroup: "Women from rural and urban-fringe communities, SHG members, and homemakers.",
    location: "Panchayat Bhawans & Community Self-Help Circles",
    coverImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80",
    status: "PUBLISHED",
    isFeatured: true,
    displayOrder: 4,
  },
  {
    slug: "gram-utthan-rural-upliftment",
    title: "Gram Utthan: Village Community Upliftment",
    tagline: "Fostering village community libraries, civic awareness, and clean spaces.",
    category: "RURAL_DEVELOPMENT",
    summary:
      "A community-driven development programme that collaborates with local village councils to establish participatory reading spaces and youth study rooms.",
    description:
      "Gram Utthan believes rural communities flourish when local youth and elders co-create solutions. Initiatives include establishing small reading libraries in panchayats and organizing youth-led village clean-up drives.",
    objectives: [
      "Establish accessible community study spaces with donated reference books and journals.",
      "Encourage inter-generational civic dialogues between village elders and youth.",
      "Promote volunteer-led cleanliness and sanitation awareness campaigns.",
    ],
    targetGroup: "Rural village populations, students preparing for exams, and local panchayats.",
    location: "Selected Rural Blocks & Village Panchayats",
    coverImage: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80",
    status: "PUBLISHED",
    isFeatured: false,
    displayOrder: 5,
  },
  {
    slug: "prakriti-sanrakshan-sustainability",
    title: "Prakriti Sanrakshan: Ecological Awareness & Tree Stewardship",
    tagline: "Cultivating ecological responsibility and hands-on environmental action.",
    category: "ENVIRONMENT_SUSTAINABILITY",
    summary:
      "Youth-driven native tree sapling plantation drives, water conservation workshops, and neighborhood plastic segregation campaigns.",
    description:
      "Prakriti Sanrakshan engages schools and youth clubs in environmental stewardship. Rather than mere sapling planting, the programme instills an 18-month tree care commitment and promotes rainwater harvesting basics.",
    objectives: [
      "Drive native species plantation with assigned student stewards.",
      "Conduct neighborhood awareness sessions on solid waste segregation and composting.",
      "Educate communities on rainwater harvesting techniques and groundwater recharge.",
    ],
    targetGroup: "School eco-clubs, college volunteers, and neighborhood associations.",
    location: "Schools, College Campuses & Community Common Lands",
    coverImage: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
    status: "PUBLISHED",
    isFeatured: false,
    displayOrder: 6,
  },
  {
    slug: "karuna-animal-welfare",
    title: "Karuna: Community Animal Care & Compassion",
    tagline: "Promoting compassionate community co-existence with stray animals.",
    category: "ANIMAL_WELFARE",
    summary:
      "Grassroots awareness campaigns promoting compassionate treatment of street animals, summer water bowls, and coordination with local veterinary health facilities.",
    description:
      "Karuna fosters harmony between neighborhood residents and stray animals. The initiative coordinates summer hydration bowl distributions, rabies awareness workshops, and first-aid reporting for injured animals.",
    objectives: [
      "Install community water bowls during peak summer months across residential areas.",
      "Promote responsible feeding practices and educate residents against animal cruelty.",
      "Facilitate connections between community feeders and certified veterinary hospitals.",
    ],
    targetGroup: "Community animal lovers, neighborhood residents, and school students.",
    location: "Selected Municipal Wards & Semi-Urban Localities",
    coverImage: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=1200&q=80",
    status: "PUBLISHED",
    isFeatured: false,
    displayOrder: 7,
  },
];

export const INITIAL_STORIES: SeedStory[] = [
  {
    slug: "foundations-of-youth-leadership-in-grassroots-india",
    title: "Foundations of Youth Leadership in Grassroots India",
    excerpt:
      "How empathetic peer circles and structured community organizing help young people take positive ownership of their local neighborhoods.",
    content: `When we think about social transformation in India, we often look to policy announcements, large institutions, or formal administrative programs. Yet, some of the most enduring changes begin quietly—in an informal circle of young people sitting on a village chaupal or in a college common room, discussing a challenge in their own street.

At Youth Spark India Foundation, our core philosophy is rooted in one conviction: young people are not passive recipients of development; they are the foremost catalysts of community progress.

Through our Yuva Netritva initiative, we facilitate structured dialogues where participants unpack local issues—whether it is the lack of street lighting on a school path, irregular waste collection, or the absence of a study room for students preparing for examinations.

By learning how to frame an issue constructively, gather community consensus, and coordinate with local authorities, young individuals build leadership muscle that serves them and their communities for life.`,
    coverImage: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80",
    category: "Youth Empowerment",
    authorName: "Editorial Board, Youth Spark India Foundation",
    status: "PUBLISHED",
    publishedAt: "2026-09-15T10:00:00Z",
  },
  {
    slug: "bridging-the-digital-divide-one-keyboard-at-a-time",
    title: "Bridging the Digital Divide: One Keyboard at a Time",
    excerpt:
      "Reflections from our pilot digital literacy sessions and why safe, hands-on computer access is indispensable for youth empowerment.",
    content: `In an increasingly digital economy, access to computing is no longer a luxury—it is fundamental civic infrastructure. While smartphones have penetrated deep into semi-urban and rural homes, their usage remains overwhelmingly geared toward passive content consumption.

There is a vast difference between scrolling on a smartphone and knowing how to write a professional email, format a resume, research scholarships, or navigate public service portals.

Our Digital Shiksha program addresses this exact nuance. By pairing learners with experienced volunteer facilitators, we demystify the keyboard, introduce spreadsheets, and teach principles of internet safety and digital privacy.`,
    coverImage: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80",
    category: "Education & Literacy",
    authorName: "Education Working Group",
    status: "PUBLISHED",
    publishedAt: "2026-08-28T14:30:00Z",
  },
  {
    slug: "stewardship-over-spectacle-rethinking-tree-plantation",
    title: "Stewardship Over Spectacle: Rethinking Community Tree Drives",
    excerpt:
      "Why Youth Spark prioritizes sustained 18-month sapling care agreements over one-day photo-op tree planting exercises.",
    content: `Every monsoon across the country, millions of saplings are planted in enthusiastic single-day corporate and civic drives. Tragically, studies show that a large majority of unattended saplings do not survive their first summer.

Under our Prakriti Sanrakshan initiative, we have adopted a strict 'Stewardship First' protocol. We do not plant a tree unless an assigned youth steward or local community member signs an 18-month water and protection commitment.

Focusing on indigenous species like Neem, Peepal, Jamun, and Banyan, this approach transforms environmental action from a momentary photo opportunity into an enduring community habit.`,
    coverImage: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
    category: "Sustainability",
    authorName: "Prakriti Initiative Lead",
    status: "PUBLISHED",
    publishedAt: "2026-07-12T09:15:00Z",
  },
];

export const INITIAL_EVENTS: SeedEvent[] = [
  {
    slug: "statewide-youth-dialogue-2026",
    title: "Statewide Youth Leadership Round-Table 2026",
    summary:
      "An open interactive conference bringing together student leaders, rural youth fellows, and community organizers.",
    description:
      "Join us for an inspiring one-day round-table discussing youth civic participation, grassroots social innovation, and practical frameworks for community upliftment. Interactive breakout workshops and expert panels will be hosted throughout the day.",
    location: "State Youth Cultural Center & Live Stream",
    startDate: "2026-11-20T09:30:00Z",
    endDate: "2026-11-20T17:00:00Z",
    isVirtual: false,
    coverImage: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
    status: "PUBLISHED",
  },
  {
    slug: "digital-safety-webinar-series",
    title: "Community Cyber Hygiene & Digital Safety Workshop",
    summary:
      "A free virtual guidance workshop on protecting personal identity, preventing UPI fraud, and safe internet browsing.",
    description:
      "With rapid adoption of digital banking and public portals, knowing how to identify phishing scams and secure your digital credentials is vital. Open to all students, parents, and community members.",
    location: "Online (Interactive Video Webinar)",
    startDate: "2026-12-05T15:00:00Z",
    endDate: "2026-12-05T17:00:00Z",
    isVirtual: true,
    coverImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    status: "PUBLISHED",
  },
];

export const INITIAL_IMPACT_METRICS: SeedImpactMetric[] = [
  {
    label: "Organisational Status",
    value: "Since 2025",
    description: "Founded with the mission to ignite potential and empower youth futures.",
    isVerified: true,
    period: "Institutional Foundation",
    displayOrder: 1,
  },
  {
    label: "Core Focus Areas",
    value: "8 Domains",
    description: "Covering education, youth leadership, skills, women, rural upliftment & eco-care.",
    isVerified: true,
    period: "Charter Framework",
    displayOrder: 2,
  },
  {
    label: "Operating Scope",
    value: "Single-State Hub",
    description: "Deep, accountable regional engagement designed for gradual nationwide expansion.",
    isVerified: true,
    period: "Current Phase",
    displayOrder: 3,
  },
  {
    label: "Operational Integrity",
    value: "100% Verified",
    description: "Zero fabricated claims; all reported activities backed by documented ground records.",
    isVerified: true,
    period: "Governance Standard",
    displayOrder: 4,
  },
];

export const INITIAL_PUBLIC_DOCUMENTS: SeedPublicDocument[] = [
  {
    title: "YSIF Organisational Charter & Mission Statement",
    category: "Governance",
    fileUrl: "/documents/ysif-charter-draft.pdf",
    fileSize: "420 KB",
    fileType: "PDF",
    version: "v1.0 (Draft)",
    status: "PUBLISHED",
  },
  {
    title: "Child Protection & Vulnerable Youth Safety Policy",
    category: "Policy",
    fileUrl: "/documents/ysif-child-protection-policy.pdf",
    fileSize: "310 KB",
    fileType: "PDF",
    version: "v1.1 (Draft)",
    status: "PUBLISHED",
  },
  {
    title: "Volunteer Code of Conduct & Ethics Framework",
    category: "Policy",
    fileUrl: "/documents/ysif-volunteer-code-of-conduct.pdf",
    fileSize: "280 KB",
    fileType: "PDF",
    version: "v1.0 (Draft)",
    status: "PUBLISHED",
  },
  {
    title: "Transparency & Financial Reporting Disclosure Note",
    category: "Compliance",
    fileUrl: "/documents/ysif-transparency-disclosure.pdf",
    fileSize: "215 KB",
    fileType: "PDF",
    version: "v1.0 (Draft)",
    status: "PUBLISHED",
  },
];
