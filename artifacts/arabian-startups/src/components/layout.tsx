import { Link, useLocation } from "wouter";
import { Search, Menu, X, Linkedin, ChevronDown, Instagram } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import logo from "@/assets/logo.jpg";
import { format } from "date-fns";

// Facebook SVG icon (not in lucide-react)
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

const GCC_COUNTRIES = [
  { name: "Saudi Arabia", code: "Saudi Arabia", flag: "🇸🇦" },
  { name: "UAE",          code: "UAE",           flag: "🇦🇪" },
  { name: "Kuwait",       code: "Kuwait",        flag: "🇰🇼" },
  { name: "Qatar",        code: "Qatar",         flag: "🇶🇦" },
  { name: "Bahrain",      code: "Bahrain",       flag: "🇧🇭" },
  { name: "Oman",         code: "Oman",          flag: "🇴🇲" },
];

const TOPICS = [
  { name: "Funding",                  slug: "Funding" },
  { name: "Incubators & Accelerators",slug: "Incubators & Accelerators" },
  { name: "Technology",               slug: "Technology" },
  { name: "Ecosystem",                slug: "Ecosystem" },
  { name: "Launches",                 slug: "Launches" },
  { name: "Policy",                   slug: "Policy" },
  { name: "People",                   slug: "People" },
  { name: "Growth",                   slug: "Growth" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const [topicOpen, setTopicOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">

      {/* Top bar */}
      <div className="bg-[hsl(220,60%,18%)] text-white text-xs py-1.5 px-4">
        <div className="container mx-auto flex justify-between items-center">
          <span className="font-sans opacity-80">{format(new Date(), "EEEE, MMMM d, yyyy")}</span>
          <div className="flex items-center gap-3">
            <a
              href="https://www.linkedin.com/company/arabian-startups-ecosystem"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity"
            >
              <Linkedin className="h-3 w-3" /> <span className="hidden sm:inline">LinkedIn</span>
            </a>
            <a
              href="https://www.instagram.com/arabian_startups_ecosystem/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity"
            >
              <Instagram className="h-3 w-3" /> <span className="hidden sm:inline">Instagram</span>
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61590585767377"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity"
            >
              <FacebookIcon className="h-3 w-3" /> <span className="hidden sm:inline">Facebook</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className="bg-white border-b-4 border-[hsl(220,80%,35%)] shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <img src={logo} alt="Arabian Startups Ecosystem" className="h-12 w-auto rounded" />
            <div className="hidden sm:block">
              <div className="font-serif font-bold text-lg leading-tight text-[hsl(220,60%,18%)]">Arabian StartUp</div>
              <div className="text-xs font-sans text-[hsl(220,80%,35%)] tracking-widest uppercase">Ecosystem</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
            {[
              { href: "/", label: "Home" },
              { href: "/digest/latest", label: "Today's Digest" },
              { href: "/articles", label: "News" },
            ].map(link => (
              <Link key={link.href} href={link.href}
                className={`px-3 py-2 rounded transition-colors hover:bg-[hsl(220,80%,35%)] hover:text-white
                  ${location === link.href ? "bg-[hsl(220,80%,35%)] text-white" : "text-[hsl(220,50%,10%)]"}`}
              >
                {link.label}
              </Link>
            ))}

            {/* Regional dropdown */}
            <div className="relative" onMouseEnter={() => setRegionOpen(true)} onMouseLeave={() => setRegionOpen(false)}>
              <button className="flex items-center gap-1 px-3 py-2 rounded hover:bg-[hsl(220,80%,35%)] hover:text-white transition-colors text-[hsl(220,50%,10%)]">
                Regional <ChevronDown className="h-3 w-3" />
              </button>
              {regionOpen && (
                <div className="absolute top-full left-0 bg-white border border-border shadow-lg z-50 min-w-40 py-1">
                  {GCC_COUNTRIES.map(c => (
                    <Link key={c.code} href={`/articles?country=${encodeURIComponent(c.code)}`}
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-[hsl(220,80%,35%)] hover:text-white transition-colors">
                      {c.flag} {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Topics dropdown */}
            <div className="relative" onMouseEnter={() => setTopicOpen(true)} onMouseLeave={() => setTopicOpen(false)}>
              <button className="flex items-center gap-1 px-3 py-2 rounded hover:bg-[hsl(220,80%,35%)] hover:text-white transition-colors text-[hsl(220,50%,10%)]">
                Topics <ChevronDown className="h-3 w-3" />
              </button>
              {topicOpen && (
                <div className="absolute top-full left-0 bg-white border border-border shadow-lg z-50 min-w-52 py-1">
                  {TOPICS.map(t => (
                    <Link key={t.slug} href={`/articles?category=${encodeURIComponent(t.slug)}`}
                      className="block px-4 py-2 text-sm hover:bg-[hsl(220,80%,35%)] hover:text-white transition-colors">
                      {t.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href="/about"
              className={`px-3 py-2 rounded transition-colors hover:bg-[hsl(220,80%,35%)] hover:text-white
                ${location === "/about" ? "bg-[hsl(220,80%,35%)] text-white" : "text-[hsl(220,50%,10%)]"}`}
            >
              About
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/articles">
              <Button variant="ghost" size="icon"><Search className="h-4 w-4" /></Button>
            </Link>
            <Button
              className="hidden md:flex bg-[hsl(220,80%,35%)] hover:bg-[hsl(220,80%,28%)] text-white text-xs gap-1.5 rounded"
              onClick={() => window.open("https://www.linkedin.com/company/arabian-startups-ecosystem", "_blank")}
            >
              <Linkedin className="h-3.5 w-3.5" /> Follow Us
            </Button>
            <a
              href="https://www.instagram.com/arabian_startups_ecosystem/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center justify-center w-9 h-9 rounded text-[hsl(220,50%,10%)] hover:bg-[hsl(220,80%,35%)] hover:text-white transition-colors"
              title="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61590585767377"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center justify-center w-9 h-9 rounded text-[hsl(220,50%,10%)] hover:bg-[hsl(220,80%,35%)] hover:text-white transition-colors"
              title="Facebook"
            >
              <FacebookIcon className="h-4 w-4" />
            </a>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-b border-border shadow-md z-40">
          <nav className="container mx-auto px-4 py-3 flex flex-col gap-1 text-sm">
            {[
              { href: "/", label: "Home" },
              { href: "/digest/latest", label: "Today's Digest" },
              { href: "/articles", label: "News" },
              { href: "/categories", label: "Categories" },
              { href: "/about", label: "About" },
            ].map(link => (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                className="px-3 py-2 rounded hover:bg-[hsl(220,80%,35%)] hover:text-white transition-colors">
                {link.label}
              </Link>
            ))}
            <div className="border-t border-border mt-2 pt-2">
              <p className="text-xs text-muted-foreground px-3 mb-1 uppercase tracking-wider">By Region</p>
              {GCC_COUNTRIES.map(c => (
                <Link key={c.code} href={`/articles?country=${encodeURIComponent(c.code)}`}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-[hsl(220,80%,35%)] hover:text-white transition-colors">
                  {c.flag} {c.name}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-[hsl(220,60%,18%)] text-white mt-16">
        <div className="container mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3 mb-4">
              <img src={logo} alt="ASE" className="h-14 w-auto rounded" />
              <div>
                <div className="font-serif font-bold text-lg">Arabian StartUp Ecosystem</div>
                <div className="text-xs opacity-60 tracking-widest uppercase">Daily GCC Startup Intelligence</div>
              </div>
            </Link>
            <p className="text-white/60 text-sm max-w-sm leading-relaxed">
              The premier intelligence hub for founders, investors, and ecosystem builders across Saudi Arabia and the GCC. Updated daily.
            </p>
            <div className="flex items-center gap-4 mt-5">
              <a
                href="https://www.linkedin.com/company/arabian-startups-ecosystem"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white/70 hover:bg-[hsl(220,80%,45%)] hover:text-white transition-all"
                title="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="https://www.instagram.com/arabian_startups_ecosystem/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white/70 hover:bg-[hsl(220,80%,45%)] hover:text-white transition-all"
                title="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61590585767377"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white/70 hover:bg-[hsl(220,80%,45%)] hover:text-white transition-all"
                title="Facebook"
              >
                <FacebookIcon className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-serif font-bold mb-4 text-white/90 uppercase tracking-wider text-sm">Navigate</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link href="/digest/latest" className="hover:text-white transition-colors">Today's Digest</Link></li>
              <li><Link href="/articles" className="hover:text-white transition-colors">All News</Link></li>
              <li><Link href="/categories" className="hover:text-white transition-colors">Categories</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-serif font-bold mb-4 text-white/90 uppercase tracking-wider text-sm">Regions</h4>
            <ul className="space-y-2 text-sm text-white/60">
              {GCC_COUNTRIES.map(c => (
                <li key={c.code}>
                  <Link href={`/articles?country=${encodeURIComponent(c.code)}`} className="hover:text-white transition-colors flex items-center gap-1.5">
                    {c.flag} {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-white/40">
          © {new Date().getFullYear()} Arabian StartUp Ecosystem. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
