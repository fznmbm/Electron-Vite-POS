import { useState, useEffect, useCallback } from "react";
import { Product, Category, Order, OrderItem } from "../../electron/database";
import { useRefresh } from "../contexts/RefreshContext";

// Custom hook for products
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { refreshTrigger } = useRefresh();

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await window.db.getProducts();
      setProducts(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  // Refetch when refreshTrigger changes
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, refreshTrigger]);

  const addProduct = useCallback(
    async (product: Product) => {
      try {
        const newId = await window.db.addProduct(product);
        await fetchProducts(); // Refresh the products list
        return newId;
      } catch (err) {
        console.error("Error adding product:", err);
        throw err;
      }
    },
    [fetchProducts]
  );

  const updateProduct = useCallback(
    async (product: Product) => {
      try {
        const success = await window.db.updateProduct(product);
        if (success) {
          await fetchProducts(); // Refresh the products list
        }
        return success;
      } catch (err) {
        console.error("Error updating product:", err);
        throw err;
      }
    },
    [fetchProducts]
  );

  const deleteProduct = useCallback(
    async (id: number) => {
      try {
        const success = await window.db.deleteProduct(id);
        if (success) {
          await fetchProducts(); // Refresh the products list
        }
        return success;
      } catch (err) {
        console.error("Error deleting product:", err);
        throw err;
      }
    },
    [fetchProducts]
  );

  const searchProducts = useCallback(async (query: string) => {
    try {
      setLoading(true);
      const data = await window.db.searchProducts(query);
      setProducts(data);
      setError(null);
    } catch (err) {
      console.error("Error searching products:", err);
      setError("Failed to search products");
    } finally {
      setLoading(false);
    }
  }, []);

  const getProductsByCategory = useCallback(async (categoryId: number) => {
    try {
      setLoading(true);
      const data = await window.db.getProductsByCategory(categoryId);
      setProducts(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching products by category:", err);
      setError("Failed to load products for this category");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load products on mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    getProductsByCategory,
  };
}

// Custom hook for categories
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { refreshTrigger } = useRefresh(); // Add this

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await window.db.getCategories();
      setCategories(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);
  // Add refreshTrigger to the dependency array of this useEffect
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories, refreshTrigger]);

  const addCategory = useCallback(
    async (category: Category) => {
      try {
        const newId = await window.db.addCategory(category);
        await fetchCategories(); // Refresh the categories list
        return newId;
      } catch (err) {
        console.error("Error adding category:", err);
        throw err;
      }
    },
    [fetchCategories]
  );

  const updateCategory = useCallback(
    async (category: Category) => {
      try {
        const success = await window.db.updateCategory(category);
        if (success) {
          await fetchCategories(); // Refresh the categories list
        }
        return success;
      } catch (err) {
        console.error("Error updating category:", err);
        throw err;
      }
    },
    [fetchCategories]
  );

  const deleteCategory = useCallback(
    async (id: number) => {
      try {
        const success = await window.db.deleteCategory(id);
        if (success) {
          await fetchCategories(); // Refresh the categories list
        }
        return success;
      } catch (err) {
        console.error("Error deleting category:", err);
        throw err;
      }
    },
    [fetchCategories]
  );

  // Load categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
  };
}

// Custom hook for orders
export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await window.db.getOrders();
      setOrders(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  const getOrderById = useCallback(async (id: number) => {
    try {
      return await window.db.getOrderById(id);
    } catch (err) {
      console.error("Error fetching order details:", err);
      throw err;
    }
  }, []);

  const addOrder = useCallback(
    async (order: Order) => {
      try {
        const newId = await window.db.addOrder(order);
        await fetchOrders(); // Refresh the orders list
        return newId;
      } catch (err) {
        console.error("Error adding order:", err);
        throw err;
      }
    },
    [fetchOrders]
  );

  const getOrdersByDateRange = useCallback(
    async (startDate: string, endDate: string) => {
      try {
        setLoading(true);

        // Create an adjusted end date that includes the full day
        const adjustedEndDate = new Date(endDate);
        adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
        const formattedEndDate = adjustedEndDate.toISOString().split("T")[0];

        const data = await window.db.getOrdersByDateRange(
          startDate,
          formattedEndDate
        );

        setOrders(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching orders by date range:", err);
        setError("Failed to load orders for this date range");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteOrder = useCallback(
    async (id: number) => {
      try {
        const success = await window.db.deleteOrder(id);
        if (success) {
          await fetchOrders(); // Refresh the orders list
        }
        return success;
      } catch (err) {
        console.error("Error deleting order:", err);
        throw err;
      }
    },
    [fetchOrders]
  );

  // Load orders on mount
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    fetchOrders,
    getOrderById,
    addOrder,
    getOrdersByDateRange,
    deleteOrder,
  };
}

// Custom hook for reports
export function useReports() {
  const getTopSellingProducts = useCallback(async (limit: number = 10) => {
    try {
      return await window.db.getTopSellingProducts(limit);
    } catch (err) {
      console.error("Error fetching top selling products:", err);
      throw err;
    }
  }, []);

  const getDailySales = useCallback(async (days: number = 30) => {
    try {
      return await window.db.getDailySales(days);
    } catch (err) {
      console.error("Error fetching daily sales:", err);
      throw err;
    }
  }, []);

  const getSalesByCategory = useCallback(async () => {
    try {
      return await window.db.getSalesByCategory();
    } catch (err) {
      console.error("Error fetching sales by category:", err);
      throw err;
    }
  }, []);

  return {
    getTopSellingProducts,
    getDailySales,
    getSalesByCategory,
  };
}
