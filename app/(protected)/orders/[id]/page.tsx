import OrderDetailComponent from "@/components/order-detail-component";
import { getAuthSnapshot } from "@/lib/iron-session/auth/auth.actions";

const OrderDetailPage = async () => {
  const authSnapshot = await getAuthSnapshot();
  return (
    <OrderDetailComponent
      isAuthenticated={authSnapshot?.authenticated || false}
    />
  );
};

export default OrderDetailPage;
