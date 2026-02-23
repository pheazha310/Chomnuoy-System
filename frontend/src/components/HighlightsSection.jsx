function HighlightsSection({ items }) {
  return (
    <section className="highlights" aria-label="product highlights">
      {items.map((item) => (
        <article key={item.title} className="highlight-card">
          <h2>{item.title}</h2>
          <p>{item.description}</p>
        </article>
      ))}
    </section>
  );
}

export default HighlightsSection;
