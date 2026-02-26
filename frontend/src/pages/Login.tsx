import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      alert("Informe usuário e senha para continuar.");
      return;
    }

    // TODO: replace with real sign-in API call
    console.log("Login:", { username, password, remember });
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md border-border">
        <CardContent className="p-8">
          <h1 className="text-2xl font-bold text-foreground mb-6 text-center">Login</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="bg-background border-border text-foreground"
              required
            />
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="bg-background border-border text-foreground"
              required
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(v) => setRemember(v === true)}
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-muted-foreground cursor-pointer select-none"
                >
                  Remember me
                </label>
              </div>
            </div>

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
