import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

const Browse = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("");

  const {
    data: itemsData,
    isLoading,
    isError,
    error: queryError,
  } = useQuery<any[]>({
    queryKey: ["items"],
    queryFn: async () => {
      const res = await api.get("/items");
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 1000 * 30, // 30s
  });

  const products = (itemsData || []).map((it: any) => {
    const raw = it.imageUrl || "";
    let imageSrc = "/placeholder.svg";

    if (raw && typeof raw === "string") {
      const trimmed = raw.trim();
      if (trimmed.startsWith("data:")) {
        imageSrc = trimmed;
      } else if (trimmed.startsWith("http") || trimmed.startsWith("/")) {
        imageSrc = trimmed;
      } else {
        // if it's likely base64 without data: prefix, add a sensible default mime
        // detect base64 (rough check)
        const base64pattern = /^[A-Za-z0-9+/=\n\r]+$/;
        const onlyBase64 = base64pattern.test(trimmed.replace(/\s/g, ""));
        if (onlyBase64) {
          imageSrc = `data:image/jpeg;base64,${trimmed}`;
        } else if (trimmed.length > 0) {
          // fallback to using the raw string (some items may store relative paths)
          imageSrc = trimmed;
        }
      }
    }

    return {
      id: String(it.id),
      name: it.title || it.name || "Untitled",
      image: imageSrc,
      pricePerDay: it.pricePerDay || it.price || 0,
      category: it.category || "Other",
    };
  });

  const productsFiltered = useMemo(() => {
    let filtered = [...products];

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (product) =>
          product.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Sort products
    if (sortBy) {
      filtered.sort((a, b) => {
        switch (sortBy) {
          case "price-low":
            return a.pricePerDay - b.pricePerDay;
          case "price-high":
            return b.pricePerDay - a.pricePerDay;
          case "newest":
            return parseInt(b.id) - parseInt(a.id);
          case "popular":
            // For now, we'll use ID as a proxy for popularity
            // You can add actual popularity data later
            return parseInt(b.id) - parseInt(a.id);
          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [products, searchQuery, selectedCategory, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Browse Equipment
          </h1>
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48 h-12">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="audio">Audio Equipment</SelectItem>
              <SelectItem value="books">Books</SelectItem>
              <SelectItem value="clothing">Clothing</SelectItem>
              <SelectItem value="electronic">Electronic Device</SelectItem>
              <SelectItem value="footwear">Footwear</SelectItem>
              <SelectItem value="furniture">Furniture</SelectItem>
              <SelectItem value="instrument">Instruments</SelectItem>
              <SelectItem value="sports">Sports Equipment</SelectItem>
              <SelectItem value="stationary">Stationary</SelectItem>
              <SelectItem value="tools">Tools</SelectItem>
              <SelectItem value="other">All categories</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
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
          {isLoading ? (
            <p className="text-muted-foreground">Loading items…</p>
          ) : isError ? (
            <p className="text-red-500">
              {(queryError as any)?.message || "Failed to load items"}
            </p>
          ) : productsFiltered.length === 0 ? (
            <p className="text-muted-foreground">No items found.</p>
          ) : (
            productsFiltered.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Browse;
