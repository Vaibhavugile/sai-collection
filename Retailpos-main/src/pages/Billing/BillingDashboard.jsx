
import "./BillingDashboard.css";

import { useEffect, useMemo, useState, useCallback } from "react";

import BillingHeader from "../../components/Billing/BillingHeader";
import CustomerCard from "../../components/Billing/CustomerCard";
import ProductSearch from "../../components/Billing/ProductSearch";
import CartTable from "../../components/Billing/CartTable";
import BillSummary from "../../components/Billing/BillSummary";
import PaymentSection from "../../components/Billing/PaymentSection";
import ThermalReceipt from "../../components/Billing/ThermalReceipt";
import SaleSuccessModal from "../../components/Billing/SaleSuccessModal";

import { getBillingSettings } from "../../services/billingSettingsService";
import { reserveNextInvoice } from "../../services/invoiceService";
import { calculateBill } from "../../utils/billingCalculator";

export default function BillingDashboard() {
  const [customer, setCustomer] = useState(null);
  const [cart, setCart] = useState([]);
  const [billDiscount, setBillDiscount] = useState(0);

  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [receivedAmount, setReceivedAmount] = useState("");

  // Invoice number reserved for the current bill.
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [isReservingInvoice, setIsReservingInvoice] = useState(false);

  const [successModal, setSuccessModal] = useState({
    open: false,
    invoiceNumber: "",
    total: 0,
  });

  const [billingSettings, setBillingSettings] = useState({
    gstEnabled: false,
    gstPercentage: 0,
    discountEnabled: true,
    allowItemDiscount: true,
    allowBillDiscount: true,
    roundOff: false,
    currency: "INR",
    currencySymbol: "₹",
    taxInclusive: false,
  });

  useEffect(() => {
    const loadBillingSettings = async () => {
      try {
        const settings = await getBillingSettings();

        if (settings) {
          setBillingSettings((previous) => ({
            ...previous,
            ...settings,
          }));
        }
      } catch (error) {
        console.error("Failed to load billing settings:", error);
      }
    };

    loadBillingSettings();
  }, []);

  const billSummary = useMemo(() => {
    return calculateBill({
      cart,
      billDiscount,
      billingSettings,
    });
  }, [cart, billDiscount, billingSettings]);

  /**
   * Reserve the next invoice number.
   *
   * If this bill already has a reserved invoice number,
   * return the same number instead of reserving another one.
   */
  const handleReserveInvoice = useCallback(async () => {
    if (invoiceNumber) {
      return invoiceNumber;
    }

    if (isReservingInvoice) {
      throw new Error("Invoice number reservation is already in progress.");
    }

    setIsReservingInvoice(true);

    try {
      const reservedNumber = await reserveNextInvoice();

      if (!reservedNumber) {
        throw new Error("Could not reserve an invoice number.");
      }

      setInvoiceNumber(reservedNumber);

      return reservedNumber;
    } catch (error) {
      console.error("Invoice reservation failed:", error);
      throw error;
    } finally {
      setIsReservingInvoice(false);
    }
  }, [invoiceNumber, isReservingInvoice]);

  /**
   * Called only after the sale has been successfully completed.
   */
  const handleSaleCompleted = (result) => {
    const completedInvoiceNumber =
      result?.invoiceNumber || invoiceNumber;

    const completedTotal = Number(
      result?.sale?.grandTotal ??
      billSummary.grandTotal ??
      0
    );

    // Reset the current bill.
    setCart([]);
    setCustomer(null);
    setBillDiscount(0);

    // Reset payment fields.
    setPaymentMethod("cash");
    setReceivedAmount("");

    // Release the current invoice number from the UI.
    setInvoiceNumber("");

    // Show success popup.
    setSuccessModal({
      open: true,
      invoiceNumber: completedInvoiceNumber,
      total: completedTotal,
    });
  };

  const closeSuccessModal = () => {
    setSuccessModal({
      open: false,
      invoiceNumber: "",
      total: 0,
    });
  };

  return (
    <div className="billing-page">
      <BillingHeader
        invoiceNumber={invoiceNumber}
        cashierName="Administrator"
        logoSrc="/assets/sai-collection-logo.png"
      />

      <div className="billing-container">
        <div className="billing-left">
          <CustomerCard
            customer={customer}
            setCustomer={setCustomer}
          />

          <ProductSearch
            cart={cart}
            setCart={setCart}
          />
        </div>

        <div className="billing-right">
          <CartTable
            cart={cart}
            setCart={setCart}
          />

          <BillSummary
            cart={cart}
            billSummary={billSummary}
            billingSettings={billingSettings}
            billDiscount={billDiscount}
            setBillDiscount={setBillDiscount}
          />

          <PaymentSection
            cart={cart}
            customer={customer}
            billSummary={billSummary}
            cashier="Administrator"
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            receivedAmount={receivedAmount}
            setReceivedAmount={setReceivedAmount}
            invoiceNumber={invoiceNumber}
            onReserveInvoice={handleReserveInvoice}
            onSaleCompleted={handleSaleCompleted}
          />
        </div>
      </div>

      {/* Thermal receipt: displayed for printing only. */}
      <ThermalReceipt
        cart={cart}
        customer={customer}
        billSummary={billSummary}
        paymentMethod={paymentMethod}
        receivedAmount={receivedAmount}
        cashier="Administrator"
        invoiceNumber={invoiceNumber || "Pending"}
        storeName="SAI COLLECTION"
       storeAddress="Hiras Complex, Opposite Warana Agency, Main Kapad Line, Latur - 413512"
        storePhone="9271747777 / 8180918191"
        logo="/assets/sai-collection-logo.png"
      />

      <SaleSuccessModal
        open={successModal.open}
        invoiceNumber={successModal.invoiceNumber}
        total={successModal.total}
        onClose={closeSuccessModal}
      />
    </div>
  );
}
