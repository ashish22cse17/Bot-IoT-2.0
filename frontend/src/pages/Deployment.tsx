import { useState, useEffect } from 'react';
import { Cpu, Shield, ArrowRight, AlertTriangle, CheckCircle, XCircle, Server, Monitor, HardDrive, Network, Lock, Zap, Loader2, Play } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { predict, ModelType, MODEL_NAMES, NetworkFeatures, PredictionResult } from '@/services/predictionService';

const Deployment = () => {
  const navigate = useNavigate();
  const [selectedModel, setSelectedModel] = useState<ModelType>('rf');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<PredictionResult | null>(null);

  // dynamic manual input keyed by backend feature names
  const [manualInput, setManualInput] = useState<Record<string, any>>({ protocol: 'TCP' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  // features provided by backend for the selected model
  const [modelFeatures, setModelFeatures] = useState<string[]>([]);
  const [featuresLoading, setFeaturesLoading] = useState(false);

  // load features for selected model from backend
  useEffect(() => {
    let mounted = true;
    setFeaturesLoading(true);
    setManualInput({ protocol: 'TCP' }); // reset manual inputs when model changes
    setErrors({});
    setApiError(null);

    fetch(`https://bot-iot-2-0.onrender.com/models/${selectedModel}/features`)
      .then(r => {
        if (!r.ok) throw new Error('Failed to load features');
        return r.json();
      })
        .then((data) => {
        if (!mounted) return;
        const feats: string[] = Array.isArray(data.features) ? data.features : [];
        if (feats.length > 0) {
          setModelFeatures(feats);

          // prefill manualInput with sensible "normal" defaults so Deployment Run works out-of-the-box
          // const defaultSample: Record<string, number | string> = {};
          // for (const f of feats) {
          //   const name = f.toLowerCase();
          //   if (f === 'protocol') {
          //     defaultSample[f] = 'TCP';
          //     continue;
          //   }
          //   if (name.includes('pkt') || name === 'pkts' || name.includes('spkts') || name.includes('dpkts')) {
          //     defaultSample[f] = 50;
          //     continue;
          //   }
          //   if (name.includes('byte') || name.includes('bytes') || name.includes('sbytes') || name.includes('dbytes')) {
          //     defaultSample[f] = 102400;
          //     continue;
          //   }
          //   if (name === 'dur' || name.includes('dur')) {
          //     defaultSample[f] = 5000;
          //     continue;
          //   }
          //   if (name.includes('rate')) {
          //     defaultSample[f] = 100;
          //     continue;
          //   }
          //   defaultSample[f] = 0;
          // }
          // setManualInput(defaultSample);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch model features:', err);
        setModelFeatures([]);
      })
      .finally(() => { if (mounted) setFeaturesLoading(false); });

    return () => { mounted = false };
  }, [selectedModel]);

  const deploymentFeatures = [
    {
      icon: Cpu,
      title: 'Raspberry Pi Gateway',
      description: 'Cost-effective, low-power edge device running the ML model for real-time intrusion detection.',
      color: 'neon-green',
    },
    {
      icon: Shield,
      title: 'Real-time Detection',
      description: 'Continuous monitoring and analysis of network packets using trained Random Forest/SVM models.',
      color: 'primary',
    },
    {
      icon: Lock,
      title: 'Automatic Blocking',
      description: 'Instantly blocks malicious traffic before it reaches the target device in the IoT network.',
      color: 'neon-magenta',
    },
    {
      icon: Zap,
      title: 'Low Latency',
      description: 'Edge-based processing ensures minimal delay in network communication for legitimate traffic.',
      color: 'neon-purple',
    },
  ];

  const handleInputChange = (field: string, value: string | number) => {
    if (field === 'protocol') {
      setManualInput(prev => ({ ...prev, [field]: String(value).toUpperCase() }));
    } else {
      const numValue = value === '' ? undefined : Number(value);
      setManualInput(prev => ({ ...prev, [field]: numValue }));
    }

    if ((errors as any)[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // validate only fields present in `modelFeatures` (backend-driven)
  const validateManualInput = (): boolean => {
    const newErrors: Record<string, string> = {};

    for (const f of modelFeatures) {
      const v = (manualInput as any)[f];

      if (f === 'protocol') {
        if (!v || !['TCP', 'UDP', 'ICMP'].includes(String(v).toUpperCase())) newErrors.protocol = 'Protocol must be TCP, UDP, or ICMP';
        continue;
      }

      if (v === undefined || v === null || v === '' || Number.isNaN(Number(v))) {
        newErrors[f] = 'Required numeric value';
        continue;
      }

      if (f === 'packetSize' && (Number(v) < 0 || Number(v) > 65535)) newErrors.packetSize = 'Packet size must be between 0 and 65535';
      if (f === 'flowDuration' && Number(v) < 0) newErrors.flowDuration = 'Flow duration must be a positive number';
      if ((f === 'srcPort' || f === 'dstPort') && (Number(v) < 0 || Number(v) > 65535)) newErrors[f] = 'Port must be between 0 and 65535';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const runSimulation = async (features?: Record<string, any>) => {
    if (!features && !validateManualInput()) return;

    setIsSimulating(true);
    setSimulationResult(null);

    try {
      // build payload using only backend-declared features
      const featuresToSend: Record<string, any> = {};

      if (features) {
        // explicit features provided (quick test)
        for (const f of modelFeatures) {
          featuresToSend[f] = features[f] ?? (f === 'protocol' ? 'TCP' : 0);
        }
      } else {
        for (const f of modelFeatures) {
          const v = (manualInput as any)[f];
          featuresToSend[f] = v === undefined || v === null || v === '' ? (f === 'protocol' ? 'TCP' : 0) : v;
        }
      }

      setApiError(null);
      const result = await predict({ model: selectedModel, features: featuresToSend as NetworkFeatures, source: 'manual' });
      setSimulationResult(result);
    } catch (error: any) {
      console.error('Prediction failed:', error);
      setApiError(error?.message || 'Prediction failed');
    } finally {
      setIsSimulating(false);
    }
  };

  const buildSampleForFeatures = (type: 'attack' | 'normal') => {
  const sample: Record<string, number> = {};

  const attackValues: Record<string, number> = {
    flgs: 7,
    proto: 3,
    sport: 50000,
    dport: 30999,
    pkts: 500,
    bytes: 50000,
    state: 6,
    dur: 50,
    mean: 2,
    stddev: 1,
    sum: 20,
    min: 0,
    max: 5,
    soui: 0,
    doui: 0,
    sco: 0,
    dco: 0,
    spkts: 400,
    dpkts: 100,
    sbytes: 40000,
    dbytes: 10000,
    rate: 1000,
    srate: 700,
    drate: 300
  };

  const normalValues: Record<string, number> = {
  flgs: 4,
  proto: 3,     
  sport: 122416,
  dport: 30999,
  pkts: 2101,
  bytes: 2045376,
  state: 1,
  dur: 15.00064,
  mean: 4.991853,
  stddev: 0.003871,
  sum: 14.975559,
  min: 4.988665,
  max: 4.997598,
  soui: 0,
  doui: 0,
  sco: 0,
  dco: 0,
  spkts:1051,
  dpkts: 1050,
  sbytes: 1056823,
  dbytes: 988553,
  rate: 139.993988,
  srate: 69.996994,
  drate: 69.930336
};

  const source = type === 'attack' ? attackValues : normalValues;

  for (const feature of modelFeatures) {
    // Assign the value from source; default to 0 if not defined
    sample[feature] = source[feature] ?? 0;
  }

  return sample;
};

  const simulateAttack = () => {
    const s = buildSampleForFeatures('attack');
    setManualInput(s);
    runSimulation(s);
  };

  const simulateNormal = () => {
    const s = buildSampleForFeatures('normal');
    setManualInput(s);
    runSimulation(s);
  };

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="py-24 relative cyber-grid">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 fade-in-up">
            <span className="font-mono text-neon-green text-sm tracking-wider uppercase mb-4 block">
              [ Deployment Architecture ]
            </span>
            <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold mb-6">
              Raspberry Pi <span className="gradient-text">IDS Gateway</span>
            </h1>
            <p className="text-muted-foreground max-w-3xl mx-auto text-lg">
              Real-world deployment of our ML-based Intrusion Detection System using Raspberry Pi as an IoT network gateway for real-time threat prevention.
            </p>
          </div>
        </div>
      </section>

      {/* Architecture Diagram */}
      <section className="py-24 relative bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 fade-in-up">
            <span className="font-mono text-primary text-sm tracking-wider uppercase mb-4 block">
              [ Network Architecture ]
            </span>
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
              How It <span className="gradient-text">Works</span>
            </h2>
          </div>

          {/* Visual Architecture */}
          <div className="max-w-5xl mx-auto fade-in-up">
            <div className="cyber-card p-8 md:p-12">
              {/* Network Flow Visualization */}
              <div className="grid md:grid-cols-5 gap-4 items-center mb-12">
                {/* PC1 - Sender */}
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto rounded-xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center mb-3">
                    <Monitor className="w-12 h-12 text-primary" />
                  </div>
                  <h4 className="font-display font-bold text-foreground">PC1</h4>
                  <p className="text-muted-foreground text-xs">Sender Device</p>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <ArrowRight className="w-8 h-8 text-primary/50" />
                </div>

                {/* Raspberry Pi */}
                <div className="text-center">
                  <div className={`w-32 h-32 mx-auto rounded-xl border-2 flex flex-col items-center justify-center mb-3 relative transition-all duration-500 ${
                    simulationResult 
                      ? simulationResult.prediction === 'attack'
                        ? 'bg-destructive/20 border-destructive/50'
                        : 'bg-neon-green/20 border-neon-green/50'
                      : 'bg-neon-green/10 border-neon-green/30'
                  }`}>
                    <Cpu className={`w-12 h-12 mb-2 ${
                      simulationResult
                        ? simulationResult.prediction === 'attack'
                          ? 'text-destructive'
                          : 'text-neon-green'
                        : 'text-neon-green'
                    }`} />
                    <span className="font-mono text-xs text-neon-green">{MODEL_NAMES[selectedModel].split(' ')[0]}</span>
                    <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full border flex items-center justify-center ${
                      simulationResult
                        ? simulationResult.prediction === 'attack'
                          ? 'bg-destructive/20 border-destructive'
                          : 'bg-neon-green/20 border-neon-green'
                        : 'bg-neon-green/20 border-neon-green'
                    }`}>
                      {simulationResult ? (
                        simulationResult.prediction === 'attack' 
                          ? <XCircle className="w-3 h-3 text-destructive" />
                          : <CheckCircle className="w-3 h-3 text-neon-green" />
                      ) : (
                        <Shield className="w-3 h-3 text-neon-green" />
                      )}
                    </div>
                  </div>
                  <h4 className={`font-display font-bold ${
                    simulationResult
                      ? simulationResult.prediction === 'attack'
                        ? 'text-destructive'
                        : 'text-neon-green'
                      : 'text-neon-green neon-text-green'
                  }`}>Raspberry Pi</h4>
                  <p className="text-muted-foreground text-xs">IDS Gateway</p>
                </div>

                {/* Arrow with Decision */}
                <div className="flex flex-col items-center gap-2">
                  {simulationResult ? (
                    simulationResult.prediction === 'attack' ? (
                      <div className="flex items-center gap-2">
                        <XCircle className="w-6 h-6 text-destructive animate-pulse" />
                        <span className="text-destructive text-sm font-mono font-bold">BLOCKED</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-6 h-6 text-neon-green" />
                        <ArrowRight className="w-6 h-6 text-neon-green" />
                        <span className="text-neon-green text-sm font-mono font-bold">ALLOWED</span>
                      </div>
                    )
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-neon-green" />
                        <ArrowRight className="w-6 h-6 text-neon-green" />
                      </div>
                      <span className="text-neon-green text-xs font-mono">Normal</span>
                      <div className="h-4" />
                      <div className="flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-destructive" />
                        <span className="text-destructive text-xs font-mono">Blocked</span>
                      </div>
                    </>
                  )}
                </div>

                {/* PC2 - Receiver */}
                <div className="text-center">
                  <div className={`w-24 h-24 mx-auto rounded-xl border-2 flex items-center justify-center mb-3 transition-all duration-500 ${
                    simulationResult
                      ? simulationResult.prediction === 'attack'
                        ? 'bg-muted/50 border-muted opacity-50'
                        : 'bg-neon-cyan/10 border-neon-cyan/30'
                      : 'bg-neon-cyan/10 border-neon-cyan/30'
                  }`}>
                    <HardDrive className={`w-12 h-12 ${
                      simulationResult && simulationResult.prediction === 'attack'
                        ? 'text-muted-foreground'
                        : 'text-neon-cyan'
                    }`} />
                  </div>
                  <h4 className="font-display font-bold text-foreground">PC2</h4>
                  <p className="text-muted-foreground text-xs">
                    {simulationResult && simulationResult.prediction === 'attack' ? 'Protected' : 'Receiver Device'}
                  </p>
                </div>
              </div>

              {/* Simulation Result Card */}
              {simulationResult && (
                <div className={`mb-8 p-6 rounded-xl border ${
                  simulationResult.prediction === 'attack'
                    ? 'bg-destructive/10 border-destructive/30'
                    : 'bg-neon-green/10 border-neon-green/30'
                } fade-in-up`}>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      {simulationResult.prediction === 'attack' ? (
                        <AlertTriangle className="w-10 h-10 text-destructive" />
                      ) : (
                        <CheckCircle className="w-10 h-10 text-neon-green" />
                      )}
                      <div>
                        <h4 className={`font-display text-lg font-bold ${
                          simulationResult.prediction === 'attack' ? 'text-destructive' : 'text-neon-green'
                        }`}>
                          {simulationResult.prediction === 'attack' ? 'INTRUSION DETECTED - TRAFFIC BLOCKED' : 'NORMAL TRAFFIC - ALLOWED'}
                        </h4>
                        {simulationResult.attackType && (
                          <p className="text-destructive/80 text-sm">Attack Type: {simulationResult.attackType}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Model: {simulationResult.modelName}</p>
                      <p className={`font-mono text-lg font-bold ${
                        simulationResult.prediction === 'attack' ? 'text-destructive' : 'text-neon-green'
                      }`}>
                        {simulationResult.probability.toFixed(1)}% Confidence
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Scenario Description */}
              <div className="grid md:grid-cols-2 gap-8 mt-12">
                {/* Normal Traffic Scenario */}
                <div className="p-6 rounded-xl bg-neon-green/5 border border-neon-green/20">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle className="w-8 h-8 text-neon-green" />
                    <h4 className="font-display text-lg font-bold text-neon-green">Normal Traffic</h4>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-neon-green mt-1">1.</span>
                      <p className="text-muted-foreground">PC1 sends file/data to PC2</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-neon-green mt-1">2.</span>
                      <p className="text-muted-foreground">Traffic passes through Raspberry Pi gateway</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-neon-green mt-1">3.</span>
                      <p className="text-muted-foreground">ML model analyzes packets in real-time</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-neon-green mt-1">4.</span>
                      <p className="text-muted-foreground">Traffic classified as normal → <strong className="text-neon-green">ALLOWED</strong></p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-neon-green mt-1">5.</span>
                      <p className="text-muted-foreground">File successfully reaches PC2</p>
                    </div>
                  </div>
                </div>

                {/* Attack Scenario */}
                <div className="p-6 rounded-xl bg-destructive/5 border border-destructive/20">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="w-8 h-8 text-destructive" />
                    <h4 className="font-display text-lg font-bold text-destructive">Intrusion Detected</h4>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-destructive mt-1">1.</span>
                      <p className="text-muted-foreground">Malicious traffic targets PC2 (DDoS, DoS, etc.)</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-destructive mt-1">2.</span>
                      <p className="text-muted-foreground">Traffic intercepted by Raspberry Pi gateway</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-destructive mt-1">3.</span>
                      <p className="text-muted-foreground">ML model detects anomalous patterns</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-destructive mt-1">4.</span>
                      <p className="text-muted-foreground">Traffic classified as attack → <strong className="text-destructive">BLOCKED</strong></p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-destructive mt-1">5.</span>
                      <p className="text-muted-foreground">PC2 remains protected from intrusion</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Simulation Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 fade-in-up">
            <span className="font-mono text-neon-magenta text-sm tracking-wider uppercase mb-4 block">
              [ Live Simulation ]
            </span>
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
              Test the <span className="gradient-text">IDS Gateway</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Simulate network traffic and see how the Raspberry Pi IDS gateway detects and blocks intrusions in real-time.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="cyber-card border-neon-magenta/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Play className="w-5 h-5 text-neon-magenta" />
                  Traffic Simulation
                </CardTitle>
                <CardDescription>
                  Configure simulated traffic parameters and run detection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Model Selection */}
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Select ML Model</label>
                    <Select value={selectedModel} onValueChange={(v) => setSelectedModel(v as ModelType)}>
                      <SelectTrigger className="w-full md:w-64 bg-background/50">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-border">
                        <SelectItem value="rf">Random Forest (RF)</SelectItem>
                        <SelectItem value="svm">Support Vector Machine (SVM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Traffic Input Form (dynamic — driven by backend model features) */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {featuresLoading ? (
                      <div className="col-span-3 text-center py-6 opacity-60">Loading model features...</div>
                    ) : modelFeatures.length === 0 ? (
                      <div className="col-span-3 text-center py-6 opacity-60">No features available for selected model.</div>
                    ) : (
                      modelFeatures.map((f) => (
                        <div key={f}>
                          <label className="text-sm text-muted-foreground mb-1 block">{f.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</label>

                          {f === 'protocol' ? (
                            <Select value={(manualInput[f] || 'TCP').toString().toUpperCase()} onValueChange={(v) => handleInputChange(f, v)}>
                              <SelectTrigger className={`bg-background/50 ${errors[f] ? 'border-destructive' : ''}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-background border-border">
                                <SelectItem value="TCP">TCP</SelectItem>
                                <SelectItem value="UDP">UDP</SelectItem>
                                <SelectItem value="ICMP">ICMP</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              type="number"
                              value={(manualInput[f] ?? '') as any}
                              onChange={(e) => handleInputChange(f, e.target.value)}
                              placeholder="0"
                              className={`bg-background/50 ${errors[f] ? 'border-destructive' : ''}`}
                            />
                          )}

                          {errors[f] && <span className="text-destructive text-xs">{errors[f]}</span>}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Action Buttons */}

                  {apiError && (
                    <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm w-full">
                      {apiError}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4">
                    <Button
                      onClick={() => runSimulation()}
                      disabled={isSimulating || featuresLoading || modelFeatures.length === 0}
                      className="flex-1 min-w-[200px] bg-neon-magenta/10 text-neon-magenta hover:bg-neon-magenta/20 border border-neon-magenta/30"
                    >
                      {isSimulating ? (
                        <>
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                          Analyzing Traffic...
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 w-4 h-4" />
                          Run Detection
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={simulateAttack}
                      disabled={isSimulating}
                      variant="outline"
                      className="border-destructive/30 text-destructive hover:bg-destructive/10"
                    >
                      <AlertTriangle className="mr-2 w-4 h-4" />
                      Simulate Attack
                    </Button>
                    <Button
                      onClick={simulateNormal}
                      disabled={isSimulating}
                      variant="outline"
                      className="border-neon-green/30 text-neon-green hover:bg-neon-green/10"
                    >
                      <CheckCircle className="mr-2 w-4 h-4" />
                      Simulate Normal
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigate to Dashboard */}
            <div className="text-center mt-8">
              <Button
                onClick={() => navigate('/dashboard')}
                size="lg"
                className="neon-border-cyan"
              >
                <Shield className="mr-2 w-5 h-5" />
                Test Model in Dashboard
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 fade-in-up">
            <span className="font-mono text-primary text-sm tracking-wider uppercase mb-4 block">
              [ Key Features ]
            </span>
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
              Deployment <span className="gradient-text">Benefits</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {deploymentFeatures.map((feature, index) => (
              <div
                key={feature.title}
                className={`cyber-card p-6 hover-lift fade-in-up stagger-${index + 1}`}
              >
                <div className={`w-14 h-14 rounded-xl bg-${feature.color}/10 border border-${feature.color}/20 flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-7 h-7 text-${feature.color}`} />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Specs */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="cyber-card p-8 md:p-12 fade-in-up">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-xl bg-neon-green/10 border border-neon-green/20 flex items-center justify-center">
                  <Server className="w-8 h-8 text-neon-green" />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-bold text-foreground">Technical Specifications</h3>
                  <p className="text-muted-foreground">Hardware & Software Requirements</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-display font-bold text-primary mb-4 flex items-center gap-2">
                    <Cpu className="w-5 h-5" />
                    Hardware
                  </h4>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      Raspberry Pi 4 Model B (4GB RAM recommended)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      MicroSD Card (32GB+ for OS and model)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      Ethernet connection (for gateway mode)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      Optional: USB-to-Ethernet adapter for dual NIC
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-display font-bold text-neon-green mb-4 flex items-center gap-2">
                    <Network className="w-5 h-5" />
                    Software Stack
                  </h4>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-neon-green mt-1">•</span>
                      Raspberry Pi OS (64-bit recommended)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-neon-green mt-1">•</span>
                      Python 3.9+ with Scikit-learn
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-neon-green mt-1">•</span>
                      iptables/nftables for traffic control
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-neon-green mt-1">•</span>
                      Scapy/pyshark for packet capture
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-center gap-4 mt-12">
              <Button asChild variant="outline" size="lg">
                <Link to="/system">
                  <ArrowRight className="mr-2 w-4 h-4 rotate-180" />
                  Back to System Overview
                </Link>
              </Button>
              <Button asChild size="lg" className="neon-border-cyan">
                <Link to="/dashboard">
                  <Shield className="mr-2 w-4 h-4" />
                  Go to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Deployment;