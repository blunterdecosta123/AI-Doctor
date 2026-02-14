import React from "react";

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold">Privacy & Security</h2>
      <p className="mt-4">Short summary of data handling and retention.</p>

      <ul className="mt-4 list-disc ml-6 text-sm text-muted-foreground">
        <li>Images submitted are used for inference.</li>
        <li>By default images are not stored persistently (unless you configure otherwise).</li>
        <li>Third-party services: Gemini for text generation (requires API key).</li>
        <li>Contact: support@example.com</li>
      </ul>
    </div>
  );
}
