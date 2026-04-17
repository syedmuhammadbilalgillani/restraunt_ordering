import AddressesPageComponent from "@/components/address-page-component";
import { getAuthSnapshot } from "@/lib/iron-session/auth/auth.actions";

const AddressPage = async () => {
  const authSnapshot = await getAuthSnapshot();
  return (
    <AddressesPageComponent
      isAuthenticated={authSnapshot?.authenticated || false}
    />
  );
};

export default AddressPage;
