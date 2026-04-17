import CartClientComponent from "@/components/cart-client-component";
import { getAuthSnapshot } from "@/lib/iron-session/auth/auth.actions";
import { getSessionData } from "@/lib/iron-session/session.actions";

const CartPage = async () => {
  const sessionData = await getSessionData();
  const authSnapshot = await getAuthSnapshot();
  return (
    <CartClientComponent
      isAuthenticated={authSnapshot?.authenticated || false}
      locationId={sessionData?.locationId || ""}
      userId={authSnapshot?.user?.id || ""}
    />
  );
};

export default CartPage;
