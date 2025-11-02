import laptopImage from "@/assets/laptop-1.jpg";
import cameraImage from "@/assets/camera-1.jpg";
import droneImage from "@/assets/drone-1.jpg";
import phoneImage from "@/assets/phone-1.jpg";
import headphonesImage from "@/assets/headphones-1.jpg";
import tabletImage from "@/assets/tablet-1.jpg";

export interface Product {
  id: string;
  name: string;
  image: string;
  pricePerDay: number;
  category: string;
  condition?: string;
  location?: string;
  description?: string;
}

// Static products data
export const staticProducts: Product[] = [
  { id: "1", name: "MacBook Pro 16\"", image: laptopImage, pricePerDay: 800, category: "Laptops" },
  { id: "2", name: "Canon EOS R5", image: cameraImage, pricePerDay: 1500, category: "Cameras" },
  { id: "3", name: "DJI Mavic 3 Pro", image: droneImage, pricePerDay: 2000, category: "Drones" },
  { id: "4", name: "iPhone 15 Pro Max", image: phoneImage, pricePerDay: 1200, category: "Phones" },
  { id: "5", name: "Sony WH-1000XM5", image: headphonesImage, pricePerDay: 600, category: "Audio" },
  { id: "6", name: "iPad Pro 12.9\"", image: tabletImage, pricePerDay: 1500, category: "Tablets" },
];

// Featured items for home page
export const featuredItems = [
  { name: "MacBook Pro", image: laptopImage, price: 800 },
  { name: "Canon DSLR", image: cameraImage, price: 1500 },
  { name: "DJI Drone", image: droneImage, price: 2000 },
];

// Sample item detail data
export const sampleItemDetail = {
  id: "1",
  name: "MacBook Pro 16\" M3 Max",
  image: laptopImage,
  pricePerDay: 800,
  category: "Laptops",
  condition: "Excellent",
  location: "Haldwani, Uttarakhand",
  description: "High-performance MacBook Pro with M3 Max chip, 36GB RAM, and 1TB SSD. Perfect for video editing, 3D rendering, and professional creative work. Comes with original charger and USB-C cable.",
  specifications: [
    "Apple M3 Max chip",
    "36GB unified memory",
    "1TB SSD storage",
    "16.2-inch Liquid Retina XDR display",
    "Up to 22 hours battery life",
  ],
  owner: "Amit Kumar",
  rating: 4.9,
  reviews: 127,
};

// Related items for item detail page
export const relatedItems = [
  { id: "2", name: "Canon EOS R5", image: cameraImage, pricePerDay: 1500, category: "Cameras" },
  { id: "3", name: "DJI Mavic 3 Pro", image: droneImage, pricePerDay: 2000, category: "Drones" },
  { id: "4", name: "iPhone 15", image: phoneImage, pricePerDay: 1200, category: "Phone" },
];

