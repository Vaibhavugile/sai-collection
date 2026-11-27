
/**
 * =========================================================
 * SAI COLLECTION - SHARED THERMAL PRINT SERVICE
 * 80MM XP-80C THERMAL PRINTER
 * DYNAMIC CONTENT-BASED PAPER HEIGHT
 * =========================================================
 *
 * Usage:
 * const printWindow = window.open("", "_blank", "width=420,height=800");
 * await printThermalReceiptInWindow(printWindow);
 *
 * IMPORTANT:
 * Open the print window synchronously inside the button click
 * before awaiting any asynchronous operation.
 */

export async function printThermalReceiptInWindow(printWindow) {
  if (!printWindow || printWindow.closed) {
    throw new Error("Print window is not available.");
  }

  const receipt = document.getElementById("thermal-receipt");

  if (!receipt) {
    throw new Error("Thermal receipt not found.");
  }

  const receiptClone = receipt.cloneNode(true);
  const printDocument = printWindow.document;

  // ---------------------------------------------------------
  // INITIALIZE PRINT DOCUMENT
  // ---------------------------------------------------------

  printDocument.open();

  printDocument.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
        <title>Sai Collection - Thermal Receipt</title>
      </head>
      <body></body>
    </html>
  `);

  printDocument.close();

  // ---------------------------------------------------------
  // COPY APPLICATION STYLESHEETS
  // ---------------------------------------------------------

  const stylesheetPromises = [];

  document
    .querySelectorAll('link[rel="stylesheet"]')
    .forEach((link) => {
      const clonedLink = printDocument.createElement("link");

      clonedLink.rel = "stylesheet";
      clonedLink.href = link.href;

      stylesheetPromises.push(
        new Promise((resolve) => {
          clonedLink.onload = resolve;
          clonedLink.onerror = resolve;

          setTimeout(resolve, 2500);
        })
      );

      printDocument.head.appendChild(clonedLink);
    });

  // ---------------------------------------------------------
  // COPY INLINE STYLES
  // ---------------------------------------------------------

  document.querySelectorAll("style").forEach((style) => {
    const clonedStyle = printDocument.createElement("style");

    clonedStyle.textContent = style.textContent;

    printDocument.head.appendChild(clonedStyle);
  });

  // ---------------------------------------------------------
  // COPY ACCESSIBLE STYLESHEET RULES
  // ---------------------------------------------------------

  try {
    Array.from(document.styleSheets).forEach((sheet) => {
      if (sheet.href) return;

      if (sheet.ownerNode?.tagName === "STYLE") return;

      try {
        const cssText = Array.from(sheet.cssRules)
          .map((rule) => rule.cssText)
          .join("\n");

        if (cssText) {
          const style = printDocument.createElement("style");

          style.textContent = cssText;

          printDocument.head.appendChild(style);
        }
      } catch (error) {
        // Cross-origin stylesheets cannot always be accessed.
      }
    });
  } catch (error) {
    console.warn(
      "Some stylesheet rules could not be copied:",
      error
    );
  }

  // ---------------------------------------------------------
  // THERMAL PRINTER BASE STYLES
  // ---------------------------------------------------------

  const baseStyle = printDocument.createElement("style");

  baseStyle.textContent = `
    * {
      box-sizing: border-box !important;
    }

    html,
    body {
      width: 80mm !important;
      min-width: 80mm !important;

      margin: 0 !important;
      padding: 0 !important;

      background: #fff !important;
      color: #000 !important;

      overflow: visible !important;

      font-family: Arial, Helvetica, sans-serif !important;
    }

    body {
      display: block !important;
    }

    #thermal-receipt {
      display: block !important;

      position: relative !important;

      width: 76mm !important;
      max-width: 76mm !important;

      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;

      margin: 0 auto !important;
      padding: 2mm 2mm 0 !important;

      overflow: visible !important;

      background: #fff !important;
      color: #000 !important;

      font-family: Arial, Helvetica, sans-serif !important;

      font-size: 10px !important;
      line-height: 1.4 !important;
    }

    #thermal-receipt img {
      max-width: 100%;
    }

    /* BRAND */

    .receipt-brand {
      text-align: center !important;
      padding-bottom: 3px !important;
      margin-bottom: 0 !important;
    }

    .receipt-logo {
      display: block !important;

      width: 19mm !important;
      max-width: 100% !important;
      max-height: 18mm !important;

      object-fit: contain !important;

      margin: 0 auto 4px !important;
    }

    .receipt-brand-name {
      font-family: Georgia, "Times New Roman", serif !important;

      font-size: 21px !important;
      font-weight: 800 !important;

      letter-spacing: 1.5px !important;
      line-height: 1.2 !important;

      margin: 0 !important;
    }

    .receipt-store-address {
      font-size: 9px !important;
      font-weight: 600 !important;

      margin-top: 5px !important;
      text-align: center !important;

      overflow-wrap: anywhere !important;
    }

    .receipt-store-phone {
      font-size: 9px !important;
      font-weight: 800 !important;

      margin-top: 3px !important;
      text-align: center !important;
    }

    .receipt-brand-divider {
      margin: 6px 0 2px !important;

      font-size: 10px !important;
      font-weight: 700 !important;

      text-align: center !important;
    }

    .receipt-tagline {
      font-size: 8px !important;
      font-weight: 700 !important;

      letter-spacing: 1.2px !important;

      margin: 0 !important;
      text-align: center !important;
    }

    /* SECTION HEADINGS */

    .receipt-section-title {
      font-size: 9px !important;
      font-weight: 800 !important;

      letter-spacing: 1px !important;

      margin: 6px 0 4px !important;
      line-height: 1.25 !important;
    }

    .receipt-divider {
      border-top: 1px dashed #333 !important;
      margin: 5px 0 !important;
    }

    /* INVOICE DETAILS */

    .receipt-info > div {
      display: flex !important;

      justify-content: space-between !important;
      align-items: flex-start !important;

      gap: 5px !important;

      margin: 2px 0 !important;
      line-height: 1.3 !important;
    }

    .receipt-info span {
      color: #333 !important;
    }

    .receipt-info strong {
      text-align: right !important;
      overflow-wrap: anywhere !important;
    }

    /* CUSTOMER */

    .receipt-customer {
      display: flex !important;

      flex-direction: column !important;
      gap: 2px !important;

      font-size: 10px !important;
      line-height: 1.35 !important;
    }

    /* PRODUCTS */

    .receipt-product {
      padding: 5px 0 !important;

      border-bottom: 1px dotted #777 !important;

      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    .receipt-product-heading {
      display: flex !important;

      align-items: flex-start !important;
      justify-content: space-between !important;

      gap: 7px !important;

      font-size: 10px !important;
      font-weight: 800 !important;

      line-height: 1.3 !important;
    }

    .receipt-product-heading strong:first-child {
      max-width: 49mm !important;
      overflow-wrap: anywhere !important;
    }

    .receipt-product-heading strong:last-child {
      white-space: nowrap !important;
    }

    .receipt-product-meta {
      display: flex !important;

      flex-direction: column !important;
      gap: 1px !important;

      margin-top: 2px !important;

      font-size: 8.5px !important;
      line-height: 1.3 !important;

      overflow-wrap: anywhere !important;
    }

    .receipt-product-variant {
      margin-top: 2px !important;

      font-size: 9px !important;
      font-weight: 600 !important;
    }

    .receipt-product-calculation {
      margin-top: 2px !important;

      font-size: 9px !important;
      line-height: 1.3 !important;
    }

    /* BILL TOTALS */

    .receipt-total-row {
      display: flex !important;

      align-items: center !important;
      justify-content: space-between !important;

      gap: 5px !important;

      margin: 3px 0 !important;
      line-height: 1.3 !important;
    }

    .receipt-total-row strong {
      text-align: right !important;
      white-space: nowrap !important;
    }

    .receipt-grand-total {
      display: flex !important;

      justify-content: space-between !important;
      align-items: center !important;

      gap: 5px !important;

      margin: 7px 0 !important;
      padding: 6px 5px !important;

      border-top: 1px solid #000 !important;
      border-bottom: 1px solid #000 !important;

      font-size: 14px !important;
      font-weight: 900 !important;

      line-height: 1.3 !important;

      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    /* PAYMENT */

    .receipt-payment {
      margin: 0 !important;
      padding: 0 !important;

      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    /* STORE POLICIES */

    .receipt-policy {
      display: block !important;

      width: 100% !important;

      margin: 5px 0 3px !important;
      padding: 0 !important;

      font-family: Arial, "Nirmala UI", sans-serif !important;
      font-size: 9px !important;
      line-height: 1.5 !important;

      color: #000 !important;
      text-align: left !important;

      overflow-wrap: anywhere !important;
    }

    .receipt-exchange-policy {
      font-weight: 800 !important;
      text-align: center !important;

      margin-bottom: 4px !important;
    }

    .receipt-return-policy {
      font-weight: 600 !important;
      margin-top: 3px !important;
    }

    .receipt-guarantee {
      font-weight: 700 !important;
      margin-top: 2px !important;
    }

    /* FOOTER */

    .receipt-footer {
      display: block !important;

      width: 100% !important;

      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;

      margin: 5px 0 0 !important;
      padding: 0 !important;

      text-align: center !important;

      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    .receipt-footer-decoration {
      margin: 0 0 3px !important;
      padding: 0 !important;

      font-size: 10px !important;
      line-height: 1.2 !important;

      text-align: center !important;
    }

    .receipt-footer h2 {
      margin: 0 !important;
      padding: 0 !important;

      font-family: "Nirmala UI", Georgia, serif !important;

      font-size: 16px !important;
      font-weight: 800 !important;

      letter-spacing: 1.5px !important;
      line-height: 1.2 !important;
    }

    .receipt-signature {
      margin-top: 7px !important;

      text-align: right !important;

      font-family: "Nirmala UI", Arial, sans-serif !important;

      font-size: 10px !important;
      font-weight: 700 !important;
    }

    .receipt-footer p,
    .receipt-footer-brand,
    .receipt-footer small,
    .receipt-copyright {
      display: none !important;
    }

    @page {
      size: 80mm auto;
      margin: 0;
    }

    @media print {
      html,
      body {
        width: 80mm !important;

        margin: 0 !important;
        padding: 0 !important;

        overflow: visible !important;
      }

      #thermal-receipt {
        display: block !important;

        width: 76mm !important;

        margin: 0 auto !important;
        padding-bottom: 0 !important;
      }

      #thermal-receipt,
      #thermal-receipt * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  `;

  printDocument.head.appendChild(baseStyle);

  // ---------------------------------------------------------
  // APPEND RECEIPT
  // ---------------------------------------------------------

  printDocument.body.innerHTML = "";
  printDocument.body.appendChild(receiptClone);

  // ---------------------------------------------------------
  // WAIT FOR STYLESHEETS
  // ---------------------------------------------------------

  await Promise.all(stylesheetPromises);

  // ---------------------------------------------------------
  // WAIT FOR FONTS
  // ---------------------------------------------------------

  if (printDocument.fonts?.ready) {
    await printDocument.fonts.ready;
  }

  // ---------------------------------------------------------
  // WAIT FOR RECEIPT IMAGES
  // ---------------------------------------------------------

  const images = Array.from(
    printDocument.querySelectorAll("#thermal-receipt img")
  );

  await Promise.all(
    images.map((img) => {
      if (img.complete) {
        return Promise.resolve();
      }

      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;

        setTimeout(resolve, 3000);
      });
    })
  );

  // ---------------------------------------------------------
  // WAIT FOR FINAL LAYOUT
  // ---------------------------------------------------------

  await new Promise((resolve) => {
    printWindow.requestAnimationFrame(() => {
      printWindow.requestAnimationFrame(resolve);
    });
  });

  const printedReceipt =
    printDocument.getElementById("thermal-receipt");

  if (!printedReceipt) {
    throw new Error("Receipt could not be prepared.");
  }

  // ---------------------------------------------------------
  // MEASURE ACTUAL CONTENT HEIGHT
  // ---------------------------------------------------------

  const contentHeightPx = Math.ceil(
    Math.max(
      printedReceipt.scrollHeight,
      printedReceipt.getBoundingClientRect().height
    )
  );

  // CSS pixels to millimetres.
  const heightMm = Math.max(
    45,
    Math.ceil((contentHeightPx * 25.4) / 96 + 2)
  );

  // ---------------------------------------------------------
  // APPLY DYNAMIC PAPER HEIGHT
  // ---------------------------------------------------------

  const pageSizeStyle = printDocument.createElement("style");

  pageSizeStyle.textContent = `
    @page {
      size: 80mm ${heightMm}mm;
      margin: 0;
    }

    @media print {
      html,
      body {
        width: 80mm !important;
        height: ${heightMm}mm !important;

        min-height: 0 !important;
        max-height: none !important;

        margin: 0 !important;
        padding: 0 !important;

        overflow: visible !important;
      }

      body {
        position: relative !important;

        top: 0 !important;
        left: 0 !important;
      }

      #thermal-receipt {
        position: absolute !important;

        top: 0 !important;
        left: 2mm !important;

        width: 76mm !important;

        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;

        margin: 0 !important;
        padding: 2mm 2mm 0 !important;

        overflow: visible !important;
      }
    }
  `;

  printDocument.head.appendChild(pageSizeStyle);

  // ---------------------------------------------------------
  // PRINT ONLY THE THERMAL RECEIPT
  // ---------------------------------------------------------

  printWindow.focus();

  printWindow.onafterprint = () => {
    printWindow.close();
  };

  printWindow.print();
}
