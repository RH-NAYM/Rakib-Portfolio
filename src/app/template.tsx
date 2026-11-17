// Re-mounts on every navigation, so each new page fades in briefly.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
