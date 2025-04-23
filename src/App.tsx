import React, { useState } from "react";
import "./App.css";
import MainLayout from "./components/Layout/MainLayout";
import ProductGrid, { Product } from "./components/Products/ProductGrid";
import Cart, { CartItem } from "./components/Cart/Cart";
import CategoryTabs from "./components/Categories/CategoryTabs";
import SearchBar from "./components/Search/SearchBar";
import CheckoutModal from "./components/Checkout/CheckoutModal";
import TopNavigation from "./components/Navigation/TopNavigation";

// Sample data
const sampleProducts: Product[] = [
  { id: 1, name: "Coffee", price: 3.5, category: "Drinks" },
  { id: 2, name: "Tea", price: 2.5, category: "Drinks" },
  { id: 3, name: "Sandwich", price: 5.99, category: "Food" },
  { id: 4, name: "Salad", price: 4.75, category: "Food" },
  { id: 5, name: "Cake", price: 3.25, category: "Desserts" },
  { id: 6, name: "Muffin", price: 2.75, category: "Desserts" },
  { id: 7, name: "Soda", price: 1.99, category: "Drinks" },
  { id: 8, name: "Burger", price: 6.5, category: "Food" },
  { id: 9, name: "Fries", price: 2.5, category: "Sides" },
  { id: 10, name: "Ice Cream", price: 3.99, category: "Desserts" },
  { id: 11, name: "Pizza Slice", price: 4.5, category: "Food" },
  { id: 12, name: "Water Bottle", price: 1.5, category: "Drinks" },
];

const categories = [...new Set(sampleProducts.map((p) => p.category))].filter(
  Boolean
) as string[];

function App() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("home");

  // Filter products based on category and search query
  const filteredProducts = sampleProducts.filter((product) => {
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Cart functions
  const handleAddToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.product.id === product.id
      );

      if (existingItem) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { product, quantity: 1 }];
      }
    });
  };

  const handleIncreaseQuantity = (productId: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const handleDecreaseQuantity = (productId: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.max(1, item.quantity - 1) }
          : item
      )
    );
  };

  const handleRemoveItem = (productId: number) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.product.id !== productId)
    );
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleCheckout = () => {
    setIsCheckoutModalOpen(true);
  };

  const handleCompleteCheckout = (paymentMethod: string) => {
    // In a real app, you would process the payment here
    console.log(`Processing ${paymentMethod} payment for ${cart.length} items`);

    // Clear the cart and close the modal
    setCart([]);
    setIsCheckoutModalOpen(false);

    // You might want to show a success message or print a receipt here
    alert(`Payment successful! Thank you for your purchase.`);
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    // In a full implementation, you would use this to change views
    console.log(`Navigating to ${page}`);
  };

  // Main content with TopNavigation
  const mainContent = (
    <div className="products-container">
      <TopNavigation onNavigate={handleNavigate} activePage={currentPage} />
      <SearchBar onSearch={setSearchQuery} />
      <CategoryTabs
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
      <ProductGrid
        products={filteredProducts}
        onProductSelect={handleAddToCart}
      />
    </div>
  );

  // Render sidebar content (cart)
  const sidebarContent = (
    <Cart
      items={cart}
      onIncreaseQuantity={handleIncreaseQuantity}
      onDecreaseQuantity={handleDecreaseQuantity}
      onRemoveItem={handleRemoveItem}
      onClearCart={handleClearCart}
      onCheckout={handleCheckout}
    />
  );

  return (
    <div className="App">
      <MainLayout sidebar={sidebarContent} content={mainContent} />

      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        cartItems={cart}
        onCompleteCheckout={handleCompleteCheckout}
      />
    </div>
  );
}

export default App;
