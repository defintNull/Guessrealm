import * as ort from 'onnxruntime-web/webgpu';
import type { AxiosInstance } from "axios";

/**
 * ============================================================================
 * CONFIGURAZIONE GLOBALE
 * ============================================================================
 * Questo oggetto contiene tutte le configurazioni necessarie per il
 * funzionamento del classificatore di attributi facciali.
 */
const CONFIG = {
    // Percorso del modello ONNX ottimizzato per WebGPU
    modelPath: 'model_webgpu.onnx',

    // Cartella contenente le immagini 256x256 da classificare
    imageFolder: 'images_256',

    /**
     * Nomi degli attributi che il modello è in grado di rilevare.
     * Questi corrispondono agli output del modello neurale e rappresentano
     * caratteristiche facciali distinte che possono essere identificate.
     */
    attributeNames: [
        'smile',                    // Presenza di sorriso
        'gender_male',              // Genere maschile
        'gender_female',            // Genere femminile
        'hair_brown',               // Capelli di colore marrone
        'hair_black',               // Capelli di colore nero
        'hair_blond',               // Capelli di colore biondo
        'hair_gray',                // Capelli di colore grigio
        'hair_long',                // Capelli lunghi
        'hair_short',               // Capelli corti
        'ethnicity_asian',          // Etnia asiatica
        'ethnicity_black',          // Etnia africana
        'ethnicity_latino',         // Etnia latina
        'ethnicity_white',          // Etnia caucasica
        'eye_blue',                 // Occhi azzurri
        'eye_brown',                // Occhi marroni
        'eye_green',                // Occhi verdi
        'has_facial_hair',          // Presenza di barba/baffi
        'a person with eyeglasses'  // Presenza di occhiali
    ],

    /**
     * Gruppi di attributi mutuamente esclusivi.
     * Questi gruppi identificano attributi dove solo uno può essere
     * dominante (es: non si può essere contemporaneamente uomo E donna).
     */
    attributeGroups: [
        { name: 'Gender', indices: [1, 2] },           // Genere: maschile o femminile
        { name: 'Hair Color', indices: [3, 4, 5, 6] }, // Colore capelli: uno solo dominante
        { name: 'Hair Length', indices: [7, 8] },      // Lunghezza capelli: lunghi o corti
        { name: 'Ethnicity', indices: [9, 10, 11, 12] }, // Etnia: una sola dominante
        { name: 'Eye Color', indices: [13, 14, 15] }   // Colore occhi: uno solo dominante
    ],

    /**
     * Mappatura degli indici degli attributi ai loro nomi in italiano.
     * Utilizzato per presentare i risultati in modo user-friendly.
     */
    displayMapping: {
        0: 'Sorriso',
        1: 'Uomo',
        2: 'Donna',
        3: 'Capelli Marroni',
        4: 'Capelli Neri',
        5: 'Capelli Biondi',
        6: 'Capelli Grigi',
        7: 'Capelli Lunghi',
        8: 'Capelli Corti',
        9: 'Asiatico',
        10: 'Nero',
        11: 'Latino',
        12: 'Bianco',
        13: 'Occhi Azzurri',
        14: 'Occhi Marroni',
        15: 'Occhi Verdi',
        16: 'Con Barba',
        17: 'Con Occhiali'
    },

    /**
     * Mapping da ID domanda agli indici degli attributi corrispondenti.
     * Permette di associare ogni domanda (0-17) ai tratti del modello.
     * Le domande 18-19 sono gestite separatamente (nome con vocale/consonante).
     */
    questionToIndices: {
        0: [0],              // Sorriso
        1: [1],              // Uomo
        2: [2],              // Donna
        3: [3],              // Capelli Marroni
        4: [4],              // Capelli neri
        5: [5],              // Capelli biondi
        6: [6],              // Capelli grigi
        7: [7],              // Capelli lunghi
        8: [8],              // Capelli corti
        9: [9],              // Etnia asiatico
        10: [10],            // Etnia africano
        11: [11],            // Etnia latino
        12: [12],            // Etnia caucasica
        13: [13],            // Occhi azzurri
        14: [14],            // Occhi marroni
        15: [15],            // Occhi verdi
        16: [16],            // Con Barba
        17: [17]             // Con Occhiali
    } as Record<number, number[]>
};


/**
 * ============================================================================
 * DEFINIZIONE TIPI TYPESCRIPT
 * ============================================================================
 */

/**
 * Rappresenta un attributo facciale rilevato dal modello.
 */
type Attribute = {
  name: string | undefined;      // Nome dell'attributo (es: 'smile', 'gender_male')
  probability: number;            // Probabilità tra 0 e 1 dopo applicazione sigmoide
  rawValue: number;               // Valore grezzo dell'output neurale (logit)
  index: number;                  // Indice dell'attributo nell'array CONFIG.attributeNames
  displayName?: string;           // Nome visualizzato in italiano (opzionale)
};

/**
 * Risposta a una domanda specifica sull'immagine.
 * Esportato per uso esterno del modulo.
 */
export type QuestionAnswer = {
  questionId: number;    // ID della domanda (0-19)
  answer: boolean;       // Risposta binaria: vero o falso
  percentage: number;    // Confidenza della risposta in percentuale (0-100)
};

/**
 * ============================================================================
 * CLASSE PRINCIPALE: FacialAttributesClassifier
 * ============================================================================
 * Classificatore di attributi facciali che utilizza un modello ONNX.
 * Supporta accelerazione WebGPU per inferenza più veloce e caching del modello.
 *
 * Pattern: Singleton - garantisce una sola istanza del classificatore.
 */
export class FacialAttributesClassifier {
    // Istanza singleton della classe
    private static instance: FacialAttributesClassifier | null = null;

    // Sessione di inferenza ONNX Runtime
    private session: ort.InferenceSession | null = null;

    // Provider di esecuzione effettivamente utilizzato ('webgpu' o 'wasm')
    private executionProvider: string = '';

    /**
     * Costruttore privato (pattern Singleton)
     */
    public constructor() {}

    /**
     * Restituisce l'istanza singleton del classificatore.
     * Se non esiste, la crea.
     */
    public static getInstance(): FacialAttributesClassifier {
        if (!FacialAttributesClassifier.instance) {
            FacialAttributesClassifier.instance = new FacialAttributesClassifier();
        }
        return FacialAttributesClassifier.instance;
    }

    /**
     * ========================================================================
     * CARICAMENTO DEL MODELLO
     * ========================================================================
     * Carica il modello ONNX con supporto per:
     * - WebGPU (accelerazione GPU)
     * - WASM (fallback CPU)
     * - Cache API del browser (per caricamenti successivi istantanei)
     * - Axios o Fetch per il download
     *
     * @param useWebGpu - Se true, tenta di utilizzare WebGPU
     * @param modelPath - Percorso personalizzato del modello (opzionale)
     * @param axios - Istanza di Axios per il download (opzionale)
     */
    async loadModel(useWebGpu: boolean = true, modelPath?: string, axios?: AxiosInstance): Promise<void> {
        const mPath = modelPath || CONFIG.modelPath;
        const CACHE_NAME = 'ai-model-cache-v1';

        try {
            // Configurazione delle opzioni della sessione ONNX
            const sessionOptions: ort.InferenceSession.SessionOptions = {
                executionProviders: [],           // Verrà popolato in base al supporto hardware
                graphOptimizationLevel: 'all',    // Massima ottimizzazione del grafo computazionale
            };

            let modelBuffer: ArrayBuffer;

            // ================================================================
            // GESTIONE CACHE DEL MODELLO
            // ================================================================
            // Tentativo di caricare il modello dalla cache del browser
            // per evitare download ripetuti e velocizzare il caricamento.
            if ('caches' in window) {
                try {
                    const cache = await caches.open(CACHE_NAME);
                    let cachedResponse = await cache.match(mPath);

                    if (cachedResponse) {
                        // ✅ Modello trovato in cache
                        console.log('✅ Model loaded from cache!');
                        modelBuffer = await cachedResponse.arrayBuffer();
                    } else {
                        // ❌ Modello non in cache, download necessario
                        console.log('📥 Downloading model (first time)...');

                        if (axios) {
                            // Download con Axios
                            const modelResponse = await axios.get(mPath, { responseType: "arraybuffer" });
                            modelBuffer = modelResponse.data;

                            // Salva in cache convertendo ArrayBuffer in Response
                            const blob = new Blob([modelBuffer]);
                            const response = new Response(blob);
                            await cache.put(mPath, response);
                            console.log('💾 Model cached successfully (from axios)!');
                        } else {
                            // Download con Fetch nativo
                            const response = await fetch(mPath);

                            if (!response.ok) {
                                throw new Error(`Failed to fetch model: ${response.status}`);
                            }

                            // Salva in cache clonando la response
                            await cache.put(mPath, response.clone());
                            console.log('💾 Model cached successfully (from fetch)!');

                            modelBuffer = await response.arrayBuffer();
                        }
                    }
                } catch (cacheError) {
                    // Gestione errori della cache con fallback a download diretto
                    console.warn('⚠️  Cache error, falling back to direct download:', cacheError);

                    if (axios) {
                        const modelResponse = await axios.get(mPath, { responseType: "arraybuffer" });
                        modelBuffer = modelResponse.data;
                    } else {
                        const response = await fetch(mPath);
                        modelBuffer = await response.arrayBuffer();
                    }
                }
            } else {
                // Browser non supporta Cache API - download diretto
                if (axios) {
                    const modelResponse = await axios.get(mPath, { responseType: "arraybuffer" });
                    modelBuffer = modelResponse.data;
                } else {
                    const response = await fetch(mPath);
                    modelBuffer = await response.arrayBuffer();
                }
            }

            // ================================================================
            // SELEZIONE EXECUTION PROVIDER
            // ================================================================
            // Determina se utilizzare WebGPU (GPU) o WASM (CPU)
            if (useWebGpu) {
                // Verifica supporto WebGPU nel browser
                if ('gpu' in navigator) {
                    try {
                        const adapter = await (navigator as any).gpu.requestAdapter();
                        if (adapter) {
                            console.log('✅ WebGPU supported, attempting to use it...');
                            sessionOptions.executionProviders = ['webgpu'];
                        } else {
                            console.warn('⚠️  WebGPU not available, falling back to WASM');
                            sessionOptions.executionProviders = ['wasm'];
                        }
                    } catch (err) {
                        console.warn('⚠️  WebGPU check failed, using WASM:', err);
                        sessionOptions.executionProviders = ['wasm'];
                    }
                } else {
                    console.warn('⚠️  WebGPU not supported by browser, using WASM');
                    sessionOptions.executionProviders = ['wasm'];
                }
            } else {
                console.log('🔄 Using WASM (CPU) as requested');
                sessionOptions.executionProviders = ['wasm'];
            }

            // ================================================================
            // CREAZIONE SESSIONE ONNX
            // ================================================================
            // Inizializza la sessione di inferenza con il modello caricato
            this.session = await ort.InferenceSession.create(modelBuffer, sessionOptions);

            // Determina quale provider è stato effettivamente utilizzato
            // (potrebbe differire da quello richiesto se non disponibile)
            this.executionProvider = (this.session as any).handler?._ep ||
                                    sessionOptions.executionProviders[0] ||
                                    'unknown';

            console.log('✅ Model loaded successfully');
            console.log(`🎮 Execution provider: ${this.executionProvider}`);

        } catch (error) {
            throw new Error(`Failed to load model: ${error}`);
        }
    }

    /**
     * ========================================================================
     * PRE-PROCESSAMENTO IMMAGINE
     * ========================================================================
     * Prepara un'immagine 256x256 per l'inferenza del modello.
     *
     * Passaggi:
     * 1. Carica l'immagine in un elemento HTML Image
     * 2. Disegna su canvas per accedere ai pixel
     * 3. Normalizza i valori RGB da [0, 255] a [0, 1]
     * 4. Riorganizza i dati da HWC a CHW (Height-Width-Channels → Channels-Height-Width)
     *
     * @param imageSrc - URL o percorso dell'immagine
     * @returns Float32Array con i dati dell'immagine pronti per il modello
     */
    private async preprocessImage(imageSrc: string): Promise<Float32Array> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';  // Permette caricamento cross-origin

            img.onload = () => {
                try {
                    // Crea canvas per manipolare l'immagine
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    if (!ctx) {
                        reject(new Error('Could not get canvas context'));
                        return;
                    }

                    // Imposta dimensioni canvas (modello richiede 256x256)
                    canvas.width = 256;
                    canvas.height = 256;

                    // Disegna l'immagine sul canvas
                    ctx.drawImage(img, 0, 0, 256, 256);

                    // Estrai i dati dei pixel
                    const imageData = ctx.getImageData(0, 0, 256, 256);
                    const { data } = imageData;

                    // Prepara array per i dati normalizzati
                    // Formato: 3 canali (RGB) * 256 * 256 pixel = 196,608 valori
                    const float32Data = new Float32Array(3 * 256 * 256);

                    // ============================================================
                    // NORMALIZZAZIONE E RIORGANIZZAZIONE
                    // ============================================================
                    // Converti da formato browser (RGBA, valori 0-255, layout HWC)
                    // a formato modello (RGB, valori 0-1, layout CHW)
                    for (let i = 0; i < 256 * 256; i++) {
                        // Indici nel formato RGBA (4 byte per pixel)
                        const r = data[i * 4];     // Rosso
                        const g = data[i * 4 + 1]; // Verde
                        const b = data[i * 4 + 2]; // Blu
                        // Alpha (data[i * 4 + 3]) viene ignorato

                        // Normalizza da [0, 255] a [0, 1]
                        // e riorganizza in formato CHW
                        float32Data[i] = r / 255.0;                    // Canale R
                        float32Data[256 * 256 + i] = g / 255.0;        // Canale G
                        float32Data[2 * 256 * 256 + i] = b / 255.0;    // Canale B
                    }

                    resolve(float32Data);
                } catch (err) {
                    reject(err);
                }
            };

            img.onerror = () => {
                reject(new Error(`Failed to load image: ${imageSrc}`));
            };

            // Avvia il caricamento dell'immagine
            img.src = imageSrc;
        });
    }

    /**
     * ========================================================================
     * VERIFICA INIZIALE NOME (VOCALE)
     * ========================================================================
     * Determina se un nome inizia con una vocale.
     * Utilizzato per le domande 18 e 19.
     *
     * @param name - Nome da verificare
     * @returns true se inizia con vocale, false altrimenti
     */
    private startsWithVowel(name?: string): boolean {
        if (!name || name.length === 0) return false;
        const firstChar = name.charAt(0).toLowerCase();
        return ['a', 'e', 'i', 'o', 'u'].includes(firstChar);
    }

    /**
     * ========================================================================
     * CALCOLO PROBABILITÀ PER DOMANDA
     * ========================================================================
     * Calcola la probabilità che una specifica domanda abbia risposta positiva.
     *
     * Per attributi non raggruppati (Sorriso, Barba, Occhiali):
     *   - Restituisce direttamente la probabilità dell'attributo
     *
     * Per attributi raggruppati (Genere, Colore Capelli, Etnia, ecc.):
     *   - Restituisce la probabilità dell'attributo con valore massimo nel gruppo
     *
     * @param questionId - ID della domanda
     * @param attributes - Array di tutti gli attributi rilevati
     * @returns Probabilità tra 0 e 1
     */
    private getQuestionProbability(questionId: number, attributes: Attribute[]): number {
        const indices = CONFIG.questionToIndices[questionId];
        if (!indices || indices.length === 0) return 0;

        // Trova il gruppo a cui appartiene questa domanda (se esiste)
        const group = CONFIG.attributeGroups.find(g =>
            g.indices.some(idx => indices.includes(idx))
        );

        if (!group) {
            // Attributo non raggruppato: restituisci la sua probabilità
            const attr = attributes.find(a => a.index === indices[0]);
            return attr ? attr.probability : 0;
        }

        // Attributo raggruppato: trova il massimo nel gruppo
        const groupAttributes = attributes.filter(a => group.indices.includes(a.index));
        const maxAttr = groupAttributes.reduce((max, curr) =>
            curr.probability > max.probability ? curr : max
        , groupAttributes[0]);

        // Se l'attributo con probabilità massima corrisponde alla domanda,
        // restituisci la sua probabilità, altrimenti 0
        return indices.includes(maxAttr?.index) ? maxAttr.probability : 0;
    }

    /**
     * ========================================================================
     * IDENTIFICAZIONE TRATTI DOMINANTI
     * ========================================================================
     * Per ogni gruppo di attributi mutuamente esclusivi, identifica
     * l'attributo con la probabilità più alta.
     *
     * Ad esempio, nel gruppo "Gender", se gender_male ha probabilità 0.8
     * e gender_female ha 0.2, il tratto dominante sarà "Uomo".
     *
     * @param attributes - Array di tutti gli attributi rilevati
     * @returns Map con i tratti dominanti per ogni gruppo
     */
    private getDominantAttributes(attributes: Attribute[]): Map<string, number> {
        const dominantTraits = new Map<string, number>();

        // Itera su ogni gruppo di attributi
        CONFIG.attributeGroups.forEach(group => {
            // Filtra gli attributi appartenenti al gruppo corrente
            const groupAttrs = attributes.filter(attr =>
                group.indices.includes(attr.index)
            );

            if (groupAttrs.length === 0) return;

            // Trova l'attributo con la probabilità massima
            const maxAttr = groupAttrs.reduce((max, curr) =>
                curr.probability > max.probability ? curr : max
            );

            // Aggiungi alla mappa dei tratti dominanti
            const displayName = CONFIG.displayMapping[maxAttr.index as keyof typeof CONFIG.displayMapping];
            if (displayName) {
                dominantTraits.set(displayName, maxAttr.probability);
            }
        });

        return dominantTraits;
    }

    /**
     * ========================================================================
     * CLASSIFICAZIONE IMMAGINE - METODO PRINCIPALE
     * ========================================================================
     * Esegue la classificazione completa di un'immagine:
     * 1. Pre-processa l'immagine
     * 2. Esegue l'inferenza con il modello neurale
     * 3. Post-processa i risultati applicando la funzione sigmoide
     * 4. Identifica i tratti dominanti
     * 5. Genera le risposte alle 20 domande (0-19)
     *
     * Domande 0-17: Attributi del modello
     * Domanda 18: Nome inizia con vocale
     * Domanda 19: Nome inizia con consonante
     *
     * @param imageSrc - URL o percorso dell'immagine
     * @param imageName - Nome associato all'immagine (per domande 18-19)
     * @returns Array di 20 QuestionAnswer
     */
    public async classifyImage(imageSrc: string, imageName?: string): Promise<QuestionAnswer[]> {
        try {
            // Verifica che il modello sia stato caricato
            if (!this.session) {
                throw new Error('Model not loaded. Call loadModel() first.');
            }

            console.log(`🖼️  Classifying image: ${imageName || imageSrc}`);

            // ================================================================
            // STEP 1: PRE-PROCESSAMENTO
            // ================================================================
            const imageData = await this.preprocessImage(imageSrc);
            console.log(`📐 Image preprocessed: ${imageData.length} values`);

            // ================================================================
            // STEP 2: CREAZIONE TENSORE DI INPUT
            // ================================================================
            // Crea un tensore ONNX con shape [1, 3, 256, 256]
            // - 1: batch size (una immagine alla volta)
            // - 3: canali RGB
            // - 256x256: dimensioni immagine
            const tensor = new ort.Tensor('float32', imageData, [1, 3, 256, 256]);

            // Prepara i feed per l'inferenza
            const feeds: Record<string, ort.Tensor> = {};
            const inputName = this.session.inputNames && this.session.inputNames.length > 0
                ? this.session.inputNames[0]
                : undefined;

            if (inputName) {
                feeds[inputName] = tensor;
            }

            // ================================================================
            // STEP 3: INFERENZA
            // ================================================================
            const output = await this.session.run(feeds);

            // Estrai il tensore di output
            const outputName = this.session.outputNames && this.session.outputNames.length > 0
                ? this.session.outputNames[0]
                : Object.keys(output)[0];

            if (!outputName) {
                throw new Error('Unable to determine output name');
            }

            const outputTensor = output[outputName];
            if (!outputTensor) {
                throw new Error('Output tensor is undefined');
            }

            const predictions = outputTensor.data as ArrayLike<number>;
            console.log(`📊 Received ${predictions.length} predictions`);

            // ================================================================
            // STEP 4: POST-PROCESSAMENTO - APPLICAZIONE SIGMOIDE
            // ================================================================
            // Il modello restituisce logit (valori non normalizzati).
            // Applichiamo la funzione sigmoide per convertirli in probabilità [0, 1].
            // Sigmoide: σ(x) = 1 / (1 + e^(-x))
            const attributes: Attribute[] = [];
            for (let i = 0; i < predictions.length && i < CONFIG.attributeNames.length; i++) {
                const pred = predictions[i];
                if (pred !== undefined && pred !== null) {
                    const probability = 1 / (1 + Math.exp(-pred));  // Funzione sigmoide
                    attributes.push({
                        name: CONFIG.attributeNames[i],
                        probability,
                        rawValue: pred,
                        index: i
                    });
                }
            }

            // ================================================================
            // STEP 5: IDENTIFICAZIONE TRATTI DOMINANTI
            // ================================================================
            const dominantTraits = this.getDominantAttributes(attributes);

            // ================================================================
            // STEP 6: GENERAZIONE RISPOSTE ALLE DOMANDE
            // ================================================================
            const answers: QuestionAnswer[] = [];
            const isVowel = this.startsWithVowel(imageName);
            const numQuestions = 19;  // Domande 0-19 (totale 20)

            for (let questionId = 0; questionId <= numQuestions; questionId++) {
                if (questionId === (numQuestions - 1)) {
                    // ========================================================
                    // DOMANDA 18: Nome inizia con vocale?
                    // ========================================================
                    answers.push({
                        questionId,
                        answer: isVowel,
                        percentage: isVowel ? 100 : 0
                    });
                } else if (questionId === numQuestions) {
                    // ========================================================
                    // DOMANDA 19: Nome inizia con consonante?
                    // ========================================================
                    answers.push({
                        questionId,
                        answer: !isVowel,
                        percentage: !isVowel ? 100 : 0
                    });
                } else {
                    // ========================================================
                    // DOMANDE 0-17: Attributi del modello
                    // ========================================================
                    const indices = CONFIG.questionToIndices[questionId];
                    if (indices && indices.length > 0) {
                        const probability = this.getQuestionProbability(questionId, attributes);
                        const percentage = Math.round(probability * 100);

                        // Determina se la risposta è true o false
                        let answer = false;

                        // Attributi non raggruppati (Sorriso, Barba, Occhiali):
                        // Usa soglia 50%
                        if (questionId === 0 || questionId === 16 || questionId === 17) {
                            answer = probability > 0.5;
                        } else {
                            // Attributi raggruppati:
                            // Controlla se questo attributo è dominante nel suo gruppo
                            for (const [displayName] of Array.from(dominantTraits.entries())) {
                                const displayIndices = indices.map(idx =>
                                    CONFIG.displayMapping[idx as keyof typeof CONFIG.displayMapping]
                                );
                                if (displayIndices.includes(displayName)) {
                                    answer = true;
                                    break;
                                }
                            }
                        }

                        answers.push({
                            questionId,
                            answer,
                            percentage
                        });
                    } else {
                        // Attributo non presente nel mapping
                        answers.push({
                            questionId,
                            answer: false,
                            percentage: 0
                        });
                    }
                }
            }

            // ================================================================
            // STEP 7: STAMPA RISULTATI SU CONSOLE
            // ================================================================
            this.printResults(answers, imageName || imageSrc);

            return answers;

        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            throw new Error(`Failed to classify image: ${message}`);
        }
    }

    /**
     * ========================================================================
     * CLASSIFICAZIONE PER ID IMMAGINE
     * ========================================================================
     * Versione semplificata che accetta un ID numerico invece del percorso completo.
     * Costruisce automaticamente il percorso come: images_256/000001.jpg
     *
     * @param imageId - ID numerico dell'immagine (es: 1, 42, 999)
     * @param imageName - Nome associato all'immagine
     * @returns Array di 20 QuestionAnswer
     */
    public async classifyImageById(imageId: number, imageName?: string): Promise<QuestionAnswer[]> {
        // Formatta l'ID con padding di zeri (es: 1 → "000001")
        const paddedNumber = String(imageId).padStart(6, '0');
        const imageUrl = `${CONFIG.imageFolder}/${paddedNumber}.jpg`;
        return this.classifyImage(imageUrl, imageName);
    }

    /**
     * ========================================================================
     * STAMPA RISULTATI SU CONSOLE
     * ========================================================================
     * Visualizza i risultati in formato tabulare con barre di progresso.
     * Utile per debug e visualizzazione rapida.
     *
     * @param answers - Risposte alle domande
     * @param imageName - Nome dell'immagine
     */
    private printResults(answers: QuestionAnswer[], imageName: string): void {
        console.log(`\n📋 Results for: ${imageName}`);
        console.log('═'.repeat(60));

        // Etichette delle domande in italiano
        const questionLabels: Record<number, string> = {
            0: 'Sorriso',
            1: 'Uomo',
            2: 'Donna',
            3: 'Capelli Marroni',
            4: 'Capelli Neri',
            5: 'Capelli Biondi',
            6: 'Capelli Grigi',
            7: 'Capelli Lunghi',
            8: 'Capelli Corti',
            9: 'Asiatico',
            10: 'Nero',
            11: 'Latino',
            12: 'Bianco',
            13: 'Occhi Azzurri',
            14: 'Occhi Marroni',
            15: 'Occhi Verdi',
            16: 'Con Barba',
            17: 'Con Occhiali',
            18: 'Nome con Vocale',
            19: 'Nome con Consonante'
        };

        // Stampa ogni risposta con formattazione
        answers.forEach((qa) => {
            const label = questionLabels[qa.questionId] || `Q${qa.questionId}`;
            const answerStr = qa.answer ? '✓ Sì' : '✗ No';

            // Barra di progresso visiva (10 caratteri max)
            const bar = '█'.repeat(Math.round(qa.percentage / 10));

            console.log(
                `${String(qa.questionId).padStart(2)}. ${label.padEnd(20)} → ${answerStr.padEnd(6)} [${bar.padEnd(10)}] ${qa.percentage}%`
            );
        });

        console.log('═'.repeat(60));
    }

    /**
     * ========================================================================
     * GETTER: EXECUTION PROVIDER
     * ========================================================================
     * Restituisce il provider di esecuzione attualmente in uso.
     * Utile per verificare se WebGPU è stato effettivamente utilizzato.
     *
     * @returns 'webgpu', 'wasm', o 'unknown'
     */
    public getExecutionProvider(): string {
        return this.executionProvider;
    }

    /**
     * ========================================================================
     * METODI STATICI DI GESTIONE CACHE
     * ========================================================================
     */

    /**
     * Pulisce la cache del modello.
     * Utile quando si vuole forzare il ridownload (es: aggiornamento modello).
     *
     * @param cacheName - Nome della cache da eliminare
     */
    public static async clearModelCache(cacheName: string = 'ai-model-cache-v1'): Promise<void> {
        if ('caches' in window) {
            const deleted = await caches.delete(cacheName);
            if (deleted) {
                console.log(`🗑️  Cache "${cacheName}" cleared successfully`);
            } else {
                console.log(`ℹ️  Cache "${cacheName}" not found or already cleared`);
            }
        }
    }

    /**
     * Verifica se il modello è presente in cache.
     * Utile per mostrare indicatori di caricamento all'utente.
     *
     * @param modelPath - Percorso del modello da verificare
     * @param cacheName - Nome della cache
     * @returns true se il modello è in cache, false altrimenti
     */
    public static async isModelCached(modelPath: string = CONFIG.modelPath, cacheName: string = 'ai-model-cache-v1'): Promise<boolean> {
        if ('caches' in window) {
            const cache = await caches.open(cacheName);
            const response = await cache.match(modelPath);
            return response !== undefined;
        }
        return false;
    }
}

/**
 * ============================================================================
 * FUNZIONI DI UTILITÀ ESPORTATE
 * ============================================================================
 * Queste funzioni wrapper semplificano l'uso del classificatore per casi comuni.
 */

/**
 * Classifica un'immagine dato il suo ID numerico.
 * Crea un'istanza del classificatore, carica il modello ed esegue la classificazione.
 *
 * @param imageId - ID numerico dell'immagine
 * @param imageName - Nome associato all'immagine
 * @param options - Opzioni di configurazione
 * @returns Array di 20 QuestionAnswer
 *
 * @example
 * const results = await classifyImageById(42, "Alice", { useWebGpu: true });
 */
export async function classifyImageById(
    imageId: number,
    imageName?: string,
    options?: {
        modelPath?: string;
        useWebGpu?: boolean;
    }
): Promise<QuestionAnswer[]> {
    const classifier = new FacialAttributesClassifier();
    await classifier.loadModel(options?.useWebGpu ?? true, options?.modelPath);
    const answers = await classifier.classifyImageById(imageId, imageName);

    return answers;
}

/**
 * Classifica un'immagine dato il suo percorso/URL.
 * Crea un'istanza del classificatore, carica il modello ed esegue la classificazione.
 *
 * @param imageSrc - URL o percorso dell'immagine
 * @param imageName - Nome associato all'immagine
 * @param options - Opzioni di configurazione
 * @returns Array di 20 QuestionAnswer
 *
 * @example
 * const results = await classifyImage("./images/photo.jpg", "Bob");
 */
export async function classifyImage(
    imageSrc: string,
    imageName?: string,
    options?: {
        modelPath?: string;
        useWebGpu?: boolean;
    }
): Promise<QuestionAnswer[]> {
    const classifier = new FacialAttributesClassifier();
    await classifier.loadModel(options?.useWebGpu ?? true, options?.modelPath);
    const answers = await classifier.classifyImage(imageSrc, imageName);

    return answers;
}
