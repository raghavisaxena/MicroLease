import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import laptopImage from "@/assets/laptop-1.jpg";
import cameraImage from "@/assets/camera-1.jpg";
import { Calendar, MapPin } from "lucide-react";

const MyLeases = () => {
  const activeLeases = [
    {
      id: "1",
      name: "MacBook Pro 16\"",
      image: laptopImage,
      pricePerDay: 45,
      startDate: "2024-10-01",
      endDate: "2024-10-15",
      status: "active",
      location: "San Francisco, CA",
    },
  ];

  const pastLeases = [
    {
      id: "2",
      name: "Canon EOS R5",
      image: cameraImage,
      pricePerDay: 35,
      startDate: "2024-09-15",
      endDate: "2024-09-22",
      status: "completed",
      location: "Los Angeles, CA",
    },
  ];

  const renderLeaseCard = (lease: typeof activeLeases[0]) => (
    <Card key={lease.id} className="p-6 border border-border hover:shadow-md transition-shadow">
      <div className="flex gap-6">
        <div className="w-32 h-32 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
          <img src={lease.image} alt={lease.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-2">{lease.name}</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{lease.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(lease.startDate).toLocaleDateString()} - {new Date(lease.endDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <Badge variant={lease.status === "active" ? "default" : "secondary"}>
              {lease.status === "active" ? "Active" : "Completed"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-primary">${lease.pricePerDay}</span>
              <span className="text-sm text-muted-foreground ml-1">/day</span>
            </div>
            {lease.status === "active" && (
              <div className="flex gap-3">
                <Button variant="outline">Extend Lease</Button>
                <Button variant="outline">Contact Owner</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">My Leases</h1>
          <p className="text-lg text-muted-foreground">
            Manage your active and past leases
          </p>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="active" className="px-8">
              Active Leases ({activeLeases.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="px-8">
              Past Leases ({pastLeases.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            {activeLeases.length > 0 ? (
              activeLeases.map(renderLeaseCard)
            ) : (
              <Card className="p-12 text-center border border-border">
                <p className="text-muted-foreground text-lg">You don't have any active leases</p>
                <Button className="mt-6">Browse Items</Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-6">
            {pastLeases.length > 0 ? (
              pastLeases.map(renderLeaseCard)
            ) : (
              <Card className="p-12 text-center border border-border">
                <p className="text-muted-foreground text-lg">No past leases yet</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyLeases;
