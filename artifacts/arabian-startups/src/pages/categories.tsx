import { useListCategories, useListCountries } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Folder, MapPin } from "lucide-react";

export default function Categories() {
  const { data: categories, isLoading: catLoading } = useListCategories();
  const { data: countries, isLoading: countLoading } = useListCountries();

  const getFlag = (code: string) => {
    const flags: Record<string, string> = { SA: "🇸🇦", AE: "🇦🇪", KW: "🇰🇼", QA: "🇶🇦", BH: "🇧🇭", OM: "🇴🇲" };
    return flags[code] || code;
  };

  return (
    <Layout>
      <div className="bg-muted/30 border-b border-border py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6">Directory</h1>
          <p className="text-muted-foreground text-lg max-w-2xl font-sans">
            Browse the Arabian startup ecosystem by topic or by region. Our coverage spans the entire GCC.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 max-w-5xl">
        
        {/* Categories Section */}
        <div className="mb-20">
          <div className="flex items-center gap-3 border-b-2 border-foreground pb-2 mb-8">
            <Folder className="w-6 h-6 text-primary" />
            <h2 className="font-serif text-2xl font-bold uppercase tracking-tight">By Topic</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {catLoading ? (
              Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
            ) : categories?.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/articles?category=${cat.slug}`} className="block h-full border border-border bg-card p-6 hover-elevate group">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-serif text-xl font-bold group-hover:text-primary transition-colors">{cat.name}</h3>
                    <span className="bg-muted text-muted-foreground text-xs font-mono px-2 py-1">{cat.articleCount}</span>
                  </div>
                  {cat.description && (
                    <p className="text-sm text-muted-foreground">{cat.description}</p>
                  )}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Countries Section */}
        <div>
          <div className="flex items-center gap-3 border-b-2 border-foreground pb-2 mb-8">
            <MapPin className="w-6 h-6 text-primary" />
            <h2 className="font-serif text-2xl font-bold uppercase tracking-tight">By Region</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {countLoading ? (
              Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
            ) : countries?.map((country, i) => (
              <motion.div
                key={country.code}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/articles?country=${country.code}`} className="block text-center border border-border bg-card p-6 hover-elevate group">
                  <div className="text-4xl mb-3">{getFlag(country.code)}</div>
                  <h3 className="font-serif font-bold text-sm uppercase tracking-wide group-hover:text-primary transition-colors mb-2">{country.country}</h3>
                  <div className="text-xs text-muted-foreground font-mono">{country.articleCount} updates</div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </Layout>
  );
}