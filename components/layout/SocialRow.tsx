type Item = { href: string; label: string; path: string };

const INSTAGRAM =
  "M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.64-.07-4.85s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95C23.73 2.69 21.31.27 16.95.07 15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.41-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z";

const X_MARK = "M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-5.66l-4.71-6.23-5.4 6.23H3.74l7.73-8.84L1.25 2.25h5.8l4.25 5.62 6.94-5.62zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64z";

export function SocialRow({
  instagram,
  x,
  className = "",
  tone = "paper",
}: {
  instagram?: string;
  x?: string;
  className?: string;
  tone?: "paper" | "ink";
}) {
  const items: Item[] = [
    instagram ? { href: instagram, label: "Instagram", path: INSTAGRAM } : null,
    x ? { href: x, label: "X", path: X_MARK } : null,
  ].filter((item): item is Item => item !== null);
  if (!items.length) return null;
  const hover = tone === "paper" ? "hover:bg-white/10" : "hover:bg-night/5";

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {items.map((item) => (
        <a
          key={item.label}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${item.label}, @formsteptr`}
          className={`grid size-11 place-items-center rounded-full transition ${hover}`}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
            <path d={item.path} />
          </svg>
        </a>
      ))}
    </div>
  );
}
