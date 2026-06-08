import { Layout } from "@/components/layout";
import { NewsletterCTA } from "@/components/newsletter-cta";

export default function About() {
  return (
    <Layout>
      <div className="bg-background">
        {/* Hero */}
        <div className="container mx-auto px-4 py-20 max-w-4xl text-center border-b border-border">
          <h1 className="font-serif text-5xl md:text-7xl font-bold mb-6">
            Intelligence for the <span className="text-primary italic">Arabian</span> Ecosystem
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-serif leading-relaxed">
            We curate, synthesize, and deliver the most critical updates from the fastest-growing startup region in the world.
          </p>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-16 max-w-3xl">
          <div className="prose prose-lg dark:prose-invert prose-headings:font-serif prose-p:font-sans">
            <h2>The Mission</h2>
            <p>
              The GCC startup ecosystem is moving faster than ever. Record funding rounds, visionary government initiatives, and a new generation of founders are transforming the region. Yet, keeping track of it all is noisy and fragmented.
            </p>
            <p>
              <strong>Arabian Startups Ecosystem (ASE)</strong> was built to solve this. We are a premium intelligence hub that aggregates news from across Saudi Arabia, UAE, Kuwait, Qatar, Bahrain, and Oman into a single, authoritative daily digest.
            </p>

            <h2>Our Coverage</h2>
            <p>
              We focus on the signal, not the noise. Our systems and editors curate updates across critical vectors:
            </p>
            <ul>
              <li><strong>Funding & M&A:</strong> Seed rounds to mega-exits.</li>
              <li><strong>Product & Launches:</strong> What teams are actually building.</li>
              <li><strong>Ecosystem & Policy:</strong> Regulatory shifts and sovereign fund initiatives.</li>
              <li><strong>Talent:</strong> Executive moves and hiring trends.</li>
            </ul>

            <div className="my-12 p-8 border border-primary bg-primary/5 text-center">
              <h3 className="font-serif text-2xl font-bold text-primary mb-2 mt-0">"The indispensable daily read for doing business in the Gulf."</h3>
            </div>

            <h2>The Team</h2>
            <p>
              We are a team of data engineers, journalists, and operators based across Riyadh and Dubai. We believe the region deserves media tooling as sophisticated as the companies being built here.
            </p>
          </div>
        </div>
      </div>
      <NewsletterCTA />
    </Layout>
  );
}