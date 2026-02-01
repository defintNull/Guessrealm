# Setup Server-to-Server con FastAPI

## Architettura

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Client    │  curl   │  Client Server   │  HTTP   │ Inference Server│
│   (curl)    │────────▶│  (porta 8002)    │────────▶│  (porta 8001)   │
│             │         │                  │         │   (ONNX Model)  │
└─────────────┘         └──────────────────┘         └─────────────────┘
```

## Installazione Dipendenze

```bash
pip install fastapi uvicorn onnxruntime numpy pillow httpx python-multipart
```

## Avvio dei Server

### 1. Server di Inferenza ONNX (Porta 8001)

**Terminale 1:**
```bash
cd /mnt/c/Users/andre/Desktop/FastApi
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

Questo server:
- Carica il modello ONNX
- Esegue l'inferenza
- Risponde con la classe predetta

### 2. Client Server (Porta 8002)

**Terminale 2:**
```bash
cd /mnt/c/Users/andre/Desktop/FastApi
uvicorn client_server:app --host 0.0.0.0 --port 8002 --reload
```

Questo server:
- Riceve richieste dal client
- Inoltra le immagini al server di inferenza
- Restituisce i risultati al client

## Test con cURL

### Test 1: Classificazione singola immagine
```bash
curl -X POST "http://localhost:8002/classify" \
  -F "file=@image.png"
```

**Risposta:**
```json
{
  "status": "success",
  "prediction": "gatto",
  "confidence": 92.45,
  "source": "ONNX Inference Server"
}
```

### Test 2: Classificazione da percorso server
```bash
curl -X POST "http://localhost:8002/classify-from-path" \
  -H "Content-Type: application/json" \
  -d '{"image_path": "/path/to/image.png"}'
```

### Test 3: Classificazione batch (multiple immagini)
```bash
curl -X POST "http://localhost:8002/classify-batch" \
  -F "files=@image1.png" \
  -F "files=@image2.png" \
  -F "files=@image3.png"
```

### Test 4: Verifica stato server di inferenza
```bash
curl http://localhost:8002/inference-server-status
```

### Test 5: Health check
```bash
curl http://localhost:8002/health
```

## Script di Test Automatico

```bash
chmod +x test_server_to_server.sh
./test_server_to_server.sh
```

## Endpoints Disponibili

### Client Server (8002)

| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/classify` | POST | Carica un'immagine e ottieni la classificazione |
| `/classify-from-path` | POST | Classifica immagine da percorso server |
| `/classify-batch` | POST | Classifica multiple immagini |
| `/health` | GET | Health check |
| `/inference-server-status` | GET | Stato del server di inferenza |
| `/` | GET | Info generali |

### Inference Server (8001)

| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/predict` | POST | Predizione ONNX |
| `/health` | GET | Health check |
| `/classes` | GET | Lista classi disponibili |
| `/model-info` | GET | Info sul modello |

## Esempio Integrazione Python

```python
import requests

# Classificazione singola
with open('image.png', 'rb') as f:
    files = {'file': f}
    response = requests.post('http://localhost:8002/classify', files=files)
    result = response.json()
    print(f"Classe: {result['prediction']}")
    print(f"Confidenza: {result['confidence']}%")

# Classificazione batch
files = [
    ('files', open('image1.png', 'rb')),
    ('files', open('image2.png', 'rb')),
    ('files', open('image3.png', 'rb'))
]
response = requests.post('http://localhost:8002/classify-batch', files=files)
results = response.json()
for r in results['results']:
    print(f"{r['filename']}: {r['prediction']} ({r['confidence']}%)")
```

## Vantaggi Server-to-Server

1. **Separazione delle responsabilità**: Un server gestisce il modello, l'altro gestisce le richieste
2. **Scalabilità**: Puoi avere multipli server di inferenza dietro un load balancer
3. **Sicurezza**: Il server di inferenza può essere isolato dalla rete pubblica
4. **Flessibilità**: Facile aggiungere preprocessing, logging, autenticazione nel client server
5. **Manutenzione**: Puoi aggiornare/riavviare i server indipendentemente

## Troubleshooting

### Server di inferenza non raggiungibile
```bash
# Verifica che sia attivo
curl http://localhost:8001/health

# Verifica i log del server
# Controlla nel terminale dove hai avviato uvicorn
```

### Timeout
Se le richieste vanno in timeout, aumenta il timeout in `client_server.py`:
```python
async with httpx.AsyncClient(timeout=60.0) as client:  # 60 secondi
```

### Porta già in uso
```bash
# Trova processo sulla porta
lsof -i :8002

# Oppure cambia porta
uvicorn client_server:app --port 8003
```

### Test locale con immagine presente
./start_servers.sh  #avvio di entrambi i server
./stop_servers.sh   #stop di entrambi i server
./test_server_to_server.sh  #test di comunicazione da server a server


### Avvio ufficiale nel progetto guessrealm

1. **VENV**
Se non ancoda fatto creare il venv
```bash
cd .\PythonServer\
python -m venv venv
```

2. **Dependencies**
Se non ancora configurato il venv installare le dependencies

Windows
```bash
venv\Scripts\activate
```

Linux
```bash
source venv\bin\activate
```

Dipendenze
```bash
pip install fastapi uvicorn onnxruntime numpy pillow httpx python-multipart
```

3. **Avvio server**
Effettuare il source dell'ambiente se non ancora fatto (vedere punto 2).

Lanciare il server
```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```
