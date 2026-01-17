import React from 'react'

export const neuroContent = {
  hero: {
    title: "Celebrating Neurodiversity",
    subtitle: "Different ways of thinking, learning, and interacting with the world.",
    intro: "Neurodiversity describes the idea that people experience and interact with the world around them in many different ways; there is no one 'right' way of thinking, learning, and behaving, and differences are not viewed as deficits."
  },

  history: {
    title: "The Movement",
    text: "The neurodiversity movement emerged during the 1990s, aiming to increase acceptance and inclusion of all people while embracing neurological differences. Through online platforms, autistic people connected to form a self-advocacy movement. Judy Singer, an Australian sociologist, coined the term to promote equality and inclusion of 'neurological minorities.' While primarily a social justice movement, it is increasingly influencing how clinicians view disabilities."
  },

  // This is the detailed expansion you asked for
  types: {
    title: "The Neurodivergent Spectrum",
    intro: "While neurodiversity refers to all people, it is often focused on specific neurodevelopmental differences. Here are some of the most common types.",
    list: [
      {
        id: "asd",
        name: "Autism Spectrum Disorder (ASD)",
        stat: "Affects ~1 in 100 people globally",
        description: "ASD is associated with differences in communication, learning, and behavior. It looks different for everyone—some autistic people live independently with high IQs, while others may need significant daily support. It is often characterized by deep interests, sensory sensitivities, and a preference for routine.",
        strengths: ["Deep focus on interests", "Logical thinking", "Visual learning", "Honesty and directness"],
        challenges: ["Social communication", "Sensory processing", "Coping with unexpected change"]
      },
      {
        id: "adhd",
        name: "Attention-Deficit/Hyperactivity Disorder (ADHD)",
        stat: "Affects ~5-7% of children & 2-5% of adults",
        description: "Attention Deficit Hyperactivity Disorder affects the brain's executive functions—the ability to plan, focus, and execute tasks. It is not a deficit of attention, but rather a difficulty in regulating it. Individuals may seek stimulation (dopamine) and struggle with impulse control or working memory.",
        strengths: ["Creativity & innovation", "Hyperfocus", "Resilience", "Ability to work well under pressure"],
        challenges: ["Time management", "Organization", "Regulating emotions", "Task initiation"]
      },
      {
        id: "dyslexia",
        name: "Dyslexia",
        stat: "Affects ~10-20% of the population",
        description: "A language-based learning difference that primarily affects reading and spelling. It involves difficulty connecting the sounds of spoken language with letters and words (phonological processing). It is not related to intelligence or vision.",
        strengths: ["Big-picture thinking", "Pattern recognition", "Spatial reasoning", "Narrative ability"],
        challenges: ["Reading fluency", "Spelling", "Rapid word retrieval", "Rote memorization"]
      },
      {
        id: "dyspraxia",
        name: "Dyspraxia (DCD)",
        stat: "Affects ~5-6% of children",
        description: "Also known as Developmental Coordination Disorder (DCD), this affects physical coordination and movement. It can impact fine motor skills (like writing) and gross motor skills (like balance). It also often affects planning and organization of thoughts.",
        strengths: ["Empathy", "Strategic thinking", "Determination", "Creative problem solving"],
        challenges: ["Handwriting", "Balance & coordination", "Organization", "Time management"]
      },
      {
        id: "dyscalculia",
        name: "Dyscalculia",
        stat: "Affects ~3-7% of the population",
        description: "Often called 'math dyslexia,' this affects the ability to understand numbers and math concepts. Individuals may struggle with estimating quantities, reading analog clocks, or mental math, despite having normal verbal skills.",
        strengths: ["Verbal communication", "Creative writing", "Intuitive thinking", "Artistic ability"],
        challenges: ["Mental math", "Time estimation", "Budgeting", "Reading graphs/charts"]
      }
    ]
  },

  language: {
    title: "Words Matter",
    text: "Neurodiversity advocates encourage inclusive, nonjudgmental language. While many disability advocacy organizations prefer person-first language ('a person with autism'), research finds that the majority of the autistic community prefers identity-first language ('an autistic person'). The best approach is to ask the individual how they wish to be addressed."
  },

  workplace: {
    title: "Fostering Inclusion",
    intro: "Stigma and a lack of appropriate infrastructure can cause exclusion. Understanding and embracing neurodiversity in workplaces improves inclusivity for all people.",
    strategies: [
      {
        category: "Sensory Environment",
        points: ["Offer quiet break spaces", "Provide noise-cancelling headphones", "Allow flexible seating options"]
      },
      {
        category: "Communication",
        points: ["Avoid sarcasm and implied messages", "Provide concise written instructions", "Break large tasks into small steps"]
      },
      {
        category: "Culture",
        points: ["Don't assume someone is being rude if they miss social cues", "Give advance notice for schedule changes", "Focus on strengths and outcomes, not just methods"]
      }
    ]
  }
}

function Neurodiversity({sectionRef}) {
  return (
    <section ref={sectionRef}>
      <div className="min-h-screen bg-[#FDFBD4] text-[#38240D] font-sans font-medium w-full">
      
      {/* HERO SECTION */}
      <header className="py-20 px-6 text-center bg-[#FDFBD4]">
        <div className="max-w-4xl mx-auto">
        
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-[#38240D]">
            {neuroContent.hero.title}
          </h1>
          <p className="text-xl md:text-2xl text-[#713600] leading-relaxed max-w-2xl mx-auto">
            {neuroContent.hero.intro}
          </p>
        </div>
      </header>

      {/* HISTORY / DEFINITION */}
      <section className="py-16 px-6 bg-[#F5F5DC]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-[#38240D] border-l-4 border-[#F4A460] pl-4">
            {neuroContent.history.title}
          </h2>
          <p className="text-lg leading-loose text-[#713600]">
            {neuroContent.history.text}
          </p>
        </div>
      </section>

      {/* THE SPECTRUM (Detailed Types) */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-darkBrown mb-4">
            {neuroContent.types.title}
          </h2>
          <p className="text-lg text-[#713600] max-w-2xl mx-auto">
            {neuroContent.types.intro}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {neuroContent.types.list.map((type) => (
            <div key={type.id} className="bg-white p-8 rounded-2xl shadow-sm border border-[#F4A460]/30 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold text-darkBrown">{type.name}</h3>
              </div>
              <p className="text-sm font-semibold text-lightBrown bg-[#FDFBD4] inline-block px-2 py-1 rounded mb-4">
                {type.stat}
              </p>
              <p className="text-[#38240D] mb-6 leading-relaxed">
                {type.description}
              </p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-[#38240D] text-sm uppercase tracking-wide mb-2">Strengths</h4>
                  <div className="flex flex-wrap gap-2">
                    {type.strengths.map(s => (
                      <span key={s} className="text-xs bg-[#F4A460]/20 text-[#713600] px-2 py-1 rounded-md">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* LANGUAGE SECTION */}
      <section className="py-16 px-6 font-medium bg-[#38240D] text-white">
        <div className="max-w-4xl mx-auto text-center">
    
          <h2 className="text-3xl font-bold mb-6 text-beige">
            {neuroContent.language.title}
          </h2>
          <p className="text-lg md:text-xl leading-relaxed opacity-90">
            {neuroContent.language.text}
          </p>
        </div>
      </section>

      {/* WORKPLACE & INCLUSION */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-[#38240D] mb-8 text-center">
          {neuroContent.workplace.title}
        </h2>
        <p className="text-center text-[#713600] mb-12 max-w-2xl mx-auto">
          {neuroContent.workplace.intro}
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {neuroContent.workplace.strategies.map((strategy, idx) => (
            <div key={idx} className="bg-[#F5F5DC] p-8 rounded-xl border-t-4 border-[#A0522D]">
              <h3 className="text-xl font-bold text-[#38240D] mb-4">
                {strategy.category}
              </h3>
              <ul className="space-y-3">
                {strategy.points.map((point, i) => (
                  <li key={i} className="flex items-start text-[#713600]">
                    <span className="text-[#F4A460] mr-2">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER CTA */}
      <div className="bg-[#FDFBD4] py-12 text-center border-t border-[#A0522D]/20">
        <p className="text-[#38240D] text-lg font-medium">
          Be kind. Be patient. Embrace the difference.
        </p>
      </div>
    </div>
    </section>
  );
}

export default Neurodiversity