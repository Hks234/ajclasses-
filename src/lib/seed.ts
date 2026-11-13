import { insert, one } from "./db";
import { now } from "./utils";
import bcrypt from "bcryptjs";

const permissions = [
  ["dashboard.view", "View the admin dashboard"],
  ["settings.manage", "Edit website settings and policies"],
  ["branding.manage", "Manage logos and favicon"],
  ["homepage.manage", "Edit homepage sections and statistics"],
  ["banners.manage", "Manage promotional banners"],
  ["courses.manage", "Manage courses, categories and batches"],
  ["content.manage", "Manage subjects, chapters, notes and announcements"],
  ["videos.manage", "Upload and manage lecture videos"],
  ["tests.manage", "Manage test series, tests and questions"],
  ["students.view", "View student accounts"],
  ["students.manage", "Suspend or restore student accounts"],
  ["faculty.manage", "Manage faculty profiles"],
  ["achievements.manage", "Manage achievements"],
  ["testimonials.manage", "Moderate testimonials"],
  ["enquiries.manage", "Manage enquiries"],
  ["payments.view", "View payments"],
  ["payments.manage", "Refund and export payments"],
  ["coupons.manage", "Manage coupons"],
  ["emails.manage", "Manage email templates and queue"],
  ["media.manage", "Use the media library"],
  ["roles.manage", "Change admin roles"],
  ["logs.view", "View activity logs"],
  ["branches.manage", "Manage branch locations"],
];

const roleMap: Record<string, string[]> = {
  super_admin: permissions.map((p) => p[0]),
  content_manager: [
    "dashboard.view",
    "homepage.manage",
    "banners.manage",
    "courses.manage",
    "content.manage",
    "media.manage",
    "achievements.manage",
    "testimonials.manage",
    "faculty.manage",
    "branding.manage",
  ],
  faculty_manager: ["dashboard.view", "faculty.manage", "videos.manage", "content.manage", "courses.manage"],
  accounts_manager: ["dashboard.view", "payments.view", "payments.manage", "coupons.manage", "students.view"],
  support_staff: ["dashboard.view", "enquiries.manage", "students.view", "content.manage"],
};

const roleNames: Record<string, string> = {
  super_admin: "Super Admin",
  content_manager: "Content Manager",
  faculty_manager: "Faculty Manager",
  accounts_manager: "Accounts Manager",
  support_staff: "Support Staff",
};

const categories = [
  ["ca-foundation", "CA Foundation", "The entry level of the Chartered Accountancy course."],
  ["ca-inter", "CA Intermediate", "The intermediate level of the Chartered Accountancy course."],
  ["ca-final", "CA Final", "The final level of the Chartered Accountancy course."],
  ["cma-foundation", "CMA Foundation", "The foundation level of the Cost and Management Accountancy course."],
  ["cma-inter", "CMA Intermediate", "The intermediate level of the Cost and Management Accountancy course."],
  ["cma-final", "CMA Final", "The final level of the Cost and Management Accountancy course."],
  ["cs-eet", "CS-EET", "The CS Executive Entrance Test."],
  ["cs-executive", "CS Executive", "The executive level of the Company Secretary course."],
  ["cs-professional", "CS Professional", "The professional level of the Company Secretary course."],
];

async function ensureInitialAdmin(stamp: string) {
  const adminEmail = process.env.ADMIN_INITIAL_EMAIL;
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
  if (!adminEmail || !adminPassword) return;
  const existing = await one("SELECT id FROM users WHERE email = ?", [adminEmail.toLowerCase()]);
  if (existing) return;
  const userId = "admin-initial";
  const passwordHash = bcrypt.hashSync(adminPassword, 12);
  await insert("users", {
    id: userId,
    email: adminEmail.toLowerCase(),
    mobile: null,
    password_hash: passwordHash,
    full_name: "AJ Classes Admin",
    role: "admin",
    status: "active",
    email_verified: 1,
    must_change_password: 1,
    google_sub: null,
    avatar_url: null,
    created_at: stamp,
    updated_at: stamp,
    deleted_at: null,
  });
  await insert("admin_users", { user_id: userId, role_id: "super_admin", last_login_at: null });
}

export async function seed() {
  const stamp = now();
  const already = await one("SELECT setting_key FROM website_settings WHERE setting_key = ?", ["institute_name"]);
  if (already) {
    await ensureInitialAdmin(stamp);
    return;
  }
  for (const [pid, description] of permissions) {
    const existing = await one("SELECT id FROM permissions WHERE id = ?", [pid]);
    if (!existing) await insert("permissions", { id: pid, description });
  }
  for (const roleId of Object.keys(roleMap)) {
    const existing = await one("SELECT id FROM roles WHERE id = ?", [roleId]);
    if (!existing) {
      await insert("roles", {
        id: roleId,
        name: roleNames[roleId],
        description: roleNames[roleId],
        is_system: 1,
      });
    }
    for (const permissionId of roleMap[roleId]) {
      const link = await one("SELECT role_id FROM role_permissions WHERE role_id = ? AND permission_id = ?", [roleId, permissionId]);
      if (!link) await insert("role_permissions", { role_id: roleId, permission_id: permissionId });
    }
  }

  const settings: Record<string, string> = {
    institute_name: "AJ Classes",
    brand_line: "Aditya Jhawar Education",
    tagline: "Learn Today. Lead Tomorrow.",
    email: "info@ajclasses.com",
    phone: "7984344294",
    instagram: "",
    facebook: "",
    youtube: "",
    linkedin: "",
    logo_url: "",
    logo_dark_url: "",
    logo_light_url: "",
    favicon_url: "",
    logo_height: "52",
    logo_bg: "transparent",
    completion_threshold: "90",
    lock_completed_lessons: "0",
    support_whatsapp: "917984344294",
    seo_title: "AJ Classes | CA, CS & CMA Coaching",
    seo_description: "AJ Classes by Aditya Jhawar Education. Coaching for CA, CS and CMA in Surat. Learn Today. Lead Tomorrow.",
    footer_about: "AJ Classes is the coaching institute of Aditya Jhawar for CA, CS and CMA students, with classrooms in Surat and an online learning portal.",
    stat_students: "",
    stat_courses: "",
    stat_faculty: "",
    stat_years: "",
    about_html: `<p>AJ Classes is the professional coaching institute of Aditya Jhawar for CA, CS and CMA preparation.</p><p>Students can explore courses, enquire for a batch, purchase published programmes, and learn through the student portal. Course fees, faculty details, results and announcements are published by the institute from the admin dashboard.</p><p>The institute teaches from three Surat branches: Parvat Patiya, Vesu (VIP Road) and Pal (Adajan).</p>`,
    privacy_html: `<p>AJ Classes collects the name, mobile number, email address and course interest that you submit through enquiry, registration and payment forms. This information is used to respond to enquiries, create student accounts, deliver purchased courses and keep payment records.</p><p>Passwords are stored only as hashes. Payment card details are handled by Razorpay and are not stored on this website.</p><p>Student videos and notes are shown only to accounts that have an active purchase. For a privacy request, email info@ajclasses.com.</p>`,
    terms_html: `<p>By creating an account or purchasing a course, you agree to use AJ Classes content for your own study. Access is personal and ends when the published validity period ends, or if the account is suspended for misuse.</p><p>Course fees, batch dates and included materials are the figures published on the course page at the time of payment. The institute can update unpublished or future batches from the admin dashboard.</p><p>These terms are a working policy and can be edited by AJ Classes.</p>`,
    refund_html: `<p>Refund requests are reviewed by AJ Classes against the policy published on this page and applicable law. Contact info@ajclasses.com with the registered email and transaction reference.</p><p>Approved refunds are recorded in the admin payment ledger. If a refund is completed, access to the refunded course or test series is withdrawn.</p><p>Replace this starter text with the institute’s confirmed refund rules before accepting live payments.</p>`,
  };
  for (const [key, value] of Object.entries(settings)) {
    const existing = await one("SELECT setting_key FROM website_settings WHERE setting_key = ?", [key]);
    if (!existing) await insert("website_settings", { setting_key: key, setting_value: value, updated_at: stamp });
  }

  const features = [
    ["Expert Guidance", "Classes led by the AJ Classes faculty team."],
    ["Structured Learning", "Subjects, chapters and lessons arranged batch by batch."],
    ["Concept-Based Teaching", "Lectures focused on understanding the concept before the question."],
    ["Quality Study Material", "Notes and practice files released inside the student portal."],
    ["Regular Test Series", "Objective tests with instant scoring for published test series."],
    ["Experienced Faculty", "Faculty profiles are published and edited by the institute."],
    ["Flexible Online Learning", "Purchased lectures can be resumed on mobile and desktop."],
    ["Dedicated Student Support", "Enquiries and support requests reach the institute team."],
  ];
  const hero = await one("SELECT id FROM homepage_sections WHERE section_key = ?", ["hero"]);
  if (!hero) {
    await insert("homepage_sections", {
      id: "section-hero",
      section_key: "hero",
      title: "Your Journey to CA, CS & CMA Starts Here.",
      subtitle: "Learn from India's Youngest CA, CS & CMA Aditya Jhawar and build the professional career you've always dreamed of.",
      body: "",
      image_url: "",
      cta_label: "Explore Our Courses",
      cta_href: "/courses",
      background: "#081B38",
      enabled: 1,
      sort_order: 1,
      extra_json: JSON.stringify({
        ctas: [
          { label: "Explore Our Courses", href: "/courses" },
          { label: "Enquire Now", href: "/enquiry" },
          { label: "Student Login", href: "/login" },
        ],
      }),
    });
    await insert("homepage_sections", {
      id: "section-why",
      section_key: "why",
      title: "Why Students Choose AJ Classes",
      subtitle: "A structured coaching experience for CA, CS and CMA.",
      body: "",
      image_url: "",
      cta_label: "",
      cta_href: "",
      background: "",
      enabled: 1,
      sort_order: 2,
      extra_json: JSON.stringify(features.map(([title, body]) => ({ title, body }))),
    });
  }

  const branches = [
    ["branch-parvat", "Parvat Patiya", "parvat", "AJ Classes, 2nd & 3rd Floor, Near Nandini Sweets, Kabutar Circle, Parvat Patiya, Surat, Gujarat.", "7984344294", "7984344294", 1],
    ["branch-vesu", "Vesu (VIP Road)", "vesu", "M-12-15, 2nd Floor, Roongta Shopping Centre, Near Vijay Sales, VIP Road, Vesu, Surat, Gujarat.", "7600069918", "7600069918", 2],
    ["branch-pal", "Pal (Adajan)", "pal", "306-307, 3rd Floor, Raj Corner, Opposite Vasu Pujya Residency, Near LP Savani Road, Pal, Adajan, Surat, Gujarat.", "7600069968", "7600069968", 3],
  ];
  for (const [bid, name, code, address, phone, whatsapp, sort] of branches) {
    const existing = await one("SELECT id FROM branches WHERE id = ?", [bid]);
    if (!existing) {
      await insert("branches", {
        id: String(bid),
        name: String(name),
        code: String(code),
        address: String(address),
        phone: String(phone),
        whatsapp: String(whatsapp),
        email: "info@ajclasses.com",
        map_query: String(address),
        sort_order: Number(sort),
        enabled: 1,
      });
    }
  }

  const faculty = await one("SELECT id FROM faculties WHERE id = ?", ["faculty-aditya"]);
  if (!faculty) {
    await insert("faculties", {
      id: "faculty-aditya",
      full_name: "Aditya Jhawar",
      qualification: "CA, CS & CMA",
      specialization: "CA, CS & CMA",
      experience: "",
      biography: "Aditya Jhawar leads AJ Classes for CA, CS and CMA coaching. Qualification details, photograph and biography can be updated from the admin dashboard.",
      subjects: "CA, CS, CMA",
      photo_url: "",
      instagram: "",
      linkedin: "",
      youtube: "",
      sort_order: 1,
      published: 1,
    });
  }

  for (let i = 0; i < categories.length; i++) {
    const [slug, name, description] = categories[i];
    const categoryId = `cat-${slug}`;
    const existingCat = await one("SELECT id FROM course_categories WHERE slug = ?", [slug]);
    if (!existingCat) {
      await insert("course_categories", {
        id: categoryId,
        name,
        slug,
        short_description: description,
        sort_order: i + 1,
        enabled: 1,
      });
    }
    const existingCourse = await one("SELECT id FROM courses WHERE slug = ?", [slug]);
    if (!existingCourse) {
      await insert("courses", {
        id: `course-${slug}`,
        category_id: categoryId,
        name,
        slug,
        thumbnail: "",
        banner: "",
        description,
        highlights: "Batch-wise video lectures\nStudy material inside the student portal\nTest series available separately\nFees published by the institute",
        faculty_id: "faculty-aditya",
        duration: "As scheduled for each batch",
        status: "published",
        seo_title: `${name} Coaching | AJ Classes`,
        seo_description: `${name} coaching at AJ Classes, Aditya Jhawar Education, Surat.`,
        sort_order: i + 1,
        created_at: stamp,
        updated_at: stamp,
        deleted_at: null,
      });
    }
  }

  const demo = await one("SELECT id FROM testimonials WHERE is_demo = 1 LIMIT 1");
  if (!demo) {
    for (let i = 1; i <= 6; i++) {
      await insert("testimonials", {
        id: `demo-review-${i}`,
        student_name: `Sample Student ${i}`,
        photo_url: "",
        course_name: categories[(i - 1) % categories.length][1],
        rating: null,
        review_text: "Demonstration card only. This is not a genuine student review. Replace it after a student submits a review and the institute approves it.",
        review_date: stamp.slice(0, 10),
        status: "approved",
        featured: 1,
        is_demo: 1,
        sort_order: i,
        created_at: stamp,
      });
    }
  }

  const bar = await one("SELECT id FROM announcements WHERE id = ?", ["announce-bar"]);
  if (!bar) {
    await insert("announcements", {
      id: "announce-bar",
      message: "Admissions open for CA, CS and CMA. Enquire for the current batch schedule.",
      href: "/enquiry",
      bg_color: "#102A56",
      text_color: "#FFFFFF",
      start_at: null,
      end_at: null,
      enabled: 1,
      audience: "public",
      kind: "bar",
      sort_order: 1,
      created_at: stamp,
    });
    await insert("announcements", {
      id: "announce-update",
      message: "Batch dates and fees are published by AJ Classes from the admin dashboard. Contact a Surat branch for the latest schedule.",
      href: "/branches",
      bg_color: "#FFF0E4",
      text_color: "#17243A",
      start_at: null,
      end_at: null,
      enabled: 1,
      audience: "public",
      kind: "update",
      sort_order: 1,
      created_at: stamp,
    });
  }

  const templates: [string, string, string][] = [
    [
      "purchase_confirmation",
      "Thank You for Choosing AJ Classes – Your Purchase is Confirmed!",
      `<p>Dear {{student_name}},</p><p>Thank you for choosing AJ Classes for your CA, CS and CMA preparation.</p><p>We are delighted to welcome you to the AJ Classes learning community.</p><p>Your purchase has been successfully confirmed. You can now log in to your student dashboard and begin your learning journey.</p><p><strong>Course:</strong> {{course_name}}<br/><strong>Batch:</strong> {{batch_name}}<br/><strong>Amount:</strong> {{amount}}<br/><strong>Status:</strong> {{status}}<br/><strong>Transaction:</strong> {{transaction_id}}<br/><strong>Date:</strong> {{purchase_date}}</p><p><a href="{{portal_link}}">Open the student portal</a></p><p>We wish you great success in your professional career.</p><p>Regards,<br/>Team AJ Classes<br/>Aditya Jhawar Education.</p>`,
    ],
    [
      "verify_email",
      "Verify your AJ Classes account",
      `<p>Dear {{student_name}},</p><p>Confirm your email address to activate your AJ Classes student account.</p><p><a href="{{verify_link}}">Verify email</a></p><p>If you did not register, you can ignore this email.</p><p>Team AJ Classes</p>`,
    ],
    [
      "password_reset",
      "Reset your AJ Classes password",
      `<p>Dear {{student_name}},</p><p>Use the link below to choose a new password. The link expires in one hour.</p><p><a href="{{reset_link}}">Reset password</a></p><p>Team AJ Classes</p>`,
    ],
    [
      "enquiry_notice",
      "New enquiry received – AJ Classes",
      `<p>A new enquiry was submitted.</p><p><strong>Name:</strong> {{student_name}}<br/><strong>Mobile:</strong> {{mobile}}<br/><strong>Email:</strong> {{email}}<br/><strong>Course:</strong> {{course_name}}<br/><strong>Message:</strong> {{message}}</p>`,
    ],
    [
      "announcement",
      "{{subject}}",
      `<p>Dear {{student_name}},</p><p>{{message}}</p><p>Team AJ Classes</p>`,
    ],
    [
      "test_reminder",
      "Test reminder from AJ Classes",
      `<p>Dear {{student_name}},</p><p>{{message}}</p><p><a href="{{portal_link}}">Open your tests</a></p><p>Team AJ Classes</p>`,
    ],
  ];
  for (const [key, subject, body] of templates) {
    const existing = await one("SELECT id FROM email_templates WHERE template_key = ?", [key]);
    if (!existing) {
      await insert("email_templates", { id: key, template_key: key, subject, body_html: body, updated_at: stamp });
    }
  }

  await ensureInitialAdmin(stamp);
}
