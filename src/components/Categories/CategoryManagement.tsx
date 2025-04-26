import React, { useState } from "react";
import { useCategories } from "../../hooks/useDatabase";
import { Category } from "../../../electron/database";
import "../Settings/Settings.css";
import { useRefresh } from "../../contexts/RefreshContext";

const CategoryManagement: React.FC = () => {
  const {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useCategories();

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState<Category>({
    name: "",
    display_order: 0,
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  const { refreshData } = useRefresh();

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    // Manual validation instead of relying on HTML5 required attribute
    if (!newCategory.name.trim()) {
      setValidationError("Category name is required");

      // Create a completely new object to reset the form state
      // This is the key part that helps avoid the "inputs becoming uneditable" issue
      setNewCategory({
        name: "",
        display_order: 0,
      });

      // Focus the name input after a small delay to allow React to update the DOM
      setTimeout(() => {
        const nameInput = document.getElementById("name");
        if (nameInput) {
          nameInput.focus();
        }
      }, 10);

      return;
    }

    // Clear any previous validation error
    setValidationError(null);

    try {
      await addCategory(newCategory);

      // Create a new object instance rather than modifying the existing one
      setNewCategory({
        name: "",
        display_order: 0,
      });

      refreshData(); // Trigger refresh
    } catch (err) {
      console.error("Error adding category:", err);
      // Use a non-blocking notification instead of alert
      setValidationError("Failed to add category. Please try again.");
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    // Manual validation
    if (!editingCategory || !editingCategory.name.trim()) {
      // For the editing modal, we can just return without resetting since we'll close the modal
      return;
    }

    try {
      await updateCategory(editingCategory);
      setEditingCategory(null);
      refreshData(); // Trigger refresh
    } catch (err) {
      console.error("Error updating category:", err);
      // Use a non-blocking notification
      setValidationError("Failed to update category. Please try again.");
    }
  };

  const handleDeleteCategory = async (id: number) => {
    // Implement a custom confirm dialog if needed instead of using window.confirm
    try {
      await deleteCategory(id);
      refreshData(); // Trigger refresh
    } catch (err) {
      console.error("Error deleting category:", err);
      setValidationError("Failed to delete category. Please try again.");
    }
  };

  // Show confirm dialog component
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);

  const confirmDelete = (id: number) => {
    setCategoryToDelete(id);
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (categoryToDelete !== null) {
      try {
        await deleteCategory(categoryToDelete);
        refreshData();
        setShowConfirmDelete(false);
        setCategoryToDelete(null);
      } catch (err) {
        console.error("Error deleting category:", err);
        setValidationError("Failed to delete category. Please try again.");
      }
    }
  };

  if (loading) return <div className="loading">Loading categories...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="category-management">
      <h2>Category Management</h2>

      {/* Validation error message */}
      {validationError && (
        <div className="validation-error">{validationError}</div>
      )}

      {/* Add New Category Form */}
      <div className="form-section">
        <h3>Add New Category</h3>
        <form onSubmit={handleAddCategory} className="settings-form">
          <div className="form-group">
            <label htmlFor="name">Category Name</label>
            <input
              id="name"
              type="text"
              value={newCategory.name}
              onChange={(e) =>
                setNewCategory({ ...newCategory, name: e.target.value })
              }
              // Remove required attribute to use our manual validation
              placeholder="Enter category name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="order">Display Order</label>
            <input
              id="order"
              type="number"
              value={newCategory.display_order}
              onChange={(e) =>
                setNewCategory({
                  ...newCategory,
                  display_order: parseInt(e.target.value),
                })
              }
              min="0"
            />
          </div>

          <button type="submit" className="btn-primary">
            Add Category
          </button>
        </form>
      </div>

      {/* Categories List */}
      <div className="data-section">
        <h3>Categories</h3>

        {categories.length === 0 ? (
          <p>No categories found. Add your first category above.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Display Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>{category.id}</td>
                  <td>{category.name}</td>
                  <td>{category.display_order}</td>
                  <td className="actions">
                    <button
                      onClick={() => setEditingCategory(category)}
                      className="btn-edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => category.id && confirmDelete(category.id)}
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
            <p>
              Are you sure you want to delete this category? This will affect
              all products in this category.
            </p>
            <div className="modal-actions">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button onClick={handleConfirmDelete} className="btn-delete">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit Category</h3>
            <form onSubmit={handleUpdateCategory} className="settings-form">
              <div className="form-group">
                <label htmlFor="edit-name">Category Name</label>
                <input
                  id="edit-name"
                  type="text"
                  value={editingCategory.name}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      name: e.target.value,
                    })
                  }
                  // Remove required attribute
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-order">Display Order</label>
                <input
                  id="edit-order"
                  type="number"
                  value={editingCategory.display_order}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      display_order: parseInt(e.target.value),
                    })
                  }
                  min="0"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
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

export default CategoryManagement;
