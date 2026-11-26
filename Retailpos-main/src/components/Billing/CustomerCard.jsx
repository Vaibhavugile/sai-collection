
import "./CustomerCard.css";
import { useEffect, useRef, useState } from "react";
import { getCustomerByMobile } from "../../services/customerService";

import {
  FiUser,
  FiPhone,
  FiShoppingBag,
  FiTrendingUp,
  FiSearch,
  FiCheckCircle,
  FiUserPlus,
} from "react-icons/fi";

export default function CustomerCard({ customer, setCustomer }) {
  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");

  const lookupVersion = useRef(0);

  // Search customer when a valid mobile number is entered.
  useEffect(() => {
    const version = ++lookupVersion.current;

    if (mobile.length !== 10) {
      setLoading(false);
      setLookupError("");
      setName("");

      setCustomer({
        exists: false,
        mobile,
        name: "",
        totalOrders: 0,
        totalSpent: 0,
      });

      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setLookupError("");

        const data = await getCustomerByMobile(mobile);

        if (version !== lookupVersion.current) return;

        if (data) {
          setName(data.name || "");

          setCustomer({
            ...data,
            exists: true,
            mobile,
            name: data.name || "",
          });
        } else {
          setName("");

          setCustomer({
            exists: false,
            mobile,
            name: "",
            totalOrders: 0,
            totalSpent: 0,
          });
        }
      } catch (error) {
        console.error("Customer lookup failed:", error);

        if (version === lookupVersion.current) {
          setLookupError("Unable to search customer. Try again.");
        }
      } finally {
        if (version === lookupVersion.current) {
          setLoading(false);
        }
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [mobile, setCustomer]);

  // Keep manually entered customer name synchronized.
  useEffect(() => {
    setCustomer((prev) => ({
      ...(prev || {}),
      mobile,
      name,
    }));
  }, [mobile, name, setCustomer]);

  const isValidMobile = mobile.length === 10;

  const formatSpent = Number(customer?.totalSpent || 0).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );

  return (
    <section className="customer-card">

      {/* HEADER */}
      <div className="customer-card-header">
        <div className="customer-heading-left">
          <div className="customer-heading-icon">
            <FiUser />
          </div>

          <div>
            <h2>Customer Details</h2>
            <p>Identify or add a billing customer</p>
          </div>
        </div>

        <div className={`customer-status ${
          loading
            ? "searching"
            : customer?.exists
              ? "success"
              : isValidMobile
                ? "new"
                : "default"
        }`}>
          {loading ? (
            <>
              <span className="customer-status-loader" />
              Searching
            </>
          ) : customer?.exists ? (
            <>
              <FiCheckCircle />
              Existing Customer
            </>
          ) : isValidMobile ? (
            <>
              <FiUserPlus />
              New Customer
            </>
          ) : (
            <>
              <FiUser />
              Walk-in / New
            </>
          )}
        </div>
      </div>

      {/* FORM */}
      <div className="customer-form-grid">

        <div className="customer-form-group">
          <label>
            <FiPhone />
            Mobile Number
          </label>

          <div className="customer-input-wrap">
            <input
              type="tel"
              inputMode="numeric"
              placeholder="Enter 10-digit mobile"
              maxLength={10}
              value={mobile}
              onChange={(e) =>
                setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
            />

            {loading && (
              <span className="customer-input-indicator">
                <FiSearch />
              </span>
            )}

            {!loading && customer?.exists && (
              <span className="customer-input-indicator verified">
                <FiCheckCircle />
              </span>
            )}
          </div>

          <span className="customer-field-hint">
            {mobile.length}/10 digits
          </span>
        </div>

        <div className="customer-form-group">
          <label>
            <FiUser />
            Customer Name
          </label>

          <input
            type="text"
            placeholder={
              isValidMobile
                ? "Enter customer name"
                : "Enter mobile number first"
            }
            value={name}
            readOnly={Boolean(customer?.exists)}
            disabled={!isValidMobile}
            onChange={(e) => setName(e.target.value)}
          />

          <span className="customer-field-hint">
            {customer?.exists
              ? "Registered customer"
              : "Enter a name for a new customer"}
          </span>
        </div>

      </div>

      {lookupError && (
        <div className="customer-lookup-error">
          {lookupError}
        </div>
      )}

      {/* CUSTOMER STATISTICS */}
      <div className="customer-stats">

        <div className="customer-stat-item">
          <div className="customer-stat-icon orders">
            <FiShoppingBag />
          </div>

          <div>
            <span>Total Orders</span>
            <strong>{customer?.totalOrders || 0}</strong>
          </div>
        </div>

        <div className="customer-stat-divider" />

        <div className="customer-stat-item">
          <div className="customer-stat-icon spent">
            <FiTrendingUp />
          </div>

          <div>
            <span>Total Spent</span>
            <strong>₹{formatSpent}</strong>
          </div>
        </div>

      </div>

    </section>
  );
}
