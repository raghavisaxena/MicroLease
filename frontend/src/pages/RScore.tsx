import Navbar from "@/components/Navbar";

const RScore = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-4">RScore</h1>
        <p className="text-muted-foreground">RScore details and analytics will appear here.</p>
      </div>
    </div>
  );
};

export default RScore;
