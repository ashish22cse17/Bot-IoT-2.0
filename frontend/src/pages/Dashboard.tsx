import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, AlertTriangle, CheckCircle, Shield, Activity, Zap, XCircle, Loader2, Download, RotateCcw, Clock, Cpu, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  predict,
  ModelType,
  MODEL_NAMES,
  NetworkFeatures,
  PredictionResult,
} from '@/services/predictionService';

const Dashboard = () => {
  const [selectedModel, setSelectedModel] = useState<ModelType>('rf');
  const [activeTab, setActiveTab] = useState('csv');
  const [file, setFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Accept dynamic feature keys (backend feature names vary per model)
  const [manualInput, setManualInput] = useState<Record<string, any>>({ protocol: 'TCP' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Features provided by backend for the selected model (controls which manual fields are shown)
  const [modelFeatures, setModelFeatures] = useState<string[]>([]);
  const [featuresLoading, setFeaturesLoading] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [predictionHistory, setPredictionHistory] = useState<PredictionResult[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  // load features for selected model from backend
  useEffect(() => {
    let mounted = true
    setFeaturesLoading(true)
    setManualInput({ protocol: 'TCP' }) // reset manual inputs when model changes
    setErrors({}) // clear any validation errors

    fetch(`http://localhost:5020/models/${selectedModel}/features`)
      .then(r => {
        if (!r.ok) throw new Error('Failed to load features')
        return r.json()
      })
      .then((data) => {
        if (!mounted) return
        const feats: string[] = Array.isArray(data.features) ? data.features : []
        if (feats.length > 0) setModelFeatures(feats)
      })
      .catch((err) => {
        console.warn('Failed to fetch model features:', err)
      })
      .finally(() => { if (mounted) setFeaturesLoading(false) })

    return () => { mounted = false }
  }, [selectedModel])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      if (!selectedFile.name.endsWith('.csv')) {
        setErrors({ file: 'Please upload a CSV file' });
        return;
      }

      setFile(selectedFile);
      setPrediction(null);
      setErrors({});

      // Read CSV preview
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const lines = content.split('\n').slice(0, 6);
        setCsvPreview(lines);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    // Treat only 'protocol' as text; everything else is numeric for backend features
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

  // Validate only fields that are required/present for the selected model
  const validateManualInput = (): boolean => {
    const newErrors: Record<string, string> = {};

    for (const f of modelFeatures) {
      const v = (manualInput as any)[f];

      if (f === 'protocol') {
        if (!v || !['TCP', 'UDP', 'ICMP'].includes(String(v).toUpperCase())) newErrors.protocol = 'Protocol must be TCP, UDP, or ICMP';
        continue;
      }

      // numeric requirement for all other backend features
      if (v === undefined || v === null || v === '' || Number.isNaN(Number(v))) {
        newErrors[f] = 'Required numeric value';
        continue;
      }

      // some semantic checks for common fields (keep previous behavior)
      if (f === 'packetSize' && (Number(v) < 0 || Number(v) > 65535)) newErrors.packetSize = 'Packet size must be between 0 and 65535';
      if (f === 'flowDuration' && Number(v) < 0) newErrors.flowDuration = 'Flow duration must be a positive number';
      if ((f === 'srcPort' || f === 'dstPort') && (Number(v) < 0 || Number(v) > 65535)) newErrors[f] = 'Port must be between 0 and 65535';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCSVUpload = async () => {
    if (!file) return;
    setIsLoading(true);
    setPrediction(null);

    try {
      console.log('Starting CSV upload with file:', file.name, 'model:', selectedModel);

      // Send CSV to backend /upload which returns annotated CSV
      const form = new FormData();
      form.append('file', file);
      form.append('model', selectedModel);

      console.log('Sending request to backend...');
      const res = await fetch('http://localhost:5020/upload', {
        method: 'POST',
        body: form,
      });

      console.log('Response status:', res.status);
      console.log('Response headers:', Object.fromEntries(res.headers.entries()));

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('Backend error:', err);
        throw new Error(err.error || 'CSV upload failed');
      }

      console.log('Response OK, creating blob...');
      const blob = await res.blob();
      console.log('Blob size:', blob.size, 'type:', blob.type);

      const url = URL.createObjectURL(blob);
      console.log('Blob URL created:', url);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'predictions.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      console.log('Download triggered successfully');

      // show placeholder success (no features attached)
      setPrediction({
        prediction: 'normal',
        probability: 0,
        model: selectedModel,
        modelName: MODEL_NAMES[selectedModel],
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('CSV upload failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualPredict = async () => {
    if (!validateManualInput()) return;

    setIsLoading(true);
    setPrediction(null);

    try {
      setApiError(null);
      // Build feature object using only modelFeatures (backend expects the exact feature names)
      const featuresToSend: any = {};
      for (const f of modelFeatures) {
        const v = (manualInput as any)[f];
        if (v === undefined || v === null || v === '') {
          // sensible defaults
          featuresToSend[f] = f === 'protocol' ? 'TCP' : 0;
        } else {
          featuresToSend[f] = v;
        }
      }

      const result = await predict({
        model: selectedModel,
        features: featuresToSend as NetworkFeatures,
        source: 'manual',
      });

      setPrediction(result);
      setPredictionHistory(prev => [result, ...prev.slice(0, 9)]);
    } catch (error: any) {
      console.error('Prediction failed:', error);
      setApiError(error?.message || 'Prediction failed');
    } finally {
      setIsLoading(false);
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
      spkts: 1051,
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

  const handleQuickTest = async (type: 'attack' | 'normal') => {
    const features = buildSampleForFeatures(type);

    setIsLoading(true);
    setPrediction(null);

    try {
      const result = await predict({
        model: selectedModel,
        features: features as unknown as NetworkFeatures,
        source: 'quick-test',
      });

      setPrediction(result);
      setPredictionHistory(prev => [result, ...prev.slice(0, 9)]);
    } catch (error) {
      console.error('Prediction failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setPrediction(null);
    setFile(null);
    setCsvPreview([]);
    setManualInput({
      packetSize: undefined,
      flowDuration: undefined,
      protocol: 'TCP',
      srcPort: undefined,
      dstPort: undefined,
      packetRate: undefined,
    });
    setErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatTimestamp = (isoString: string) => {
    return new Date(isoString).toLocaleString();
  };

  return (
    <div className="pt-16 min-h-screen">
      {/* Hero Section */}
      <section className="py-16 relative cyber-grid">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 fade-in-up">
            <span className="font-mono text-primary text-sm tracking-wider uppercase mb-4 block">
              [ Live Detection ]
            </span>
            <h1 className="font-display text-3xl md:text-5xl font-bold mb-6">
              Intrusion <span className="gradient-text">Dashboard</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Upload network traffic data or manually input features for real-time intrusion detection analysis.
            </p>
          </div>
        </div>
      </section>

      {/* Model Selector */}
      <section className="pb-8 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <Card className="cyber-card border-neon-purple/20">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-neon-purple/10 border border-neon-purple/20 flex items-center justify-center">
                      <Cpu className="w-6 h-6 text-neon-purple" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-foreground">Select ML Model</h3>
                      <p className="text-sm text-muted-foreground">Choose the algorithm for intrusion detection</p>
                    </div>
                  </div>
                  <Select value={selectedModel} onValueChange={(v) => { setSelectedModel(v as ModelType); setApiError(null); }}>
                    <SelectTrigger className="w-full md:w-80 bg-background/50 border-neon-purple/30">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      <SelectItem value="rf">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-neon-green" />
                          Random Forest (RF)
                        </div>
                      </SelectItem>
                      <SelectItem value="svm">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-primary" />
                          Support Vector Machine (SVM)
                        </div>
                      </SelectItem>
                      <SelectItem value="dnn">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-neon-purple" />
                          Deep Neural Network (DNN)
                        </div>
                      </SelectItem>
                      <SelectItem value="cnn">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(20, 100%, 50%)' }} />
                          Convolutional Neural Network (CNN)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Dashboard Content */}
      <section className="py-8 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
              <TabsList className="grid grid-cols-3 w-full max-w-xl mx-auto bg-secondary/50 p-1">
                <TabsTrigger value="csv" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Upload className="w-4 h-4 mr-2" />
                  CSV Upload
                </TabsTrigger>
                <TabsTrigger value="manual" className="data-[state=active]:bg-neon-green data-[state=active]:text-background">
                  <Activity className="w-4 h-4 mr-2" />
                  Manual Input
                </TabsTrigger>
                <TabsTrigger value="quick" className="data-[state=active]:bg-neon-magenta data-[state=active]:text-background">
                  <FlaskConical className="w-4 h-4 mr-2" />
                  Quick Test
                </TabsTrigger>
              </TabsList>

              {/* CSV Upload Tab */}
              <TabsContent value="csv" className="fade-in-up">
                <Card className="cyber-card border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Upload className="w-5 h-5 text-primary" />
                      CSV File Upload
                    </CardTitle>
                    <CardDescription>
                      Upload a CSV file containing network traffic features for batch prediction using {MODEL_NAMES[selectedModel]}.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${errors.file
                          ? 'border-destructive/50 bg-destructive/5'
                          : 'border-primary/30 hover:border-primary/50'
                          }`}
                      >
                        <FileText className="w-12 h-12 text-primary/50 mx-auto mb-4" />
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv"
                          onChange={handleFileChange}
                          className="hidden"
                          id="csv-upload"
                        />
                        <label
                          htmlFor="csv-upload"
                          className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {file ? (
                            <span className="text-primary font-medium">{file.name}</span>
                          ) : (
                            <>
                              <span className="block font-medium mb-1">Click to upload CSV</span>
                              <span className="text-sm">or drag and drop</span>
                            </>
                          )}
                        </label>
                        {errors.file && (
                          <p className="text-destructive text-sm mt-2">{errors.file}</p>
                        )}
                      </div>

                      {/* CSV Preview */}
                      {csvPreview.length > 0 && (
                        <div className="bg-secondary/30 rounded-lg p-4 overflow-x-auto">
                          <p className="text-sm text-muted-foreground mb-2">Preview (first 5 rows):</p>
                          <pre className="font-mono text-xs text-foreground/80">
                            {csvPreview.map((line, i) => (
                              <div key={i} className={i === 0 ? 'text-primary font-bold' : ''}>
                                {line}
                              </div>
                            ))}
                          </pre>
                        </div>
                      )}

                      <Button
                        onClick={handleCSVUpload}
                        disabled={!file || isLoading}
                        className="w-full neon-border-cyan"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                            Analyzing with {MODEL_NAMES[selectedModel].split(' ')[0]}...
                          </>
                        ) : (
                          <>
                            <Shield className="mr-2 w-4 h-4" />
                            Analyze Traffic
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Manual Input Tab */}
              <TabsContent value="manual" className="fade-in-up">
                <Card className="cyber-card border-neon-green/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Activity className="w-5 h-5 text-neon-green" />
                      Manual Feature Input
                    </CardTitle>
                    <CardDescription>
                      Enter network traffic features manually for single prediction using {MODEL_NAMES[selectedModel]}.
                      <div className="text-xs text-muted-foreground mt-2">
                        {featuresLoading ? 'Loading fields…' : `Fields: ${modelFeatures.join(', ')}`}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {modelFeatures.map((f) => {
                          const value = (manualInput as any)[f] ?? ''
                          const error = (errors as any)[f]

                          if (f === 'protocol') {
                            return (
                              <div key={f}>
                                <label className="text-sm text-muted-foreground mb-1 block">
                                  Protocol {modelFeatures.includes('protocol') && <span className="text-destructive">*</span>}
                                </label>
                                <Select value={String(value || 'TCP')} onValueChange={(v) => handleInputChange('protocol', v)}>
                                  <SelectTrigger className={`bg-background/50 ${error ? 'border-destructive' : ''}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-background border-border">
                                    <SelectItem value="TCP">TCP</SelectItem>
                                    <SelectItem value="UDP">UDP</SelectItem>
                                    <SelectItem value="ICMP">ICMP</SelectItem>
                                  </SelectContent>
                                </Select>
                                {error && <span className="text-destructive text-xs">{error}</span>}
                              </div>
                            )
                          }

                          // numeric inputs for all other features
                          const label = f.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())
                          return (
                            <div key={f}>
                              <label className="text-sm text-muted-foreground mb-1 block">
                                {label} {['packetSize', 'flowDuration', 'srcPort', 'dstPort', 'packetRate'].includes(f) && <span className="text-destructive">*</span>}
                              </label>
                              <Input
                                type="number"
                                value={value}
                                onChange={(e) => handleInputChange(f as keyof NetworkFeatures, e.target.value)}
                                placeholder={`e.g., ${f === 'packetSize' ? '1500' : f === 'flowDuration' ? '5000' : '0'}`}
                                className={`bg-background/50 ${error ? 'border-destructive' : ''}`}
                              />
                              {error && <span className="text-destructive text-xs">{error}</span>}
                            </div>
                          )
                        })}
                      </div>

                      {apiError && (
                        <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                          {apiError}
                        </div>
                      )}

                      <Button
                        onClick={handleManualPredict}
                        disabled={isLoading || featuresLoading || modelFeatures.length === 0}
                        className="w-full bg-neon-green/10 text-neon-green hover:bg-neon-green/20 border border-neon-green/30"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                            Predicting with {MODEL_NAMES[selectedModel].split(' ')[0]}...
                          </>
                        ) : (
                          <>
                            <Zap className="mr-2 w-4 h-4" />
                            Run Prediction
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Quick Test Tab */}
              <TabsContent value="quick" className="fade-in-up">
                <Card className="cyber-card border-neon-magenta/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <FlaskConical className="w-5 h-5 text-neon-magenta" />
                      Quick Test Mode
                    </CardTitle>
                    <CardDescription>
                      Test the {MODEL_NAMES[selectedModel]} model with pre-configured attack and normal traffic samples.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Sample Info Cards */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                          <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                            <h4 className="font-display font-bold text-destructive">Attack Sample</h4>
                          </div>
                          <ul className="space-y-1 text-sm text-muted-foreground font-mono">
                            <li>Bytes: {buildSampleForFeatures('attack').bytes}</li>
                            <li>Packets: {buildSampleForFeatures('attack').pkts}</li>
                            <li>Duration: {buildSampleForFeatures('attack').dur}s</li>
                            <li>Protocol: {buildSampleForFeatures('attack').proto}</li>
                            <li>Source Port: {buildSampleForFeatures('attack').sport}</li>
                          </ul>
                        </div>
                        <div className="p-4 rounded-xl bg-neon-green/5 border border-neon-green/20">
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle className="w-5 h-5 text-neon-green" />
                            <h4 className="font-display font-bold text-neon-green">Normal Sample</h4>
                          </div>
                          <ul className="space-y-1 text-sm text-muted-foreground font-mono">
                            <li>Bytes: {buildSampleForFeatures('normal').bytes}</li>
                            <li>Packets: {buildSampleForFeatures('normal').pkts}</li>
                            <li>Duration: {buildSampleForFeatures('normal').dur}s</li>
                            <li>Protocol: {buildSampleForFeatures('normal').proto}</li>
                            <li>Source Port: {buildSampleForFeatures('normal').sport}</li>
                          </ul>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                          onClick={() => handleQuickTest('attack')}
                          disabled={isLoading}
                          className="flex-1 bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/30"
                        >
                          {isLoading ? (
                            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                          ) : (
                            <AlertTriangle className="mr-2 w-4 h-4" />
                          )}
                          Simulate Attack
                        </Button>
                        <Button
                          onClick={() => handleQuickTest('normal')}
                          disabled={isLoading}
                          className="flex-1 bg-neon-green/10 text-neon-green hover:bg-neon-green/20 border border-neon-green/30"
                        >
                          {isLoading ? (
                            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="mr-2 w-4 h-4" />
                          )}
                          Simulate Normal Traffic
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Prediction Results */}
          {prediction && (
            <div className="max-w-4xl mx-auto mt-12 fade-in-up">
              <Card className={`cyber-card ${prediction.prediction === 'attack' ? 'border-destructive/50' : 'border-neon-green/50'}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    {prediction.prediction === 'attack' ? (
                      <AlertTriangle className="w-6 h-6 text-destructive" />
                    ) : (
                      <CheckCircle className="w-6 h-6 text-neon-green" />
                    )}
                    Prediction Result
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Main Result */}
                    <div className={`p-6 rounded-xl text-center ${prediction.prediction === 'attack'
                      ? 'bg-destructive/10 border border-destructive/30'
                      : 'bg-neon-green/10 border border-neon-green/30'
                      }`}>
                      <div className="mb-3">
                        {prediction.prediction === 'attack' ? (
                          <XCircle className="w-16 h-16 text-destructive mx-auto" />
                        ) : (
                          <CheckCircle className="w-16 h-16 text-neon-green mx-auto" />
                        )}
                      </div>
                      <h3 className={`font-display text-2xl font-bold ${prediction.prediction === 'attack' ? 'text-destructive' : 'text-neon-green'
                        }`}>
                        {prediction.prediction === 'attack' ? 'INTRUSION DETECTED' : 'NORMAL TRAFFIC'}
                      </h3>
                      {prediction.attackType && prediction.prediction === 'attack' && (
                        <p className="text-destructive/80 mt-2">
                          Attack Type: <span className="font-bold">{prediction.attackType}</span>
                        </p>
                      )}
                    </div>

                    {/* Details Grid */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-secondary/30">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <Cpu className="w-4 h-4" />
                          <span className="text-sm">Model Used</span>
                        </div>
                        <p className="font-display font-bold text-foreground">{prediction.modelName}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-secondary/30">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">Timestamp</span>
                        </div>
                        <p className="font-mono text-sm text-foreground">{formatTimestamp(prediction.timestamp)}</p>
                      </div>
                    </div>

                    {/* Confidence */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Confidence Level</span>
                        <span className={prediction.prediction === 'attack' ? 'text-destructive' : 'text-neon-green'}>
                          {Math.max(prediction.probability, 100 - prediction.probability).toFixed(1)}%
                        </span>
                      </div>

                      <Progress
                        value={Math.max(prediction.probability, 100 - prediction.probability)}
                        className={`h-3 ${prediction.prediction === 'attack'
                          ? '[&>div]:bg-destructive'
                          : '[&>div]:bg-neon-green'
                          }`}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                      <Button variant="outline" onClick={clearResults} className="flex-1">
                        <RotateCcw className="mr-2 w-4 h-4" />
                        Clear Results
                      </Button>
                      <Button className="flex-1 neon-border-cyan">
                        <Download className="mr-2 w-4 h-4" />
                        Download Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Prediction History */}
          {predictionHistory.length > 0 && (
            <div className="max-w-4xl mx-auto mt-12">
              <h3 className="font-display text-xl font-bold mb-4 text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                Recent Predictions
              </h3>
              <div className="space-y-3">
                {predictionHistory.slice(0, 5).map((result, index) => (
                  <div
                    key={`${result.timestamp}-${index}`}
                    className={`p-4 rounded-lg border flex items-center justify-between ${result.prediction === 'attack'
                      ? 'bg-destructive/5 border-destructive/20'
                      : 'bg-neon-green/5 border-neon-green/20'
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      {result.prediction === 'attack' ? (
                        <XCircle className="w-6 h-6 text-destructive" />
                      ) : (
                        <CheckCircle className="w-6 h-6 text-neon-green" />
                      )}
                      <div>
                        <p className={`font-bold ${result.prediction === 'attack' ? 'text-destructive' : 'text-neon-green'}`}>
                          {result.prediction === 'attack' ? 'Attack Detected' : 'Normal Traffic'}
                          {result.attackType && ` - ${result.attackType}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {result.modelName} • {formatTimestamp(result.timestamp)}
                        </p>
                      </div>
                    </div>
                    <span className={`font-mono font-bold ${result.prediction === 'attack' ? 'text-destructive' : 'text-neon-green'}`}>
                      {Math.max(result.probability, 100 - result.probability).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Backend Integration Notice */}
          {/* <div className="max-w-2xl mx-auto mt-12">
            <div className="p-6 rounded-xl bg-neon-magenta/5 border border-neon-magenta/20 text-center">
              <Zap className="w-8 h-8 text-neon-magenta mx-auto mb-3" />
              <h4 className="font-display font-bold text-foreground mb-2">Backend Integration Ready</h4>
              <p className="text-muted-foreground text-sm">
                This dashboard is prepared for ML API integration. Connect your trained Random Forest or SVM model endpoint in <code className="text-primary bg-primary/10 px-1 rounded">src/services/predictionService.ts</code> for real predictions.
              </p>
            </div>
          </div> */}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;