import NeuroFlowLogo from '../assets/Inovate.svg'
import { useState } from 'react'

function Navbar({ sections }) {
  const [isOpen, setIsOpen] = useState(false)

  // Updated styling for navigation items (Dark Brown text + subtle hover effect)
  const navItemClass =
    "block text-[#38240D] text-lg font-semibold px-3 py-2 rounded-lg transition-all duration-300 hover:text-[#A0522D] hover:bg-[#38240D]/5"

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' })
    setIsOpen(false)
  }

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-[#FDFBD4] border-b border-[#38240D]/10 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-end max-w-7xl mx-auto">
        
        {/* Logo Area */}
        {/* <img src={NeuroFlowLogo} alt="NeuroFlow logo" className="h-8" /> */}
        <span className="text-[#38240D] font-bold text-xl md:hidden">NeuroFlow</span>

        {/* Mobile Hamburger Button */}
        <button
          className="md:hidden text-2xl text-[#38240D] focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? '✕' : '☰'}
        </button>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-2">
          <button onClick={() => scrollToSection(sections.homeRef)} className={navItemClass}>Home</button>
          <button onClick={() => scrollToSection(sections.aboutRef)} className={navItemClass}>The Extension</button>
          <button onClick={() => scrollToSection(sections.neuroRef)} className={navItemClass}>Neurodiversity</button>
          <button onClick={() => scrollToSection(sections.helpsRef)} className={navItemClass}>How It Helps</button>
          <button onClick={() => scrollToSection(sections.featuresRef)} className={navItemClass}>Features</button>

        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-[#38240D]/10 flex flex-col gap-2 items-start bg-[#FDFBD4]">
          <button onClick={() => scrollToSection(sections.homeRef)} className={navItemClass}>Home</button>
          <button onClick={() => scrollToSection(sections.aboutRef)} className={navItemClass}>The Extension</button>
          <button onClick={() => scrollToSection(sections.neuroRef)} className={navItemClass}>Neurodiversity</button>
          <button onClick={() => scrollToSection(sections.helpsRef)} className={navItemClass}>How It Helps</button>
          <button onClick={() => scrollToSection(sections.featuresRef)} className={navItemClass}>Features</button>

        </div>
      )}
    </nav>
  )
}

export default Navbar