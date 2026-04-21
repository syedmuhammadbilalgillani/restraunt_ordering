import EditProfileComponent from "@/components/edit-profile-component";
import {
  getAuthSnapshot
} from "@/lib/iron-session/auth/auth.actions";

const EditProfilePage = async () => {
  const authSnapshot = await getAuthSnapshot();


  return (
    <EditProfileComponent
      isAuthenticated={authSnapshot?.authenticated || false}
      user={
        authSnapshot?.user || {
          id: "",
          name: "",
          email: "",
          phone: "",
          address: "",
        }
      }
    />
  );
};

export default EditProfilePage;
