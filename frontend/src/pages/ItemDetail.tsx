import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProductCard from "@/components/ProductCard";
import { MapPin, Shield, Calendar, ArrowLeft } from "lucide-react";
import laptopImage from "@/assets/laptop-1.jpg";
import cameraImage from "@/assets/camera-1.jpg";
import droneImage from "@/assets/drone-1.jpg";
import phoneImage from "@/assets/phone-1.jpg";

const ItemDetail = () => {
  const { id } = useParams();

  const item = {
    id: "1",
    name: "MacBook Pro 16\" M3 Max",
    image: laptopImage,
    pricePerDay: 45,
    category: "Laptops",
    condition: "Excellent",
    location: "San Francisco, CA",
    description: "High-performance MacBook Pro with M3 Max chip, 36GB RAM, and 1TB SSD. Perfect for video editing, 3D rendering, and professional creative work. Comes with original charger and USB-C cable.",
    specifications: [
      "Apple M3 Max chip",
      "36GB unified memory",
      "1TB SSD storage",
      "16.2-inch Liquid Retina XDR display",
      "Up to 22 hours battery life",
    ],
    owner: "John Doe",
    rating: 4.9,
    reviews: 127,
  };

  const relatedItems = [
    { id: "2", name: "Canon EOS R5", image: cameraImage, pricePerDay: 35, category: "Cameras" },
    { id: "3", name: "DJI Mavic 3 Pro", image: droneImage, pricePerDay: 50, category: "Drones" },
    { id: "4", name: "iPhone 15 Pro Max", image: phoneImage, pricePerDay: 25, category: "Phones" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to="/browse" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Browse
        </Link>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Image Section */}
          <div>
            <div className="aspect-square rounded-2xl overflow-hidden bg-secondary shadow-lg">
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <div>
              <Badge className="mb-3">{item.category}</Badge>
              <h1 className="text-4xl font-bold text-foreground mb-4">{item.name}</h1>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-bold text-primary">${item.pricePerDay}</span>
                <span className="text-xl text-muted-foreground">/day</span>
              </div>
            </div>

            <div className="flex items-center gap-6 py-4 border-y border-border">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{item.condition}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{item.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Available Now</span>
              </div>
            </div>

            <Card className="p-6 bg-secondary/50 border-border">
              <h3 className="font-semibold mb-3">About this item</h3>
              <p className="text-muted-foreground leading-relaxed">{item.description}</p>
            </Card>

            <div>
              <h3 className="font-semibold mb-3">Specifications</h3>
              <ul className="space-y-2">
                {item.specifications.map((spec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span className="text-muted-foreground">{spec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-4 pt-4">
              <Button size="lg" className="flex-1 text-lg py-6">
                Lease Now
              </Button>
              <Button size="lg" variant="outline" className="flex-1 text-lg py-6">
                Contact Owner
              </Button>
            </div>
          </div>
        </div>

        {/* Related Items */}
        <div className="border-t border-border pt-16">
          <h2 className="text-3xl font-bold text-foreground mb-8">Similar Items</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {relatedItems.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetail;
