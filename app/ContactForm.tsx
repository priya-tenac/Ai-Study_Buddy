"use client"
import { useState } from "react";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [recipient, setRecipient] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Thank you for contacting us! We'll get back to you soon.");
        setRecipient(data.recipient || null);
        setForm({ name: "", email: "", message: "" });
      } else {
        console.error('API Error:', data);
        setError(data.details || data.error || "Failed to send message. Please try again later.");
      }
    } catch (err) {
      console.error('Fetch Error:', err);
      setError("Failed to send message. Please try again later.");
    }
    setLoading(false);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-[#b2b8d6] mb-1">Name</label>
        <input
          type="text"
          id="name"
          name="name"
          required
          value={form.name}
          onChange={handleChange}
          className="w-full rounded-lg border border-[#232b45] bg-[#11182a] px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-[#b2b8d6] mb-1">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          required
          value={form.email}
          onChange={handleChange}
          className="w-full rounded-lg border border-[#232b45] bg-[#11182a] px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-[#b2b8d6] mb-1">Message</label>
        <textarea
          id="message"
          name="message"
          rows={4}
          required
          value={form.message}
          onChange={handleChange}
          className="w-full rounded-lg border border-[#232b45] bg-[#11182a] px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-full bg-indigo-500 px-6 py-2.5 text-white font-semibold shadow-md hover:bg-indigo-400 transition disabled:opacity-60"
        disabled={loading}
      >
        {loading ? "Sending..." : "Send Message"}
      </button>
      {success && (
        <div className="text-center">
          <p className="text-green-400 text-sm font-semibold mb-1">{success}</p>
          {recipient && (
            <div className="inline-flex items-center gap-2 bg-green-900/40 border border-green-700 rounded-full px-4 py-1 mt-1 text-xs text-green-200">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M2 6.75A2.75 2.75 0 0 1 4.75 4h14.5A2.75 2.75 0 0 1 22 6.75v10.5A2.75 2.75 0 0 1 19.25 20H4.75A2.75 2.75 0 0 1 2 17.25V6.75Zm2.75-1.25A1.25 1.25 0 0 0 3.5 6.75v.38l8.5 5.67 8.5-5.67v-.38A1.25 1.25 0 0 0 19.25 5H4.75Zm15.75 3.12-7.7 5.14a1 1 0 0 1-1.1 0L3.5 8.12v9.13A1.25 1.25 0 0 0 4.75 18.5h14.5a1.25 1.25 0 0 0 1.25-1.25V8.12Z"/></svg>
              <span>Your message was delivered to <span className="font-bold">{recipient}</span></span>
            </div>
          )}
        </div>
      )}
      {error && <p className="text-red-400 text-center text-sm">{error}</p>}
    </form>
  );
}