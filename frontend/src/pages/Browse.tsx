import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import laptopImage from "@/assets/laptop-1.jpg";
import cameraImage from "@/assets/camera-1.jpg";
import droneImage from "@/assets/drone-1.jpg";
import phoneImage from "@/assets/phone-1.jpg";
import headphonesImage from "@/assets/headphones-1.jpg";
import tabletImage from "@/assets/tablet-1.jpg";

const Browse = () => {
  const products = [
    { id: "1", name: "MacBook Pro 16\"", image: laptopImage, pricePerDay: 45, category: "Laptops" },
    { id: "2", name: "Canon EOS R5", image: cameraImage, pricePerDay: 35, category: "Cameras" },
    { id: "3", name: "DJI Mavic 3 Pro", image: droneImage, pricePerDay: 50, category: "Drones" },
    { id: "4", name: "iPhone 15 Pro Max", image: phoneImage, pricePerDay: 25, category: "Phones" },
    { id: "5", name: "Sony WH-1000XM5", image: headphonesImage, pricePerDay: 15, category: "Audio" },
    { id: "6", name: "iPad Pro 12.9\"", image: tabletImage, pricePerDay: 30, category: "Tablets" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Browse Equipment</h1>
          <p className="text-lg text-muted-foreground">
            Discover thousands of tech gadgets available for lease
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for items..."
              className="pl-10 h-12"
            />
          </div>
          <Select>
            <SelectTrigger className="w-full sm:w-48 h-12">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="laptops">Laptops</SelectItem>
              <SelectItem value="cameras">Cameras</SelectItem>
              <SelectItem value="drones">Drones</SelectItem>
              <SelectItem value="phones">Phones</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
              <SelectItem value="tablets">Tablets</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-full sm:w-48 h-12">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Browse;
