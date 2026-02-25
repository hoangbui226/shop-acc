import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import NavBar from "@/components/NavBar";

const SignUp = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [captchaChecked, setCaptchaChecked] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaChecked) return;
    console.log("Sign up:", username);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 pt-20">
      <NavBar />
      <Card className="w-full max-w-md border-border">
        <CardContent className="p-8">
          <h1 className="text-2xl font-bold text-foreground mb-6 text-center">Sign Up</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              value={username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
              placeholder="Username"
              className="bg-background border-border text-foreground"
            />
            <Input
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              placeholder="Password"
              className="bg-background border-border text-foreground"
            />
            <Input
              type="password"
              value={confirm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirm(e.target.value)}
              placeholder="Confirm Password"
              className="bg-background border-border text-foreground"
            />
            {/* Captcha */}
            <div className="flex items-center gap-3 rounded-md border border-border bg-secondary/50 p-3">
              <Checkbox
                id="captcha"
                checked={captchaChecked}
                onCheckedChange={(v: boolean) => setCaptchaChecked(v === true)}
              />
              <label htmlFor="captcha" className="text-sm text-foreground cursor-pointer select-none">
                I'm not a robot
              </label>
            </div>
            <Button type="submit" className="w-full" disabled={!captchaChecked}>
              Sign Up
            </Button>
          </form>
          <p className="text-muted-foreground text-sm text-center mt-4">
            Already have an account?{" "}
            <button onClick={() => navigate("/login")} className="text-primary hover:underline">
              Login
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUp;
