from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import onnxruntime as ort
import numpy as np
from PIL import Image
import io

app = FastAPI(title="ONNX Inference API")

# Abilita CORS per Laravel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In produzione, specifica il dominio di Laravel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Carica il modello ONNX all'avvio
session = None

# DEFINISCI QUI LE TUE 18 CLASSI (dal file TypeScript)
CLASS_NAMES = [
    "smile",              # 0
    "gender_male",        # 1
    "gender_female",      # 2
    "hair_brown",         # 3
    "hair_black",         # 4
    "hair_blond",         # 5
    "hair_gray",          # 6
    "hair_long",          # 7
    "hair_short",         # 8
    "ethnicity_asian",    # 9
    "ethnicity_black",    # 10
    "ethnicity_latino",   # 11
    "ethnicity_white",    # 12
    "eye_blue",           # 13
    "eye_brown",          # 14
    "eye_green",          # 15
    "has_facial_hair",    # 16
    "eyeglasses"          # 17
]

@app.on_event("startup")
async def load_model():
    global session
    model_path = "model_webgpu.onnx"  # Assicurati che il file sia nella stessa directory
    session = ort.InferenceSession(model_path)
    print(f"✓ Modello caricato: {model_path}")
    print(f"✓ Input: {session.get_inputs()[0].name} - Shape: {session.get_inputs()[0].shape}")
    print(f"✓ Output: {session.get_outputs()[0].name}")
    print(f"✓ Classi disponibili: {len(CLASS_NAMES)}")

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Riceve un'immagine e restituisce il nome della classe predetta
    """
    try:
        # Leggi l'immagine
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Converti in RGB se necessario (es. PNG con alpha channel)
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Preprocessing
        image = image.resize((256, 256))
        image_array = np.array(image).astype(np.float32)
        
        # Normalizzazione
        image_array = image_array / 255.0
        
        # Converti in formato CHW (Channels, Height, Width)
        image_array = np.transpose(image_array, (2, 0, 1))
        
        # Aggiungi batch dimension
        image_array = np.expand_dims(image_array, axis=0)
        
        # Inferenza
        input_name = session.get_inputs()[0].name
        output_name = session.get_outputs()[0].name
        
        result = session.run([output_name], {input_name: image_array})
        
        # Prendi tutti i predictions (logits)
        predictions = result[0][0]
        
        # Prendi il secondo e terzo valore (indici 1 e 2)
        # Indice 1 = gender_male, Indice 2 = gender_female
        male_logit = float(predictions[1])
        female_logit = float(predictions[2])
        
        # Applica la funzione sigmoide per convertire logits in probabilità
        # sigmoid(x) = 1 / (1 + e^(-x))
        male_probability = 1 / (1 + np.exp(-male_logit))
        female_probability = 1 / (1 + np.exp(-female_logit))
        
        # Converti in percentuali
        male_percentage = male_probability * 100
        female_percentage = female_probability * 100
        
        # Trova il massimo
        if male_percentage > female_percentage:
            max_index = 1
            max_percentage = male_percentage
        else:
            max_index = 2
            max_percentage = female_percentage
        
        # Risposta: quale tra maschio e femmina ha la probabilità maggiore
        return {
            "class_name": CLASS_NAMES[max_index],
            "percentage": round(max_percentage, 2)
        }
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

