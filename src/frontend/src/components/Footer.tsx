export default function Footer() {
  const year = new Date().getFullYear();
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";
  const utm = `utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(hostname)}`;
  return (
    <footer className="text-center py-4 text-xs text-muted-foreground">
      © {year}.{" "}
      <a
        href={`https://caffeine.ai?${utm}`}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-foreground transition-colors"
      >
        Built with ❤️ using caffeine.ai
      </a>
    </footer>
  );
}
