import React from 'react'

export const howItHelpsContent = {
    header: {
      title: "Bridging the Digital Gap",
      subtitle: "The internet wasn't built for neurodivergent minds. NeuroFlow fixes that by adapting the browser to work with your brain, not against it."
    },
    cards: [
      {
        id: 1,
        title: "Reduce Cognitive Load",
        description: "Standard websites demand too much processing power. We hide the noise (ads, pop-ups, clutter) so your brain can focus purely on the signal.",
        highlight: "Save your energy for what matters."
      },
      {
        id: 2,
        title: "Regulate Sensory Input",
        description: "Bright white screens and flashing animations can trigger sensory overload. NeuroFlow allows you to dampen these stimuli instantly.",
        highlight: "Browse without the burnout."
      },
      {
        id: 3,
        title: "Support Executive Function",
        description: "Staying on task is hard when the web is designed to distract you. Our tools provide gentle guardrails to keep you on your intended path.",
        highlight: "Turn intention into action."
      }
    ]
  }

  function HowItHelps({ sectionRef }) {
    return (
      <section 
        ref={sectionRef} 
        className="bg-[#F5F5DC] py-24 px-6"
      >
        <div className="max-w-7xl mx-auto">
          
          {/* Section Header */}
          <div className="mb-16 md:text-center max-w-3xl mx-auto">
            <span className="uppercase tracking-widest text-[#A0522D] font-bold text-sm">
              The Impact
            </span>
            <h2 className="text-[#38240D] font-bold text-3xl md:text-5xl mt-3 mb-6">
              {howItHelpsContent.header.title}
            </h2>
            <p className="text-xl text-[#713600] leading-relaxed font-medium">
              {howItHelpsContent.header.subtitle}
            </p>
          </div>
  
          {/* Benefits Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {howItHelpsContent.cards.map((card) => (
              <div 
                key={card.id} 
                className="bg-[#FDFBD4] p-8 rounded-2xl border border-[#38240D]/10 hover:border-[#A0522D]/30 transition-colors duration-300 flex flex-col"
              >
                {/* Card Number / Decorative Element */}
                <div className="text-6xl font-bold text-[#38240D]/10 mb-4">
                  0{card.id}
                </div>
  
                <h3 className="text-2xl font-bold text-[#38240D] mb-4">
                  {card.title}
                </h3>
                
                <p className="text-[#713600] text-lg leading-relaxed flex-grow mb-6">
                  {card.description}
                </p>
  
                {/* Bottom Highlight */}
                <div className="pt-6 border-t border-[#38240D]/10">
                  <span className="text-[#A0522D] font-bold text-sm tracking-wide uppercase">
                    {card.highlight}
                  </span>
                </div>
              </div>
            ))}
          </div>
  
        </div>
      </section>
    )
  }
  
export default HowItHelps