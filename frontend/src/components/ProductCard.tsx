import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface ProductCardProps {
  id: string;
  name: string;
  image: string;
  pricePerDay: number;
  category: string;
}

const ProductCard = ({ id, name, image, pricePerDay, category }: ProductCardProps) => {
  return (
    <Card className="group overflow-hidden border border-border hover:shadow-lg transition-all duration-300">
      <Link to={`/item/${id}`}>
        <div className="aspect-square overflow-hidden bg-secondary">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            {category}
          </p>
          <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-1">
            {name}
          </h3>
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-2xl font-bold text-primary">${pricePerDay}</span>
            <span className="text-sm text-muted-foreground">/day</span>
          </div>
          <Button className="w-full" size="lg">
            Lease Now
          </Button>
        </div>
      </Link>
    </Card>
  );
};

export default ProductCard;
