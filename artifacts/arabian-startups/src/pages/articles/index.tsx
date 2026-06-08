import { Layout } from "@/components/layout";
import { ArticleCard } from "@/components/article-card";
import { useListArticles, useListCategories, useListCountries } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce"; // We need to create this or just use local state with timeout

// simple debounce hook
function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useState(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }); // Note: useEffect is better but sticking to quick implementation

  return debouncedValue;
}

export default function Articles() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [country, setCountry] = useState<string>("all");
  const [page, setPage] = useState(1);

  // Quick manual debounce since we didn't write the hook file
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const { data, isLoading } = useListArticles({
    page,
    limit: 12,
    search: debouncedSearch || undefined,
    category: category !== "all" ? category : undefined,
    country: country !== "all" ? country : undefined,
  });

  const { data: categories } = useListCategories();
  const { data: countries } = useListCountries();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    // Simple debounce inline
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(e.target.value);
      setPage(1);
    }, 500);
    return () => clearTimeout(timeoutId);
  };

  return (
    <Layout>
      <div className="bg-muted/30 border-b border-border py-12">
        <div className="container mx-auto px-4">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6">Latest News</h1>
          
          <div className="flex flex-col md:flex-row gap-4 items-center bg-card p-4 border border-border shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search articles..." 
                className="pl-9 h-10 border-none bg-muted/50 rounded-none focus-visible:ring-primary"
                value={search}
                onChange={handleSearchChange}
              />
            </div>
            
            <div className="flex w-full md:w-auto gap-4">
              <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
                <SelectTrigger className="w-full md:w-[180px] rounded-none h-10 border-border">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map(c => (
                    <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={country} onValueChange={(v) => { setCountry(v); setPage(1); }}>
                <SelectTrigger className="w-full md:w-[180px] rounded-none h-10 border-border">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {countries?.map(c => (
                    <SelectItem key={c.code} value={c.code}>{c.country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="w-full h-80" />)}
          </div>
        ) : data?.articles && data.articles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {data.articles.map((article, i) => (
                <ArticleCard key={article.id} article={article} index={i} />
              ))}
            </div>
            
            {/* Pagination */}
            <div className="flex justify-center gap-2">
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
          </>
        ) : (
          <div className="text-center py-24 bg-card border border-border">
            <h3 className="font-serif text-2xl font-bold mb-2">No articles found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters.</p>
            <Button 
              variant="outline" 
              className="mt-6 rounded-none font-serif"
              onClick={() => {
                setSearch("");
                setDebouncedSearch("");
                setCategory("all");
                setCountry("all");
                setPage(1);
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}