export function BrandBackground() {
  return (
    <div className="brand-bg" aria-hidden="true">
      <div
        className="brand-bg__layer is-active"
        style={{ backgroundImage: "url(/brand-bg.jpg)" }}
      />
      <div className="brand-bg__overlay" />
    </div>
  );
}
