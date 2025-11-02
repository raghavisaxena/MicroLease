import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import api from "@/lib/api";

const AddItem = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    description: "",
    location: "",
    condition: "",
    imageUrl: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const processFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB");
      return;
    }

    // Convert image to base64 for now (you can later implement proper file upload)
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, imageUrl: reader.result as string }));
      toast.success("Image uploaded successfully");
    };
    reader.onerror = () => {
      toast.error("Error reading image file");
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to list an item");
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      let response;
      const payload = {
        title: formData.name,
        category: formData.category,
        pricePerDay: parseFloat(formData.price),
        description: formData.description,
        location: formData.location,
        condition: formData.condition,
        imageUrl: formData.imageUrl || "",
      };

      if (isEditing && editId) {
        response = await api.put(`/items/${editId}`, payload);
        toast.success('Item updated successfully!');
      } else {
        response = await api.post('/items', payload);
        toast.success('Item listed successfully!');
      }

      // Invalidate items queries so Browse and MyLeases will refetch automatically
      try {
        await queryClient.invalidateQueries({ queryKey: ["items"] });
        await queryClient.invalidateQueries({ queryKey: ["items", "my"] });
      } catch (e) {
        console.error("Error invalidating queries:", e);
      }

      // Reset form when creating; if editing, keep values or navigate away
      if (!isEditing) {
        setFormData({
          name: "",
          category: "",
          price: "",
          description: "",
          location: "",
          condition: "",
          imageUrl: "",
        });
        navigate('/browse');
      } else {
        // After editing, go to My Listings
        navigate('/my-leases');
      }
    } catch (error: any) {
      console.error('Error listing/updating item:', error);
      toast.error(error.response?.data?.message || 'Failed to save item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If editId is present, fetch item and prefill form
  useEffect(() => {
    const loadItem = async () => {
      if (!editId) return;
      setLoading(true);
      try {
        const res = await api.get(`/items/${editId}`);
        const it = res.data;
        setFormData({
          name: it.title || '',
          category: it.category || '',
          price: it.pricePerDay ? String(it.pricePerDay) : '',
          description: it.description || '',
          location: it.location || '',
          condition: it.condition || '',
          imageUrl: it.imageUrl || '',
        });
        setIsEditing(true);
      } catch (err: any) {
        console.error('Failed to load item for editing', err);
        toast.error(err?.response?.data?.message || 'Failed to load item for editing');
      } finally {
        setLoading(false);
      }
    };

    loadItem();
  }, [editId]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">{isEditing ? 'Edit Item' : 'List Your Item'}</h1>
            <p className="text-lg text-muted-foreground">
              {isEditing ? 'Update your listing details below' : 'Share your tech gadgets with the community and earn'}
            </p>
          </div>

          <Card className="p-8 border border-border">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., MacBook Pro 16-inch"
                  className="h-12"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => handleChange("category", value)} required>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select a category" />
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
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price per Day (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="25"
                  className="h-12"
                  min="1"
                  value={formData.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your item, its condition, and any accessories included..."
                  className="min-h-32 resize-none"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Images</Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer relative ${
                    isDragging
                      ? "border-primary bg-primary/5 scale-[1.02]"
                      : "border-border hover:border-primary"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">
                    {isDragging ? "Drop your image here" : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG up to 10MB
                  </p>
                  <Input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  {formData.imageUrl && (
                    <div className="mt-4">
                      <img src={formData.imageUrl} alt="Preview" className="max-h-32 mx-auto rounded shadow-md" />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="City, State"
                    className="h-12"
                    value={formData.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Select value={formData.condition} onValueChange={(value) => handleChange("condition", value)} required>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-6 flex gap-4">
                <Button type="submit" size="lg" className="flex-1" disabled={loading}>
                  {loading ? (isEditing ? 'Saving...' : 'Listing...') : (isEditing ? 'Update Item' : 'List Item')}
                </Button>
                <Button type="button" variant="outline" size="lg" onClick={() => navigate("/browse")}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AddItem;
