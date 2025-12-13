import { useEffect, useState } from "react";

import Dashboard from "../../dashboard-components/dashboard.component";

import { getStoredUser } from "../../../utils/user.utils";

export default function UserProfile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  if (!user) return null;

  return (
    <>
      <Dashboard sidebarType="Public User">
        <section className="bg-slate-50 rounded-md shadow p-5 mb-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-slate-200 flex items-center justify-center text-xl font-semibold">
              {user.fullName?.charAt(0).toUpperCase()}
            </div>

            <div>
              <h2 className="text-lg font-semibold">{user.fullName}</h2>
              <p className="text-sm text-slate-500">
                Aadhaar: **** **** {user.aadhaar?.slice(-4)}
              </p>
              <span className="inline-block mt-2 px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                Eligible: Economically Weaker Section
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 text-sm">
            <p>
              <b>Email:</b> {user.contactEmail}
            </p>
            <p>
              <b>Phone:</b> {user.phoneNumber}
            </p>
            <p>
              <b>Gender:</b>{" "}
              {user.gender?.charAt(0).toUpperCase() + user.gender.slice(1)}
            </p>
            <p>
              <b>Date of Birth:</b> {user.dob}
            </p>
            <p>
              <b>Address:</b> {user.address}
            </p>
          </div>
        </section>
      </Dashboard>
    </>
  );
}
