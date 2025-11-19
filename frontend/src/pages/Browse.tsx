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

  // Filter approved items only - for now show all items to allow testing
  // TODO: Re-enable approval filter once admin system is fully deployed
  const approvedItems = (itemsData || []).filter((it: any) => {
    // Show item if: approved is true, OR approved is undefined/null (legacy items), OR approved is false (for testing)
    return true; // Temporarily show all items
  });

  const products = approvedItems.map((it: any) => {
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
  // Friendly mapping for categories and derive categories from products
  const CATEGORY_LABELS: Record<string, string> = {
    audio: 'Audio Equipment',
    books: 'Books',
    clothing: 'Clothing',
    electronic: 'Electronic Devices',
    footwear: 'Footwear',
    furniture: 'Furniture',
    instrument: 'Instruments',
    sports: 'Sports Equipment',
    stationary: 'Stationary',
    tools: 'Tools',
  };

  const knownCategoryKeys = new Set(Object.keys(CATEGORY_LABELS));

  // derive categories from products so dropdown stays in sync with DB
  const categories = useMemo(() => {
    const seen = new Set<string>();
    const unknown = new Set<string>();
    products.forEach((p) => {
      const cat = (p.category || '').toString().trim();
      if (!cat) return;
      const key = cat.toLowerCase();
      if (knownCategoryKeys.has(key)) {
        seen.add(key);
      } else {
        unknown.add(key);
      }
    });

    // Build list: All -> known (mapped labels) -> Other (if unknown exists)
    const knownList = Array.from(seen).sort().map((k) => ({ value: k, label: CATEGORY_LABELS[k] || k }));
    const result = [{ value: 'all', label: 'All categories' }, ...knownList];
    if (unknown.size > 0) result.push({ value: 'other', label: 'Other' });
    return result;
  }, [products]);

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
            Discover thousands of items available for lease
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
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
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
