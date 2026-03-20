/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import axios from "../../../../api/axios";
import { DASHBOARD_FRAUD_ALERTS_URL } from "../../../../api/api_routing_urls";
import Dashboard from "../../../dashboard-components/dashboard.component";
import GenericModal from "../../../../reusable-components/modals/GenericModal.component";
import { FraudAlertCard, FraudAlertDetailsContent } from "../../../../reusable-components/FraudAlertCard/FraudAlertCard";
import { FaExclamationTriangle } from "react-icons/fa";
import { FiAlertTriangle } from "react-icons/fi";

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchFraudAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.append("limit", "100");
      params.append("type", "all");
      params.append("status", "active");

      const response = await axios.get(
        `${DASHBOARD_FRAUD_ALERTS_URL}?${params.toString()}`
      );

      if (response.data?.status === "success" && response.data?.data) {
        setAlerts(response.data.data.alerts || []);
      } else {
        setAlerts([]);
      }
    } catch (err) {
      console.error("Error fetching fraud alerts:", err);
      setError(
        err.code === "ERR_NETWORK" || err.message?.includes("Network Error")
          ? "Unable to connect to server. Please ensure the backend is running."
          : "Failed to load fraud detection alerts."
      );
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFraudAlerts();
  }, []);

  const handleDismiss = () => {
    setShowModal(false);
    setSelectedAlert(null);
    fetchFraudAlerts();
  };

  return (
    <Dashboard sidebarType="System Admin">
      <div className="p-6 bg-slate-50 min-h-screen">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">
            Fraud Detection Alerts
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            All alerts raised by fraud detection. Click an alert for details.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#d85a30]" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-8 bg-white border border-gray-200 rounded-lg text-center text-slate-500">
            <p className="text-lg">No active fraud detection alerts.</p>
            <p className="text-sm mt-2">
              Alerts will appear here when duplicate applications or ineligibility
              issues are detected.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <FraudAlertCard
                key={alert.alertId || alert._id || index}
                alert={alert}
                index={index}
                onCardClick={(a) => {
                  setSelectedAlert(a);
                  setShowModal(true);
                }}
              />
            ))}
          </div>
        )}

        {showModal && selectedAlert && (
          <GenericModal
            open={showModal}
            setOpen={(value) => {
              setShowModal(value);
              if (!value) setSelectedAlert(null);
            }}
            title={
              <div className="flex items-center gap-2">
                {selectedAlert.type === "duplicate" ? (
                  <FiAlertTriangle className="text-[#68d388]" size={24} />
                ) : (
                  <FaExclamationTriangle className="text-red-600" size={24} />
                )}
                <span>
                  {selectedAlert.title ||
                    (selectedAlert.type === "duplicate"
                      ? "Duplicate Application"
                      : "Ineligible Claim")}
                </span>
              </div>
            }
          >
            <FraudAlertDetailsContent
              alert={selectedAlert}
              onDismiss={handleDismiss}
            />
          </GenericModal>
        )}
      </div>
    </Dashboard>
  );
};

export default Alerts;
