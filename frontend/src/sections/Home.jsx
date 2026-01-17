import React from 'react'

function Home({ sectionRef }) {
  return (
    <section 
      ref={sectionRef} 
      className="min-h-[86vh] flex flex-col justify-center items-center bg-[#FDFBD4] px-6 py-20 w-full"
    >
      <div className="max-w-4xl mx-auto text-center space-y-8">
        
        {/* Main Headline */}
        <h1 className="text-[#38240D] font-bold text-5xl md:text-7xl leading-tight tracking-tight">
          Navigate the Web <br className="hidden md:block" /> on Your Terms.
        </h1>

        {/* Subtitle */}
        <h3 className="text-[#713600] font-medium text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed">
          NeuroFlow is the intelligent browser extension designed to make the internet accessible, calm, and distraction-free for neurodivergent minds.
        </h3>

        {/* CTA Button */}
        <div className="pt-6">
          <button className="bg-[#38240D] text-white hover:bg-[#713600] transition-all duration-300 px-10 py-4 rounded-xl font-semibold text-2xl md:text-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            Get the Extension
          </button>
        </div>

      </div>
    </section>
  )
}

export default Home