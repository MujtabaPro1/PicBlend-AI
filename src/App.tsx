import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Hero from './components/Hero';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import Pricing from './components/Pricing';
import ImageProcessor from './components/ImageProcessor';

function App() {
  const [showProcessor, setShowProcessor] = useState(false);
  
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header onGetStarted={() => setShowProcessor(true)} />
      
      <main className="flex-grow">
        {showProcessor ? (
          <section className="container mx-auto px-4 py-12">
            <div className="bg-white rounded-xl shadow-xl overflow-hidden p-6 md:p-8">
              <button 
                onClick={() => setShowProcessor(false)}
                className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2 transition-colors"
              >
                ← Back to Home
              </button>
              <ImageProcessor />
            </div>
          </section>
        ) : (
          <>
            <Hero onGetStarted={() => setShowProcessor(true)} />
            <Features />
            <HowItWorks />
            <Pricing />
          </>
        )}
      </main>
      
      <Footer />
    </div>
  );
}

export default App;