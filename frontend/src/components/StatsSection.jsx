function StatsSection({ items }) {
  return (
    <section className="stats" aria-label="platform statistics">
      {items.map((item) => (
        <article key={item.label} className="stat-card">
          <p className="stat-value">{item.value}</p>
          <p className="stat-label">{item.label}</p>
        </article>
      ))}
    </section>
  );
}

export default StatsSection;
