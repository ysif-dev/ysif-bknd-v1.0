"use server";

import { revalidatePath } from "next/cache";
import { prisma, isDatabaseConfigured } from "../db/prisma";
import { requireAdminSession } from "../auth/actions";
import { hasPermission } from "../auth/session";
import { hashPassword } from "../auth/password";
import { slugify } from "../utils";

// -------------------------------------------------------------
// PROGRAMMES MUTATIONS
// -------------------------------------------------------------
export async function saveProgrammeAction(formData: FormData) {
  const session = await requireAdminSession();

  const id = formData.get("id") as string | null;
  const title = (formData.get("title") as string)?.trim();
  const tagline = (formData.get("tagline") as string)?.trim();
  const category = formData.get("category") as any;
  const location = (formData.get("location") as string)?.trim();
  const summary = (formData.get("summary") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const status = (formData.get("status") as any) || "DRAFT";
  const coverImage =
    (formData.get("coverImage") as string)?.trim() ||
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80";
  const objectivesRaw = (formData.get("objectives") as string) || "";
  const objectives = objectivesRaw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!title || !category || !summary || !description) {
    return { success: false, error: "Please fill in all required fields." };
  }

  const slug = id ? (formData.get("slug") as string) || slugify(title) : slugify(title);

  if (!isDatabaseConfigured()) {
    return {
      success: true,
      notice: "Saved in preview mode (Neon database not yet connected).",
    };
  }

  try {
    let saved;
    if (id) {
      saved = await prisma.programme.update({
        where: { id },
        data: {
          title,
          tagline,
          category,
          location,
          summary,
          description,
          status,
          coverImage,
          objectives,
        },
      });
    } else {
      saved = await prisma.programme.create({
        data: {
          slug,
          title,
          tagline,
          category,
          location,
          summary,
          description,
          status,
          coverImage,
          targetGroup: "Community youth & local learners",
          objectives,
        },
      });
    }

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id !== "admin-initial" ? session.id : null,
        action: id ? "UPDATE" : "CREATE",
        entity: "Programme",
        entityId: saved.id,
        details: `Saved programme '${title}' with status ${status}`,
      },
    });

    revalidatePath("/programmes");
    revalidatePath(`/programmes/${slug}`);
    revalidatePath("/");
    revalidatePath("/admin/programmes");

    return { success: true, id: saved.id };
  } catch (error: any) {
    console.error("Save programme error:", error);
    return {
      success: false,
      error: error?.message || "Failed to persist programme to Neon database.",
    };
  }
}

export async function deleteProgrammeAction(id: string) {
  const session = await requireAdminSession();

  if (!isDatabaseConfigured()) {
    return { success: true };
  }

  try {
    const deleted = await prisma.programme.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id !== "admin-initial" ? session.id : null,
        action: "DELETE",
        entity: "Programme",
        entityId: id,
        details: `Deleted programme '${deleted.title}'`,
      },
    });

    revalidatePath("/programmes");
    revalidatePath("/");
    revalidatePath("/admin/programmes");
    return { success: true };
  } catch (error: any) {
    console.error("Delete programme error:", error);
    return { success: false, error: "Failed to delete programme." };
  }
}

// -------------------------------------------------------------
// STORIES MUTATIONS
// -------------------------------------------------------------
export async function saveStoryAction(formData: FormData) {
  const session = await requireAdminSession();

  const id = formData.get("id") as string | null;
  const title = (formData.get("title") as string)?.trim();
  const category = (formData.get("category") as string)?.trim() || "General";
  const authorName =
    (formData.get("authorName") as string)?.trim() || "Youth Spark Editorial Team";
  const excerpt = (formData.get("excerpt") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();
  const status = (formData.get("status") as any) || "DRAFT";
  const coverImage =
    (formData.get("coverImage") as string)?.trim() ||
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80";

  if (!title || !excerpt || !content) {
    return { success: false, error: "Title, excerpt, and content are required." };
  }

  const slug = id ? (formData.get("slug") as string) || slugify(title) : slugify(title);

  if (!isDatabaseConfigured()) {
    return { success: true, notice: "Saved in preview mode." };
  }

  try {
    let saved;
    if (id) {
      saved = await prisma.story.update({
        where: { id },
        data: {
          title,
          category,
          authorName,
          excerpt,
          content,
          status,
          coverImage,
          publishedAt: status === "PUBLISHED" ? new Date() : null,
        },
      });
    } else {
      saved = await prisma.story.create({
        data: {
          slug,
          title,
          category,
          authorName,
          excerpt,
          content,
          status,
          coverImage,
          publishedAt: status === "PUBLISHED" ? new Date() : null,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: session.id !== "admin-initial" ? session.id : null,
        action: id ? "UPDATE" : "CREATE",
        entity: "Story",
        entityId: saved.id,
        details: `Saved story '${title}' with status ${status}`,
      },
    });

    revalidatePath("/stories");
    revalidatePath(`/stories/${slug}`);
    revalidatePath("/");
    revalidatePath("/admin/stories");

    return { success: true, id: saved.id };
  } catch (error: any) {
    console.error("Save story error:", error);
    return { success: false, error: error?.message || "Failed to persist story." };
  }
}

export async function deleteStoryAction(id: string) {
  const session = await requireAdminSession();

  if (!isDatabaseConfigured()) return { success: true };

  try {
    const deleted = await prisma.story.delete({ where: { id } });
    await prisma.auditLog.create({
      data: {
        userId: session.id !== "admin-initial" ? session.id : null,
        action: "DELETE",
        entity: "Story",
        entityId: id,
        details: `Deleted story '${deleted.title}'`,
      },
    });

    revalidatePath("/stories");
    revalidatePath("/");
    revalidatePath("/admin/stories");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Failed to delete story." };
  }
}

// -------------------------------------------------------------
// SITE SETTINGS MUTATION
// -------------------------------------------------------------
export async function saveSiteSettingsAction(formData: FormData) {
  const session = await requireAdminSession();

  const noticeBanner = (formData.get("noticeBanner") as string)?.trim();
  const noticeActive = formData.get("noticeActive") === "true";
  const contactEmail = (formData.get("contactEmail") as string)?.trim();
  const contactPhone = (formData.get("contactPhone") as string)?.trim();
  const officeAddress = (formData.get("officeAddress") as string)?.trim();

  if (!isDatabaseConfigured()) {
    return { success: true, notice: "Saved in preview mode." };
  }

  try {
    await prisma.siteSetting.upsert({
      where: { id: "default" },
      update: {
        noticeBanner,
        noticeActive,
        contactEmail: contactEmail || "contact@youthsparkindia.org",
        contactPhone,
        officeAddress,
      },
      create: {
        id: "default",
        orgName: "YOUTH SPARK INDIA FOUNDATION",
        tagline: "Igniting Potential, Empowering Futures.",
        noticeBanner,
        noticeActive,
        contactEmail: contactEmail || "contact@youthsparkindia.org",
        contactPhone,
        officeAddress,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id !== "admin-initial" ? session.id : null,
        action: "UPDATE",
        entity: "SiteSetting",
        entityId: "default",
        details: "Updated site notice banner and contact details",
      },
    });

    revalidatePath("/");
    revalidatePath("/contact");
    revalidatePath("/admin/settings");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Failed to save settings to Neon." };
  }
}

// -------------------------------------------------------------
// ENQUIRIES MUTATION
// -------------------------------------------------------------
export async function markEnquiryReadAction(id: string) {
  await requireAdminSession();

  if (!isDatabaseConfigured()) return { success: true };

  try {
    await prisma.contactEnquiry.update({
      where: { id },
      data: { isRead: true },
    });
    revalidatePath("/admin/enquiries");
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

export async function deleteContactEnquiryAction(id: string) {
  const session = await requireAdminSession();
  const isSuperAdmin =
    session.role === "SUPER_ADMIN" || session.appRoleCode === "SUPER_ADMIN";
  const hasDeletePermission =
    session.permissions?.includes("enquiries.delete") ||
    session.permissions?.includes("*");

  if (!isSuperAdmin && !hasDeletePermission) {
    return {
      success: false,
      error: "Access denied: Super Admin authorization required to delete enquiries.",
    };
  }

  if (!isDatabaseConfigured()) return { success: true };

  try {
    const deleted = await prisma.contactEnquiry.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id !== "admin-initial" ? session.id : null,
        action: "DELETE",
        entity: "ContactEnquiry",
        entityId: id,
        details: `Deleted enquiry from '${deleted.fullName}' (${deleted.email})`,
      },
    });

    revalidatePath("/admin/enquiries");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || "Failed to delete enquiry." };
  }
}


// -------------------------------------------------------------
// HOMEPAGE SECTIONS MUTATIONS
// -------------------------------------------------------------
export async function saveHomepageSectionAction(formData: FormData) {
  const session = await requireAdminSession();
  if (!hasPermission(session, "homepage.edit")) {
    return { success: false, error: "Access denied: Missing homepage.edit permission." };
  }

  const id = formData.get("id") as string;
  const title = (formData.get("title") as string)?.trim();
  const subtitle = (formData.get("subtitle") as string)?.trim() || null;
  const isVisible = formData.get("isVisible") === "true";
  const displayOrder = parseInt((formData.get("displayOrder") as string) || "0", 10);
  const contentRaw = formData.get("content") as string;

  if (!id || !title) {
    return { success: false, error: "Section ID and Title are required." };
  }

  let content = null;
  if (contentRaw) {
    try {
      content = JSON.parse(contentRaw);
    } catch {
      return { success: false, error: "Invalid JSON format in section content." };
    }
  }

  if (!isDatabaseConfigured()) {
    return { success: true, notice: "Saved in preview mode." };
  }

  try {
    const saved = await prisma.homepageSection.upsert({
      where: { id },
      update: {
        title,
        subtitle,
        isVisible,
        displayOrder,
        ...(content ? { content } : {}),
      },
      create: {
        id,
        title,
        subtitle,
        isVisible,
        displayOrder,
        content: content || {},
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id !== "admin-initial" ? session.id : null,
        action: "UPDATE",
        entity: "HomepageSection",
        entityId: id,
        details: `Updated homepage section '${title}' (visible: ${isVisible})`,
      },
    });

    revalidatePath("/");
    revalidatePath("/admin/homepage");
    return { success: true, section: saved };
  } catch (error: any) {
    console.error("Save homepage section error:", error);
    return { success: false, error: error?.message || "Failed to save homepage section." };
  }
}

export async function reorderHomepageSectionsAction(orderedIds: string[]) {
  const session = await requireAdminSession();
  if (!hasPermission(session, "homepage.reorder")) {
    return { success: false, error: "Access denied: Missing homepage.reorder permission." };
  }

  if (!isDatabaseConfigured()) return { success: true };

  try {
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.homepageSection.update({
          where: { id },
          data: { displayOrder: index },
        })
      )
    );

    revalidatePath("/");
    revalidatePath("/admin/homepage");
    return { success: true };
  } catch (error: any) {
    console.error("Reorder homepage error:", error);
    return { success: false, error: "Failed to reorder homepage sections." };
  }
}

// -------------------------------------------------------------
// NAVIGATION MUTATIONS
// -------------------------------------------------------------
export async function saveNavigationItemAction(formData: FormData) {
  const session = await requireAdminSession();
  if (!hasPermission(session, "navigation.edit")) {
    return { success: false, error: "Access denied: Missing navigation.edit permission." };
  }

  const id = formData.get("id") as string | null;
  const label = (formData.get("label") as string)?.trim();
  const href = (formData.get("href") as string)?.trim();
  const order = parseInt((formData.get("order") as string) || "0", 10);
  const isVisible = formData.get("isVisible") === "true";
  const isExternal = formData.get("isExternal") === "true";
  const parentId = (formData.get("parentId") as string)?.trim() || null;

  if (!label || !href) {
    return { success: false, error: "Label and Destination URL are required." };
  }

  if (!isDatabaseConfigured()) return { success: true };

  try {
    let saved;
    if (id) {
      saved = await prisma.navigationItem.update({
        where: { id },
        data: { label, href, order, isVisible, isExternal, parentId },
      });
    } else {
      saved = await prisma.navigationItem.create({
        data: { label, href, order, isVisible, isExternal, parentId },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: session.id !== "admin-initial" ? session.id : null,
        action: id ? "UPDATE" : "CREATE",
        entity: "NavigationItem",
        entityId: saved.id,
        details: `Saved navigation item '${label}' (${href})`,
      },
    });

    revalidatePath("/", "layout");
    revalidatePath("/admin/navigation");
    return { success: true, item: saved };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to save navigation item." };
  }
}

export async function deleteNavigationItemAction(id: string) {
  const session = await requireAdminSession();
  if (!hasPermission(session, "navigation.delete")) {
    return { success: false, error: "Access denied: Missing navigation.delete permission." };
  }

  if (!isDatabaseConfigured()) return { success: true };

  try {
    await prisma.navigationItem.delete({ where: { id } });
    revalidatePath("/", "layout");
    revalidatePath("/admin/navigation");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Failed to delete navigation item." };
  }
}

// -------------------------------------------------------------
// FOOTER & SOCIAL PROFILES MUTATIONS
// -------------------------------------------------------------
export async function saveFooterSettingsAction(formData: FormData) {
  const session = await requireAdminSession();
  if (!hasPermission(session, "footer.edit")) {
    return { success: false, error: "Access denied: Missing footer.edit permission." };
  }

  const footerTagline = (formData.get("footerTagline") as string)?.trim();
  const footerDescription = (formData.get("footerDescription") as string)?.trim();
  const copyrightText = (formData.get("copyrightText") as string)?.trim();

  if (!isDatabaseConfigured()) return { success: true };

  try {
    await prisma.siteSetting.upsert({
      where: { id: "default" },
      update: { footerTagline, footerDescription, copyrightText },
      create: {
        id: "default",
        footerTagline,
        footerDescription,
        copyrightText,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id !== "admin-initial" ? session.id : null,
        action: "UPDATE",
        entity: "SiteSetting",
        entityId: "default",
        details: "Updated footer tagline, description, and copyright",
      },
    });

    revalidatePath("/", "layout");
    revalidatePath("/admin/footer");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Failed to update footer settings." };
  }
}

export async function saveSocialProfileAction(formData: FormData) {
  const session = await requireAdminSession();
  if (!hasPermission(session, "social.edit")) {
    return { success: false, error: "Access denied: Missing social.edit permission." };
  }

  const id = formData.get("id") as string | null;
  const platform = (formData.get("platform") as string)?.trim();
  const url = (formData.get("url") as string)?.trim();
  const displayOrder = parseInt((formData.get("displayOrder") as string) || "0", 10);
  const isVisible = formData.get("isVisible") === "true";

  if (!platform || !url) {
    return { success: false, error: "Platform and URL are required." };
  }

  if (!isDatabaseConfigured()) return { success: true };

  try {
    if (id) {
      await prisma.socialProfile.update({
        where: { id },
        data: { platform, url, displayOrder, isVisible },
      });
    } else {
      await prisma.socialProfile.create({
        data: { platform, url, displayOrder, isVisible },
      });
    }

    revalidatePath("/", "layout");
    revalidatePath("/admin/footer");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Failed to save social profile." };
  }
}

export async function deleteSocialProfileAction(id: string) {
  const session = await requireAdminSession();
  if (!hasPermission(session, "social.delete")) {
    return { success: false, error: "Access denied: Missing social.delete permission." };
  }

  if (!isDatabaseConfigured()) return { success: true };

  try {
    await prisma.socialProfile.delete({ where: { id } });
    revalidatePath("/", "layout");
    revalidatePath("/admin/footer");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Failed to delete social profile." };
  }
}

// -------------------------------------------------------------
// LEADERSHIP & GOVERNANCE MUTATIONS
// -------------------------------------------------------------
export async function saveLeadershipProfileAction(formData: FormData) {
  const session = await requireAdminSession();
  if (!hasPermission(session, "governance.edit")) {
    return { success: false, error: "Access denied: Missing governance.edit permission." };
  }

  const id = formData.get("id") as string | null;
  const fullName = (formData.get("fullName") as string)?.trim();
  const roleType = (formData.get("roleType") as string)?.trim() || "TEAM";
  const designation = (formData.get("designation") as string)?.trim();
  const portraitUrl = (formData.get("portraitUrl") as string)?.trim() || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80";
  const signatureUrl = (formData.get("signatureUrl") as string)?.trim() || null;
  const shortIntro = (formData.get("shortIntro") as string)?.trim() || null;
  const biography = (formData.get("biography") as string)?.trim() || "";
  const founderMessage = (formData.get("founderMessage") as string)?.trim() || null;
  const linkedinUrl = (formData.get("linkedinUrl") as string)?.trim() || null;
  const twitterUrl = (formData.get("twitterUrl") as string)?.trim() || null;
  const email = (formData.get("email") as string)?.trim() || null;
  const displayOrder = parseInt((formData.get("displayOrder") as string) || "0", 10);
  const isFeatured = formData.get("isFeatured") === "true";
  const status = (formData.get("status") as any) || "PUBLISHED";

  const respRaw = (formData.get("responsibilities") as string) || "";
  const responsibilities = respRaw.split("\n").map((r) => r.trim()).filter(Boolean);

  if (!fullName || !designation || !biography) {
    return { success: false, error: "Full Name, Designation, and Biography are required." };
  }

  const slug = id ? (formData.get("slug") as string) || slugify(fullName) : slugify(fullName);

  if (!isDatabaseConfigured()) return { success: true };

  try {
    let saved;
    if (id) {
      saved = await prisma.leadershipProfile.update({
        where: { id },
        data: {
          fullName,
          roleType,
          designation,
          portraitUrl,
          signatureUrl,
          shortIntro,
          biography,
          founderMessage,
          responsibilities,
          linkedinUrl,
          twitterUrl,
          email,
          displayOrder,
          isFeatured,
          status,
        },
      });
    } else {
      saved = await prisma.leadershipProfile.create({
        data: {
          slug,
          fullName,
          roleType,
          designation,
          portraitUrl,
          signatureUrl,
          shortIntro,
          biography,
          founderMessage,
          responsibilities,
          linkedinUrl,
          twitterUrl,
          email,
          displayOrder,
          isFeatured,
          status,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: session.id !== "admin-initial" ? session.id : null,
        action: id ? "UPDATE" : "CREATE",
        entity: "LeadershipProfile",
        entityId: saved.id,
        details: `Saved leadership profile '${fullName}' (${designation})`,
      },
    });

    revalidatePath("/about");
    revalidatePath("/admin/governance");
    return { success: true, profile: saved };
  } catch (error: any) {
    console.error("Save leadership error:", error);
    return { success: false, error: error?.message || "Failed to save leadership profile." };
  }
}

export async function deleteLeadershipProfileAction(id: string) {
  const session = await requireAdminSession();
  if (!hasPermission(session, "governance.delete")) {
    return { success: false, error: "Access denied: Missing governance.delete permission." };
  }

  if (!isDatabaseConfigured()) return { success: true };

  try {
    await prisma.leadershipProfile.delete({ where: { id } });
    revalidatePath("/about");
    revalidatePath("/admin/governance");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Failed to delete leadership profile." };
  }
}

// -------------------------------------------------------------
// PUBLIC DOCUMENTS & TRANSPARENCY MUTATIONS
// -------------------------------------------------------------
export async function savePublicDocumentAction(formData: FormData) {
  const session = await requireAdminSession();
  if (!hasPermission(session, "documents.upload")) {
    return { success: false, error: "Access denied: Missing documents.upload permission." };
  }

  const id = formData.get("id") as string | null;
  const title = (formData.get("title") as string)?.trim();
  const category = (formData.get("category") as string)?.trim() || "Policy";
  const fileUrl = (formData.get("fileUrl") as string)?.trim();
  const fileSize = (formData.get("fileSize") as string)?.trim() || "1.2 MB";
  const fileType = (formData.get("fileType") as string)?.trim() || "PDF";
  const version = (formData.get("version") as string)?.trim() || "1.0";
  const status = (formData.get("status") as any) || "PUBLISHED";

  if (!title || !fileUrl) {
    return { success: false, error: "Document title and File URL are required." };
  }

  if (!isDatabaseConfigured()) return { success: true };

  try {
    let saved;
    if (id) {
      saved = await prisma.publicDocument.update({
        where: { id },
        data: { title, category, fileUrl, fileSize, fileType, version, status },
      });
    } else {
      saved = await prisma.publicDocument.create({
        data: { title, category, fileUrl, fileSize, fileType, version, status },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: session.id !== "admin-initial" ? session.id : null,
        action: id ? "UPDATE" : "CREATE",
        entity: "PublicDocument",
        entityId: saved.id,
        details: `Saved transparency document '${title}' (${category})`,
      },
    });

    revalidatePath("/transparency");
    revalidatePath("/admin/documents");
    return { success: true, document: saved };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to save public document." };
  }
}

export async function deletePublicDocumentAction(id: string) {
  const session = await requireAdminSession();
  if (!hasPermission(session, "documents.delete")) {
    return { success: false, error: "Access denied: Missing documents.delete permission." };
  }

  if (!isDatabaseConfigured()) return { success: true };

  try {
    await prisma.publicDocument.delete({ where: { id } });
    revalidatePath("/transparency");
    revalidatePath("/admin/documents");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Failed to delete document." };
  }
}

// -------------------------------------------------------------
// GALLERY ALBUMS & ITEMS MUTATIONS
// -------------------------------------------------------------
export async function saveGalleryAlbumAction(formData: FormData) {
  const session = await requireAdminSession();
  if (!hasPermission(session, "gallery.create")) {
    return { success: false, error: "Access denied: Missing gallery.create permission." };
  }

  const id = formData.get("id") as string | null;
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const coverImage = (formData.get("coverImage") as string)?.trim() || "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80";
  const status = (formData.get("status") as any) || "PUBLISHED";

  if (!title) {
    return { success: false, error: "Album title is required." };
  }

  const slug = id ? (formData.get("slug") as string) || slugify(title) : slugify(title);

  if (!isDatabaseConfigured()) return { success: true };

  try {
    let saved;
    if (id) {
      saved = await prisma.galleryAlbum.update({
        where: { id },
        data: { title, description, coverImage, status },
      });
    } else {
      saved = await prisma.galleryAlbum.create({
        data: { slug, title, description, coverImage, status },
      });
    }

    revalidatePath("/gallery");
    revalidatePath("/admin/gallery");
    return { success: true, album: saved };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to save gallery album." };
  }
}

export async function deleteGalleryAlbumAction(id: string) {
  const session = await requireAdminSession();
  if (!hasPermission(session, "gallery.delete")) {
    return { success: false, error: "Access denied: Missing gallery.delete permission." };
  }

  if (!isDatabaseConfigured()) return { success: true };

  try {
    await prisma.galleryAlbum.delete({ where: { id } });
    revalidatePath("/gallery");
    revalidatePath("/admin/gallery");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Failed to delete album." };
  }
}

export async function saveGalleryItemAction(formData: FormData) {
  const session = await requireAdminSession();
  if (!hasPermission(session, "gallery.create")) {
    return { success: false, error: "Access denied." };
  }

  const id = formData.get("id") as string | null;
  const albumId = formData.get("albumId") as string;
  const title = (formData.get("title") as string)?.trim() || "Photo";
  const caption = (formData.get("caption") as string)?.trim() || null;
  const imageUrl = (formData.get("imageUrl") as string)?.trim();
  const altText = (formData.get("altText") as string)?.trim() || title;
  const order = parseInt((formData.get("order") as string) || "0", 10);

  if (!albumId || !imageUrl) {
    return { success: false, error: "Album and image URL are required." };
  }

  if (!isDatabaseConfigured()) return { success: true };

  try {
    if (id) {
      await prisma.galleryItem.update({
        where: { id },
        data: { title, caption, imageUrl, altText, order },
      });
    } else {
      await prisma.galleryItem.create({
        data: { albumId, title, caption, imageUrl, altText, order },
      });
    }

    revalidatePath("/gallery");
    revalidatePath("/admin/gallery");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Failed to save gallery photo." };
  }
}

export async function deleteGalleryItemAction(id: string) {
  const session = await requireAdminSession();
  if (!hasPermission(session, "gallery.delete")) {
    return { success: false, error: "Access denied." };
  }

  if (!isDatabaseConfigured()) return { success: true };

  try {
    await prisma.galleryItem.delete({ where: { id } });
    revalidatePath("/gallery");
    revalidatePath("/admin/gallery");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Failed to delete gallery item." };
  }
}

// -------------------------------------------------------------
// USER & RBAC MUTATIONS
// -------------------------------------------------------------
export async function saveAdminUserAction(formData: FormData) {
  const session = await requireAdminSession();
  if (!hasPermission(session, "users.create") && !hasPermission(session, "users.edit")) {
    return { success: false, error: "Access denied: Missing user management permissions." };
  }

  const id = formData.get("id") as string | null;
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string | null;
  const appRoleId = (formData.get("appRoleId") as string)?.trim() || null;
  const isActive = formData.get("isActive") === "true";

  if (!name || !email) {
    return { success: false, error: "Name and Email are required." };
  }

  if (!isDatabaseConfigured()) return { success: true };

  try {
    if (id) {
      const updateData: any = { name, email, appRoleId, isActive };
      if (password && password.trim().length >= 8) {
        updateData.passwordHash = await hashPassword(password);
      }
      await prisma.adminUser.update({
        where: { id },
        data: updateData,
      });
    } else {
      if (!password || password.trim().length < 8) {
        return { success: false, error: "A secure password of at least 8 characters is required for new users." };
      }
      const passwordHash = await hashPassword(password);
      await prisma.adminUser.create({
        data: {
          name,
          email,
          passwordHash,
          appRoleId,
          isActive,
          role: "EDITOR", // baseline compatibility
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: session.id !== "admin-initial" ? session.id : null,
        action: id ? "UPDATE" : "CREATE",
        entity: "AdminUser",
        entityId: id || email,
        details: `Configured manager account '${name}' (${email})`,
      },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to save user account." };
  }
}

export async function deleteAdminUserAction(id: string) {
  const session = await requireAdminSession();
  if (!hasPermission(session, "users.delete")) {
    return { success: false, error: "Access denied: Missing users.delete permission." };
  }

  if (session.id === id) {
    return { success: false, error: "You cannot delete your own active administrator account." };
  }

  if (!isDatabaseConfigured()) return { success: true };

  try {
    await prisma.adminUser.delete({ where: { id } });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Failed to delete user account." };
  }
}

export async function saveAppRoleAction(formData: FormData) {
  const session = await requireAdminSession();
  if (!hasPermission(session, "roles.edit")) {
    return { success: false, error: "Access denied: Missing roles.edit permission." };
  }

  const id = formData.get("id") as string | null;
  const name = (formData.get("name") as string)?.trim();
  const code = (formData.get("code") as string)?.trim().toUpperCase();
  const description = (formData.get("description") as string)?.trim() || null;
  const permissionIdsRaw = (formData.get("permissionIds") as string) || "[]";

  let permissionIds: string[] = [];
  try {
    permissionIds = JSON.parse(permissionIdsRaw);
  } catch {
    permissionIds = [];
  }

  if (!name || !code) {
    return { success: false, error: "Role name and unique code are required." };
  }

  if (!isDatabaseConfigured()) return { success: true };

  try {
    let role: any;
    if (id) {
      role = await prisma.appRole.update({
        where: { id },
        data: { name, description },
      });

      // Update role permissions
      await prisma.rolePermission.deleteMany({ where: { roleId: id } });
      if (permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissionIds.map((pId) => ({ roleId: id, permissionId: pId })),
        });
      }
    } else {
      role = await prisma.appRole.create({
        data: { name, code, description, isSystem: false },
      });
      if (permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissionIds.map((pId) => ({ roleId: role.id, permissionId: pId })),
        });
      }
    }

    revalidatePath("/admin/roles");
    return { success: true, role };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to save role." };
  }
}

