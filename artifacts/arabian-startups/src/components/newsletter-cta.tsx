import { useSubscribeNewsletter } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export function NewsletterCTA() {
  const { toast } = useToast();
  const subscribe = useSubscribeNewsletter();
  
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (values: z.infer<typeof schema>) => {
    subscribe.mutate(
      { data: { email: values.email } },
      {
        onSuccess: () => {
          toast({
            title: "Subscribed Successfully",
            description: "You've been added to our daily digest.",
          });
          form.reset();
        },
        onError: () => {
          toast({
            title: "Subscription Failed",
            description: "Please try again later.",
            variant: "destructive",
          });
        }
      }
    );
  };

  return (
    <div className="bg-secondary text-secondary-foreground py-16 px-6 border-y-4 border-primary">
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="font-serif text-3xl md:text-5xl font-bold mb-4">
          The Ecosystem in Your Inbox
        </h2>
        <p className="text-secondary-foreground/80 text-lg mb-8 max-w-2xl mx-auto font-sans">
          Join thousands of founders, investors, and operators. Get the daily curated digest of GCC startup news, funding rounds, and insights.
        </p>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input 
                      placeholder="Your professional email" 
                      className="h-12 bg-background text-foreground rounded-none border-none focus-visible:ring-primary font-mono"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-left" />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="h-12 rounded-none px-8 font-serif tracking-wider text-base bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={subscribe.isPending}
            >
              {subscribe.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Subscribe
            </Button>
          </form>
        </Form>
        <p className="text-xs text-secondary-foreground/50 mt-4 font-mono uppercase tracking-wider">
          No spam. Unsubscribe anytime.
        </p>
      </div>
    </div>
  );
}