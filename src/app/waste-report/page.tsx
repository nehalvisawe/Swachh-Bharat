'use client'
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Recycle, Leaf, TrendingUp, AlertTriangle, Award, Calendar, Download, Filter, Loader2 } from 'lucide-react';

// Types for your database functions - adjust these according to your actual API
interface Report {
  id: string;
  amount?: string;
  createdAt: string;
  type?: string;
}

interface Reward {
  id: string;
  points: number;
  createdAt: string;
}

interface WasteTask {
  id: string;
  amount: string;
  type?: string;
  createdAt: string;
}

interface ImpactData {
  wasteCollected: number;
  reportsSubmitted: number;
  tokensEarned: number;
  co2Offset: number;
}

interface ProcessedData {
  wasteCollection: Array<{
    month: string;
    organic: number;
    recyclable: number;
    hazardous: number;
    total: number;
  }>;
  recyclingRates: Array<{
    category: string;
    rate: number;
    target: number;
  }>;
  sustainabilityMetrics: {
    carbonReduction: number;
    energySaved: number;
    waterSaved: number;
    treesEquivalent: number;
  };
  wasteComposition: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

interface WasteManagementReportProps {
  title?: string;
  dateRange?: string;
  // Add your API functions as props
  getRecentReports: (limit: number) => Promise<Report[]>;
  getAllRewards: () => Promise<Reward[]>;
  getWasteCollectionTasks: (limit: number) => Promise<WasteTask[]>;
}

const WasteManagementReport: React.FC<WasteManagementReportProps> = ({
  title = "Swachh Bharat Waste Management Report",
  dateRange = "Last 6 Months",
  getRecentReports,
  getAllRewards,
  getWasteCollectionTasks
}) => {
  const [impactData, setImpactData] = useState<ImpactData>({
    wasteCollected: 0,
    reportsSubmitted: 0,
    tokensEarned: 0,
    co2Offset: 0
  });
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('total');
  const [error, setError] = useState<string | null>(null);

  // Process raw data into chart-friendly format
  const processDataForCharts = (reports: Report[], rewards: Reward[], tasks: WasteTask[], impactData: ImpactData) => {
    // Group data by month for the last 6 months
    const monthlyData = new Map();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const monthName = months[monthIndex];
      monthlyData.set(monthName, { organic: 0, recyclable: 0, hazardous: 0, total: 0 });
    }

    // Process tasks by month
    tasks.forEach(task => {
      const taskDate = new Date(task.createdAt);
      const monthName = months[taskDate.getMonth()];
      const match = task.amount.match(/(\d+(\.\d+)?)/);
      const amount = match ? parseFloat(match[0]) : 0;
      
      if (monthlyData.has(monthName)) {
        const data = monthlyData.get(monthName);
        // Categorize based on task type or default distribution
        if (task.type?.toLowerCase().includes('organic')) {
          data.organic += amount;
        } else if (task.type?.toLowerCase().includes('recycl')) {
          data.recyclable += amount;
        } else if (task.type?.toLowerCase().includes('hazard')) {
          data.hazardous += amount;
        } else {
          // Default distribution if no type specified
          data.organic += amount * 0.45;
          data.recyclable += amount * 0.35;
          data.hazardous += amount * 0.2;
        }
        data.total += amount;
      }
    });

    const wasteCollection = Array.from(monthlyData.entries()).map(([month, data]) => ({
      month,
      ...data,
      organic: Math.round(data.organic * 10) / 10,
      recyclable: Math.round(data.recyclable * 10) / 10,
      hazardous: Math.round(data.hazardous * 10) / 10,
      total: Math.round(data.total * 10) / 10
    }));

    // Calculate recycling rates based on collected data
    const totalWaste = impactData.wasteCollected;
    const recyclingRates = [
      { category: 'Plastic', rate: Math.min(95, Math.round((totalWaste * 0.25) / (totalWaste * 0.3) * 100)), target: 75 },
      { category: 'Paper', rate: Math.min(95, Math.round((totalWaste * 0.3) / (totalWaste * 0.35) * 100)), target: 85 },
      { category: 'Glass', rate: Math.min(95, Math.round((totalWaste * 0.15) / (totalWaste * 0.15) * 100)), target: 90 },
      { category: 'Metal', rate: Math.min(95, Math.round((totalWaste * 0.1) / (totalWaste * 0.12) * 100)), target: 80 },
      { category: 'Organic', rate: Math.min(100, Math.round((totalWaste * 0.4) / (totalWaste * 0.45) * 100)), target: 95 }
    ];

    const sustainabilityMetrics = {
      carbonReduction: Math.round(impactData.co2Offset),
      energySaved: Math.round(impactData.wasteCollected * 12.5), // kWh saved per kg
      waterSaved: Math.round(impactData.wasteCollected * 8.2), // liters saved per kg
      treesEquivalent: Math.round(impactData.co2Offset / 15) // trees equivalent to CO2 offset
    };

    const wasteComposition = [
      { name: 'Organic', value: 45, color: '#16a34a' },
      { name: 'Recyclable', value: 35, color: '#22c55e' },
      { name: 'Non-Recyclable', value: 15, color: '#84cc16' },
      { name: 'Hazardous', value: 5, color: '#fbbf24' }
    ];

    return {
      wasteCollection,
      recyclingRates,
      sustainabilityMetrics,
      wasteComposition
    };
  };

  useEffect(() => {
    async function fetchImpactData() {
      setLoading(true);
      setError(null);
      
      try {
        const reports = await getRecentReports(100);  // Fetch last 100 reports
        const rewards = await getAllRewards();
        const tasks = await getWasteCollectionTasks(100);  // Fetch last 100 tasks
        
        const wasteCollected = tasks.reduce((total, task) => {
          const match = task.amount.match(/(\d+(\.\d+)?)/);
          const amount = match ? parseFloat(match[0]) : 0;
          return total + amount;
        }, 0);
        
        const reportsSubmitted = reports.length;
        const tokensEarned = rewards.reduce((total, reward) => total + (reward.points || 0), 0);
        const co2Offset = wasteCollected * 0.5;  // Assuming 0.5 kg CO2 offset per kg of waste
        
        const calculatedImpactData = {
          wasteCollected: Math.round(wasteCollected * 10) / 10, // Round to 1 decimal place
          reportsSubmitted,
          tokensEarned,
          co2Offset: Math.round(co2Offset * 10) / 10 // Round to 1 decimal place
        };
        
        setImpactData(calculatedImpactData);
        
        // Process data for charts
        const chartData = processDataForCharts(reports, rewards, tasks, calculatedImpactData);
        setProcessedData(chartData);
        
      } catch (error) {
        console.error("Error fetching impact data:", error);
        setError("Failed to load report data. Please try again later.");
        
        // Set default values in case of error
        const defaultImpactData = {
          wasteCollected: 0,
          reportsSubmitted: 0,
          tokensEarned: 0,
          co2Offset: 0
        };
        setImpactData(defaultImpactData);
        
        // Set default processed data
        setProcessedData({
          wasteCollection: [],
          recyclingRates: [
            { category: 'Plastic', rate: 0, target: 75 },
            { category: 'Paper', rate: 0, target: 85 },
            { category: 'Glass', rate: 0, target: 90 },
            { category: 'Metal', rate: 0, target: 80 },
            { category: 'Organic', rate: 0, target: 95 }
          ],
          sustainabilityMetrics: {
            carbonReduction: 0,
            energySaved: 0,
            waterSaved: 0,
            treesEquivalent: 0
          },
          wasteComposition: [
            { name: 'Organic', value: 45, color: '#16a34a' },
            { name: 'Recyclable', value: 35, color: '#22c55e' },
            { name: 'Non-Recyclable', value: 15, color: '#84cc16' },
            { name: 'Hazardous', value: 5, color: '#fbbf24' }
          ]
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchImpactData();
  }, [getRecentReports, getAllRewards, getWasteCollectionTasks]);

  const MetricCard = ({ icon: Icon, title, value, unit, trend, color = "text-green-600" }: any) => (
    <div className="bg-white rounded-lg shadow-md p-6 border border-green-100 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Icon className={`h-5 w-5 ${color}`} />
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value} 
            <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>
          </p>
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-medium">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
              <p className="text-gray-600">Generating sustainability report...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-green-600 p-3 rounded-lg">
                <Leaf className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                <p className="text-gray-600">{dateRange}</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                <Download className="h-4 w-4" />
                <span>Export PDF</span>
              </button>
              <button className="flex items-center space-x-2 bg-white border border-green-600 text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            icon={Recycle}
            title="Waste Collected"
            value={impactData.wasteCollected}
            unit="kg"
            trend={8.5}
            color="text-green-600"
          />
          <MetricCard
            icon={Award}
            title="Reports Submitted"
            value={impactData.reportsSubmitted}
            unit="reports"
            trend={12.3}
            color="text-emerald-600"
          />
          <MetricCard
            icon={TrendingUp}
            title="Tokens Earned"
            value={impactData.tokensEarned}
            unit="tokens"
            trend={5.7}
            color="text-lime-600"
          />
          <MetricCard
            icon={Leaf}
            title="CO₂ Offset"
            value={impactData.co2Offset}
            unit="kg"
            trend={15.2}
            color="text-teal-600"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Waste Collection Trends */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-green-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Waste Collection Trends</h2>
              <div className="flex space-x-2">
                {['total', 'organic', 'recyclable', 'hazardous'].map(metric => (
                  <button
                    key={metric}
                    onClick={() => setSelectedMetric(metric)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedMetric === metric
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {metric.charAt(0).toUpperCase() + metric.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={processedData?.wasteCollection || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #d1d5db',
                    borderRadius: '8px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={selectedMetric}
                  stroke="#16a34a"
                  fill="url(#gradient)"
                  strokeWidth={2}
                />
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Waste Composition */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-green-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Waste Composition</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={processedData?.wasteComposition || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {processedData?.wasteComposition.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Percentage']}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #d1d5db',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-4">
              {processedData?.wasteComposition.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600">{item.name}: {item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recycling Rates */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-green-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Recycling Performance</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={processedData?.recyclingRates || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="category" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #d1d5db',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="rate" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" fill="#dcfce7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Sustainability Impact */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-green-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Environmental Impact</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Leaf className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{processedData?.sustainabilityMetrics.carbonReduction || 0}</p>
                <p className="text-sm text-gray-600">kg CO₂ Reduced</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{processedData?.sustainabilityMetrics.energySaved || 0}</p>
                <p className="text-sm text-gray-600">kWh Energy Saved</p>
              </div>
              <div className="text-center">
                <div className="bg-cyan-100 p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Award className="h-8 w-8 text-cyan-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{processedData?.sustainabilityMetrics.waterSaved || 0}</p>
                <p className="text-sm text-gray-600">Liters Water Saved</p>
              </div>
              <div className="text-center">
                <div className="bg-emerald-100 p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Recycle className="h-8 w-8 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{processedData?.sustainabilityMetrics.treesEquivalent || 0}</p>
                <p className="text-sm text-gray-600">Trees Equivalent</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-green-200 text-center">
          <p className="text-gray-600 mb-2">Report generated on {new Date().toLocaleDateString()}</p>
          <p className="text-sm text-gray-500">Swachh Bharat Mission - Digital India Initiative</p>
        </div>
      </div>
    </div>
  );
};

export default WasteManagementReport;