"use client";

import { BriefcaseBusiness, Camera, MessageCircle, Phone } from "lucide-react";

import { siteContact } from "../data/site";

const links = [
  { label: "LinkedIn", href: siteContact.linkedin, icon: BriefcaseBusiness },
  { label: "Instagram", href: siteContact.instagram, icon: Camera },
  { label: "WhatsApp", href: siteContact.whatsapp, icon: MessageCircle },
  { label: "Phone", href: siteContact.tel, icon: Phone },
];

export default function FloatingSocials() {
  return (
    <div className="floating-socials" aria-label="Social and contact links">
      {links.map(({ label, href, icon: Icon }) => (
        <a href={href} key={label} aria-label={label} title={label}>
          <Icon size={19} aria-hidden="true" />
        </a>
      ))}
    </div>
  );
}
