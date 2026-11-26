
import "./BillingHeader.css";
import { useEffect, useState } from "react";

import {
  FiShoppingBag,
  FiFileText,
  FiCalendar,
  FiClock,
  FiUser,
} from "react-icons/fi";

export default function BillingHeader({
  invoiceNumber = "",
  cashierName = "Administrator",
  logoSrc = "/assets/logo.png",
}) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const currentDate = currentTime.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const currentClock = currentTime.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const details = [
    {
      label: "Invoice Number",
      value: invoiceNumber || "New Invoice",
      icon: <FiFileText />,
      className: "invoice",
    },
    {
      label: "Date",
      value: currentDate,
      icon: <FiCalendar />,
      className: "date",
    },
    {
      label: "Current Time",
      value: currentClock,
      icon: <FiClock />,
      className: "time",
    },
    {
      label: "Cashier",
      value: cashierName,
      icon: <FiUser />,
      className: "cashier",
    },
  ];

  return (
    <header className="billing-header">

      {/* BRAND SECTION */}
      <div className="billing-brand-section">

        <div className="billing-brand-logo">
          <img
            src={logoSrc}
            alt="Sai Collection Logo"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />

          <span className="billing-logo-fallback">साई</span>
        </div>

        <div className="billing-brand-content">
          <div className="billing-brand-name">
            Sai Collection
          </div>

          <div className="billing-brand-location">
            LATUR · MAHARASHTRA
          </div>

          <div className="billing-brand-divider" />

          <div className="billing-page-title">
            <FiShoppingBag />
            <h1>Retail POS Billing</h1>
          </div>

          <p>
            Scan products, manage customers and complete sales effortlessly.
          </p>
        </div>

      </div>

      {/* BILLING INFORMATION */}
      <div className="billing-header-details">

        {details.map((item) => (
          <div
            className={`billing-info-card ${item.className}`}
            key={item.label}
          >
            <div className="billing-info-icon">
              {item.icon}
            </div>

            <div className="billing-info-content">
              <span>{item.label}</span>
              <strong title={String(item.value)}>
                {item.value}
              </strong>
            </div>
          </div>
        ))}

      </div>

    </header>
  );
}
