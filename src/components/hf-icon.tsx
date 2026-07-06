// Shared Hugging Face glyph — lucide-react has no official HF icon, so we ship
// a small inline SVG. Used by the hero social row and the site footer.
export function HFIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zM8.5 8a1.3 1.3 0 110 2.6A1.3 1.3 0 018.5 8zm7 0a1.3 1.3 0 110 2.6A1.3 1.3 0 0115.5 8zM12 18c-2.3 0-4.3-1.4-5.1-3.5h10.2C16.3 16.6 14.3 18 12 18z" />
    </svg>
  );
}
