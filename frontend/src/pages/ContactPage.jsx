import React, { useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Support form submission stub — wire to your backend or email service.");
    setName(""); setEmail(""); setMsg("");
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold">Contact / Support</h2>
      <form className="mt-6 max-w-lg" onSubmit={handleSubmit}>
        <label className="block mb-2">Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded p-2 mb-3" />
        <label className="block mb-2">Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded p-2 mb-3" />
        <label className="block mb-2">Message</label>
        <textarea value={msg} onChange={(e) => setMsg(e.target.value)} className="w-full border rounded p-2 mb-3" rows={6} />
        <button className="px-4 py-2 rounded bg-primary text-primary-foreground">Send</button>
      </form>
    </div>
  );
}
