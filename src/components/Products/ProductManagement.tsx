import React, { useState, useEffect } from "react";
import { useProducts, useCategories } from "../../hooks/useDatabase";
import { Product } from "../../../electron/database";
import "./ProductManagement.css";
import { useCurrencyFormatter } from "../../utils/formatCurrency";
import { useRefresh } from "../../contexts/RefreshContext";

const ProductManagement: React.FC = () => {
  const {
    products,
    loading: productsLoading,
    error: productsError,
    addProduct,
    updateProduct,
    deleteProduct,
    fetchProducts,
  } = useProducts();

  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useCategories();

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<Product>({
    name: "",
    price: 0,
    category_id: 0,
    barcode: "",
    image: "",
  });

  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // State for delete confirmation modal
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);

  const isLoading = productsLoading || categoriesLoading;
  const error = productsError || categoriesError;
  const { format } = useCurrencyFormatter();
  const { refreshData } = useRefresh();

  // Reset form validation messages when input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (validationError) {
      setValidationError(null);
    }

    if (name === "price" && type === "number") {
      setNewProduct({
        ...newProduct,
        [name]: parseFloat(value) || 0,
      });
    } else if (name === "category_id") {
      setNewProduct({
        ...newProduct,
        [name]: parseInt(value) || 0,
      });
    } else {
      setNewProduct({
        ...newProduct,
        [name]: value,
      });
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting new product:", newProduct);

    // Validation
    if (!newProduct.name.trim()) {
      console.log("Validation failed: Product name is required");
      setValidationError("Product name is required");
      return;
    }

    if (newProduct.price <= 0) {
      console.log("Validation failed: Price must be greater than 0");
      setValidationError("Price must be greater than 0");
      return;
    }

    if (!newProduct.category_id) {
      console.log("Validation failed: Please select a category");
      setValidationError("Please select a category");
      return;
    }

    setValidationError(null);

    try {
      console.log("Attempting to add product to database:", newProduct);
      const newId = await addProduct(newProduct);
      console.log("Product added successfully with ID:", newId);

      // Reset form
      setNewProduct({
        name: "",
        price: 0,
        category_id: 0,
        barcode: "",
        image: "",
      });

      setSuccessMessage("Product added successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);

      refreshData(); // Trigger refresh
    } catch (err) {
      console.error("Error adding product:", err);
      setValidationError("Failed to add product. Please try again.");
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Updating product:", editingProduct);

    if (!editingProduct) return;

    if (!editingProduct.name.trim()) {
      setValidationError("Product name is required");
      return;
    }

    if (editingProduct.price <= 0) {
      setValidationError("Price must be greater than 0");
      return;
    }

    if (!editingProduct.category_id) {
      setValidationError("Please select a category");
      return;
    }

    setValidationError(null);

    try {
      const success = await updateProduct(editingProduct);
      console.log("Product update result:", success);

      setEditingProduct(null);
      setSuccessMessage("Product updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);

      refreshData(); // Trigger refresh
    } catch (err) {
      console.error("Error updating product:", err);
      setValidationError("Failed to update product. Please try again.");
    }
  };

  const confirmDelete = (id: number) => {
    console.log("Confirming delete for product ID:", id);
    setProductToDelete(id);
    setShowConfirmDelete(true);
  };

  const handleDeleteProduct = async () => {
    if (productToDelete === null) return;

    console.log("Deleting product ID:", productToDelete);

    try {
      const success = await deleteProduct(productToDelete);
      console.log("Product deletion result:", success);

      setShowConfirmDelete(false);
      setProductToDelete(null);
      setSuccessMessage("Product deleted successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);

      refreshData(); // Trigger refresh
    } catch (err) {
      console.error("Error deleting product:", err);
      setValidationError("Failed to delete product. Please try again.");
      setShowConfirmDelete(false);
    }
  };

  // Log products when they change
  useEffect(() => {
    if (!productsLoading && products.length > 0) {
      console.log("Products loaded:", products.length);
    }
  }, [products, productsLoading]);

  if (isLoading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="product-management">
      <h2>Product Management</h2>

      {validationError && (
        <div className="validation-error">{validationError}</div>
      )}

      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}

      {/* Add New Product Form */}
      <div className="form-section">
        <h3>Add New Product</h3>
        <form onSubmit={handleAddProduct} className="management-form">
          <div className="form-group">
            <label htmlFor="name">Product Name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={newProduct.name}
              onChange={handleInputChange}
              placeholder="Enter product name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="price">Price</label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={newProduct.price}
              onChange={handleInputChange}
              placeholder="Enter product price"
            />
          </div>

          <div className="form-group">
            <label htmlFor="category_id">Category</label>
            <select
              id="category_id"
              name="category_id"
              value={newProduct.category_id || ""}
              onChange={handleInputChange}
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="barcode">Barcode (Optional)</label>
            <input
              id="barcode"
              name="barcode"
              type="text"
              value={newProduct.barcode || ""}
              onChange={handleInputChange}
              placeholder="Enter product barcode"
            />
          </div>

          <div className="form-group">
            <label htmlFor="image">Image URL (Optional)</label>
            <input
              id="image"
              name="image"
              type="text"
              value={newProduct.image || ""}
              onChange={handleInputChange}
              placeholder="Enter image URL"
            />
          </div>

          <button type="submit" className="btn-primary">
            Add Product
          </button>
        </form>
      </div>

      {/* Products List */}
      <div className="data-section">
        <h3>Products ({products.length})</h3>

        {products.length === 0 ? (
          <p>No products found. Add your first product above.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Image</th>
                <th>Name</th>
                <th>Price</th>
                <th>Category</th>
                <th>Barcode</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td>
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="product-thumbnail"
                      />
                    ) : (
                      <div className="product-thumbnail placeholder">
                        {product.name.charAt(0)}
                      </div>
                    )}
                  </td>
                  <td>{product.name}</td>
                  <td>{format(product.price)}</td>
                  <td>{product.category || "None"}</td>
                  <td>{product.barcode || "N/A"}</td>
                  <td className="actions">
                    <button
                      onClick={() => setEditingProduct({ ...product })}
                      className="btn-edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => product.id && confirmDelete(product.id)}
                      className="btn-delete"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showConfirmDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this product?</p>
            <div className="modal-actions">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button onClick={handleDeleteProduct} className="btn-delete">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit Product</h3>
            <form onSubmit={handleUpdateProduct} className="management-form">
              <div className="form-group">
                <label htmlFor="edit-name">Product Name</label>
                <input
                  id="edit-name"
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-price">Price</label>
                <input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingProduct.price}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-category">Category</label>
                <select
                  id="edit-category"
                  value={editingProduct.category_id || ""}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      category_id: parseInt(e.target.value) || 0,
                    })
                  }
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="edit-barcode">Barcode</label>
                <input
                  id="edit-barcode"
                  type="text"
                  value={editingProduct.barcode || ""}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      barcode: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-image">Image URL</label>
                <input
                  id="edit-image"
                  type="text"
                  value={editingProduct.image || ""}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      image: e.target.value,
                    })
                  }
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
