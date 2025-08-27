"use client"

import { useState } from "react"
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Brain, ScanText, Compass, ShieldCheck } from "lucide-react"

interface ResumeUploadScreenProps {
  onUpload: () => void
}

export function ResumeUploadScreen({ onUpload }: ResumeUploadScreenProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      console.log("Resume uploaded:", files[0].name)
      onUpload()
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    handleFileChange(files);
  }

  return (
    // Main wrapper with your desired background color and layout
    <div className="bg-[#ecfeff] min-h-screen w-full">
      {/* 1. Navbar Section */}
      <header className="w-full bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center gap-3 px-4 md:px-6 py-3">
          <Brain className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">
            AI Career Co-pilot
          </h1>
        </div>
      </header>

      {/* 2. Main Content Area */}
      <main className="w-full max-w-5xl mx-auto text-center px-4 pb-4 md:px-6 md:pb-6">
        <h2 className="text-3xl md:text-5xl font-bold text-foreground leading-tight pt-2 md:pt-4">
          Find Your Perfect Job, Faster.
        </h2>
        <p className="max-w-2xl mx-auto mt-4 text-base md:text-lg text-gray-600 mb-5 md:mb-7">
          Stop sifting through endless job boards. Upload your resume and let our advanced AI analyze your unique skills and experience to uncover your perfect match.
        </p>

        {/* Uploader Section */}
        <div className="max-w-2xl mx-auto">
          <label
            htmlFor="upload-files"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative w-full h-60 bg-white/50
              border-2 border-dashed border-gray-300
              flex flex-col justify-center items-center text-lg text-gray-700 
              rounded-xl cursor-pointer transition-all duration-300
              pulse-border
              ${isDragging ? "border-primary scale-105 bg-white" : "hover:border-primary/50"}
            `}
          >
            <DotLottieReact
              src="https://lottie.host/358906b7-3b60-4922-a409-da25e29ebde1/zb6BWz1PX3.lottie"
              loop
              autoplay
              className="h-32 md:h-40 w-auto" // Responsive height
            />   
            <span className="font-semibold">Choose or Drag & Drop Your Resume</span>
            <input
              id="upload-files"
              type="file"
              className="absolute w-full h-full top-0 left-0 opacity-0 cursor-pointer"
              onChange={(e) => handleFileChange(e.target.files)}
              accept=".pdf,.doc,.docx,.txt"
            />
          </label>
        </div>

        {/* Feature Cards Section */}
        <div className="mt-4 md:mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-left">
          <FeatureCard
            icon={<ScanText className="h-6 w-6" />}
            title="Beyond Keywords"
            description="Our AI reads your resume like a top recruiter, understanding the context of your roles, projects, and achievements—not just keywords."
          />
          <FeatureCard
            icon={<Compass className="h-6 w-6" />}
            title="Discover Hidden Gems"
            description="We match you to roles you might have overlooked. Our model finds jobs where your transferable skills would make you the ideal candidate."
          />
          <FeatureCard
            icon={<ShieldCheck className="h-6 w-6" />}
            title="Private & Secure"
            description="Your career data is sensitive. We treat it with the utmost confidentiality and will never share it without your explicit permission."
          />
        </div>
      </main>
    </div>
  )
}

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => {
  return (
    // Updated card style for the new background
    <div className="bg-white/60 backdrop-blur-md p-6 rounded-lg border border-gray-200/80 shadow-sm">
      <div className="flex items-center gap-4 mb-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
      </div>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}