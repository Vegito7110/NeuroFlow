import React from 'react'

export const featuresContent = {
  header: {
    title: "Innovation & Novelty",
    subtitle: "A powerful suite of tools tucked neatly into your browser's side panel.",
  },
  list: [
    {
      id: "bionic",
      title: "Bionic Reader",
      description: "Guides the eye by bolding the first few letters of every word. This anchor point allows your brain to complete the word automatically, significantly increasing reading speed and focus.",
      icon: "eye"
    },
    {
      id: "clutter",
      title: "Clutter Free Reader",
      description: "Instantly strips away distractions. Ads vanish, and the font automatically shifts to OpenDyslexic—a typeface designed to mitigate some of the common reading errors caused by dyslexia.",
      icon: "book"
    },
    {
      id: "writer",
      title: "Smart Text Editor",
      description: "A specialized editor that fixes phonetic spelling instantly (e.g., correcting 'nefessari' to 'necessary') and uses context awareness to predict what you actually meant to say.",
      icon: "pen"
    },
    {
      id: "panic",
      title: "Panic Button",
      description: "Feeling overwhelmed? One click turns your screen dark to reduce sensory input and immediately guides you through a gentle, grounding breathing exercise.",
      icon: "shield"
    },
    {
      id: "block",
      title: "Soft Block",
      description: "Tracks your session goal and analyzes links before you open them. If you drift towards a distraction, it offers a gentle prompt to keep your focus intact rather than a hard wall.",
      icon: "lock"
    },
    {
      id: "todo",
      title: "Focus To-Do List",
      description: "A streamlined, side-panel checklist that keeps your immediate tasks visible without cluttering your main workspace. Perfect for breaking down large goals.",
      icon: "list"
    }
  ]
}

// Simple SVG Icons map based on the feature type
const Icons = {
  eye: (
    <svg className="w-8 h-8 text-[#FDFBD4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  book: (
    <svg className="w-8 h-8 text-[#FDFBD4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  pen: (
    <svg className="w-8 h-8 text-[#FDFBD4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  ),
  shield: (
    <svg className="w-8 h-8 text-[#FDFBD4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  lock: (
    <svg className="w-8 h-8 text-[#FDFBD4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  list: (
    <svg className="w-8 h-8 text-[#FDFBD4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  )
}

function Features({ sectionRef }) {
  return (
    <section 
      ref={sectionRef} 
      className="bg-[#FDFBD4] py-24 px-6"
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="uppercase tracking-widest text-[#A0522D] font-bold text-sm">
            What's Inside
          </span>
          <h2 className="text-[#38240D] font-bold text-3xl md:text-5xl mt-3 mb-6">
            {featuresContent.header.title}
          </h2>
          <p className="text-xl font-semibold text-[#713600] max-w-2xl mx-auto">
            {featuresContent.header.subtitle}
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuresContent.list.map((feature) => (
            <div 
              key={feature.id} 
              className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300 border border-[#38240D]/5 group"
            >
              {/* Icon Container */}
              <div className="w-14 h-14 bg-[#38240D] rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#A0522D] transition-colors duration-300">
                {Icons[feature.icon]}
              </div>

              {/* Text Content */}
              <h3 className="text-2xl font-bold text-[#38240D] mb-4">
                {feature.title}
              </h3>
              <p className="text-[#713600] leading-relaxed text-lg font-medium">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

export default Features