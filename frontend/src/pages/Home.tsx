import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import heroImage from "@/assets/hero-image.jpg";
import laptopImage from "@/assets/laptop-1.jpg";
import cameraImage from "@/assets/camera-1.jpg";
import droneImage from "@/assets/drone-1.jpg";
import { ArrowRight, Shield, Clock, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import api from "@/lib/api";

const Home = () => {
   const [backendStatus, setBackendStatus] = useState("Connecting...");

  useEffect(() => {
   
    api.get("/test")
      .then((res) => {
        setBackendStatus(res.data.message || "Backend connected!");
      })
      .catch(() => {
        setBackendStatus("⚠️ Unable to connect to backend");
      });
  }, []);
  
  const features = [
    {
      icon: Shield,
      title: "Verified Equipment",
      description: "All items are quality-checked and insured for your peace of mind",
    },
    {
      icon: Clock,
      title: "Flexible Duration",
      description: "Lease for a day, week, or month. Cancel anytime with ease",
    },
    {
      icon: Sparkles,
      title: "Latest Tech",
      description: "Access cutting-edge gadgets without the commitment",
    },
  ];

  const featuredItems = [
    { name: "MacBook Pro", image: laptopImage, price: 800 },
    { name: "Canon DSLR", image: cameraImage, price: 1500 },
    { name: "DJI Drone", image: droneImage, price: 2000 },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-7xl font-bold text-foreground leading-tight">
                Lease Smarter,
                <span className="block text-primary mt-2">Live Lighter</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
                Access premium tech gadgets without the commitment. Browse, lease, and return with ease.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/browse">
                  <Button size="lg" className="text-lg px-8 py-6 shadow-lg">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/add-item">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                    List Your Item
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <img
                  src={heroImage}
                  alt="Tech gadgets"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Why Choose MicroLease?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The smartest way to access technology
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-8 border border-border hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Items */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Popular Leases</h2>
            <p className="text-lg text-muted-foreground">Start with these trending items</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {featuredItems.map((item, index) => (
              <div
                key={index}
                className="bg-card rounded-xl overflow-hidden border border-border hover:shadow-lg transition-all"
              >
                <div className="aspect-square bg-secondary">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-2xl font-bold text-primary">₹{item.price}</span>
                    <span className="text-sm text-muted-foreground">/day</span>
                  </div>
                  <Link to="/browse">
                    <Button className="w-full" size="lg">View Details</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/browse">
              <Button size="lg" variant="outline">
                Browse All Items
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-teal">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands who are already leasing smarter with MicroLease
          </p>
          <Link to="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
