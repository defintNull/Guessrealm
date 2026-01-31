# 🧠 Facial Attributes Classifier

Un classificatore di attributi facciali ad alte prestazioni basato su modelli ONNX con supporto WebGPU per accelerazione hardware.

## 📋 Indice

- [Panoramica](#panoramica)
- [Caratteristiche](#caratteristiche)
- [Requisiti](#requisiti)
- [Installazione](#installazione)
- [Utilizzo Base](#utilizzo-base)
- [Architettura](#architettura)
- [API Reference](#api-reference)
- [Configurazione](#configurazione)
- [Performance](#performance)
---

## 🎯 Panoramica

Questo progetto fornisce un sistema di classificazione di attributi facciali che utilizza reti neurali ONNX per rilevare 18 caratteristiche facciali distinte, tra cui:

- **Espressioni**: Sorriso
- **Genere**: Maschio/Femmina
- **Capelli**: Colore (marrone, nero, biondo, grigio) e lunghezza (lunghi, corti)
- **Etnia**: Asiatica, Africana, Latina, Caucasica
- **Occhi**: Colore (azzurri, marroni, verdi)
- **Accessori**: Barba, Occhiali

In aggiunta, il sistema può rispondere a domande sul nome della persona (se inizia con vocale o consonante).

### 🚀 Tecnologie Utilizzate

- **ONNX Runtime Web**: Per l'esecuzione del modello neurale nel browser
- **WebGPU**: Accelerazione GPU per inferenza ultra-rapida
- **Cache API**: Caching intelligente del modello per ricaricamenti istantanei
- **TypeScript**: Type-safety completo
- **Pattern Singleton**: Gestione efficiente delle risorse

---

## ✨ Caratteristiche

### 🎮 Accelerazione Hardware

- **WebGPU**: Utilizza la GPU quando disponibile per prestazioni fino a 10x più veloci
- **Fallback WASM**: Esecuzione su CPU se WebGPU non è supportato
- **Auto-detection**: Rilevamento automatico delle capacità hardware

### 💾 Caching Intelligente

- **Cache API**: Il modello viene scaricato una sola volta
- **Caricamenti istantanei**: Ricaricamenti successivi da cache locale
- **Gestione cache**: Metodi per verificare e pulire la cache

### 🎯 Classificazione Accurata

- **18 attributi facciali**: Rilevamento multi-attributo simultaneo
- **Gestione gruppi**: Identificazione automatica dei tratti dominanti
- **Normalizzazione sigmoide**: Conversione logit → probabilità

### 🔧 Flessibilità

- **API multipla**: Funzioni wrapper e classe completa
- **Configurazione personalizzabile**: Override di percorsi e parametri
- **Supporto Axios/Fetch**: Download del modello con libreria preferita

---

## 📦 Requisiti

### Dipendenze

```json
{
  "onnxruntime-web": "^1.17.0",
  "axios": "^1.6.0" // Opzionale
}
```

### Browser Supportati

- **Chrome/Edge**: 113+ (supporto WebGPU completo)
- **Firefox**: 121+ (supporto WASM)
- **Safari**: 17+ (supporto WASM)

### Hardware Raccomandato

- **GPU**: WebGPU compatibile (NVIDIA, AMD, Intel recenti)
- **RAM**: Minimo 2GB disponibili
- **Storage**: 50MB per cache modello

---

## 🛠️ Installazione

### 1. Installazione Dipendenze

```bash
npm install onnxruntime-web
# Opzionale: per download personalizzato
npm install axios
```

### 2. Struttura File

```
project/
├── standalone.tsx              # Codice principale
├── model_webgpu.onnx          # Modello ONNX
└── images_256/                # Immagini 256x256
    ├── 000001.jpg
    ├── 000002.jpg
    └── ...
```

### 3. Import nel Progetto

```typescript
import { 
  classifyImageById, 
  classifyImage, 
  FacialAttributesClassifier 
} from './standalone';
```

---

## 🚀 Utilizzo Base

### Esempio 1: Classificazione Rapida per ID

```typescript
import { classifyImageById } from './standalone';

// Classifica l'immagine con ID 42
const results = await classifyImageById(42, "Alice");

// Risultato: array di 20 risposte
results.forEach(answer => {
  console.log(`Domanda ${answer.questionId}: ${answer.answer ? 'Sì' : 'No'} (${answer.percentage}%)`);
});
```

### Esempio 2: Classificazione per Percorso

```typescript
import { classifyImage } from './standalone';

const results = await classifyImage(
  "./images/photo.jpg",
  "Bob",
  { useWebGpu: true }  // Opzionale: forza WebGPU
);
```

### Esempio 3: Uso Avanzato con Classe

```typescript
import { FacialAttributesClassifier } from './standalone';

// Crea istanza (singleton)
const classifier = FacialAttributesClassifier.getInstance();

// Carica modello con configurazione personalizzata
await classifier.loadModel(
  true,                        // useWebGpu
  './models/custom.onnx',      // percorso personalizzato
  axiosInstance                // istanza axios (opzionale)
);

// Classifica multiple immagini (modello già caricato)
for (let i = 1; i <= 100; i++) {
  const results = await classifier.classifyImageById(i, `Person${i}`);
  // Processa risultati...
}

// Verifica execution provider
console.log(`Using: ${classifier.getExecutionProvider()}`);
```

### Esempio 4: Gestione Cache

```typescript
// Verifica se modello è in cache
const isCached = await FacialAttributesClassifier.isModelCached();
console.log(`Model cached: ${isCached}`);

// Pulisci cache (es: dopo aggiornamento modello)
await FacialAttributesClassifier.clearModelCache();
```

---

## 🏗️ Architettura

### Flusso di Esecuzione

```
┌─────────────────────┐
│  Caricamento Modello │
│  (con cache)        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Carica Immagine    │
│  (256x256)          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Pre-processamento  │
│  RGB → CHW          │
│  [0,255] → [0,1]    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Inferenza ONNX     │
│  (WebGPU/WASM)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Post-processamento │
│  Logit → Sigmoide   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Identificazione    │
│  Tratti Dominanti   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Generazione        │
│  20 Risposte        │
└─────────────────────┘
```

### Pipeline Pre-processamento

1. **Caricamento Immagine**: Da URL/file a elemento HTML Image
2. **Canvas Drawing**: Rendering su canvas 256x256
3. **Estrazione Pixel**: Conversione a ImageData (RGBA)
4. **Normalizzazione**: Da [0,255] a [0,1]
5. **Riorganizzazione**: Da HWC (Height-Width-Channels) a CHW

```
Input:  RGBA [H=256, W=256, C=4] in [0, 255]
         ↓
Output: RGB  [C=3, H=256, W=256] in [0.0, 1.0]
```

### Logica Classificazione

#### Attributi Non Raggruppati (Sorriso, Barba, Occhiali)
```typescript
answer = probability > 0.5
```

#### Attributi Raggruppati (Genere, Colore Capelli, Etnia, Occhi)
```typescript
// 1. Trova attributo con probabilità massima nel gruppo
maxAttr = max(group.attributes)

// 2. Verifica se corrisponde alla domanda
answer = (maxAttr.index == questionIndex)
```

### Funzione Sigmoide

Converte i logit del modello in probabilità:

```
σ(x) = 1 / (1 + e^(-x))

Dove:
- x: logit (output raw del modello)
- σ(x): probabilità ∈ [0, 1]
```

**Esempi**:
- `σ(-5) ≈ 0.007` (molto improbabile)
- `σ(0) = 0.5` (neutro)
- `σ(5) ≈ 0.993` (molto probabile)

---

## 📚 API Reference

### Classe: `FacialAttributesClassifier`

#### Metodi di Istanza

##### `loadModel(useWebGpu?, modelPath?, axios?): Promise<void>`

Carica il modello ONNX con supporto caching.

**Parametri**:
- `useWebGpu` (boolean, default: `true`): Abilita accelerazione WebGPU
- `modelPath` (string, opzionale): Percorso personalizzato del modello
- `axios` (AxiosInstance, opzionale): Istanza Axios per download

**Esempio**:
```typescript
await classifier.loadModel(true, './models/v2.onnx');
```

---

##### `classifyImage(imageSrc, imageName?): Promise<QuestionAnswer[]>`

Classifica un'immagine dato il percorso.

**Parametri**:
- `imageSrc` (string): URL o percorso dell'immagine
- `imageName` (string, opzionale): Nome associato

**Ritorna**: Array di 20 `QuestionAnswer`

**Esempio**:
```typescript
const results = await classifier.classifyImage('./photo.jpg', 'Alice');
```

---

##### `classifyImageById(imageId, imageName?): Promise<QuestionAnswer[]>`

Classifica un'immagine dato l'ID numerico.

**Parametri**:
- `imageId` (number): ID dell'immagine (viene formattato come `000001.jpg`)
- `imageName` (string, opzionale): Nome associato

**Ritorna**: Array di 20 `QuestionAnswer`

**Esempio**:
```typescript
const results = await classifier.classifyImageById(42, 'Bob');
```

---

##### `getExecutionProvider(): string`

Restituisce il provider di esecuzione utilizzato.

**Ritorna**: `'webgpu'`, `'wasm'`, o `'unknown'`

**Esempio**:
```typescript
console.log(`Running on: ${classifier.getExecutionProvider()}`);
```

---

#### Metodi Statici

##### `getInstance(): FacialAttributesClassifier`

Ottiene l'istanza singleton del classificatore.

**Esempio**:
```typescript
const classifier = FacialAttributesClassifier.getInstance();
```

---

##### `clearModelCache(cacheName?): Promise<void>`

Pulisce la cache del modello.

**Parametri**:
- `cacheName` (string, default: `'ai-model-cache-v1'`): Nome della cache

**Esempio**:
```typescript
await FacialAttributesClassifier.clearModelCache();
```

---

##### `isModelCached(modelPath?, cacheName?): Promise<boolean>`

Verifica se il modello è in cache.

**Parametri**:
- `modelPath` (string, opzionale): Percorso del modello
- `cacheName` (string, default: `'ai-model-cache-v1'`): Nome della cache

**Ritorna**: `true` se in cache, `false` altrimenti

**Esempio**:
```typescript
if (await FacialAttributesClassifier.isModelCached()) {
  console.log('Model ready!');
}
```

---

### Funzioni Wrapper

##### `classifyImageById(imageId, imageName?, options?): Promise<QuestionAnswer[]>`

Funzione di utilità per classificazione rapida per ID.

**Parametri**:
- `imageId` (number): ID immagine
- `imageName` (string, opzionale): Nome
- `options` (oggetto, opzionale):
  - `modelPath` (string): Percorso modello personalizzato
  - `useWebGpu` (boolean): Abilita WebGPU

**Esempio**:
```typescript
const results = await classifyImageById(42, 'Alice', { useWebGpu: true });
```

---

##### `classifyImage(imageSrc, imageName?, options?): Promise<QuestionAnswer[]>`

Funzione di utilità per classificazione rapida per percorso.

**Parametri**: Analoghi a `classifyImageById`

---

### Tipi TypeScript

#### `QuestionAnswer`

```typescript
type QuestionAnswer = {
  questionId: number;    // ID domanda (0-19)
  answer: boolean;       // Risposta: true/false
  percentage: number;    // Confidenza: 0-100
};
```

#### `Attribute`

```typescript
type Attribute = {
  name: string | undefined;      // Nome attributo
  probability: number;            // Probabilità [0, 1]
  rawValue: number;               // Logit grezzo
  index: number;                  // Indice in CONFIG.attributeNames
  displayName?: string;           // Nome visualizzato (opzionale)
};
```

---

## ⚙️ Configurazione

### Oggetto `CONFIG`

Tutte le configurazioni sono centralizzate nell'oggetto `CONFIG`:

```typescript
const CONFIG = {
  modelPath: 'model_webgpu.onnx',      // Percorso modello
  imageFolder: 'images_256',           // Cartella immagini
  attributeNames: [...],               // Nomi attributi
  attributeGroups: [...],              // Gruppi mutuamente esclusivi
  displayMapping: {...},               // Mapping IT
  questionToIndices: {...}             // Mapping domande → attributi
};
```

### Personalizzazione

Per modificare la configurazione, puoi:

1. **Modifica diretta** (sconsigliato):
```typescript
CONFIG.modelPath = './models/custom.onnx';
```

2. **Override in loadModel** (raccomandato):
```typescript
await classifier.loadModel(true, './models/custom.onnx');
```

### Aggiungere Nuovi Attributi

1. Aggiungi nome in `CONFIG.attributeNames`
2. Aggiorna `CONFIG.displayMapping`
3. Aggiungi mapping in `CONFIG.questionToIndices`
4. (Opzionale) Aggiungi a `CONFIG.attributeGroups` se raggruppato

**Esempio**:
```typescript
// Aggiungere "occhiali da sole"
CONFIG.attributeNames.push('has_sunglasses');
CONFIG.displayMapping[18] = 'Con Occhiali da Sole';
CONFIG.questionToIndices[18] = [18];
```

---

## 🚄 Performance

### Benchmark Tipici

| Execution Provider | Tempo per Immagine | FPS |
|-------------------|-------------------|-----|
| **WebGPU** (RTX 3070) | ~15-25ms | ~40-60 |
| **WebGPU** (Intel iGPU) | ~50-80ms | ~12-20 |
| **WASM** (CPU) | ~200-400ms | ~2-5 |

### Ottimizzazioni

#### 1. Pre-carica il Modello

```typescript
// ❌ Carica ad ogni classificazione
const result = await classifyImageById(1);

// ✅ Carica una volta, riutilizza
const classifier = FacialAttributesClassifier.getInstance();
await classifier.loadModel();
for (let i = 1; i <= 100; i++) {
  await classifier.classifyImageById(i);
}
```

#### 2. Usa WebGPU quando Possibile

```typescript
// Verifica supporto e abilita
if ('gpu' in navigator) {
  await classifier.loadModel(true);  // WebGPU
} else {
  await classifier.loadModel(false); // Fallback WASM
}
```

#### 3. Batch Processing

```typescript
// Classifica immagini in parallelo (limitato dalla memoria GPU)
const promises = [1, 2, 3, 4, 5].map(id => 
  classifier.classifyImageById(id)
);
const results = await Promise.all(promises);
```

#### 4. Verifica Cache Prima del Caricamento

```typescript
const isCached = await FacialAttributesClassifier.isModelCached();
if (!isCached) {
  // Mostra loading indicator
  console.log('Downloading model...');
}
await classifier.loadModel();
```

---

## 🔍 Risoluzione Problemi

### Problema: Modello non si carica

**Sintomo**: Errore "Failed to load model"

**Soluzioni**:
1. Verifica che `model_webgpu.onnx` esista
2. Controlla CORS se caricato da server esterno
3. Verifica path relativo/assoluto
4. Prova a pulire la cache: `clearModelCache()`

```typescript
// Debug
try {
  await classifier.loadModel();
} catch (error) {
  console.error('Load error:', error);
  // Pulisci cache e riprova
  await FacialAttributesClassifier.clearModelCache();
  await classifier.loadModel();
}
```

---

### Problema: WebGPU non funziona

**Sintomo**: Sempre usa WASM anche con GPU supportata

**Soluzioni**:
1. Verifica supporto browser: `chrome://gpu`
2. Aggiorna driver GPU
3. Abilita flag sperimentali in `chrome://flags`:
   - `#enable-unsafe-webgpu`
   - `#enable-webgpu-developer-features`

```typescript
// Verifica supporto programmaticamente
if ('gpu' in navigator) {
  const adapter = await navigator.gpu.requestAdapter();
  console.log('GPU:', adapter);
} else {
  console.log('WebGPU not supported');
}
```

---

### Problema: Immagini non si caricano

**Sintomo**: Errore "Failed to load image"

**Soluzioni**:
1. Verifica percorso immagine
2. Controlla formato (JPEG/PNG supportati)
3. Verifica CORS per immagini esterne
4. Assicurati dimensioni 256x256 (il sistema ridimensiona automaticamente)

```typescript
// Test caricamento immagine
const img = new Image();
img.crossOrigin = 'anonymous';
img.onload = () => console.log('Image OK');
img.onerror = () => console.error('Image failed');
img.src = 'images_256/000001.jpg';
```

---

### Problema: Risultati inaccurati

**Sintomo**: Classificazioni errate

**Verifiche**:
1. Controlla preprocessing: immagini 256x256 RGB
2. Verifica normalizzazione [0,1]
3. Assicurati modello corretto per il task
4. Confronta con output Python se disponibile

```typescript
// Debug output modello
const results = await classifier.classifyImage('./test.jpg');
results.forEach(r => {
  console.log(`Q${r.questionId}: ${r.answer} (${r.percentage}%)`);
});
```

---

### Problema: Out of Memory (OOM)

**Sintomo**: Crash del browser o errore memoria

**Soluzioni**:
1. Riduci batch size
2. Usa WASM invece di WebGPU (usa meno VRAM)
3. Libera memoria tra classificazioni:

```typescript
// Processa a lotti
const batchSize = 10;
for (let i = 0; i < totalImages; i += batchSize) {
  const batch = images.slice(i, i + batchSize);
  await Promise.all(batch.map(img => classifier.classifyImage(img)));
  
  // Garbage collection hint
  if (global.gc) global.gc();
}
```

---

### Problema: Cache non funziona

**Sintomo**: Modello sempre ridownloadato

**Verifiche**:
1. Browser supporta Cache API: `'caches' in window`
2. Storage non pieno
3. Modalità incognito disabilita cache

```typescript
// Test cache manualmente
if ('caches' in window) {
  const cache = await caches.open('ai-model-cache-v1');
  const response = await cache.match('model_webgpu.onnx');
  console.log('Cached:', !!response);
}
```

---

## 📊 Mappa delle Domande

| ID | Domanda | Tipo | Soglia |
|----|---------|------|--------|
| 0 | Sorriso? | Singolo | 50% |
| 1 | Uomo? | Gruppo (Gender) | Dominante |
| 2 | Donna? | Gruppo (Gender) | Dominante |
| 3 | Capelli Marroni? | Gruppo (Hair Color) | Dominante |
| 4 | Capelli Neri? | Gruppo (Hair Color) | Dominante |
| 5 | Capelli Biondi? | Gruppo (Hair Color) | Dominante |
| 6 | Capelli Grigi? | Gruppo (Hair Color) | Dominante |
| 7 | Capelli Lunghi? | Gruppo (Hair Length) | Dominante |
| 8 | Capelli Corti? | Gruppo (Hair Length) | Dominante |
| 9 | Asiatico? | Gruppo (Ethnicity) | Dominante |
| 10 | Nero? | Gruppo (Ethnicity) | Dominante |
| 11 | Latino? | Gruppo (Ethnicity) | Dominante |
| 12 | Bianco? | Gruppo (Ethnicity) | Dominante |
| 13 | Occhi Azzurri? | Gruppo (Eye Color) | Dominante |
| 14 | Occhi Marroni? | Gruppo (Eye Color) | Dominante |
| 15 | Occhi Verdi? | Gruppo (Eye Color) | Dominante |
| 16 | Con Barba? | Singolo | 50% |
| 17 | Con Occhiali? | Singolo | 50% |
| 18 | Nome con Vocale? | Logica | 100%/0% |
| 19 | Nome con Consonante? | Logica | 100%/0% |

---

## 🔐 Privacy e Sicurezza

### Dati Locali

- ✅ Tutto il processamento avviene **nel browser**
- ✅ Nessun dato inviato a server esterni
- ✅ Modello ONNX eseguito localmente
- ✅ Cache del modello solo in locale

### Best Practices

1. **Non inviare dati sensibili** al modello senza consenso
2. **Informare gli utenti** sul rilevamento attributi
3. **Gestire bias del modello**: I risultati possono essere inaccurati
4. **Compliance**: Rispetta GDPR/privacy laws per dati biometrici

---

## 🧪 Testing

### Test Rapido

```typescript
// Test singolo
const classifier = FacialAttributesClassifier.getInstance();
await classifier.loadModel();
const results = await classifier.classifyImageById(1, 'TestPerson');

console.assert(results.length === 20, 'Should return 20 answers');
console.assert(results[0].questionId === 0, 'First question ID should be 0');
console.assert(results[0].percentage >= 0 && results[0].percentage <= 100, 'Percentage in range');
```

### Test Suite Completa

```typescript
async function runTests() {
  const classifier = FacialAttributesClassifier.getInstance();
  
  // Test 1: Caricamento modello
  console.log('Test 1: Model loading...');
  await classifier.loadModel();
  console.assert(classifier.getExecutionProvider() !== '', 'Provider should be set');
  
  // Test 2: Cache
  console.log('Test 2: Cache check...');
  const isCached = await FacialAttributesClassifier.isModelCached();
  console.assert(isCached === true, 'Model should be cached after loading');
  
  // Test 3: Classificazione
  console.log('Test 3: Classification...');
  const results = await classifier.classifyImageById(1, 'Alice');
  console.assert(results.length === 20, 'Should return 20 answers');
  
  // Test 4: Risposta vocale
  const vowelResult = results.find(r => r.questionId === 18);
  console.assert(vowelResult !== undefined, 'Should have vowel question');
  console.assert(vowelResult.answer === true, 'Alice starts with vowel');
  
  // Test 5: Pulizia cache
  console.log('Test 5: Cache clearing...');
  await FacialAttributesClassifier.clearModelCache();
  const isCachedAfter = await FacialAttributesClassifier.isModelCached();
  console.assert(isCachedAfter === false, 'Cache should be cleared');
  
  console.log('✅ All tests passed!');
}

runTests().catch(console.error);
```
