import ProductTable from "../components/ProductTable";
import ActivityLog from "../components/ActivityLog";

export default function UserDashboard() {
  return (
    <>
      <ProductTable />

      <ActivityLog
        entityType="Product"
        title="Product Activity"
      />
    </>
  );
}