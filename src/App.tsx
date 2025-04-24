import React, { useState, useEffect } from "react";
import "./App.css";
import MainLayout from "./components/Layout/MainLayout";
import ProductGrid, { Product } from "./components/Products/ProductGrid";
import Cart, { CartItem } from "./components/Cart/Cart";
import CategoryTabs from "./components/Categories/CategoryTabs";
import SearchBar from "./components/Search/SearchBar";
import CheckoutModal from "./components/Checkout/CheckoutModal";
import TopNavigation from "./components/Navigation/TopNavigation";
import SettingsPage from "./components/Settings/SettingsPage";
import ProductManagement from "./components/Products/ProductManagement";
import CategoryManagement from "./components/Settings/CategoryManagement";
import OrdersPage from "./components/Orders/OrdersPage";
import ReportsPage from "./components/Reports/ReportsPage";
import BarcodeScanner from "./components/BarcodeScanner/BarcodeScanner";

// Import the database hooks
import { useProducts, useCategories, useOrders } from "./hooks/useDatabase";
import { useSettings } from "./hooks/useSettings";

function App() {
  // State for application
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("home");

  // Use the database hooks
  const {
    products,
    loading: productsLoading,
    error: productsError,
    searchProducts,
    getProductsByCategory,
    fetchProducts,
  } = useProducts();

  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useCategories();

  const { addOrder } = useOrders();

  const { settings, loading: settingsLoading } = useSettings();

  // Effect to fetch products when category changes
  useEffect(() => {
    if (selectedCategory === "all") {
      fetchProducts();
    } else {
      // Find the category ID by name
      const category = categories.find((c) => c.name === selectedCategory);
      if (category?.id) {
        getProductsByCategory(category.id);
      }
    }
  }, [selectedCategory, categories, fetchProducts, getProductsByCategory]);

  // Effect to search products when query changes
  useEffect(() => {
    if (searchQuery) {
      searchProducts(searchQuery);
    } else if (selectedCategory === "all") {
      fetchProducts();
    } else {
      // If we have a category selected, maintain that filter
      const category = categories.find((c) => c.name === selectedCategory);
      if (category?.id) {
        getProductsByCategory(category.id);
      }
    }
  }, [
    searchQuery,
    selectedCategory,
    categories,
    searchProducts,
    fetchProducts,
    getProductsByCategory,
  ]);

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

  const handleCompleteCheckout = async (
    paymentMethod: string
  ): Promise<number> => {
    try {
      // Calculate total and tax
      const subtotal = cart.reduce((total, item) => {
        return total + item.product.price * item.quantity;
      }, 0);

      // Get tax rate from settings
      const taxRate = settings?.taxEnabled ? settings.taxRate : 0;
      const taxAmount = subtotal * (taxRate / 100);

      // Create order object
      const order = {
        total: subtotal + taxAmount,
        tax: taxAmount,
        payment_method: paymentMethod,
        items: cart.map((item) => ({
          product_id: item.product.id || 0,
          quantity: item.quantity,
          price: item.product.price,
        })),
      };

      // Add order to database
      const orderId = await addOrder(order);
      console.log(`Order #${orderId} created successfully`);

      // Clear the cart
      setCart([]);

      // Return the order ID to show the receipt
      return orderId;
    } catch (error) {
      console.error("Error processing checkout:", error);
      throw new Error(
        "There was an error processing your payment. Please try again."
      );
    }
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  // Get category names from the database
  const categoryNames = categories.map((category) => category.name);

  // Determine what content to show based on current page
  let mainContent;

  if (productsLoading || categoriesLoading) {
    mainContent = <div className="loading-container">Loading...</div>;
  } else if (productsError || categoriesError) {
    mainContent = (
      <div className="error-container">
        Error loading data. Please try again.
      </div>
    );
  } else {
    switch (currentPage) {
      case "home":
        mainContent = (
          <div className="products-container">
            <SearchBar onSearch={setSearchQuery} />
            <CategoryTabs
              categories={categoryNames}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
            <ProductGrid
              products={products}
              onProductSelect={handleAddToCart}
            />
          </div>
        );
        break;
      case "orders":
        mainContent = <OrdersPage />;
        break;
      case "products":
        mainContent = <ProductManagement />;
        break;
      case "categories":
        mainContent = <CategoryManagement />;
        break;
      case "reports":
        mainContent = <ReportsPage />;
        break;
      case "settings":
        mainContent = <SettingsPage />;
        break;
      default:
        mainContent = <div>Page not found</div>;
    }
  }

  // Render sidebar content (cart)
  const sidebarContent = (
    <Cart
      items={cart}
      onIncreaseQuantity={handleIncreaseQuantity}
      onDecreaseQuantity={handleDecreaseQuantity}
      onRemoveItem={handleRemoveItem}
      onClearCart={handleClearCart}
      onCheckout={handleCheckout}
      onClose={() => {
        /* Function to close the cart panel if needed */
      }}
    />
  );

  // Add footer with navigation
  const footerContent = (
    <TopNavigation onNavigate={handleNavigate} activePage={currentPage} />
  );

  return (
    <div className="App">
      <MainLayout
        sidebar={sidebarContent}
        content={mainContent}
        footer={footerContent}
      />

      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        cartItems={cart}
        onCompleteCheckout={handleCompleteCheckout}
      />

      {/* Add barcode scanner component */}
      {currentPage === "home" && (
        <BarcodeScanner onProductScanned={handleAddToCart} />
      )}
    </div>
  );
}

export default App;
