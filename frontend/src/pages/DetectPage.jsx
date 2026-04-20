import React, { useState, useRef, useEffect } from "react";
import {
  Loader2,
  User,
  Bot,
  Image as ImageIcon,
  Mic,
  MicOff,
  Square,
  Volume2,
  VolumeX,
} from "lucide-react";

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
  const precautionsCacheRef = useRef({});
  const recognitionRef = useRef(null);
  const lastSpokenTextRef = useRef("");
  const activeUtteranceRef = useRef(null);
  const activeAudioSourceRef = useRef(null);
  const audioContextRef = useRef(null);
  const availableVoicesRef = useRef([]);
  const audioUnlockedRef = useRef(false);
  const speechUnlockedRef = useRef(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [diagnosis, setDiagnosis] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedPrecautions, setHasLoadedPrecautions] = useState(false);

  const [chatHistory, setChatHistory] = useState([]);
  const [userMessage, setUserMessage] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceError, setVoiceError] = useState(null);
  const [pendingVoiceMessage, setPendingVoiceMessage] = useState(null);
  const [voiceCapabilities, setVoiceCapabilities] = useState({
    audio: false,
    synthesis: false,
    recognition: false,
  });

  const fileInputRef = useRef(null);
  const chatScrollRef = useRef(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop =
        chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const loadAvailableVoices = () => {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      return [];
    }

    const voices = window.speechSynthesis.getVoices();
    availableVoicesRef.current = Array.isArray(voices) ? voices : [];
    return availableVoicesRef.current;
  };

  const getPreferredVoice = () => {
    const voices =
      availableVoicesRef.current.length > 0
        ? availableVoicesRef.current
        : loadAvailableVoices();

    if (voices.length === 0) return null;

    return (
      voices.find((voice) =>
        ["en-IN", "en-US", "en-GB"].includes(voice.lang)
      ) ||
      voices.find((voice) => voice.lang?.startsWith("en")) ||
      voices[0]
    );
  };

  const unlockSpeechPlayback = () => {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      return false;
    }

    try {
      window.speechSynthesis.resume();
      loadAvailableVoices();
      speechUnlockedRef.current = true;
      return true;
    } catch {
      speechUnlockedRef.current = false;
      return false;
    }
  };

  const stopAudioPlayback = () => {
    if (activeAudioSourceRef.current) {
      activeAudioSourceRef.current.onended = null;
      try {
        activeAudioSourceRef.current.stop();
      } catch {
        // Ignore double-stop errors from already-finished sources.
      }
      activeAudioSourceRef.current.disconnect();
      activeAudioSourceRef.current = null;
    }
  };

  const unlockAudioPlayback = async () => {
    if (typeof window === "undefined") return false;

    const AudioContextCtor =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextCtor) return false;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextCtor();
      }

      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      audioUnlockedRef.current =
        audioContextRef.current.state === "running";
      return audioUnlockedRef.current;
    } catch {
      audioUnlockedRef.current = false;
      return false;
    }
  };

  const playBackendSpeech = async (text, { userInitiated = false } = {}) => {
    if (typeof window === "undefined") return false;

    if (userInitiated) {
      await unlockAudioPlayback();
    }

    if (!audioUnlockedRef.current) {
      return false;
    }

    const response = await fetch("http://localhost:8000/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error("Audio service is not responding.");
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("audio/")) {
      const data = await response.json().catch(() => null);
      throw new Error(
        data?.error || "Audio playback could not be prepared."
      );
    }

    if (!audioContextRef.current) {
      const AudioContextCtor =
        window.AudioContext || window.webkitAudioContext;
      if (!AudioContextCtor) {
        return false;
      }
      audioContextRef.current = new AudioContextCtor();
    }

    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }

    const audioBufferData = await response.arrayBuffer();
    const audioBuffer = await audioContextRef.current.decodeAudioData(
      audioBufferData.slice(0)
    );

    stopAudioPlayback();
    window.speechSynthesis?.cancel();

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    source.onended = () => {
      if (activeAudioSourceRef.current === source) {
        activeAudioSourceRef.current = null;
      }
      setIsSpeaking(false);
    };

    activeAudioSourceRef.current = source;
    setVoiceError(null);
    setIsSpeaking(true);
    source.start(0);
    return true;
  };

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const supportsSynthesis = "speechSynthesis" in window;
    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    setVoiceCapabilities({
      audio: Boolean(window.AudioContext || window.webkitAudioContext),
      synthesis: supportsSynthesis,
      recognition: Boolean(SpeechRecognitionCtor),
    });

    if (supportsSynthesis) {
      loadAvailableVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        loadAvailableVoices();
      };
    }

    let recognition = null;

    if (SpeechRecognitionCtor) {
      recognition = new SpeechRecognitionCtor();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError(null);
      };

      recognition.onresult = (event) => {
        let transcript = "";
        let finalTranscript = "";

        for (let index = 0; index < event.results.length; index += 1) {
          const phrase = event.results[index][0]?.transcript ?? "";
          transcript += phrase;
          if (event.results[index].isFinal) {
            finalTranscript += phrase;
          }
        }

        if (transcript.trim()) {
          setUserMessage(transcript.trim());
        }

        if (finalTranscript.trim()) {
          setPendingVoiceMessage(finalTranscript.trim());
        }
      };

      recognition.onerror = (event) => {
        const errorMap = {
          "not-allowed": "Microphone access was denied.",
          "service-not-allowed": "Speech recognition is not allowed in this browser.",
          "no-speech": "No speech was detected. Please try again.",
          "audio-capture": "No microphone was detected.",
        };
        setVoiceError(errorMap[event.error] || "Voice input could not be completed.");
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      recognition?.stop();
      recognitionRef.current = null;
      stopAudioPlayback();
      audioContextRef.current?.close?.();
      audioContextRef.current = null;
      if (supportsSynthesis) {
        activeUtteranceRef.current = null;
        window.speechSynthesis.cancel();
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const speakText = async (text, { userInitiated = false } = {}) => {
    if (typeof window === "undefined") return;

    const normalizedText = text?.replace(/\s+/g, " ").trim();
    if (!normalizedText) return;

    try {
      const playedByBackend = await playBackendSpeech(normalizedText, {
        userInitiated,
      });
      if (playedByBackend) {
        return;
      }
    } catch (error) {
      setVoiceError(error.message || "Audio playback could not be started.");
    }

    if (userInitiated) {
      unlockSpeechPlayback();
    }

    if (!speechUnlockedRef.current) {
      setVoiceError(
        "Click Enable Voice Mode once to allow speech playback in this browser."
      );
      return;
    }

    const synthesis = window.speechSynthesis;
    synthesis.cancel();
    synthesis.resume();
    const utterance = new SpeechSynthesisUtterance(normalizedText);
    const preferredVoice = getPreferredVoice();

    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.lang = preferredVoice?.lang || "en-US";
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      speechUnlockedRef.current = true;
      setVoiceError(null);
      setIsSpeaking(true);
    };
    utterance.onend = () => {
      if (activeUtteranceRef.current === utterance) {
        activeUtteranceRef.current = null;
      }
      setIsSpeaking(false);
    };
    utterance.onerror = (event) => {
      if (activeUtteranceRef.current === utterance) {
        activeUtteranceRef.current = null;
      }
      setIsSpeaking(false);
      if (event.error === "interrupted" || event.error === "canceled") {
        return;
      }
      if (event.error === "not-allowed") {
        setVoiceError(
          "Browser blocked speech playback. Click Read Result Aloud to try again."
        );
        return;
      }
      setVoiceError("Speech playback could not be started.");
    };

    activeUtteranceRef.current = utterance;

    try {
      synthesis.speak(utterance);
    } catch {
      activeUtteranceRef.current = null;
      setIsSpeaking(false);
      setVoiceError("Speech playback could not be started.");
    }
  };

  const stopVoiceExperience = () => {
    recognitionRef.current?.stop();
    stopAudioPlayback();
    if (typeof window !== "undefined" && voiceCapabilities.synthesis) {
      activeUtteranceRef.current = null;
      window.speechSynthesis.cancel();
    }
    setIsListening(false);
    setIsSpeaking(false);
  };

  const startVoiceQuestion = () => {
    if (!voiceCapabilities.recognition) {
      setVoiceError("Speech recognition is not supported in this browser.");
      return;
    }

    if (!diagnosis) {
      setVoiceError("Run an analysis before asking spoken follow-up questions.");
      return;
    }

    try {
      setVoiceError(null);
      setUserMessage("");
      recognitionRef.current?.start();
    } catch {
      setVoiceError("Voice listening is already active.");
    }
  };

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
    setHasLoadedPrecautions(false);
    setVoiceError(null);
    lastSpokenTextRef.current = "";
    stopVoiceExperience();
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
      setChatHistory([]);
      setHasLoadedPrecautions(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetPrecautions = async (currentDiagnosis) => {
    if (!currentDiagnosis) return;

    const cachedPrecautions = precautionsCacheRef.current[currentDiagnosis];
    if (cachedPrecautions) {
      setChatHistory([{ role: "model", parts: [cachedPrecautions] }]);
      setHasLoadedPrecautions(true);
      return;
    }

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

      precautionsCacheRef.current[currentDiagnosis] = data.response_text;
      setChatHistory([
        { role: "model", parts: [data.response_text] },
      ]);
      setHasLoadedPrecautions(true);
    } catch (err) {
      setChatHistory([
        {
          role: "model",
          parts: [
            `Sorry, I couldn't fetch precautions: ${err.message}`,
          ],
        },
      ]);
      setHasLoadedPrecautions(false);
    } finally {
      setIsChatLoading(false);
    }
  };

  const submitChatMessage = async (messageText) => {
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage || isChatLoading) return;

    const newUserMessage = {
      role: "user",
      parts: [trimmedMessage],
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
          message: trimmedMessage,
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

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    await submitChatMessage(userMessage);
  };

  useEffect(() => {
    if (!pendingVoiceMessage || isChatLoading) return;

    submitChatMessage(pendingVoiceMessage);
    setPendingVoiceMessage(null);
  }, [pendingVoiceMessage, isChatLoading]);

  useEffect(() => {
    if (!voiceEnabled || !diagnosis || confidence == null) return;

    const summary = `Analysis complete. The result is ${diagnosis} with ${confidence} percent confidence.`;
    if (lastSpokenTextRef.current === summary) return;

    void speakText(summary);
    lastSpokenTextRef.current = summary;
  }, [voiceEnabled, diagnosis, confidence, voiceCapabilities.audio, voiceCapabilities.synthesis]);

  useEffect(() => {
    if (!voiceEnabled || chatHistory.length === 0) return;

    const latestMessage = chatHistory[chatHistory.length - 1];
    if (latestMessage.role !== "model") return;

    const spokenText = latestMessage.parts.join(" ").trim();
    if (!spokenText || lastSpokenTextRef.current === spokenText) return;

    void speakText(spokenText);
    lastSpokenTextRef.current = spokenText;
  }, [chatHistory, voiceEnabled, voiceCapabilities.audio, voiceCapabilities.synthesis]);

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
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Button
              type="button"
              variant={voiceEnabled ? "default" : "outline"}
              onClick={async () => {
                const nextValue = !voiceEnabled;
                if (nextValue) {
                  await unlockAudioPlayback();
                }
                if (nextValue && voiceCapabilities.synthesis) {
                  unlockSpeechPlayback();
                }
                setVoiceEnabled(nextValue);
                setVoiceError(null);
                if (!nextValue) {
                  stopVoiceExperience();
                }
              }}
              className={voiceEnabled ? "bg-[#2E3A3A] text-white hover:bg-[#253030]" : "border-[#C8D6D0] bg-white text-[#2E3A3A] hover:bg-[#F1F5F4]"}
            >
              {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              {voiceEnabled ? "Voice Mode On" : "Enable Voice Mode"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={startVoiceQuestion}
              disabled={!voiceCapabilities.recognition || !diagnosis || isListening || isChatLoading}
              className="border-[#C8D6D0] bg-white text-[#2E3A3A] hover:bg-[#F1F5F4]"
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {isListening ? "Listening..." : "Ask by Voice"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={stopVoiceExperience}
              disabled={!isListening && !isSpeaking}
              className="text-[#2E3A3A] hover:bg-[#F1F5F4]"
            >
              <Square className="h-4 w-4" />
              Stop Voice
            </Button>
          </div>
          {voiceError ? (
            <p className="mt-3 text-sm text-[#B45309]">{voiceError}</p>
          ) : null}
          {!voiceCapabilities.audio && !voiceCapabilities.synthesis && !voiceCapabilities.recognition ? (
            <p className="mt-3 text-sm text-[#7A8E8C]">
              Voice mode depends on browser audio or speech APIs and may work best in Chrome or Edge.
            </p>
          ) : null}
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
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Button
                        onClick={() => handleGetPrecautions(diagnosis)}
                        disabled={isChatLoading}
                        className="bg-[#6BA292] text-white hover:bg-[#5C9182]"
                      >
                        {isChatLoading && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {hasLoadedPrecautions
                          ? "Refresh Lifestyle Tips"
                          : "Get Lifestyle Tips"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          void speakText(
                            `Analysis complete. The result is ${diagnosis} with ${confidence} percent confidence.`,
                            { userInitiated: true }
                          );
                        }}
                        disabled={!voiceCapabilities.audio && !voiceCapabilities.synthesis}
                        className="border-[#C8D6D0] bg-white text-[#2E3A3A] hover:bg-[#F9FBFA]"
                      >
                        <Volume2 className="h-4 w-4" />
                        Read Result Aloud
                      </Button>
                    </div>
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
                Ask follow-up questions about the analysis by typing or speaking.
              </CardDescription>
            </CardHeader>

            <CardContent
              ref={chatScrollRef}
              className="flex-grow overflow-y-auto bg-[#F9FBFA]"
            >
              <div className="space-y-4">
                {chatHistory.length === 0 && (
                  <p className="text-center text-[#7A8E8C] pt-8">
                    Run analysis, then load lifestyle tips or ask a follow-up
                    question.
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
                  type="button"
                  variant="outline"
                  onClick={startVoiceQuestion}
                  disabled={!voiceCapabilities.recognition || !diagnosis || isListening || isChatLoading}
                  className="border-[#CBDDD6] bg-white text-[#2E3A3A] hover:bg-[#F1F5F4]"
                >
                  <Mic className="h-4 w-4" />
                </Button>
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
