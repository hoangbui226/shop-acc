import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login:", email);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md border-border">
        <CardContent className="p-8">
          <h1 className="text-2xl font-bold text-foreground mb-6 text-center">Login</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="bg-background border-border text-foreground"
            />
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="bg-background border-border text-foreground"
            />
            <Button type="submit" className="w-full">Login</Button>
          </form>
          <p className="text-muted-foreground text-sm text-center mt-4">
            Don't have an account?{" "}
            <button onClick={() => navigate("/signup")} className="text-primary hover:underline">
              Sign Up
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
