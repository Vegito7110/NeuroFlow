import React from 'react'

function About({ sectionRef }) {
  return (
    <section 
      ref={sectionRef} 
      className="bg-[#F5F5DC] py-24 px-6 flex flex-col justify-center"
    >
      <div className="max-w-4xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="uppercase tracking-widest text-[#A0522D] font-bold text-sm">
            The Mission
          </span>
          <h2 className="text-[#38240D] font-bold text-3xl md:text-5xl mt-3">
            What is NeuroFlow?
          </h2>
        </div>

        {/* Content Card */}
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border-l-8 border-[#A0522D]">
          <div className="space-y-6 text-lg md:text-xl text-[#713600] leading-relaxed">
            <p className='font-medium'>
              The modern web is designed to maximize attention—through intrusive ads,
              auto-playing media, and visually cluttered layouts. While effective for
              engagement, this design approach often creates accessibility barriers,
              especially for neurodivergent individuals.
            </p>
            <p className="font-bold text-[#38240D]">
              NeuroFlow acts as an intelligent layer between you and the internet.
              It quietly restructures web pages in real time, reducing visual noise
              and enhancing readability without altering the original content.
              The result is a more focused, calm, and inclusive browsing experience.
            </p>
          </div>
        </div>

      </div>
    </section>
  )
}

export default About