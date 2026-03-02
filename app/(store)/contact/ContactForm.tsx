"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Something went wrong.");
        setStatus("error");
        return;
      }
      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  return (
    <section className="px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-heading font-bold text-3xl md:text-4xl tracking-tight mb-3">
          Contact Us
        </h1>
        <p className="text-sm text-muted mb-10">
          Have a question or just want to say hello? We&apos;d love to hear from you.
        </p>

        <div className="grid md:grid-cols-[1fr_280px] gap-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs text-muted mb-1.5">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-sm text-primary placeholder:text-muted/50 focus:outline-none focus:border-primary transition-colors duration-200"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-sm text-primary placeholder:text-muted/50 focus:outline-none focus:border-primary transition-colors duration-200"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Message</label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-sm text-primary placeholder:text-muted/50 focus:outline-none focus:border-primary transition-colors duration-200 resize-none"
                placeholder="How can we help?"
              />
            </div>

            {status === "error" && (
              <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">
                {errorMsg}
              </p>
            )}

            {status === "success" ? (
              <p className="text-sm text-emerald-700 bg-emerald-50 px-4 py-3 rounded-xl font-medium">
                Message sent! We&apos;ll get back to you within 24 hours.
              </p>
            ) : (
              <button
                type="submit"
                disabled={status === "submitting"}
                className="bg-dark text-white font-heading font-semibold text-sm px-8 py-3.5 rounded-full hover:bg-dark/80 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === "submitting" ? "Sending..." : "Send Message"}
              </button>
            )}
          </form>

          <div className="space-y-6">
            <div>
              <h3 className="font-heading font-semibold text-xs uppercase tracking-widest text-primary mb-2">
                Email
              </h3>
              <p className="text-sm text-muted">support@mgtfashion.com</p>
            </div>
            <div>
              <h3 className="font-heading font-semibold text-xs uppercase tracking-widest text-primary mb-2">
                Response Time
              </h3>
              <p className="text-sm text-muted">We typically respond within 24 hours.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
