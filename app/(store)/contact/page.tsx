import type { Metadata } from "next";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with MGT Fashion — we'd love to hear from you.",
};

export default function ContactPage() {
  return <ContactForm />;
}
