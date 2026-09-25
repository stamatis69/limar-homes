/**
 * Company-level configuration. Values marked verified:false are pending confirmation
 * (see BUSINESS_DATA_CONFLICTS.md #11, #12). WhatsApp stays null until Limar supplies
 * the number to use; the WhatsApp action is hidden while null.
 */
export const site = {
  name: "Limar Homes",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.limarhomes.com").replace(/\/$/, ""),
  email: "info@limarhomes.com",
  phone: { display: "+30 211 008 2343", tel: "+302110082343", verified: false },
  whatsapp: null as null | { display: string; wa: string },
  office: { street: "Akadimias 17", postalCode: "10671", locality: "Athens", country: "GR", verified: false },
  social: {
    instagram: "https://www.instagram.com/limarhomes/",
    facebook: "https://www.facebook.com/p/Limar-Homes-61577643385551/",
    linkedin: "https://gr.linkedin.com/company/limar-homes",
    youtube: "https://www.youtube.com/@limar_homes",
  },
  /** Google rating — intentionally null until connected to the Business Profile API. */
  reviews: null as null | { rating: number; count: number; source: string },
  recognition: [
    {
      id: "lla-2026",
      label: "Luxury Lifestyle Awards 2026",
      subject: "Terrace Heights",
      href: "/news/terrace-heights-wins-luxury-lifestyle-awards-2026-for-best-luxury-apartment-living-in-greece",
      independentlyVerified: false,
    },
  ],
  revision: "v001",
} as const;
