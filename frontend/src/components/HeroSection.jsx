function HeroSection({ content, backendStatus }) {
  return (
    <header className="hero">
      <p className="eyebrow">{content.eyebrow}</p>
      <p className={`backend-status backend-status-${backendStatus.state}`}>{backendStatus.message}</p>
      <h1>{content.title}</h1>
      <p className="subtitle">{content.subtitle}</p>
      <div className="cta-row">
        <button className="btn btn-primary">{content.primaryAction}</button>
        <button className="btn btn-secondary">{content.secondaryAction}</button>
      </div>
    </header>
  );
}
export default HeroSection;

