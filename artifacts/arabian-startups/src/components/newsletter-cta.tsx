import { Linkedin } from "lucide-react";

export function NewsletterCTA() {
  return (
    <div className="bg-[hsl(220,60%,18%)] text-white py-14 px-6">
      <div className="container mx-auto max-w-3xl text-center">
        <div className="text-xs font-sans tracking-widest uppercase text-white/50 mb-3">Stay Connected</div>
        <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
          Never Miss a GCC Startup Story
        </h2>
        <p className="text-white/70 text-base mb-8 max-w-xl mx-auto">
          Follow us on LinkedIn for daily startup news, funding rounds, accelerator programs, events and ecosystem insights from Saudi Arabia and the GCC.
        </p>
        <button
          onClick={() => window.open("https://www.linkedin.com/company/arabian-startups-ecosystem", "_blank")}
          className="inline-flex items-center gap-2 bg-white text-[hsl(220,80%,35%)] hover:bg-white/90 font-bold px-8 py-3 rounded transition-colors text-sm"
        >
          <Linkedin className="h-4 w-4" />
          Follow on LinkedIn
        </button>
      </div>
    </div>
  );
}
