export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="pt-20">
        <div className="skeleton h-6 w-64" />
        <div className="skeleton mt-6 h-16 w-full max-w-3xl" />
        <div className="skeleton mt-3 h-16 w-2/3 max-w-2xl" />
        <div className="skeleton mt-8 h-14 w-full max-w-xl rounded-2xl" />
      </div>
      <div className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-2xl" />
        ))}
      </div>
      <div className="mt-20 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-44 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
