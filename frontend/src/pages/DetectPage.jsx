import React, { useState, useRef, useEffect } from "react";
import { Loader2, User, Bot, Image as ImageIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

export default function DetectPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [diagnosis, setDiagnosis] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [chatHistory, setChatHistory] = useState([]);
  const [userMessage, setUserMessage] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  const fileInputRef = useRef(null);
  const chatScrollRef = useRef(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop =
        chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(selectedFile);

    setDiagnosis(null);
    setConfidence(null);
    setError(null);
    setChatHistory([]);
  };

  const handlePredict = async () => {
    if (!file) {
      setError("Please select an MRI image first.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Prediction request failed.");

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setDiagnosis(data.diagnosis);
      setConfidence(data.confidence);
      handleGetPrecautions(data.diagnosis);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetPrecautions = async (currentDiagnosis) => {
    setIsChatLoading(true);
    try {
      const response = await fetch(
        "http://localhost:8000/get_precautions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ diagnosis: currentDiagnosis }),
        }
      );

      if (!response.ok)
        throw new Error("Could not fetch precautions.");

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setChatHistory([
        { role: "model", parts: [data.response_text] },
      ]);
    } catch (err) {
      setChatHistory([
        {
          role: "model",
          parts: [
            `Sorry, I couldn't fetch precautions: ${err.message}`,
          ],
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!userMessage.trim() || isChatLoading) return;

    const newUserMessage = {
      role: "user",
      parts: [userMessage],
    };

    const updatedHistory = [...chatHistory, newUserMessage];
    setChatHistory(updatedHistory);
    setUserMessage("");
    setIsChatLoading(true);

    const apiHistory = updatedHistory
      .slice(-11, -1)
      .map((item) => ({
        role: item.role,
        parts: item.parts,
      }));

    try {
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: apiHistory,
          diagnosis,
        }),
      });

      if (!response.ok)
        throw new Error("The chat service is not responding.");

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setChatHistory((prev) => [
        ...prev,
        { role: "model", parts: [data.response_text] },
      ]);
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        {
          role: "model",
          parts: [`Sorry, I encountered an error: ${err.message}`],
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7F6] text-[#2E3A3A]">
      <div className="container mx-auto p-4 md:p-8">

        {/* HEADER */}
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold">
            Alzheimer’s Detection Assistant
          </h1>
          <p className="text-lg text-[#5F6F73] mt-2">
            Upload an MRI scan for a calm, AI-assisted preliminary analysis.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* LEFT */}
          <Card className="bg-white border border-[#E4E7EC]">
            <CardHeader>
              <CardTitle>MRI Scan Analysis</CardTitle>
              <CardDescription className="text-[#5F6F73]">
                JPG or PNG brain MRI scans.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div
                className="h-64 border-2 border-dashed border-[#C8D6D0]
                           rounded-lg flex items-center justify-center
                           cursor-pointer bg-[#F9FBFA]
                           hover:border-[#6BA292] transition"
                onClick={() => fileInputRef.current.click()}
              >
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-full max-w-full rounded-md"
                  />
                ) : (
                  <div className="text-center text-[#6F8483]">
                    <ImageIcon className="mx-auto h-12 w-12" />
                    <p className="mt-2">Click to upload MRI</p>
                    <p className="text-xs">
                      PNG / JPG up to 10MB
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg"
                className="hidden"
                onChange={handleFileChange}
              />
            </CardContent>

            <CardFooter>
              <Button
                onClick={handlePredict}
                disabled={isLoading || !file}
                className="bg-[#6BA292] text-white hover:bg-[#5C9182]"
              >
                {isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isLoading ? "Analyzing…" : "Run Analysis"}
              </Button>
            </CardFooter>

            {diagnosis && (
              <div className="p-6 border-t border-[#E4E7EC]">
                <Alert className="bg-[#F1F5F4] border-[#C8D6D0]">
                  <AlertTitle>Analysis Complete</AlertTitle>
                  <AlertDescription>
                    <p>
                      Diagnosis:{" "}
                      <span className="font-semibold text-[#4F7F72]">
                        {diagnosis}
                      </span>
                    </p>
                    <p className="mt-1">
                      Confidence:{" "}
                      <span className="font-semibold">
                        {confidence}%
                      </span>
                    </p>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </Card>

          {/* RIGHT */}
          <Card className="flex flex-col h-[70vh] bg-white border border-[#E4E7EC]">
            <CardHeader>
              <CardTitle>Chat Assistant</CardTitle>
              <CardDescription className="text-[#5F6F73]">
                Ask follow-up questions about the analysis.
              </CardDescription>
            </CardHeader>

            <CardContent
              ref={chatScrollRef}
              className="flex-grow overflow-y-auto bg-[#F9FBFA]"
            >
              <div className="space-y-4">
                {chatHistory.length === 0 && (
                  <p className="text-center text-[#7A8E8C] pt-8">
                    Upload an MRI to begin the chat.
                  </p>
                )}

                {chatHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${
                      msg.role === "user"
                        ? "justify-end"
                        : ""
                    }`}
                  >
                    {msg.role === "model" && (
                      <div className="w-8 h-8 rounded-full bg-[#94B8A6] flex items-center justify-center text-white">
                        <Bot size={16} />
                      </div>
                    )}

                    <div
                      className={`p-3 rounded-lg max-w-md text-sm ${
                        msg.role === "user"
                          ? "bg-[#E6F2EE]"
                          : "bg-[#F1F5F4]"
                      }`}
                    >
                      {msg.parts}
                    </div>

                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-[#CBDDD6] flex items-center justify-center">
                        <User size={16} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>

            <CardFooter>
              <form
                onSubmit={handleChatSubmit}
                className="flex w-full gap-2"
              >
                <Input
                  value={userMessage}
                  onChange={(e) =>
                    setUserMessage(e.target.value)
                  }
                  disabled={!diagnosis || isChatLoading}
                  placeholder={
                    diagnosis
                      ? "Ask a question…"
                      : "Waiting for analysis…"
                  }
                  className="bg-[#F9FBFA] border-[#CBDDD6]"
                />
                <Button
                  type="submit"
                  disabled={
                    !userMessage.trim() ||
                    !diagnosis ||
                    isChatLoading
                  }
                  className="bg-[#6BA292] text-white hover:bg-[#5C9182]"
                >
                  Send
                </Button>
              </form>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
