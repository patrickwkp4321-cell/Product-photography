/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Sparkles, 
  Settings, 
  Image as ImageIcon, 
  ChevronRight, 
  ChevronLeft, 
  Loader2, 
  CheckCircle2,
  Camera,
  Maximize,
  Layout
} from 'lucide-react';
import { analyzeProduct, generateAdVariants } from './lib/gemini';

type Step = 'upload' | 'analyze' | 'customize' | 'generate';

interface Concept {
  theme: string;
  description: string;
  lighting: string;
  prompt: string;
}

export default function App() {
  const [step, setStep] = useState<Step>('upload');
  const [image, setImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [ratio, setRatio] = useState<"1:1" | "3:4" | "4:3" | "9:16" | "16:9">("1:1");
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImages, setResultImages] = useState<string[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setImage(base64);
        setMimeType(file.type);
        setStep('analyze');
        handleAnalyze(base64, file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async (base64: string, type: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      const result = await analyzeProduct(base64, type);
      setConcepts(result);
      if (result.length > 0) {
        setSelectedConcept(result[0]);
        setCustomPrompt(result[0].prompt);
      }
    } catch (err) {
      setError('Failed to analyze product. Please try again.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerate = async () => {
    if (!image || !customPrompt) return;
    setIsProcessing(true);
    setError(null);
    setStep('generate');
    try {
      const results = await generateAdVariants(image, mimeType, customPrompt, ratio);
      setResultImages(results);
      setSelectedResultIndex(0);
    } catch (err) {
      setError('Failed to generate advertisements. Please try again.');
      setStep('customize');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setStep('upload');
    setImage(null);
    setResultImages([]);
    setConcepts([]);
    setSelectedConcept(null);
    setCustomPrompt('');
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#1a1a1a] font-sans selection:bg-black selection:text-white">
      {/* Navigation Rail / Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-black/5 z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <Camera className="text-white w-5 h-5" />
          </div>
          <span className="font-semibold tracking-tight text-lg">AdGenius</span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1 text-xs font-medium uppercase tracking-widest opacity-40">
            <span className={step === 'upload' ? 'opacity-100 text-black' : ''}>01 Upload</span>
            <ChevronRight size={12} />
            <span className={step === 'analyze' ? 'opacity-100 text-black' : ''}>02 Analyze</span>
            <ChevronRight size={12} />
            <span className={step === 'customize' ? 'opacity-100 text-black' : ''}>03 Customize</span>
            <ChevronRight size={12} />
            <span className={step === 'generate' ? 'opacity-100 text-black' : ''}>04 Result</span>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6 max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center min-h-[60vh] text-center"
            >
              <h1 className="text-5xl md:text-7xl font-light tracking-tighter mb-6">
                Professional ads,<br />
                <span className="font-semibold italic">instantly.</span>
              </h1>
              <p className="text-lg text-black/60 max-w-xl mb-12">
                Upload your product photo and let our AI guide you through creating high-end commercial advertisements tailored for your brand.
              </p>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group relative w-full max-w-md aspect-video bg-white border-2 border-dashed border-black/10 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-black/30 transition-all duration-300"
              >
                <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 opacity-40 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="font-medium">Click to upload product photo</p>
                <p className="text-sm text-black/40">PNG, JPG up to 10MB</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept="image/*"
                />
              </div>
            </motion.div>
          )}

          {step === 'analyze' && (
            <motion.div
              key="analyze"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start"
            >
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight mb-2">Analyzing Product</h2>
                  <p className="text-black/60">Our AI is identifying your product and brainstorming creative concepts.</p>
                </div>

                {isProcessing ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-32 bg-white rounded-2xl animate-pulse border border-black/5" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {concepts.map((concept, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedConcept(concept);
                          setCustomPrompt(concept.prompt);
                        }}
                        className={`w-full text-left p-6 rounded-2xl border transition-all ${
                          selectedConcept?.theme === concept.theme 
                          ? 'bg-black text-white border-black shadow-xl' 
                          : 'bg-white border-black/5 hover:border-black/20'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg">{concept.theme}</h3>
                          {selectedConcept?.theme === concept.theme && <CheckCircle2 size={20} />}
                        </div>
                        <p className={`text-sm ${selectedConcept?.theme === concept.theme ? 'opacity-70' : 'text-black/60'}`}>
                          {concept.description}
                        </p>
                      </button>
                    ))}
                    
                    <button 
                      onClick={() => setStep('customize')}
                      className="w-full py-4 bg-black text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-black/90 transition-colors mt-8"
                    >
                      Continue with Selection <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </div>

              <div className="sticky top-24">
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-black/5">
                  <div className="aspect-square rounded-2xl overflow-hidden bg-black/5 relative">
                    {image && (
                      <img 
                        src={`data:${mimeType};base64,${image}`} 
                        alt="Product" 
                        className="w-full h-full object-contain"
                      />
                    )}
                    {isProcessing && (
                      <div className="absolute inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs font-medium text-black/40 uppercase tracking-widest">
                    <Sparkles size={14} /> AI Analysis Active
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'customize' && (
            <motion.div
              key="customize"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12"
            >
              <div className="space-y-8">
                <div>
                  <button 
                    onClick={() => setStep('analyze')}
                    className="text-sm font-medium flex items-center gap-1 opacity-40 hover:opacity-100 transition-opacity mb-4"
                  >
                    <ChevronLeft size={16} /> Back to concepts
                  </button>
                  <h2 className="text-3xl font-semibold tracking-tight mb-2">Refine Details</h2>
                  <p className="text-black/60">Fine-tune the scene and choose your preferred output settings.</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-widest opacity-40">Scene Prompt</label>
                    <textarea 
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      className="w-full h-32 p-4 bg-white border border-black/10 rounded-2xl focus:outline-none focus:border-black transition-colors resize-none"
                      placeholder="Describe the environment, lighting, and props..."
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-widest opacity-40">Aspect Ratio</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: '1:1', label: 'Square', icon: <Layout size={18} /> },
                        { id: '16:9', label: 'Landscape', icon: <Maximize size={18} /> },
                        { id: '9:16', label: 'Portrait', icon: <div className="rotate-90"><Maximize size={18} /></div> },
                      ].map((r) => (
                        <button
                          key={r.id}
                          onClick={() => setRatio(r.id as any)}
                          className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                            ratio === r.id ? 'bg-black text-white border-black' : 'bg-white border-black/5 hover:border-black/20'
                          }`}
                        >
                          {r.icon}
                          <span className="text-xs font-medium">{r.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={handleGenerate}
                    disabled={isProcessing}
                    className="w-full py-6 bg-black text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-black/90 transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="animate-spin" /> Generating...
                      </>
                    ) : (
                      <>
                        Generate Advertisement <Sparkles size={20} />
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="hidden lg:block">
                <div className="bg-white p-8 rounded-[40px] border border-black/5 sticky top-24">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-black/5 rounded-full flex items-center justify-center">
                        <Settings className="w-5 h-5 opacity-40" />
                      </div>
                      <div>
                        <h4 className="font-bold">Summary</h4>
                        <p className="text-xs text-black/40">Configuration overview</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4 text-sm">
                      <div className="flex justify-between py-3 border-b border-black/5">
                        <span className="opacity-40">Concept</span>
                        <span className="font-medium">{selectedConcept?.theme || 'Custom'}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-black/5">
                        <span className="opacity-40">Ratio</span>
                        <span className="font-medium">{ratio}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-black/5">
                        <span className="opacity-40">Lighting</span>
                        <span className="font-medium">{selectedConcept?.lighting || 'Custom'}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-[#f9f9f9] rounded-2xl border border-black/5 italic text-sm text-black/60">
                      "Our AI will blend your product seamlessly into the described environment using advanced diffusion techniques."
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'generate' && (
            <motion.div
              key="generate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[70vh]"
            >
              {resultImages.length === 0 ? (
                <div className="text-center space-y-8">
                  <div className="relative w-32 h-32 mx-auto">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border-4 border-black/5 border-t-black rounded-full"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-10 h-10 animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Crafting your variants</h2>
                    <p className="text-black/60">Generating 4 professional angles for your product...</p>
                  </div>
                </div>
              ) : (
                <div className="w-full space-y-12">
                  <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                    <div>
                      <h2 className="text-4xl font-bold tracking-tight mb-4">Choose your favorite.</h2>
                      <p className="text-lg text-black/60">We've generated 4 unique commercial angles. Select any to download.</p>
                    </div>
                    <button 
                      onClick={reset}
                      className="px-8 py-4 bg-white border border-black/10 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#f9f9f9] transition-colors"
                    >
                      Start New Project
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    <div className="relative group">
                      <div className="absolute -inset-4 bg-gradient-to-tr from-black/20 to-transparent blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
                      <div className="relative bg-white p-2 rounded-3xl shadow-2xl border border-black/5 overflow-hidden">
                        <img 
                          src={resultImages[selectedResultIndex]} 
                          alt="Generated Advertisement" 
                          className="w-full h-auto rounded-2xl"
                        />
                        <div className="absolute bottom-6 right-6">
                          <a 
                            href={resultImages[selectedResultIndex]} 
                            download={`ad-variant-${selectedResultIndex + 1}.png`}
                            className="bg-black text-white px-6 py-3 rounded-xl font-semibold shadow-xl hover:scale-105 transition-transform flex items-center gap-2"
                          >
                            Download High-Res
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {resultImages.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedResultIndex(idx)}
                          className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                            selectedResultIndex === idx ? 'border-black scale-[0.98]' : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={img} alt={`Variant ${idx + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-md uppercase tracking-widest font-bold">
                            Variant 0{idx + 1}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {error && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-[100]">
          <span className="text-sm font-medium">{error}</span>
          <button onClick={() => setError(null)} className="text-xs font-bold uppercase opacity-60 hover:opacity-100">Dismiss</button>
        </div>
      )}
    </div>
  );
}
