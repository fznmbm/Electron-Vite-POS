import React, { useState } from "react";
import { useCurrencyFormatter } from "../../utils/formatCurrency";

interface Product {
  id: number;
  name: string;
  price: number;
  image?: string;
}

const sampleProducts: Product[] = [
  { id: 1, name: "Coffee", price: 3.5 },
  { id: 2, name: "Sandwich", price: 5.99 },
  { id: 3, name: "Salad", price: 4.75 },
  { id: 4, name: "Cake", price: 3.25 },
];

interface ProductListProps {
  onProductSelect: (product: Product) => void;
}

const { format } = useCurrencyFormatter();

const ProductList: React.FC<ProductListProps> = ({ onProductSelect }) => {
  return (
    <div className="product-grid">
      {sampleProducts.map((product) => (
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
            <h3>{product.name}</h3>
            <p>{format(product.price)}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductList;
