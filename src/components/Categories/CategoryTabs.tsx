import React from "react";
import "./CategoryTabs.css";

interface CategoryTabsProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="category-tabs">
      <button
        className={`category-tab ${selectedCategory === "all" ? "active" : ""}`}
        onClick={() => onSelectCategory("all")}
      >
        All
      </button>

      {categories.map((category) => (
        <button
          key={category}
          className={`category-tab ${
            selectedCategory === category ? "active" : ""
          }`}
          onClick={() => onSelectCategory(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
};

export default CategoryTabs;
