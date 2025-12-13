import Dashboard from "../../dashboard-components/dashboard.component";

const UserApplicationTracker = () => {
  return (
    <>
      <Dashboard sidebarType="Public User">
        <section className="bg-white p-5">
          <h3 className="text-lg font-semibold mb-4">
            Application Status Tracker
          </h3>

          <div className="rounded-md shadow p-5 mt-6">
            <table className="w-full text-base">
              <thead className="text-left text-slate-500">
                <tr>
                  <th>Scheme</th>
                  <th>Status</th>
                  <th>Date Applied</th>
                  <th>Action</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                <tr className="border-t border-gray-400">
                  <td className="py-5">Child Care Assistance Program</td>
                  <td>
                    <div className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs w-28 text-center">
                      Under Review
                    </div>
                  </td>
                  <td>15-08-2025</td>
                  <td className="text-blue-600 cursor-pointer">View Details</td>
                </tr>

                <tr className="border-t border-gray-200">
                  <td className="py-5">Maternity Support Scheme</td>
                  <td>
                    <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs w-28 text-center">
                      Approved
                    </div>
                  </td>
                  <td>20-07-2024</td>
                  <td className="text-blue-600 cursor-pointer">View Details</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </Dashboard>
    </>
  );
};

export default UserApplicationTracker;
