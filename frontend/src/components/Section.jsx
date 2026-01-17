function Section({ id, title, children }) {
    return (
      <section
        id={id}
        className="min-h-screen px-8 py-32 max-w-5xl mx-auto"
      >
        <h2 className="text-3xl font-semibold text-gray-900 mb-6">
          {title}
        </h2>
        <div className="text-gray-700 leading-relaxed text-lg">
          {children}
        </div>
      </section>
    )
  }
  
  export default Section
  