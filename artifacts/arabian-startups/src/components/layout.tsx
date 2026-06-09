import { Link, useLocation } from "wouter";
import { Search, Menu, X, Linkedin } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import logo from "@/assets/logo.jpg";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/digest/latest", label: "Today's Digest" },
    { href: "/articles", label: "News" },
    { href: "/categories", label: "Categories" },
    { href: "/about", label: "About" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center">
              <img src={logo} alt="Arabian Startups Ecosystem" className="h-10 w-auto rounded" />
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors hover:text-primary ${
                    location === link.href ? "text-primary border-b-2 border-primary py-5" : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/articles">
              <Button variant="ghost" size="icon" aria-label="Search">
                <Search className="h-5 w-5" />
              </Button>
            </Link>
            {/* Subscribe → LinkedIn */}
            <Button
              variant="default"
              className="hidden md:flex font-serif tracking-wide rounded-none items-center gap-2"
              onClick={() => window.open("https://www.linkedin.com/company/arabian-startups-ecosystem", "_blank")}
            >
              <Linkedin className="h-4 w-4" />
              Follow Us
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-card p-4">
          <nav className="flex flex-col gap-4 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`transition-colors hover:text-primary p-2 ${
                  location === link.href ? "text-primary bg-primary/10" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <button
              className="text-left p-2 text-muted-foreground hover:text-primary flex items-center gap-2"
              onClick={() => { window.open("https://www.linkedin.com/company/arabian-startups-ecosystem", "_blank"); setIsMobileMenuOpen(false); }}
            >
              <Linkedin className="h-4 w-4" /> Follow on LinkedIn
            </button>
          </nav>
        </div>
      )}

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-secondary text-secondary-foreground mt-24 py-12">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <img src={logo} alt="Arabian Startups Ecosystem" className="h-16 w-auto rounded" />
            </Link>
            <p className="text-secondary-foreground/70 max-w-md">
              The premier intelligence hub for founders, investors, and ecosystem builders in the Gulf region. Curated daily insights from Saudi Arabia, UAE, Kuwait, Qatar, Bahrain, and Oman.
            </p>
          </div>
          <div>
            <h4 className="font-serif text-lg font-semibold mb-4">Explore</h4>
            <ul className="space-y-2 text-secondary-foreground/70">
              <li><Link href="/digest/latest" className="hover:text-primary transition-colors">Today's Digest</Link></li>
              <li><Link href="/articles" className="hover:text-primary transition-colors">All News</Link></li>
              <li><Link href="/categories" className="hover:text-primary transition-colors">Categories</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-serif text-lg font-semibold mb-4">Connect</h4>
            <ul className="space-y-2 text-secondary-foreground/70">
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li>
                <a href="https://www.linkedin.com/company/arabian-startups-ecosystem" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-2">
                  <Linkedin className="h-4 w-4" /> LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-12 pt-8 border-t border-secondary-foreground/20 text-sm text-secondary-foreground/50 text-center">
          &copy; {new Date().getFullYear()} Arabian Startups Ecosystem. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
