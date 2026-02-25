import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import NavBar from "@/components/NavBar";
import TutorialModal from "@/components/TutorialModal";

const Index = () => {
  const [token, setToken] = useState("");
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    setShowResults(true);
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 3000);
  };

  return (
    <div className="flex min-h-screen flex-col items-center pt-24 px-4 gap-6">
      <NavBar />
      <Card className="w-full max-w-2xl border-border">
        <CardContent className="p-8">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Checagem de Limites
          </h1>

          <p className="text-muted-foreground mb-6">
            Envie o <strong className="text-foreground">token da conta</strong>{" "}
            para ver quais recargas estão disponíveis para você VIA MÉTODO 2 e a{" "}
            <strong className="text-foreground uppercase">
              QUANTIDADE DE DIAMANTES QUE VOCÊ JÁ RECARREGOU NA CONTA ATÉ HOJE!
            </strong>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Cole aqui o token da sua conta."
              className="bg-background border-border text-foreground placeholder:text-muted-foreground"
            />
            <div className="flex gap-3">
              <Button type="submit" className="flex-1">
                Check
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setTutorialOpen(true)}
              >
                Tutorial
              </Button>
            </div>
          </form>

          <TutorialModal open={tutorialOpen} onClose={() => setTutorialOpen(false)} />

          <p className="text-muted-foreground text-sm mt-6">
            IMPORTANTE! Nas quantidades que mostram por ex: 620 ou 930, significa
            que você só tem limite de 1 recarga incluindo as duas, ou seja, se
            você fizer 930, não poderá fazer 620 mais.
          </p>
        </CardContent>
      </Card>

      {/* Results card */}
      {showResults && (
        <Card className="w-full max-w-2xl border-border">
          <CardContent className="p-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-muted-foreground text-sm">Loading API info...</p>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-2">Results</h2>
                <p className="text-muted-foreground text-sm">API data will be displayed here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Index;
