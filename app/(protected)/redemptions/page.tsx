import MyRedemptionsPageComponent from "@/components/my-redemptions-component";
import { getAuthSnapshot } from "@/lib/iron-session/auth/auth.actions";

const RedemptionsPage = async () => {
  const authSnapshot = await getAuthSnapshot();
  return (
    <MyRedemptionsPageComponent
      isAuthenticated={authSnapshot?.authenticated || false}
    />
  );
};

export default RedemptionsPage;
