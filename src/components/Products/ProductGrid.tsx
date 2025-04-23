import React from "react";
import "./ProductGrid.css";

export interface Product {
  id: number;
  name: string;
  price: number;
  image?: string;
  category?: string;
  barcode?: string;
}

interface ProductGridProps {
  products: Product[];
  onProductSelect: (product: Product) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onProductSelect,
}) => {
  return (
    <div className="product-grid">
      {products.map((product) => (
        <div
          key={product.id}
          className="product-item"
          onClick={() => onProductSelect(product)}
        >
          <div className="product-image">
            {product.image ? (
              <img src={product.image} alt={product.name} />
            ) : (
              <div className="placeholder-image">{product.name[0]}</div>
            )}
          </div>
          <div className="product-info">
            <h3 className="product-name">{product.name}</h3>
            <p className="product-price">${product.price.toFixed(2)}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductGrid;
