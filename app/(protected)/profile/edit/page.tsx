import EditProfileComponent from "@/components/edit-profile-component";
import {
  getAuthSnapshot,
  updateProfileAction,
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
      updateProfile={async (data) => {
        await updateProfileAction(data.name);
      }}
    />
  );
};

export default EditProfilePage;
