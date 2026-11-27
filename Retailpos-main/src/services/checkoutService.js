
import { runTransaction } from "firebase/firestore";
import { db } from "../firebase";

import {
  getInvoiceSettingsRef,
  buildNextInvoice,
} from "./invoiceService";

import {
  getCustomerRef,
  buildCustomerDocument,
  buildCustomerPurchaseUpdate,
} from "./customerService";

import {
  buildSaleDocument,
  getSaleRef,
} from "./salesService";

import {
  getPaymentRef,
  buildPaymentDocument,
} from "./paymentService";

import {
  getProductRef,
  getInventoryHistoryRef,
  prepareStockUpdate,
} from "./inventoryService";

import {
  getDailyReportRef,
  buildNewDailyReport,
  buildUpdatedDailyReport,
} from "./reportService";

export const completeSale = async ({
  cart,
  customer,
  billSummary,
  paymentMethod,
  receivedAmount,
  cashier = "Administrator",
  reservedInvoiceNumber = "",
}) => {

  /*
  ======================================
  VALIDATION
  ======================================
  */

  if (!cart || !cart.length) {
    throw new Error("Cart is empty.");
  }

  if (!customer?.mobile) {
    throw new Error("Customer mobile number is required.");
  }

  if (String(customer.mobile).length !== 10) {
    throw new Error("Customer mobile number is invalid.");
  }

  if (!customer?.name?.trim()) {
    throw new Error("Customer name is required.");
  }

  if (
    paymentMethod === "cash" &&
    Number(receivedAmount) < Number(billSummary?.grandTotal || 0)
  ) {
    throw new Error(
      "Received amount is less than Grand Total."
    );
  }

  return await runTransaction(
    db,
    async (transaction) => {

      /*
      ======================================
      READ EVERYTHING FIRST
      ======================================
      */

      // INVOICE SETTINGS

      const invoiceRef = getInvoiceSettingsRef();

      const invoiceSnap = await transaction.get(invoiceRef);

      if (!invoiceSnap.exists()) {
        throw new Error("Invoice settings not found.");
      }

      const generatedInvoice = buildNextInvoice(
        invoiceSnap.data()
      );

      const invoiceNumber =
        reservedInvoiceNumber || generatedInvoice.invoiceNumber;

      const nextNumber = generatedInvoice.nextNumber;

      /*
      ======================================
      CHECK DUPLICATE INVOICE
      ======================================
      */

      const saleRef = getSaleRef(invoiceNumber);

      const existingSaleSnap = await transaction.get(saleRef);

      if (existingSaleSnap.exists()) {
        throw new Error(
          `Invoice ${invoiceNumber} has already been used. Please reserve a new invoice number.`
        );
      }

      /*
      ======================================
      CUSTOMER
      ======================================
      */

      const customerRef = getCustomerRef(customer.mobile);

      const customerSnap = await transaction.get(customerRef);

      let customerData;

      if (!customerSnap.exists()) {

        customerData = buildCustomerDocument({
          mobile: customer.mobile,
          name: customer.name,
          firstPurchaseAmount: billSummary.grandTotal,
        });

      } else {

        customerData = customerSnap.data();

      }

      /*
      ======================================
      PRODUCTS
      ======================================
      */

      const productSnapshots = [];

      for (const item of cart) {

        const productRef = getProductRef(item.productId);

        const productSnap = await transaction.get(productRef);

        if (!productSnap.exists()) {
          throw new Error(
            `${item.productName} not found.`
          );
        }

        productSnapshots.push({
          item,
          productRef,
          product: productSnap.data(),
        });

      }

      /*
      ======================================
      DAILY REPORT
      ======================================
      */

      const reportRef = getDailyReportRef();

      const reportSnap = await transaction.get(reportRef);

      /*
      ======================================
      BUILD SALE
      ======================================
      */

      const sale = buildSaleDocument({
        invoiceNumber,

        customer: {
          mobile: customer.mobile,
          name: customer.name,
        },

        cart,
        billSummary,
        paymentMethod,
        receivedAmount,
        cashier,
      });

      /*
      ======================================
      BUILD PAYMENT
      ======================================
      */

      const payment = buildPaymentDocument({
        invoiceNumber,
        paymentMethod,
        grandTotal: sale.grandTotal,
        receivedAmount,
        changeAmount: sale.changeAmount,
      });

      /*
      ======================================
      PREPARE CUSTOMER UPDATE
      ======================================
      */

      let customerOperation = null;

      if (!customerSnap.exists()) {

        customerOperation = {
          type: "create",
          data: customerData,
        };

      } else {

        customerOperation = {
          type: "update",

          data: buildCustomerPurchaseUpdate({
            customer: customerData,
            billAmount: sale.grandTotal,
          }),
        };

      }

      /*
      ======================================
      PREPARE STOCK UPDATES
      ======================================
      */

      const stockOperations = [];

      for (const productInfo of productSnapshots) {

        const {
          item,
          product,
          productRef,
        } = productInfo;

        const {
          updatedProduct,
          history,
        } = prepareStockUpdate(
          product,
          item
        );

        stockOperations.push({
          productRef,
          updatedProduct,

          history: {
            invoiceNumber,
            cashier,
            ...history,
          },
        });

      }

      /*
      ======================================
      PREPARE DAILY REPORT
      ======================================
      */

      const totalProfit = sale.totalProfit;
      const totalItems = sale.totalQuantity;

      let reportOperation;

      if (!reportSnap.exists()) {

        reportOperation = {
          type: "create",

          data: buildNewDailyReport({
            grandTotal: sale.grandTotal,
            totalProfit,
            paymentMethod,
            totalItems,
          }),
        };

      } else {

        reportOperation = {
          type: "update",

          data: buildUpdatedDailyReport({
            report: reportSnap.data(),
            grandTotal: sale.grandTotal,
            totalProfit,
            paymentMethod,
            totalItems,
          }),
        };

      }

      /*
      ======================================
      UPDATE INVOICE COUNTER
      ======================================
      */

      // If Print already reserved the invoice number,
      // do not increment the counter again.
      //
      // Otherwise, generate the next number here.

      if (!reservedInvoiceNumber) {

        transaction.update(invoiceRef, {
          lastNumber: nextNumber,
        });

      }

      /*
      ======================================
      SAVE CUSTOMER
      ======================================
      */

      if (customerOperation.type === "create") {

        transaction.set(
          customerRef,
          customerOperation.data
        );

      } else {

        transaction.update(
          customerRef,
          customerOperation.data
        );

      }

      /*
      ======================================
      UPDATE PRODUCTS
      ======================================
      */

      for (const operation of stockOperations) {

        transaction.update(
          operation.productRef,
          operation.updatedProduct
        );

      }

      /*
      ======================================
      SAVE INVENTORY HISTORY
      ======================================
      */

      for (const operation of stockOperations) {

        transaction.set(
          getInventoryHistoryRef(),
          operation.history
        );

      }

      /*
      ======================================
      SAVE SALE
      ======================================
      */

      transaction.set(
        saleRef,
        sale
      );

      /*
      ======================================
      SAVE PAYMENT
      ======================================
      */

      transaction.set(
        getPaymentRef(invoiceNumber),
        payment
      );

      /*
      ======================================
      UPDATE DAILY REPORT
      ======================================
      */

      if (reportOperation.type === "create") {

        transaction.set(
          reportRef,
          reportOperation.data
        );

      } else {

        transaction.update(
          reportRef,
          reportOperation.data
        );

      }

      /*
      ======================================
      TRANSACTION COMPLETE
      ======================================
      */

      return {
        success: true,
        invoiceNumber,
        sale,
        payment,
      };

    }
  );
};
