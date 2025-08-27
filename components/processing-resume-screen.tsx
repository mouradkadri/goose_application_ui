"use client"

import React, { useState, useEffect } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
// 1. Import the Brain icon for the navbar
import { Brain } from 'lucide-react';

// The list of messages that will cycle
const processingMessages = [
  "Calibrating AI models...",
  "Analyzing skills and experience...",
  "Scanning over 10,000+ job postings...",
  "Identifying transferable skills...",
  "Cross-referencing industry trends...",
  "Finalizing your personalized matches...",
];

interface ProcessingResumeScreenProps {
  onProcessingComplete: () => void;
}

export function ProcessingResumeScreen({ onProcessingComplete }: ProcessingResumeScreenProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isTextVisible, setIsTextVisible] = useState(true);

  // Effect to handle the main 5-second timer
  useEffect(() => {
    const timer = setTimeout(() => {
      onProcessingComplete();
    }, 5000); // 5 seconds
    return () => clearTimeout(timer);
  }, [onProcessingComplete]);

  // Effect to handle the cycling of text messages
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTextVisible(false); // Start fade-out
      setTimeout(() => {
        setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % processingMessages.length);
        setIsTextVisible(true); // Start fade-in with new text
      }, 400); // Wait for fade-out to complete
    }, 2000); // Change text every 2 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    // The main container sets the background and flex properties.
    // 'relative' is not strictly needed but is good practice for positioning children.
    <div className="bg-[#ecfeff] min-h-screen w-full flex items-center justify-center p-4 relative">
      
      {/* 2. Collapsed Navbar */}
      {/* It uses 'absolute' positioning to float on top without taking up space. */}
      <header className="absolute top-0 left-0 w-full bg-white/50 backdrop-blur-sm z-10">
        <div className="max-w-5xl mx-auto flex items-center gap-3 px-4 md:px-6 py-3">
          <Brain className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">
            AI Career Co-pilot
          </h1>
        </div>
      </header>

      {/* 3. White Card Content */}
      {/* This remains centered on the screen, underneath the floating navbar. */}
      <div 
        className="w-full max-w-md mx-auto flex flex-col items-center 
                   bg-white rounded-2xl shadow-xl p-8"
      >
        <DotLottieReact
          src="https://lottie.host/4d8fe2d3-0a95-4b3a-b0cb-889b1bdd4f74/Q17E4gOglX.lottie"
          loop
          autoplay
          className="w-60 h-60"
        />
        <h2 className="text-3xl font-bold text-gray-800 mt-4">
          Analyzing Your Resume
        </h2>
        <p 
          className={`text-lg text-gray-600 mt-2 h-7 transition-opacity duration-300 ${isTextVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          {processingMessages[currentMessageIndex]}
        </p>

        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-8 overflow-hidden">
          <div className="bg-primary h-2.5 rounded-full progress-bar-inner"></div>
        </div>
      </div>
      
    </div>
  );
}