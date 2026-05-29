import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { CheckCircle, Shield, Cpu, TrendingUp, Rocket, Clock, Brain, Cloud, Lock,  Code, BookOpen, Lightbulb, Github, Code2, GitBranch, Star, Mail, MapPin, GraduationCap } from 'lucide-react';
import { useEffect, useState } from 'react';

const Results = () => {

  const [rfMetrics, setRfMetrics] = useState<any>(null);
  const [svmMetrics, setSvmMetrics] = useState<any>(null);
  const [dnnMetrics, setDnnMetrics] = useState<any>(null);
  const [cnnMetrics, setCnnMetrics] = useState<any>(null);
  const [svmDataset, setSvmDataset] = useState<any>(null);
  const [rfDataset, setRfDataset] = useState<any>(null);
  const [dnnDataset, setDnnDataset] = useState<any>(null);
  const [cnnDataset, setCnnDataset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState("rf");
  const [bestModel, setBestModel] = useState<string>("");
  
  // Helper function to truncate to 2 decimal places without rounding
  const truncateToTwoDecimals = (value: number) => {
    return Math.floor(value * 100) / 100;
  };
  
  // Helper function to format percentage for display
  const formatPercent = (value: number) => {
    return (Math.floor(value * 10000) / 100).toFixed(2);
  };
  
  // ==============================
  // FETCH REAL MODEL METRICS
  // ==============================
  useEffect(() => {
    async function fetchMetrics() {
      try {
        const rfRes = await fetch("https://bot-iot-2-0.onrender.com/models/rf/metrics");
        const svmRes = await fetch("https://bot-iot-2-0.onrender.com/models/svm/metrics");
        const dnnRes = await fetch("https://bot-iot-2-0.onrender.com/models/dnn/metrics");
        const cnnRes = await fetch("https://bot-iot-2-0.onrender.com/models/cnn/metrics");

        const svmDat = await fetch("https://bot-iot-2-0.onrender.com/models/svm/dataset");
        const rfDat = await fetch("https://bot-iot-2-0.onrender.com/models/rf/dataset");
        const dnnDat = await fetch("https://bot-iot-2-0.onrender.com/models/dnn/dataset");
        const cnnDat = await fetch("https://bot-iot-2-0.onrender.com/models/cnn/dataset");
        
        const rfData = await rfRes.json();
        const svmData = await svmRes.json();
        const dnnData = await dnnRes.json();
        const cnnData = await cnnRes.json();
        
        const svmDataset = await svmDat.json();
        const rfDataset = await rfDat.json();
        const dnnDataset = await dnnDat.json();
        const cnnDataset = await cnnDat.json();

        setRfMetrics(rfData);
        setSvmMetrics(svmData);
        setDnnMetrics(dnnData);
        setCnnMetrics(cnnData);
        setSvmDataset(svmDataset);
        setRfDataset(rfDataset);
        setDnnDataset(dnnDataset);
        setCnnDataset(cnnDataset);
        
        // Determine best model by accuracy
        const models = [
          { name: "rf", accuracy: rfData.test_accuracy },
          { name: "svm", accuracy: svmData.test_accuracy },
          { name: "dnn", accuracy: dnnData.test_accuracy },
          { name: "cnn", accuracy: cnnData.test_accuracy }
        ];
        const best = models.reduce((prev, current) => 
          (current.accuracy > prev.accuracy) ? current : prev
        );
        setBestModel(best.name);
        
      } catch (error) {
        console.error("Failed to fetch metrics:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="pt-32 text-center text-white">
        Loading model results...
      </div>
    );
  }

  if (!rfMetrics || !svmMetrics || !dnnMetrics || !cnnMetrics) {
    return (
      <div className="pt-32 text-center text-red-500">
        Failed to load model metrics.
      </div>
    );
  }

  // ==============================
  // REAL DATA FROM BACKEND (USING TRUNCATION)
  // ==============================
  const accuracyData = [
    {
      name: "Random Forest",
      accuracy: truncateToTwoDecimals(rfMetrics.test_accuracy * 100),
      fill: 'hsl(150, 100%, 50%)'
    },
    {
      name: "SVM",
      accuracy: truncateToTwoDecimals(svmMetrics.test_accuracy * 100),
      fill: 'hsl(185, 100%, 50%)'
    },
    {
      name: "DNN",
      accuracy: truncateToTwoDecimals(dnnMetrics.test_accuracy * 100),
      fill: 'hsl(280, 100%, 50%)'
    },
    {
      name: "CNN",
      accuracy: truncateToTwoDecimals(cnnMetrics.test_accuracy * 100),
      fill: 'hsl(20, 100%, 50%)'
    },
  ];

  const metricsData = [
    {
      metric: "Precision",
      RF: truncateToTwoDecimals(rfMetrics.precision * 100),
      SVM: truncateToTwoDecimals(svmMetrics.precision * 100),
      DNN: truncateToTwoDecimals(dnnMetrics.precision * 100),
      CNN: truncateToTwoDecimals(cnnMetrics.precision * 100)
    },
    {
      metric: "Recall",
      RF: truncateToTwoDecimals(rfMetrics.recall * 100),
      SVM: truncateToTwoDecimals(svmMetrics.recall * 100),
      DNN: truncateToTwoDecimals(dnnMetrics.recall * 100),
      CNN: truncateToTwoDecimals(cnnMetrics.recall * 100)
    },
    {
      metric: "F1-Score",
      RF: truncateToTwoDecimals(rfMetrics.f1_score * 100),
      SVM: truncateToTwoDecimals(svmMetrics.f1_score * 100),
      DNN: truncateToTwoDecimals(dnnMetrics.f1_score * 100),
      CNN: truncateToTwoDecimals(cnnMetrics.f1_score * 100)
    },
    {
      metric: "Accuracy",
      RF: truncateToTwoDecimals(rfMetrics.test_accuracy * 100),
      SVM: truncateToTwoDecimals(svmMetrics.test_accuracy * 100),
      DNN: truncateToTwoDecimals(dnnMetrics.test_accuracy * 100),
      CNN: truncateToTwoDecimals(cnnMetrics.test_accuracy * 100)
    },
  ];

  const cm =
    selectedModel === "rf"
      ? rfMetrics.confusion_matrix
      : selectedModel === "svm"
      ? svmMetrics.confusion_matrix
      : selectedModel === "dnn"
      ? dnnMetrics.confusion_matrix
      : cnnMetrics.confusion_matrix;

  const confusionData = [
    { name: "True Negative", value: truncateToTwoDecimals(cm[0][0]), color: 'hsl(185, 100%, 50%)' },
    { name: "False Positive", value: truncateToTwoDecimals(cm[0][1]), color: 'hsl(330, 100%, 50%)' },
    { name: "False Negative", value: truncateToTwoDecimals(cm[1][0]), color: 'hsl(30, 100%, 50%)' },
    { name: "True Positive", value: truncateToTwoDecimals(cm[1][1]), color: 'hsl(150, 100%, 50%)' },
  ];

  // Table data for all models - using truncation to show 99.99 instead of 100
  const tableData = [
    {
      model: "Random Forest",
      accuracy: formatPercent(rfMetrics.test_accuracy),
      precision: formatPercent(rfMetrics.precision),
      recall: formatPercent(rfMetrics.recall),
      f1: formatPercent(rfMetrics.f1_score),
      samples: rfDataset?.test_samples?.toLocaleString() || "N/A",
      color: 'text-neon-green'
    },
    {
      model: "SVM",
      accuracy: formatPercent(svmMetrics.test_accuracy),
      precision: formatPercent(svmMetrics.precision),
      recall: formatPercent(svmMetrics.recall),
      f1: formatPercent(svmMetrics.f1_score),
      samples: svmDataset?.test_samples?.toLocaleString() || "N/A",
      color: 'text-primary'
    },
    {
      model: "DNN",
      accuracy: formatPercent(dnnMetrics.test_accuracy),
      precision: formatPercent(dnnMetrics.precision),
      recall: formatPercent(dnnMetrics.recall),
      f1: formatPercent(dnnMetrics.f1_score),
      samples: dnnDataset?.test_samples?.toLocaleString() || "N/A",
      color: 'text-neon-purple'
    },
    {
      model: "CNN",
      accuracy: formatPercent(cnnMetrics.test_accuracy),
      precision: formatPercent(cnnMetrics.precision),
      recall: formatPercent(cnnMetrics.recall),
      f1: formatPercent(cnnMetrics.f1_score),
      samples: cnnDataset?.test_samples?.toLocaleString() || "N/A",
      color: 'text-neon-orange'
    },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-primary/30 rounded-lg p-3 shadow-lg">
          <p className="text-foreground font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const conclusions = [
    {
      icon: Shield,
      title: 'Effective Detection',
      description: 'Both Random Forest and SVM demonstrate high effectiveness in detecting various types of intrusions in IoT networks.',
    },
    {
      icon: TrendingUp,
      title: 'High Performance',
      description: 'Random Forest achieved 99.99% accuracy, showing exceptional capability in classifying normal and malicious traffic.',
    },
    {
      icon: Cpu,
      title: 'IoT Suitability',
      description: 'The lightweight nature of these algorithms makes them suitable for deployment in resource-constrained IoT environments.',
    },
  ];

  const futureWork = [
    {
      icon: Clock,
      title: 'Real-time Deployment',
      description: 'Implementing the IDS for real-time network traffic monitoring and instant threat detection in production IoT environments.',
      status: 'Next Phase',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/30',
    },
    {
      icon: Brain,
      title: 'Deep Learning Integration',
      description: 'Exploring deep learning models like LSTM and CNN for improved pattern recognition and zero-day attack detection.',
      status: 'Research',
      color: 'text-neon-green',
      bgColor: 'bg-neon-green/10',
      borderColor: 'border-neon-green/30',
    },
    {
      icon: Cpu,
      title: 'Edge Device Security',
      description: 'Optimizing models for direct deployment on edge devices and IoT gateways for decentralized threat detection.',
      status: 'Development',
      color: 'text-neon-magenta',
      bgColor: 'bg-neon-magenta/10',
      borderColor: 'border-neon-magenta/30',
    },
    {
      icon: Cloud,
      title: 'Cloud-Edge Hybrid',
      description: 'Developing a hybrid architecture combining edge computing with cloud-based advanced analytics.',
      status: 'Planned',
      color: 'text-neon-purple',
      bgColor: 'bg-neon-purple/10',
      borderColor: 'border-neon-purple/30',
    },
    {
      icon: Lock,
      title: 'Federated Learning',
      description: 'Implementing federated learning to train models across multiple IoT networks while preserving data privacy.',
      status: 'Future',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/30',
    },
  ];

  const teamMembers = [
    {
      name: 'Dr. Sudhir Kumar Pandey',
      role: 'Faculty Advisor',
      icon: Lightbulb,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/30',
      isGuide: true,
    },
    {
      name: 'SHUBHAM KUMAR',
      role: 'Team Member',
      icon: Code,
      color: 'text-neon-green',
      bgColor: 'bg-neon-green/10',
      borderColor: 'border-neon-green/30',
    },
    {
      name: 'ASHISH RANJAN',
      role: 'Team Member',
      icon: Code,
      color: 'text-neon-green',
      bgColor: 'bg-neon-green/10',
      borderColor: 'border-neon-green/30',
    },
    {
      name: 'SACHIN KR YADAV',
      role: 'Team Member',
      icon: BookOpen,
      color: 'text-neon-magenta',
      bgColor: 'bg-neon-magenta/10',
      borderColor: 'border-neon-magenta/30',
    },
    {
      name: 'MANIKANT',
      role: 'Team Member',
      icon: Code,
      color: 'text-neon-purple',
      bgColor: 'bg-neon-purple/10',
      borderColor: 'border-neon-purple/30',
    },
  ];

  return (
    <div className="pt-16">
      {/* Results Charts Section */}
      <section className="py-24 relative bg-secondary/30">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="text-center mb-16 fade-in-up">
            <span className="font-mono text-primary text-sm tracking-wider uppercase mb-4 block">
              [ Results & Graphs ]
            </span>
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
              Performance <span className="gradient-text">Analysis</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Comprehensive evaluation metrics demonstrating the effectiveness of our intrusion detection models.
            </p>
          </div>

          {/* Best Model Badge */}
          {bestModel && (
            <div className="flex justify-center mb-10">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-neon-green/10 to-primary/10 border border-neon-green/30">
                <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                <span className="font-mono text-neon-green font-semibold">
                  Best Model: {bestModel.toUpperCase()} — {
                    bestModel === "rf" ? formatPercent(rfMetrics.test_accuracy) :
                    bestModel === "svm" ? formatPercent(svmMetrics.test_accuracy) :
                    bestModel === "dnn" ? formatPercent(dnnMetrics.test_accuracy) :
                    formatPercent(cnnMetrics.test_accuracy)
                  }% accuracy
                </span>
              </div>
            </div>
          )}

          {/* Charts Grid */}
          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Accuracy Comparison */}
            <div className="cyber-card p-6 fade-in-up stagger-1">
              <h3 className="font-display text-xl font-bold mb-6 text-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Model Accuracy Comparison
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={accuracyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(185, 50%, 20%)" />
                    <XAxis dataKey="name" tick={{ fill: 'hsl(180, 20%, 60%)' }} />
                    <YAxis domain={[90, 100]} tick={{ fill: 'hsl(180, 20%, 60%)' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="accuracy" radius={[8, 8, 0, 0]}>
                      {accuracyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Confusion Matrix Pie */}
            <div className="cyber-card p-6 fade-in-up stagger-2">
              {/* Header with Dropdown */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                  Confusion Matrix Distribution
                </h3>

                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-secondary border border-primary/30 rounded-md px-3 py-1 text-sm text-foreground"
                >
                  <option value="rf">Random Forest</option>
                  <option value="svm">SVM</option>
                  <option value="dnn">DNN</option>
                  <option value="cnn">CNN</option>
                </select>
              </div>

              {/* Pie Chart */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={confusionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {confusionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(240, 10%, 6%)",
                        border: "1px solid hsl(185, 50%, 20%)",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend
                      formatter={(value) => (
                        <span style={{ color: "hsl(180, 20%, 60%)" }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Performance Metrics Comparison */}
            <div className="cyber-card p-6 lg:col-span-2 fade-in-up stagger-3">
  <h3 className="font-display text-xl font-bold mb-6 text-foreground flex items-center gap-2">
    <span className="w-2 h-2 rounded-full bg-neon-magenta animate-pulse" />
    Precision, Recall & F1-Score Comparison
  </h3>
  <div className="h-72">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={metricsData}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(185, 50%, 20%)" />
        <XAxis 
          dataKey="metric" 
          tick={{ fill: 'hsl(180, 20%, 60%)' }}
          axisLine={{ stroke: 'hsl(185, 50%, 30%)' }}
        />
        <YAxis 
          domain={[99.9, 100]} 
          tick={{ fill: 'hsl(180, 20%, 60%)' }}
          tickFormatter={(value) => value.toFixed(2)}
          axisLine={{ stroke: 'hsl(185, 50%, 30%)' }}
          ticks={[99.9, 99.92, 99.94, 99.96, 99.98, 100]}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => <span style={{ color: 'hsl(180, 100%, 95%)' }}>{value}</span>}
          wrapperStyle={{ paddingTop: '10px' }}
        />
        <Line
          type="monotone"
          dataKey="RF"
          name="Random Forest"
          stroke="hsl(150, 100%, 50%)"
          strokeWidth={3}
          dot={{ fill: 'hsl(150, 100%, 50%)', r: 6 }}
          activeDot={{ r: 8 }}
        />
        <Line
          type="monotone"
          dataKey="SVM"
          name="SVM"
          stroke="hsl(185, 100%, 50%)"
          strokeWidth={3}
          dot={{ fill: 'hsl(185, 100%, 50%)', r: 6 }}
          activeDot={{ r: 8 }}
        />
        <Line
          type="monotone"
          dataKey="DNN"
          name="DNN"
          stroke="hsl(280, 100%, 50%)"
          strokeWidth={3}
          dot={{ fill: 'hsl(280, 100%, 50%)', r: 6 }}
          activeDot={{ r: 8 }}
        />
        <Line
          type="monotone"
          dataKey="CNN"
          name="CNN"
          stroke="hsl(20, 100%, 50%)"
          strokeWidth={3}
          dot={{ fill: 'hsl(20, 100%, 50%)', r: 6 }}
          activeDot={{ r: 8 }}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
</div>
          </div>

          {/* Detailed Metrics Table */}
          <div className="mt-12 max-w-6xl mx-auto fade-in-up">
            <div className="cyber-card p-6 overflow-x-auto">
              <h3 className="font-display text-xl font-bold mb-6 text-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                Detailed Model Comparison Table
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-3 text-left text-muted-foreground font-mono">Model</th>
                    <th className="py-3 text-center text-muted-foreground">Accuracy (%)</th>
                    <th className="py-3 text-center text-muted-foreground">Precision (%)</th>
                    <th className="py-3 text-center text-muted-foreground">Recall (%)</th>
                    <th className="py-3 text-center text-muted-foreground">F1-Score (%)</th>
                    <th className="py-3 text-right text-muted-foreground">Test Samples</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, idx) => (
                    <tr 
                      key={row.model} 
                      className={`border-b border-border/50 hover:bg-primary/5 transition-colors ${
                        (bestModel === "rf" && row.model === "Random Forest") ||
                        (bestModel === "svm" && row.model === "SVM") ||
                        (bestModel === "dnn" && row.model === "DNN") ||
                        (bestModel === "cnn" && row.model === "CNN")
                          ? "bg-neon-green/5"
                          : ""
                      }`}
                    >
                      <td className={`py-3 font-semibold ${row.color}`}>
                        {row.model}
                        {((bestModel === "rf" && row.model === "Random Forest") ||
                          (bestModel === "svm" && row.model === "SVM") ||
                          (bestModel === "dnn" && row.model === "DNN") ||
                          (bestModel === "cnn" && row.model === "CNN")) && (
                          <span className="ml-2 text-xs text-neon-green">★ Best</span>
                        )}
                      </td>
                      <td className="py-3 text-center text-foreground font-mono">
                        {row.accuracy}%
                      </td>
                      <td className="py-3 text-center text-foreground font-mono">
                        {row.precision}%
                      </td>
                      <td className="py-3 text-center text-foreground font-mono">
                        {row.recall}%
                      </td>
                      <td className="py-3 text-center text-foreground font-mono">
                        {row.f1}%
                      </td>
                      <td className="py-3 text-right text-muted-foreground font-mono">
                        {row.samples}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Key Findings */}
          {/* <div className="mt-12 max-w-6xl mx-auto fade-in-up">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="cyber-card p-6 text-center hover-lift">
                <div className="text-4xl font-display font-bold text-neon-green neon-text-green mb-2">{formatPercent(rfMetrics.test_accuracy)}%</div>
                <p className="text-muted-foreground text-sm">Random Forest Accuracy</p>
              </div>
              <div className="cyber-card p-6 text-center hover-lift">
                <div className="text-4xl font-display font-bold text-primary neon-text-cyan mb-2">{formatPercent(svmMetrics.test_accuracy)}%</div>
                <p className="text-muted-foreground text-sm">SVM Accuracy</p>
              </div>
              <div className="cyber-card p-6 text-center hover-lift">
                <div className="text-4xl font-display font-bold text-neon-purple neon-text-purple mb-2">{formatPercent(dnnMetrics.test_accuracy)}%</div>
                <p className="text-muted-foreground text-sm">DNN Accuracy</p>
              </div>
              <div className="cyber-card p-6 text-center hover-lift">
                <div className="text-4xl font-display font-bold text-neon-orange neon-text-orange mb-2">{formatPercent(cnnMetrics.test_accuracy)}%</div>
                <p className="text-muted-foreground text-sm">CNN Accuracy</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
              <div className="cyber-card p-6 text-center hover-lift">
                <div className="text-4xl font-display font-bold text-neon-green neon-text-green mb-2">
                  {Math.round(rfDataset?.test_samples / 1000) || 0}K
                </div>
                <p className="text-muted-foreground text-sm">RF Samples Tested</p>
              </div>
              <div className="cyber-card p-6 text-center hover-lift">
                <div className="text-4xl font-display font-bold text-primary neon-text-cyan mb-2">
                  {Math.round(svmDataset?.test_samples / 1000) || 0}K
                </div>
                <p className="text-muted-foreground text-sm">SVM Samples Tested</p>
              </div>
              <div className="cyber-card p-6 text-center hover-lift">
                <div className="text-4xl font-display font-bold text-neon-purple neon-text-purple mb-2">
                  {Math.round(dnnDataset?.test_samples / 1000) || 0}K
                </div>
                <p className="text-muted-foreground text-sm">DNN Samples Tested</p>
              </div>
              <div className="cyber-card p-6 text-center hover-lift">
                <div className="text-4xl font-display font-bold text-neon-orange neon-text-orange mb-2">
                  {Math.round(cnnDataset?.test_samples / 1000) || 0}K
                </div>
                <p className="text-muted-foreground text-sm">CNN Samples Tested</p>
              </div>
            </div>
          </div> */}
        </div>
      </section>

      {/* Conclusion Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="text-center mb-16 fade-in-up">
            <span className="font-mono text-primary text-sm tracking-wider uppercase mb-4 block">
              [ Conclusion ]
            </span>
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
              Project <span className="gradient-text">Conclusion</span>
            </h2>
          </div>

          {/* Main Conclusion */}
          <div className="max-w-4xl mx-auto">
            <div className="cyber-card p-8 md:p-12 mb-12 fade-in-up stagger-1">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-neon-green/10 border border-neon-green/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-neon-green" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-foreground mb-2">
                    Summary of Findings
                  </h3>
                </div>
              </div>

              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  This project successfully demonstrates the effectiveness of machine learning-based intrusion detection systems for IoT environments. Through the implementation and evaluation of Random Forest and Support Vector Machine algorithms, we have shown that these lightweight yet powerful techniques can accurately identify and classify various types of cyber attacks targeting IoT networks.
                </p>
                <p>
                  The experimental results on the Bot-IoT dataset validate that our approach achieves high detection accuracy while maintaining computational efficiency suitable for resource-constrained IoT devices. Random Forest emerged as the top performer with {formatPercent(rfMetrics.test_accuracy)}% accuracy, closely followed by SVM with {formatPercent(svmMetrics.test_accuracy)}% accuracy.
                </p>
                <p className="text-neon-green">
                  These findings contribute to the growing body of research aimed at securing the rapidly expanding IoT ecosystem against increasingly sophisticated cyber threats.
                </p>
              </div>
            </div>

            {/* Key Conclusions */}
            <div className="grid md:grid-cols-3 gap-6">
              {conclusions.map((item, index) => (
                <div
                  key={item.title}
                  className={`cyber-card p-6 hover-lift fade-in-up stagger-${index + 2}`}
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2 text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Future Scope Section */}
      <section className="py-24 relative bg-secondary/30">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="text-center mb-16 fade-in-up">
            <span className="font-mono text-primary text-sm tracking-wider uppercase mb-4 block">
              [ Future Scope ]
            </span>
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
              What's <span className="gradient-text">Next?</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Potential enhancements and future directions for extending this research.
            </p>
          </div>

          {/* Future Work Cards */}
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {futureWork.map((item, index) => (
                <div
                  key={item.title}
                  className={`cyber-card p-6 hover-lift fade-in-up stagger-${(index % 5) + 1} ${index === 0 ? 'lg:col-span-2 md:col-span-2' : ''
                    }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg ${item.bgColor} border ${item.borderColor} flex items-center justify-center`}>
                      <item.icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <span className={`px-3 py-1 rounded-full ${item.bgColor} border ${item.borderColor} ${item.color} text-xs font-medium`}>
                      {item.status}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2 text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Call to Action */}
            <div className="mt-16 text-center fade-in-up">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-primary/10 to-neon-green/10 border border-primary/20">
                <Rocket className="w-6 h-6 text-primary animate-float" />
                <span className="text-foreground font-medium">
                  This research opens doors to advanced IoT security solutions
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="text-center mb-16 fade-in-up">
            <span className="font-mono text-primary text-sm tracking-wider uppercase mb-4 block">
              [ Team Members ]
            </span>
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
              Meet Our <span className="gradient-text">Team</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              The talented individuals who contributed to this project.
            </p>
          </div>

          {/* Team Grid */}
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {teamMembers.map((member, index) => (
                <div
                  key={member.name}
                  className={`cyber-card p-6 text-center hover-lift fade-in-up stagger-${index + 1} ${
                    member.isGuide ? 'lg:col-span-4 md:col-span-2' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className={`w-20 h-20 mx-auto rounded-full ${member.bgColor} border-2 ${member.borderColor} flex items-center justify-center mb-4 ${member.isGuide ? 'w-24 h-24' : ''}`}>
                    <member.icon className={`${member.isGuide ? 'w-10 h-10' : 'w-8 h-8'} ${member.color}`} />
                  </div>

                  {/* Name */}
                  <h3 className={`font-display font-bold mb-1 text-foreground ${member.isGuide ? 'text-xl' : 'text-lg'}`}>
                    {member.name}
                  </h3>

                  {/* Role Badge */}
                  <span className={`inline-block px-3 py-1 rounded-full ${member.bgColor} border ${member.borderColor} ${member.color} text-xs font-medium`}>
                    {member.role}
                  </span>

                  {/* Lead Badge */}
                  {member.isGuide && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-muted-foreground text-sm">
                        Department of Computer Science & Engineering
                      </p>
                      <p className="text-primary text-sm font-mono mt-1">
                        LNJPIT, Chapra | 7th Semester
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* GitHub Section */}
      <section className="py-24 relative bg-secondary/30">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="text-center mb-16 fade-in-up">
            <span className="font-mono text-primary text-sm tracking-wider uppercase mb-4 block">
              [ Source Code ]
            </span>
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
              <span className="gradient-text">GitHub</span> Repository
            </h2>
          </div>

          {/* GitHub Card */}
          <div className="max-w-2xl mx-auto">
            <div className="cyber-card p-8 text-center hover-lift fade-in-up stagger-1">
              {/* GitHub Icon */}
              <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
                <Github className="w-10 h-10 text-primary" />
              </div>

              <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                IoT-IDS-ML
              </h3>
              <p className="text-muted-foreground mb-6">
                Smart IoT Intrusion Detection using Random Forest & SVM
              </p>

              {/* Stats */}
              <div className="flex justify-center gap-6 mb-8">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Code2 className="w-4 h-4" />
                  <span className="text-sm">Python</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Star className="w-4 h-4" />
                  <span className="text-sm">Star</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GitBranch className="w-4 h-4" />
                  <span className="text-sm">Fork</span>
                </div>
              </div>

              {/* Coming Soon Badge */}
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary/10 border border-primary/30">
                <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                <span className="font-mono text-primary">Repository Coming Soon</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="text-center mb-16 fade-in-up">
            <span className="font-mono text-primary text-sm tracking-wider uppercase mb-4 block">
              [ Contact ]
            </span>
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
              Get In <span className="gradient-text">Touch</span>
            </h2>
          </div>

          {/* Contact Cards */}
          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
            <div className="cyber-card p-6 text-center hover-lift fade-in-up stagger-1">
              <div className="w-14 h-14 mx-auto rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                <GraduationCap className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">Institution</h3>
              <p className="text-muted-foreground text-sm">
                Loknayak Jai Prakash Institute of Technology
              </p>
              <p className="text-primary text-sm font-mono mt-1">LNJPIT, Chapra</p>
            </div>

            <div className="cyber-card p-6 text-center hover-lift fade-in-up stagger-2">
              <div className="w-14 h-14 mx-auto rounded-xl bg-neon-green/10 border border-neon-green/20 flex items-center justify-center mb-4">
                <MapPin className="w-7 h-7 text-neon-green" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">Department</h3>
              <p className="text-muted-foreground text-sm">
                Computer Science & Engineering
              </p>
              <p className="text-neon-green text-sm font-mono mt-1">7th Semester</p>
            </div>

            <div className="cyber-card p-6 text-center hover-lift fade-in-up stagger-3">
              <div className="w-14 h-14 mx-auto rounded-xl bg-neon-magenta/10 border border-neon-magenta/20 flex items-center justify-center mb-4">
                <Mail className="w-7 h-7 text-neon-magenta" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">Contact</h3>
              <p className="text-muted-foreground text-sm">
                For project inquiries
              </p>
              <p className="text-neon-magenta text-sm font-mono mt-1">Via College</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Results;