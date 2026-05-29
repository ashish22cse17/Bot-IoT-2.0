// Prediction Service for IoT-IDS
// Centralized logic for SVM and Random Forest predictions
// Ready for future backend API integration

export type ModelType = 'svm' | 'rf' | 'dnn' | 'cnn';

export type PredictionLabel = 'attack' | 'normal';

export interface NetworkFeatures {
  packetSize: number;
  flowDuration: number;
  protocol: string;
  srcPort: number;
  dstPort: number;
  packetRate: number;
  byteRate?: number;
  flowPackets?: number;
  tcpFlags?: number;
  payloadSize?: number;
}

export interface PredictionRequest {
  model: ModelType;
  features: NetworkFeatures;
  source?: 'csv' | 'manual' | 'quick-test';
}

export interface PredictionResult {
  prediction: PredictionLabel;
  probability: number;
  model: ModelType;
  modelName: string;
  timestamp: string;
  attackType?: string;
  features?: NetworkFeatures;
}

// Sample attack patterns for simulation
export const ATTACK_SAMPLE: NetworkFeatures = {
  packetSize: 64,
  flowDuration: 100,
  protocol: 'UDP',
  srcPort: 12345,
  dstPort: 80,
  packetRate: 50000,
  byteRate: 3200000,
  flowPackets: 5000,
  tcpFlags: 0,
  payloadSize: 0,
};

export const NORMAL_SAMPLE: NetworkFeatures = {
  packetSize: 1024,
  flowDuration: 5000,
  protocol: 'TCP',
  srcPort: 54321,
  dstPort: 443,
  packetRate: 100,
  byteRate: 102555,
  flowPackets: 50,
  tcpFlags: 24,
  payloadSize: 512,
};

// Model display names
export const MODEL_NAMES: Record<ModelType, string> = {
  svm: 'Support Vector Machine (SVM)',
  rf: 'Random Forest (RF)',
  dnn: 'Deep Neural Network (DNN)',
  cnn: 'Convolutional Neural Network (CNN)',
};

// NOTE: local simulation removed — frontend uses backend /predict for all predictions.

// Main prediction function - Now calls actual backend API
export async function predict(request: PredictionRequest): Promise<PredictionResult> {
  // Map frontend model name to backend model name
  const backendModel = request.model;
  const payload = { model: backendModel, ...request.features } as Record<string, any>;
  // debug: log outgoing payload
  console.debug('[predict] sending payload to backend:', payload);

  try {
    const response = await fetch('http://localhost:5020/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // debug: log status
    console.debug('[predict] response status:', response.status, response.statusText);

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      console.error('[predict] backend error body:', errBody);
      throw new Error(errBody.error || 'Prediction failed');
    }

    const data = await response.json();
    console.debug('[predict] backend response:', data);
    
    // Map backend response to frontend format
    const isAttack = data.prediction === 1;
    const probability = data.probabilities 
      ? (data.probabilities[1] || 0) * 100
      : 0;
    
    const result: PredictionResult = {
      prediction: isAttack ? 'attack' : 'normal',
      probability: Math.min(99.9, Math.max(0.1, probability)),
      model: request.model,
      modelName: MODEL_NAMES[request.model],
      timestamp: new Date().toISOString(),
      features: request.features,
    };

    return result;
  } catch (error) {
    console.error('Backend prediction failed:', error);
    throw error;
  }
}


// Batch prediction for CSV files
export async function predictBatch(
  features: NetworkFeatures[],
  model: ModelType
): Promise<PredictionResult[]> {
  const results: PredictionResult[] = [];
  
  for (const feature of features) {
    const result = await predict({ model, features: feature, source: 'csv' });
    results.push(result);
  }
  
  return results;
}

// Parse CSV content to features
export function parseCSVToFeatures(csvContent: string): NetworkFeatures[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const features: NetworkFeatures[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length !== headers.length) continue;
    
    const feature: NetworkFeatures = {
      packetSize: parseFloat(values[headers.indexOf('packetsize')] || values[0]) || 0,
      flowDuration: parseFloat(values[headers.indexOf('flowduration')] || values[1]) || 0,
      protocol: values[headers.indexOf('protocol')] || values[2] || 'TCP',
      srcPort: parseInt(values[headers.indexOf('srcport')] || values[3]) || 0,
      dstPort: parseInt(values[headers.indexOf('dstport')] || values[4]) || 0,
      packetRate: parseFloat(values[headers.indexOf('packetrate')] || values[5]) || 0,
    };
    
    features.push(feature);
  }
  
  return features;
}

// Validate network features
export function validateFeatures(features: Partial<NetworkFeatures>): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  if (!features.packetSize || features.packetSize < 0 || features.packetSize > 65535) {
    errors.packetSize = 'Packet size must be between 0 and 65535';
  }
  
  if (!features.flowDuration || features.flowDuration < 0) {
    errors.flowDuration = 'Flow duration must be a positive number';
  }
  
  if (!features.protocol || !['TCP', 'UDP', 'ICMP'].includes(features.protocol.toUpperCase())) {
    errors.protocol = 'Protocol must be TCP, UDP, or ICMP';
  }
  
  if (features.srcPort === undefined || features.srcPort < 0 || features.srcPort > 65535) {
    errors.srcPort = 'Source port must be between 0 and 65535';
  }
  
  if (features.dstPort === undefined || features.dstPort < 0 || features.dstPort > 65535) {
    errors.dstPort = 'Destination port must be between 0 and 65535';
  }
  
  if (!features.packetRate || features.packetRate < 0) {
    errors.packetRate = 'Packet rate must be a positive number';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// Future API integration point
// Uncomment and modify when backend is ready

export async function predictFromAPI(request: PredictionRequest): Promise<PredictionResult> {
  // backend expects model + feature columns at the top level
  const response = await fetch('http://localhost:5020/predict', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: request.model, ...request.features }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Prediction failed');
  }

  const data = await response.json();
  const isAttack = data.prediction === 1;
  const probability = data.probabilities ? (data.probabilities[1] || 0) * 100 : 0;

  return {
    prediction: isAttack ? 'attack' : 'normal',
    probability: Math.min(99.9, Math.max(0.1, probability)),
    model: request.model,
    modelName: MODEL_NAMES[request.model],
    timestamp: new Date().toISOString(),
    features: request.features,
  } as PredictionResult;
}

