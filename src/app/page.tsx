// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { ArrowRight, Leaf, Recycle, Users, Coins, MapPin, Award, Globe, Zap, Star, TrendingUp, Shield } from 'lucide-react'

function AnimatedGlobe() {
  return (
    <div className="relative w-40 h-40 mx-auto mb-8">
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 to-green-600 opacity-20 animate-pulse"></div>
      <div className="absolute inset-2 rounded-full bg-gradient-to-r from-green-300 to-green-500 opacity-30 animate-ping"></div>
      <div className="absolute inset-4 rounded-full bg-gradient-to-r from-green-200 to-green-400 opacity-40 animate-spin"></div>
      <div className="absolute inset-6 rounded-full bg-gradient-to-r from-green-100 to-green-300 opacity-60 animate-bounce"></div>
      <div className="absolute inset-8 rounded-full bg-white opacity-80 animate-pulse"></div>
      <Leaf className="absolute inset-0 m-auto h-20 w-20 text-green-600 animate-pulse" />
      <div className="absolute top-6 right-6 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
      <div className="absolute bottom-8 left-8 w-1 h-1 bg-green-500 rounded-full animate-bounce"></div>
      <div className="absolute top-12 left-4 w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse"></div>
    </div>
  )
}

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className={`absolute w-2 h-2 bg-green-${400 + (i % 3) * 100} rounded-full opacity-30 animate-float`}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${3 + Math.random() * 2}s`
          }}
        />
      ))}
    </div>
  )
}

function StatsHighlight({ value, label, trend }: { value: string; label: string; trend: string }) {
  return (
    <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-center">
      <div className="text-3xl font-bold text-white mb-2">{value}</div>
      <div className="text-green-200 text-sm mb-1">{label}</div>
      <div className="flex items-center justify-center gap-1 text-xs text-green-300">
        <TrendingUp className="w-3 h-3" />
        {trend}
      </div>
    </div>
  )
}

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [impactData, setImpactData] = useState({
    wasteCollected: 0,
    reportsSubmitted: 0,
    tokensEarned: 0,
    co2Offset: 0
  });

  useEffect(() => {
    // Simulating API calls with mock data since we can't use external dependencies
    const mockData = {
      wasteCollected: 1247.5,
      reportsSubmitted: 89,
      tokensEarned: 3450,
      co2Offset: 623.8
    };
    
    // Simulate loading delay
    setTimeout(() => {
      setImpactData(mockData);
    }, 1000);
  }, []);

  const login = () => {
    setLoggedIn(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      <FloatingParticles />
      
      {/* Hero Section */}
      <section className="relative container mx-auto px-4 py-20 text-center">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-transparent rounded-full blur-3xl transform -translate-y-12"></div>
        
        <AnimatedGlobe />
        
        <h1 className="text-7xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-white via-green-200 to-green-400 bg-clip-text text-transparent tracking-tight leading-tight">
          Swachh-Bharat
        </h1>
        <div className="text-4xl md:text-5xl font-bold mb-8 text-green-400">
          Waste Management
        </div>
        
        <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-12">
          Join our revolutionary community in making waste management more efficient, rewarding, and sustainable. 
          <span className="text-green-400 font-semibold"> Transform your environment, earn rewards!</span>
        </p>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
          <StatsHighlight value="1.2K+" label="Waste Collected (kg)" trend="+12% this week" />
          <StatsHighlight value="89" label="Reports Submitted" trend="+8% this week" />
          <StatsHighlight value="3.4K" label="Tokens Earned" trend="+15% this week" />
          <StatsHighlight value="623kg" label="CO2 Offset" trend="+10% this week" />
        </div>
        
        {!loggedIn ? (
          <div className="space-y-4">
            <button 
              onClick={login} 
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-lg py-6 px-12 rounded-full font-medium transition-all duration-300 ease-in-out transform hover:scale-105 shadow-2xl hover:shadow-green-500/25 border border-green-500/30 backdrop-blur-sm"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5 inline" />
            </button>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400" />
                <span>4.8/5 Rating</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-green-400" />
                <span>10K+ Users</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-blue-400" />
                <span>Secure</span>
              </div>
            </div>
          </div>
        ) : (
          <button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-lg py-6 px-12 rounded-full font-medium transition-all duration-300 ease-in-out transform hover:scale-105 shadow-2xl hover:shadow-green-500/25 border border-green-500/30 backdrop-blur-sm">
            Report Waste
            <ArrowRight className="ml-2 h-5 w-5 inline" />
          </button>
        )}
      </section>
      
      {/* Features Section */}
      <section className="relative container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-16 text-white">Why Choose Our Platform?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={Leaf}
            title="Eco-Friendly"
            description="Contribute to a cleaner environment by reporting and collecting waste. Every action counts towards a sustainable future."
            gradient="from-green-600 to-green-700"
          />
          <FeatureCard
            icon={Coins}
            title="Earn Rewards"
            description="Get tokens for your contributions to waste management efforts. Turn your environmental impact into real rewards."
            gradient="from-yellow-600 to-yellow-700"
          />
          <FeatureCard
            icon={Users}
            title="Community-Driven"
            description="Be part of a growing community committed to sustainable practices. Connect with like-minded individuals."
            gradient="from-blue-600 to-blue-700"
          />
        </div>
      </section>

      {/* Enhanced Impact Section */}
      <section className="relative container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-xl border border-white/10 p-12 rounded-3xl shadow-2xl">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-green-400 bg-clip-text text-transparent">
              Our Global Impact
            </h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Together, we're creating a measurable difference in waste management and environmental conservation.
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <ImpactCard 
              title="Waste Collected" 
              value={`${impactData.wasteCollected} kg`} 
              icon={Recycle} 
              color="text-green-400"
              bgColor="bg-green-500/20"
            />
            <ImpactCard 
              title="Reports Submitted" 
              value={impactData.reportsSubmitted.toString()} 
              icon={MapPin} 
              color="text-blue-400"
              bgColor="bg-blue-500/20"
            />
            <ImpactCard 
              title="Tokens Earned" 
              value={impactData.tokensEarned.toString()} 
              icon={Coins} 
              color="text-yellow-400"
              bgColor="bg-yellow-500/20"
            />
            <ImpactCard 
              title="CO2 Offset" 
              value={`${impactData.co2Offset} kg`} 
              icon={Leaf} 
              color="text-emerald-400"
              bgColor="bg-emerald-500/20"
            />
          </div>
          
          {/* Additional Impact Metrics */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10">
              <Award className="w-8 h-8 text-purple-400 mx-auto mb-3" />
              <div className="text-2xl font-bold text-white mb-1">25</div>
              <div className="text-sm text-gray-400">Achievement Badges</div>
            </div>
            <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10">
              <Globe className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
              <div className="text-2xl font-bold text-white mb-1">12</div>
              <div className="text-sm text-gray-400">Cities Covered</div>
            </div>
            <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10">
              <Zap className="w-8 h-8 text-orange-400 mx-auto mb-3" />
              <div className="text-2xl font-bold text-white mb-1">98%</div>
              <div className="text-sm text-gray-400">Resolution Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="relative container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-4xl font-bold mb-6 text-white">Ready to Make a Difference?</h3>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of users who are already transforming their communities through sustainable waste management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-4 rounded-full font-medium transition-all duration-300 transform hover:scale-105 shadow-lg">
              Start Your Journey
            </button>
            <button className="bg-transparent border-2 border-green-500 text-green-400 hover:bg-green-500 hover:text-white px-8 py-4 rounded-full font-medium transition-all duration-300">
              Learn More
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

function ImpactCard({ title, value, icon: Icon, color, bgColor }: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType;
  color: string;
  bgColor: string;
}) {
  const formattedValue = typeof value === 'number' ? value.toLocaleString('en-US', { maximumFractionDigits: 1 }) : value;
  
  return (
    <div className={`relative p-8 rounded-xl ${bgColor} border border-white/10 transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-105 backdrop-blur-sm group`}>
      <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative z-10">
        <Icon className={`h-12 w-12 ${color} mb-4 transition-transform duration-300 group-hover:scale-110`} />
        <p className="text-4xl font-bold mb-2 text-white">{formattedValue}</p>
        <p className="text-sm text-gray-300">{title}</p>
      </div>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description, gradient }: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
  gradient: string;
}) {
  return (
    <div className="relative bg-white/5 backdrop-blur-sm p-8 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300 ease-in-out flex flex-col items-center text-center group hover:transform hover:scale-105">
      <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative z-10">
        <div className={`bg-gradient-to-r ${gradient} p-4 rounded-full mb-6 transition-transform duration-300 group-hover:scale-110`}>
          <Icon className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-2xl font-semibold mb-4 text-white">{title}</h3>
        <p className="text-gray-300 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}