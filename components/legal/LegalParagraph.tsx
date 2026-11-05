/** **kalın** parçalarını gerçek vurguya çevirir. */
export function Emphasis({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold text-ink">{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

/** Satıcı bloğundaki telefon, e-posta ve profil adreslerini tıklanır yapar. */
export function LegalParagraph({ text }: { text: string }) {
  const match = text.match(/^([^:]+:\s*)(\S.*)$/);
  if (!match) return <p><Emphasis text={text} /></p>;
  const label = match[1];
  const value = match[2].trim();
  const link = "font-medium text-blue underline-offset-4 hover:underline";

  if (/^https?:\/\//i.test(value)) {
    const handle = value.replace(/\/$/, "").split("/").pop() ?? value;
    const shown = handle.includes(".") ? value.replace(/^https?:\/\/(www\.)?/, "") : `@${handle}`;
    return (
      <p>
        {label}
        <a href={value} target="_blank" rel="noopener noreferrer" className={link}>
          {shown}
        </a>
      </p>
    );
  }
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
    return (
      <p>
        {label}
        <a href={`mailto:${value}`} className={link}>{value}</a>
      </p>
    );
  }
  if (/^\+?[0-9][0-9\s()-]{6,}$/.test(value)) {
    return (
      <p>
        {label}
        <a href={`tel:${value.replace(/[^\d+]/g, "")}`} className={link}>{value}</a>
      </p>
    );
  }
  return (
    <p>
      <Emphasis text={text} />
    </p>
  );
}
