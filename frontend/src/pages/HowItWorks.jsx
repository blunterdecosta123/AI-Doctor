import React from "react";

export default function HowItWorks() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold">How it works</h2>
      <p className="mt-4 text-muted-foreground">Short pipeline summary in plain language.</p>

      <div className="mt-6 grid gap-4">
        <div className="p-4 border rounded"><strong>1. Upload</strong> – You upload an MRI scan (PNG/JPG).</div>
        <div className="p-4 border rounded"><strong>2. Preprocessing</strong> – The backend resizes, normalizes and forms a tensor for the model.</div>
        <div className="p-4 border rounded"><strong>3. Inference</strong> – TunedCNN outputs a label + confidence.</div>
        <div className="p-4 border rounded"><strong>4. Chat</strong> – An assistant generates plain-language precautions & explanations (requires GEMINI API).</div>
      </div>

      <div className="mt-8 text-xs text-muted-foreground">
        <strong>Limitations:</strong> Model trained on limited data; results are not medical advice.
      </div>
    </div>
  );
}
