import React, { useState, useEffect } from "react";
import { useProducts, useCategories } from "../../hooks/useDatabase";
import { Product } from "../../../electron/database";
import "./ProductManagement.css";

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

  const isLoading = productsLoading || categoriesLoading;
  const error = productsError || categoriesError;

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name.trim() || newProduct.price <= 0) {
      alert("Please enter a valid product name and price");
      return;
    }

    try {
      await addProduct(newProduct);
      setNewProduct({
        name: "",
        price: 0,
        category_id: 0,
        barcode: "",
        image: "",
      });
    } catch (err) {
      console.error("Error adding product:", err);
      alert("Failed to add product");
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !editingProduct ||
      !editingProduct.name.trim() ||
      editingProduct.price <= 0
    ) {
      alert("Please enter a valid product name and price");
      return;
    }

    try {
      await updateProduct(editingProduct);
      setEditingProduct(null);
    } catch (err) {
      console.error("Error updating product:", err);
      alert("Failed to update product");
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      await deleteProduct(id);
    } catch (err) {
      console.error("Error deleting product:", err);
      alert("Failed to delete product");
    }
  };

  if (isLoading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="product-management">
      <h2>Product Management</h2>

      {/* Add New Product Form */}
      <div className="form-section">
        <h3>Add New Product</h3>
        <form onSubmit={handleAddProduct} className="management-form">
          <div className="form-group">
            <label htmlFor="name">Product Name</label>
            <input
              id="name"
              type="text"
              value={newProduct.name}
              onChange={(e) =>
                setNewProduct({ ...newProduct, name: e.target.value })
              }
              required
              placeholder="Enter product name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="price">Price</label>
            <input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={newProduct.price}
              onChange={(e) =>
                setNewProduct({
                  ...newProduct,
                  price: parseFloat(e.target.value),
                })
              }
              required
              placeholder="Enter product price"
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={newProduct.category_id}
              onChange={(e) =>
                setNewProduct({
                  ...newProduct,
                  category_id: parseInt(e.target.value),
                })
              }
              required
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
              type="text"
              value={newProduct.barcode || ""}
              onChange={(e) =>
                setNewProduct({ ...newProduct, barcode: e.target.value })
              }
              placeholder="Enter product barcode"
            />
          </div>

          <div className="form-group">
            <label htmlFor="image">Image URL (Optional)</label>
            <input
              id="image"
              type="text"
              value={newProduct.image || ""}
              onChange={(e) =>
                setNewProduct({ ...newProduct, image: e.target.value })
              }
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
        <h3>Products</h3>

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
                  <td>${product.price.toFixed(2)}</td>
                  <td>{product.category || "None"}</td>
                  <td>{product.barcode || "N/A"}</td>
                  <td className="actions">
                    <button
                      onClick={() => setEditingProduct(product)}
                      className="btn-edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        product.id && handleDeleteProduct(product.id)
                      }
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
                  required
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
                      price: parseFloat(e.target.value),
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-category">Category</label>
                <select
                  id="edit-category"
                  value={editingProduct.category_id}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      category_id: parseInt(e.target.value),
                    })
                  }
                  required
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
