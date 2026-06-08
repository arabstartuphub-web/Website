import { useListDigests } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { useState } from "react";

export default function Digests() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useListDigests({ page, limit: 10 });

  return (
    <Layout>
      <div className="bg-secondary text-secondary-foreground py-16">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <Mail className="w-12 h-12 mx-auto mb-6 text-primary" />
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6">Daily Briefing Archive</h1>
          <p className="text-secondary-foreground/80 text-lg max-w-2xl mx-auto font-sans">
            Our daily curated synthesis of the most important moves in the GCC startup ecosystem.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {isLoading ? (
          <div className="space-y-6">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="w-full h-48" />
            ))}
          </div>
        ) : data?.digests && data.digests.length > 0 ? (
          <div className="space-y-8">
            {data.digests.map((digest, i) => (
              <motion.div 
                key={digest.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border p-6 md:p-8 hover-elevate transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="text-primary font-mono text-sm font-bold uppercase tracking-wider mb-2">
                      {format(new Date(digest.date), "EEEE, MMMM dd, yyyy")}
                    </div>
                    <h2 className="font-serif text-2xl font-bold">The Daily Briefing</h2>
                  </div>
                  <div className="bg-muted px-3 py-1 text-xs font-mono uppercase border border-border">
                    {digest.articleCount} Updates
                  </div>
                </div>
                
                <p className="text-muted-foreground mb-6 line-clamp-3">
                  {digest.summary}
                </p>
                
                <Button asChild variant="outline" className="rounded-none font-serif tracking-wide border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  <Link href={i === 0 && page === 1 ? "/digest/latest" : `/digest/${digest.id}`}>
                    Read Full Briefing →
                  </Link>
                </Button>
              </motion.div>
            ))}

            {/* Pagination */}
            <div className="flex justify-center gap-2 pt-8 border-t border-border">
              <Button 
                variant="outline" 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="rounded-none font-mono uppercase"
              >
                Previous
              </Button>
              <div className="flex items-center px-4 font-mono text-sm">
                Page {page} of {Math.ceil(data.total / data.limit)}
              </div>
              <Button 
                variant="outline" 
                disabled={page >= Math.ceil(data.total / data.limit)}
                onClick={() => setPage(p => p + 1)}
                className="rounded-none font-mono uppercase"
              >
                Next
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-24 border border-dashed border-border">
            <p className="text-muted-foreground text-lg">No digests available.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}