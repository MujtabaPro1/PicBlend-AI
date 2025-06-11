import React from 'react';
import { 
  Zap, 
  Shield, 
  Sparkles, 
  Download, 
  Smartphone, 
  Clock,
  Eye,
  Layers
} from 'lucide-react';

const Features: React.FC = () => {
  const features = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Lightning Fast Processing',
      description: 'Process images in seconds with our optimized AI algorithms',
      color: 'from-yellow-400 to-orange-500'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Privacy Protected',
      description: 'All processing happens locally in your browser - your images never leave your device',
      color: 'from-green-400 to-emerald-500'
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: 'AI-Powered Precision',
      description: 'Advanced machine learning for accurate background removal and object detection',
      color: 'from-purple-400 to-pink-500'
    },
    {
      icon: <Eye className="w-8 h-8" />,
      title: 'License Plate Blurring',
      description: 'Automatically detect and blur license plates for privacy compliance',
      color: 'from-blue-400 to-cyan-500'
    },
    {
      icon: <Layers className="w-8 h-8" />,
      title: 'Realistic Shadows & Reflections',
      description: 'Generate natural-looking shadows and reflections for professional results',
      color: 'from-indigo-400 to-purple-500'
    },
    {
      icon: <Download className="w-8 h-8" />,
      title: 'High-Quality Export',
      description: 'Download your processed images in full resolution PNG format',
      color: 'from-teal-400 to-blue-500'
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: 'Mobile Optimized',
      description: 'Works seamlessly across all devices - desktop, tablet, and mobile',
      color: 'from-rose-400 to-pink-500'
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: 'No Wait Times',
      description: 'Instant processing with no queues or waiting - start creating immediately',
      color: 'from-amber-400 to-yellow-500'
    }
  ];

  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Powerful Features for
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Professional Results</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to create stunning composite images with advanced AI technology
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
            >
              <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
        
        {/* Stats section */}
        <div className="mt-20 bg-white rounded-3xl p-8 lg:p-12 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                10M+
              </div>
              <div className="text-gray-600 font-medium">Images Processed</div>
            </div>
            <div>
              <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-2">
                99.9%
              </div>
              <div className="text-gray-600 font-medium">Accuracy Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                &lt;3s
              </div>
              <div className="text-gray-600 font-medium">Average Processing</div>
            </div>
            <div>
              <div className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
                100K+
              </div>
              <div className="text-gray-600 font-medium">Happy Users</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;