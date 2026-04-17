import ProfileComponent from "@/components/profile-component";
import { getAuthSnapshot } from "@/lib/iron-session/auth/auth.actions";
import React from "react";

const ProfilePage = async () => {
  const authSnapshot = await getAuthSnapshot();

  return <ProfileComponent authSnapshot={authSnapshot} />;
};

export default ProfilePage;
