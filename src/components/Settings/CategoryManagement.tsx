import React, { useState } from "react";
import { useCategories } from "../../hooks/useDatabase";
import { Category } from "../../../electron/database";
import "./Settings.css";

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

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;

    try {
      await addCategory(newCategory);
      setNewCategory({ name: "", display_order: 0 });
    } catch (err) {
      console.error("Error adding category:", err);
      alert("Failed to add category");
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name.trim()) return;

    try {
      await updateCategory(editingCategory);
      setEditingCategory(null);
    } catch (err) {
      console.error("Error updating category:", err);
      alert("Failed to update category");
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this category? This will affect all products in this category."
      )
    ) {
      return;
    }

    try {
      await deleteCategory(id);
    } catch (err) {
      console.error("Error deleting category:", err);
      alert("Failed to delete category");
    }
  };

  if (loading) return <div className="loading">Loading categories...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="category-management">
      <h2>Category Management</h2>

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
              required
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
                      onClick={() =>
                        category.id && handleDeleteCategory(category.id)
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
                  required
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
