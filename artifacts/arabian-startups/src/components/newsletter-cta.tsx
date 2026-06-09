import { Linkedin } from "lucide-react";
import { Button } from "./ui/button";

export function NewsletterCTA() {
  return (
    <div className="bg-secondary text-secondary-foreground py-16 px-6 border-y-4 border-primary">
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="font-serif text-3xl md:text-5xl font-bold mb-4">
          Stay in the Loop
        </h2>
        <p className="text-secondary-foreground/80 text-lg mb-8 max-w-2xl mx-auto font-sans">
          Follow us on LinkedIn for daily GCC startup news, funding rounds, accelerator programs, events, and ecosystem insights delivered straight to your feed.
        </p>

        <Button
          onClick={() => window.open("https://www.linkedin.com/company/arabian-startups-ecosystem", "_blank")}
          className="h-12 rounded-none px-10 font-serif tracking-wider text-base bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-3"
        >
          <Linkedin className="h-5 w-5" />
          Follow on LinkedIn
        </Button>

        <p className="text-xs text-secondary-foreground/50 mt-6 font-mono uppercase tracking-wider">
          Join founders, investors & operators across the GCC
        </p>
      </div>
    </div>
  );
}
