"use client"

import React, { useState, useEffect } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Brain, CheckCircle2, Loader2 } from 'lucide-react';

const processingMessages = [
  "Calibrating AI models...",
  "Analyzing skills and experience...",
  "Scanning 10,000+ job postings...",
  "Identifying transferable skills...",
  "Cross-referencing industry trends...",
  "Finalizing your matches...",
];

interface ProcessingResumeScreenProps {
  onProcessingComplete: () => void;
}

export function ProcessingResumeScreen({ onProcessingComplete }: ProcessingResumeScreenProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isTextVisible, setIsTextVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  // 1. Total Timer (5 Seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      onProcessingComplete();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onProcessingComplete]);

  // 2. Continuous Progress Counter (0 to 100)
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 1));
    }, 45); 
    return () => clearInterval(interval);
  }, []);

  // 3. Text Cycling Logic
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTextVisible(false);
      setTimeout(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % processingMessages.length);
        setIsTextVisible(true);
      }, 400);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative bg-[#f0f9ff] overflow-hidden">
      
      {/* Background Decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-200/30 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/30 blur-[120px] rounded-full" />

      {/* HEADER */}
      <header className="absolute top-0 left-0 w-full bg-white/80 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-5xl mx-auto flex items-center gap-3 px-4 md:px-6 h-20">
          <img 
            src="/goose_job_logo.png" 
            width={100} 
            height={100} 
            alt="goose jobs" 
            className="object-contain h-16 w-auto" 
          />
          <h1 className="text-xl md:text-2xl font-bold text-foreground">
            AI Career Co-pilot
          </h1>
        </div>
      </header>


      {/* Main Content Card */}
      <div className="w-full max-w-lg mx-auto flex flex-col items-center bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white p-8 md:p-12 relative z-20 mt-16">
        
        {/* Animation Container */}
        <div className="relative flex justify-center items-center">
          <div className="absolute inset-0 bg-primary/5 rounded-full animate-ping" />
          
          {/* ORIGINAL ANIMATION (COMMENTED OUT) */}
          {/* 
          <DotLottieReact
            src="https://lottie.host/4d8fe2d3-0a95-4b3a-b0cb-889b1bdd4f74/Q17E4gOglX.lottie"
            loop
            autoplay
            className="w-48 h-48 md:w-56 md:h-56 relative z-10"
          /> 
          */}

          {/* NEW GIF REPLACEMENT */}
          <img 
            src="/goose2.gif" 
            alt="Processing Goose"
            className="w-48 h-48 md:w-56 md:h-56 object-contain relative z-10"
          />
        </div>

        <div className="text-center mt-6 space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
            Synthesizing Data
          </h2>
          <div className="flex items-center justify-center gap-2 text-primary font-medium">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className={`transition-all duration-500 transform ${isTextVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
              {processingMessages[currentMessageIndex]}
            </p>
          </div>
        </div>

        {/* Progress Section */}
        <div className="w-full mt-10 space-y-2">
          <div className="flex justify-between text-sm font-semibold text-gray-500 px-1">
            <span>Processing Resume</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden border border-gray-50">
            <div 
              className="bg-primary h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_15px_rgba(var(--primary),0.5)]"
              style={{ width: `${progress}%` }}
            >
              <div className="w-full h-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            </div>
          </div>
        </div>

        {/* Processing Steps */}
        <div className="grid grid-cols-2 gap-4 mt-10 w-full pt-8 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
            <CheckCircle2 className="h-4 w-4" /> Parsing PDF
          </div>
          <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
            <CheckCircle2 className="h-4 w-4" /> Extracting Skills
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="h-4 w-4 rounded-full border-2 border-gray-200 animate-pulse" /> Benchmarking
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="h-4 w-4 rounded-full border-2 border-gray-200 animate-pulse" /> Matching Jobs
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}