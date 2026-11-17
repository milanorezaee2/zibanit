export function SkipLink({ href = '#main', label = 'پرش به محتوای اصلی' }) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:start-4 focus:z-50 focus:rounded-full focus:bg-gold-400 focus:px-5 focus:py-2.5 focus:text-[13px] focus:font-medium focus:text-obsidian-950"
    >
      {label}
    </a>
  );
}
