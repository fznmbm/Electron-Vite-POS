import React, { useState, useEffect } from "react";
import { useReports } from "../../hooks/useDatabase";
import { useSettings } from "../../hooks/useSettings";
import "./ReportsPage.css";

const ReportsPage: React.FC = () => {
  const { getTopSellingProducts, getDailySales, getSalesByCategory } =
    useReports();
  const { settings } = useSettings();

  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [dailySales, setDailySales] = useState<any[]>([]);
  const [salesByCategory, setSalesByCategory] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<number>(30); // Default to 30 days
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load reports data
  useEffect(() => {
    const loadReportData = async () => {
      try {
        setLoading(true);

        // Load top selling products
        const topProductsData = await getTopSellingProducts(10);
        setTopProducts(topProductsData);

        // Load daily sales for the selected time range
        const dailySalesData = await getDailySales(timeRange);
        setDailySales(dailySalesData);

        // Load sales by category
        const salesByCategoryData = await getSalesByCategory();
        setSalesByCategory(salesByCategoryData);

        setError(null);
      } catch (err) {
        console.error("Error loading report data:", err);
        setError("Failed to load some report data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadReportData();
  }, [timeRange, getTopSellingProducts, getDailySales, getSalesByCategory]);

  // Format currency
  const formatCurrency = (value: number) => {
    return `${settings?.currencySymbol || "$"}${value.toFixed(2)}`;
  };

  // Update time range and reload data
  const handleTimeRangeChange = (days: number) => {
    setTimeRange(days);
  };

  if (loading) return <div className="loading">Loading reports...</div>;

  return (
    <div className="reports-page">
      <h2>Sales Reports</h2>

      <div className="time-range-selector">
        <button
          className={`time-range-button ${timeRange === 7 ? "active" : ""}`}
          onClick={() => handleTimeRangeChange(7)}
        >
          Last 7 Days
        </button>
        <button
          className={`time-range-button ${timeRange === 30 ? "active" : ""}`}
          onClick={() => handleTimeRangeChange(30)}
        >
          Last 30 Days
        </button>
        <button
          className={`time-range-button ${timeRange === 90 ? "active" : ""}`}
          onClick={() => handleTimeRangeChange(90)}
        >
          Last 90 Days
        </button>
      </div>

      <div className="reports-grid">
        {/* Top Selling Products */}
        <div className="report-card">
          <h3>Top Selling Products</h3>
          {topProducts.length === 0 ? (
            <div className="empty-state">No sales data available</div>
          ) : (
            <div className="product-ranking">
              {topProducts.map((product, index) => (
                <div key={product.id} className="ranking-item">
                  <div className="ranking-position">{index + 1}</div>
                  <div className="ranking-content">
                    <div className="ranking-name">{product.name}</div>
                    <div className="ranking-quantity">
                      {product.total_quantity} sold
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Daily Sales */}
        <div className="report-card">
          <h3>Daily Sales - Last {timeRange} Days</h3>
          {dailySales.length === 0 ? (
            <div className="empty-state">No sales data available</div>
          ) : (
            <div className="daily-sales">
              <div className="daily-sales-header">
                <span>Date</span>
                <span>Orders</span>
                <span>Total</span>
              </div>
              <div className="daily-sales-list">
                {dailySales.map((day) => (
                  <div key={day.date} className="daily-sales-item">
                    <div className="sales-date">
                      {new Date(day.date).toLocaleDateString()}
                    </div>
                    <div className="sales-orders">{day.order_count}</div>
                    <div className="sales-total">
                      {formatCurrency(day.total_sales)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="daily-sales-summary">
                <div>
                  Total Orders:{" "}
                  {dailySales.reduce((sum, day) => sum + day.order_count, 0)}
                </div>
                <div>
                  Total Sales:{" "}
                  {formatCurrency(
                    dailySales.reduce((sum, day) => sum + day.total_sales, 0)
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sales by Category */}
        <div className="report-card">
          <h3>Sales by Category</h3>
          {salesByCategory.length === 0 ? (
            <div className="empty-state">No category sales data available</div>
          ) : (
            <div className="category-sales">
              <div className="category-sales-header">
                <span>Category</span>
                <span>Sales</span>
              </div>
              <div className="category-sales-list">
                {salesByCategory.map((category) => (
                  <div key={category.category} className="category-sales-item">
                    <div className="category-name">{category.category}</div>
                    <div className="category-total">
                      {formatCurrency(category.total_sales)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="category-sales-summary">
                <div>
                  Total:{" "}
                  {formatCurrency(
                    salesByCategory.reduce(
                      (sum, category) => sum + category.total_sales,
                      0
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default ReportsPage;
