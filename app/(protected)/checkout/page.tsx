import CheckoutClientComponent from "@/components/checkout-client-component";
import { getAuthSnapshot } from "@/lib/iron-session/auth/auth.actions";
import { getSessionData } from "@/lib/iron-session/session.actions";

const CheckoutPage = async () => {
  const sessionData = await getSessionData();
  const authSnapshot = await getAuthSnapshot();
  return (
    <CheckoutClientComponent
      isAuthenticated={authSnapshot?.authenticated || false}
      defaultAddressId={authSnapshot?.defaultAddressId || ""}
      user={{
        name: authSnapshot?.user?.name || "",
        phone: authSnapshot?.user?.phone || "",
      }}
      locationId={sessionData?.locationId || ""}
    />
  );
};

export default CheckoutPage;
