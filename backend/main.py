import uvicorn
import numpy as np
import google.generativeai as genai
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
# --- PyTorch Imports ---
import torch
import torch.nn as nn
import torch.nn.functional as F # Needed for TunedCNN activations
import torchvision.transforms as transforms # Use standard transforms
from PIL import Image
# --- End PyTorch Imports ---
import io
import os
import subprocess
import tempfile
from dotenv import load_dotenv
from fastapi.responses import Response

# --- NEW Pydantic Imports ---
from pydantic import BaseModel
from typing import List, Optional
# --- End Pydantic Imports ---


# --- [UPDATED FOR TunedCNN MODEL from new notebook] ---
IMAGE_WIDTH = 128
IMAGE_HEIGHT = 128
MODEL_PATH = "alzheimer_cnn_model.pth"
CLASS_NAMES = ['Mild Demented', 'Moderate Demented', 'Non Demented', 'Very Mild Demented']
# --- [END UPDATED] ---

LOCAL_PRECAUTIONS = {
    "Mild Demented": [
        "Keep a simple daily routine with clear reminders for meals, medicines, and rest.",
        "Use written notes, phone alarms, or labeled spaces to reduce memory strain.",
        "Stay active with light walks, stretching, or another gentle movement most days.",
        "Keep regular follow-up with a qualified doctor and share any changes in behavior or memory."
    ],
    "Moderate Demented": [
        "Create a calm home setup with fewer distractions and easy-to-follow daily steps.",
        "Ask a trusted family member or caregiver to help with schedules, appointments, and safety checks.",
        "Encourage short, familiar activities such as music, conversation, or simple puzzles.",
        "Watch for changes in sleep, eating, or confusion and discuss them with a clinician."
    ],
    "Very Mild Demented": [
        "Build strong habits around sleep, hydration, movement, and regular mental activity.",
        "Use calendars, checklists, and reminders early so daily tasks stay manageable.",
        "Reduce stress with breaks, breathing exercises, and steady social connection.",
        "Plan a medical follow-up if memory concerns continue or become more frequent."
    ],
    "Non Demented": [
        "Keep supporting brain health with regular exercise, good sleep, and balanced meals.",
        "Stay mentally active through reading, conversation, or memory games.",
        "Maintain routine health checkups if any symptoms still concern you.",
        "Seek clinical advice if memory issues continue even when the scan result looks reassuring."
    ],
}

# --- Define the TunedCNN Architecture (Copied from new notebook) ---
class TunedCNN(nn.Module):
    def __init__(self, num_classes=4):
        super(TunedCNN, self).__init__()
        self.conv1 = nn.Conv2d(1, 32, kernel_size=3, padding=1)
        self.pool1 = nn.MaxPool2d(2, 2)
        self.batchnorm1 = nn.BatchNorm2d(num_features=32)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.pool2 = nn.MaxPool2d(2, 2)
        self.flatten = nn.Flatten()
        self.fc1 = nn.Linear(64 * 32 * 32, 128)
        self.drop1 = nn.Dropout(p=0.2)
        self.out = nn.Linear(128, num_classes)

    def forward(self, x):
        x = F.mish(self.conv1(x))
        x = self.pool1(x)
        x = self.batchnorm1(x)
        x = F.mish(self.conv2(x))
        x = self.pool2(x)
        x = self.flatten(x)
        x = self.fc1(x)
        leaky = nn.LeakyReLU(0.01)
        x = leaky(x)
        x = self.drop1(x)
        x = self.out(x)
        return x
# --- End Model Definition ---


# --- NEW Pydantic Models for Chat History ---
# This defines the structure of a single chat message
class HistoryItem(BaseModel):
    role: str  # Must be "user" or "model"
    parts: List[str]

# This defines the structure of the data your frontend will send
class ChatPayload(BaseModel):
    message: str
    history: List[HistoryItem]
    diagnosis: Optional[str] = None # The diagnosis is optional
# --- END NEW Pydantic Models ---


class SpeechPayload(BaseModel):
    text: str


# Initialize FastAPI app
app = FastAPI(title="Alzheimer's Detection API (Tuned PyTorch)")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Load the PyTorch Model ---
model = None
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
try:
    model = TunedCNN(num_classes=len(CLASS_NAMES)).to(device)
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
    model.eval()
    print(f"Tuned PyTorch Model loaded successfully from {MODEL_PATH} onto {device}")
except Exception as e:
    print(f"Error loading PyTorch model: {e}")
    model = None
# --- End Model Loading ---

# Configure the Gemini API
gemini_model = None
try:
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found. Please create a .env file.")
    genai.configure(api_key=api_key)
    gemini_model = genai.GenerativeModel('gemini-2.5-flash')
    print("Gemini model configured successfully")
except Exception as e:
    print(f"Error configuring Gemini: {e}")
    gemini_model = None


# --- Define PyTorch Image Transforms ---
image_transforms = transforms.Compose([
    transforms.Grayscale(num_output_channels=1),
    transforms.Resize((IMAGE_WIDTH, IMAGE_HEIGHT)),
    transforms.ToTensor(), # This scales image to [0.0, 1.0]
])
# --- End Transforms ---

# Helper function to process the image
def process_image_pytorch(image_bytes):
    image = Image.open(io.BytesIO(image_bytes))
    
    # This applies Grayscale, Resize, and ToTensor()
    image_tensor = image_transforms(image) # Output is (1, 128, 128) float tensor [0.0, 1.0]
    
    # --- THIS IS THE FIX ---
    # Your model was tested on data from 0-255, not 0-1.
    # We must scale the tensor back up to match your notebook.
    image_tensor = image_tensor * 255.0 
    # --- END FIX ---
    
    # Add the batch dimension: (1, 128, 128) -> (1, 1, 128, 128)
    image_tensor = image_tensor.unsqueeze(0) 
    
    return image_tensor


def build_precautions_text(diagnosis):
    tips = LOCAL_PRECAUTIONS.get(
        diagnosis,
        [
            "Keep a consistent daily routine with enough sleep, hydration, and light exercise.",
            "Use simple reminders, notes, or alarms to make day-to-day tasks easier.",
            "Stay socially and mentally active with calm, familiar activities.",
            "Discuss ongoing symptoms or concerns with a qualified clinician."
        ],
    )

    formatted_tips = "\n".join([f"{index}. {tip}" for index, tip in enumerate(tips, start=1)])
    return (
        "Based on the model's result, here are some general lifestyle tips that may be helpful:\n"
        f"{formatted_tips}"
    )


def build_local_chat_response(message, diagnosis=None):
    message_text = (message or "").strip().lower()

    if "precaution" in message_text or "tip" in message_text or "care" in message_text:
        return build_precautions_text(diagnosis or "general")

    if "diagnosis" in message_text or "result" in message_text or "meaning" in message_text:
        if diagnosis:
            return (
                f"The model result shown is '{diagnosis}'. This is only a screening-style AI result, "
                "so it should be reviewed with a qualified clinician before making medical decisions."
            )
        return (
            "I can help explain the result once an MRI analysis is available. "
            "Please run the scan first, then ask about the diagnosis."
        )

    if "doctor" in message_text or "hospital" in message_text or "emergency" in message_text:
        return (
            "If symptoms are getting worse, daily life is becoming harder, or there are sudden changes "
            "in memory, behavior, balance, or speech, please contact a qualified doctor promptly."
        )

    if "food" in message_text or "diet" in message_text or "eat" in message_text:
        return (
            "Simple helpful habits include regular meals, enough water, fruits and vegetables, "
            "and avoiding long gaps without eating. A clinician or dietitian can give more personal advice."
        )

    if "exercise" in message_text or "walk" in message_text or "activity" in message_text:
        return (
            "Gentle daily movement like walking, stretching, or light guided exercise can be helpful "
            "for general wellbeing, as long as it is comfortable and safe."
        )

    if "memory" in message_text or "sleep" in message_text or "stress" in message_text:
        return (
            "Supportive habits often include regular sleep, lower stress, daily structure, reminders, "
            "light physical activity, and staying socially engaged."
        )

    if diagnosis:
        return (
            f"I could not reach Gemini just now, but I can still help with general guidance around "
            f"the result '{diagnosis}'. Ask about lifestyle tips, what the result means, or when to seek care."
        )

    return (
        "I could not reach Gemini just now, but I can still help with general non-diagnostic guidance. "
        "Ask about healthy routines, memory-support habits, or when to speak with a clinician."
    )


def synthesize_speech_wav(text):
    normalized_text = " ".join((text or "").split()).strip()
    if not normalized_text:
        raise ValueError("No text provided for speech synthesis.")

    with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False, encoding="utf-8") as text_file:
        text_file.write(normalized_text)
        text_path = text_file.name

    aiff_path = f"{text_path}.aiff"
    wav_path = f"{text_path}.wav"

    try:
        say_result = subprocess.run(
            ["say", "-v", "Samantha", "-f", text_path, "-o", aiff_path],
            capture_output=True,
            text=True,
            check=False,
        )
        if say_result.returncode != 0:
            raise RuntimeError((say_result.stderr or say_result.stdout or "say failed").strip())

        convert_result = subprocess.run(
            ["afconvert", "-f", "WAVE", "-d", "LEI16", aiff_path, wav_path],
            capture_output=True,
            text=True,
            check=False,
        )
        if convert_result.returncode != 0:
            raise RuntimeError((convert_result.stderr or convert_result.stdout or "afconvert failed").strip())

        with open(wav_path, "rb") as audio_file:
            return audio_file.read()
    finally:
        for path in (text_path, aiff_path, wav_path):
            if os.path.exists(path):
                os.remove(path)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Alzheimer's Detection API (Tuned PyTorch)"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # This endpoint is unchanged
    if not model:
        return {"error": "PyTorch ML Model not loaded"}
    try:
        image_bytes = await file.read()
        input_tensor = process_image_pytorch(image_bytes).to(device)
        with torch.no_grad():
            outputs = model(input_tensor)
            probabilities = torch.softmax(outputs, dim=1)
            confidence, predicted_idx = torch.max(probabilities, 1)
        predicted_class_index = predicted_idx.item()
        if 0 <= predicted_class_index < len(CLASS_NAMES):
            predicted_class_name = CLASS_NAMES[predicted_class_index]
        else:
            print(f"Warning: Predicted index {predicted_class_index} out of bounds for CLASS_NAMES.")
            return {"error": f"Model produced an invalid prediction index: {predicted_class_index}."}
        confidence_score = confidence.item()
        return {
            "diagnosis": predicted_class_name,
            "confidence": round(confidence_score * 100, 2)
        }
    except Exception as e:
        print(f"Prediction Exception: {e}")
        return {"error": f"Prediction failed: {e}. Check image format and model compatibility."}


@app.post("/get_precautions")
async def get_precautions(data: dict):
    diagnosis = data.get("diagnosis")
    if not diagnosis: return {"error": "No diagnosis provided"}
    return {"response_text": build_precautions_text(diagnosis)}

# --- UPDATED CHATBOT ENDPOINT ---
@app.post("/chat")
async def chat(data: ChatPayload): # Now uses the Pydantic model
    if not gemini_model:
        return {
            "response_text": build_local_chat_response(data.message, data.diagnosis),
            "fallback": True,
        }

    try:
        # 1. Define the System Prompt & Safety Rules
        system_prompt = f"""
        You are a helpful and empathetic health assistant.
        Your safety rules are:
        1. DO NOT use any medical jargon.
        2. DO NOT suggest any specific medications or drugs.
        3. DO NOT give direct medical advice.
        4. Keep the response concise and easy to understand.
        """
        
        # 2. Define the context based on the diagnosis
        if data.diagnosis:
            context = f"The user has uploaded an MRI. The model's diagnosis is '{data.diagnosis}'. Answer their questions based on this context."
        else:
            context = "The user has not uploaded an MRI scan yet. Answer their general questions."

        # 3. Build the full history
        # We start with the system prompt and context, then add the user's history
        
        full_history = [
            {"role": "user", "parts": [system_prompt + "\n" + context]},
            {"role": "model", "parts": ["Okay, I understand. I am ready to help the user based on their diagnosis and my safety rules."]}
        ]
        
        # Add the existing history sent from the frontend
        for item in data.history:
            full_history.append(item.dict()) # Add past messages
            
        # 4. Start a new chat session with the *full* history
        chat_session = gemini_model.start_chat(history=full_history)
        
        # 5. Send the user's *new* message
        # Use send_message_async for better performance in FastAPI
        response = await chat_session.send_message_async(data.message)
        
        return {"response_text": response.text}
        
    except Exception as e:
        print(f"Chatbot Exception: {e}")
        error_text = str(e)
        if "429" in error_text or "quota" in error_text.lower():
            return {
                "response_text": build_local_chat_response(data.message, data.diagnosis),
                "fallback": True,
                "warning": "Gemini free-tier rate limit reached. Showing local fallback guidance for now.",
            }
        return {"error": f"Chatbot failed: {e}"}
# --- END UPDATED ENDPOINT ---


@app.post("/speak")
async def speak(payload: SpeechPayload):
    try:
        audio_bytes = synthesize_speech_wav(payload.text)
        return Response(content=audio_bytes, media_type="audio/wav")
    except Exception as e:
        print(f"Speech synthesis Exception: {e}")
        return {"error": f"Speech synthesis failed: {e}"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
