import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import api from "@/lib/api";

const Register = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Configure allowed domains here. Leave empty to allow any valid domain.
  const ALLOWED_EMAIL_DOMAINS: string[] = []; // e.g. ['example.com', 'company.org']

  const validateEmail = (value: string) => {
  // Format validation: stricter local-part (no '#', only common safe characters), domain basic structure
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(value)) return false;

    const domain = value.split("@")[1].toLowerCase();

    // If a whitelist is provided, require the domain to be in it
    if (ALLOWED_EMAIL_DOMAINS.length > 0) {
      return ALLOWED_EMAIL_DOMAINS.includes(domain);
    }

    // Domain validation: must contain at least one dot
    if (!domain.includes('.')) return false;

    // Each domain label must not start or end with a hyphen and must be non-empty
    const parts = domain.split('.');
    for (const label of parts) {
      if (!label) return false;
      if (label.startsWith('-') || label.endsWith('-')) return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || firstName.trim().length < 2) {
      toast.error("Please enter a valid first name (at least 2 characters).");
      return;
    }

    if (!lastName.trim() || lastName.trim().length < 2) {
      toast.error("Please enter a valid last name (at least 2 characters).");
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error("Please enter your email.");
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (!password) {
      toast.error("Please enter a password.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      const response = await api.post("/auth/register", {
        name: `${firstName} ${lastName}`,
        email: trimmedEmail,
        password: password,
        role: "lessee", // Default role, can be changed later
      });

      if (response.status === 200 || response.status === 201) {
        toast.success("Account created successfully!");
        // Store token if backend returns one
        if (response.data.token) {
          localStorage.setItem("token", response.data.token);
        }
        navigate("/browse");
      }
    } catch (error: any) {
      console.error("Register error:", error.response?.data || error.message);

      if (error.response) {
        const errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          "Failed to create account. Please try again.";
        toast.error(errorMessage);
      } else if (error.request) {
        toast.error("Cannot reach server. Please check if the backend is running.");
      } else {
        toast.error("An error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center space-x-2 mb-8">
            <div className="w-10 h-10 bg-gradient-teal rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <span className="text-2xl font-bold text-foreground">MicroLease</span>
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">Create Account</h1>
          <p className="text-muted-foreground">Join MicroLease today</p>
        </div>

        <Card className="p-8 border border-border shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  className="h-12"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  className="h-12"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="h-12"
                required
                value={email}
                onChange={(e) => {
                  const v = e.target.value;
                  setEmail(v);
                  const trimmed = v.trim();
                  if (!trimmed) {
                    setEmailError("");
                  } else if (!validateEmail(trimmed)) {
                    setEmailError("Please enter a valid email address.");
                  } else {
                    setEmailError("");
                  }
                }}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "email-error" : undefined}
              />
              {emailError ? (
                <p className="text-sm text-red-500 mt-1" id="email-error">
                  {emailError}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                className="h-12"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                className="h-12"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={!firstName || !lastName || !email || !password || !confirmPassword || !!emailError}
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Register;
