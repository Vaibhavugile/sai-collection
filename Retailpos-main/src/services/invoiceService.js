
import {
  doc,
  runTransaction,
} from "firebase/firestore";

import { db } from "../firebase";

export const getInvoiceSettingsRef = () => {
  return doc(db, "settings", "invoice");
};

export const buildNextInvoice = (invoiceSettings) => {
  const prefix = invoiceSettings.prefix || "INV";
  const padding = invoiceSettings.padding || 6;

  const nextNumber =
    Number(invoiceSettings.lastNumber || 0) + 1;

  const invoiceNumber =
    `${prefix}-${String(nextNumber).padStart(padding, "0")}`;

  return {
    invoiceNumber,
    nextNumber,
  };
};

// Reserve an invoice number immediately and safely.
// Repeated Print clicks should reuse the number stored in React state.
export const reserveNextInvoice = async () => {
  return await runTransaction(db, async (transaction) => {
    const invoiceRef = getInvoiceSettingsRef();
    const invoiceSnap = await transaction.get(invoiceRef);

    if (!invoiceSnap.exists()) {
      throw new Error("Invoice settings not found.");
    }

    const { invoiceNumber, nextNumber } =
      buildNextInvoice(invoiceSnap.data());

    transaction.update(invoiceRef, {
      lastNumber: nextNumber,
    });

    return invoiceNumber;
  });
};
