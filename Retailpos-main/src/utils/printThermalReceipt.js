
export async function printThermalReceipt() {
  const sourceReceipt = document.getElementById("thermal-receipt");

  if (!sourceReceipt) {
    alert("Thermal receipt not found.");
    return;
  }

  // Open immediately from the user's Print button click.
  const printWindow = window.open(
    "",
    "_blank",
    "width=420,height=800"
  );

  if (!printWindow) {
    alert("Please allow pop-ups for this website to print receipts.");
    return;
  }

  // Copy the current receipt and its styling.
  const styles = Array.from(
    document.querySelectorAll('link[rel="stylesheet"], style')
  )
    .map((element) => element.outerHTML)
    .join("\n");

  printWindow.document.open();

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>SAI COLLECTION - Receipt</title>

        ${styles}

        <style id="dynamic-print-style">
          @page {
            size: 80mm auto;
            margin: 0;
          }

          html,
          body {
            width: 80mm !important;
            min-width: 80mm !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: #fff !important;
          }

          body {
            display: block !important;
          }

          #thermal-receipt {
            display: block !important;
            position: static !important;
            width: 76mm !important;
            max-width: 76mm !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            margin: 0 auto !important;
            padding: 2mm 2mm 0 !important;
            box-sizing: border-box !important;
            overflow: visible !important;
            background: #fff !important;
            color: #000 !important;
          }

          #thermal-receipt,
          #thermal-receipt * {
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          @media print {
            html,
            body {
              width: 80mm !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            #thermal-receipt {
              display: block !important;
              width: 76mm !important;
              margin: 0 auto !important;
            }
          }
        </style>
      </head>

      <body>
        ${sourceReceipt.outerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();

  // Wait until the print document is ready.
  const waitForStylesheets = () => {
    const links = Array.from(
      printWindow.document.querySelectorAll('link[rel="stylesheet"]')
    );

    return Promise.all(
      links.map(
        (link) =>
          new Promise((resolve) => {
            if (link.sheet) {
              resolve();
              return;
            }

            link.addEventListener("load", resolve, { once: true });
            link.addEventListener("error", resolve, { once: true });

            // Avoid waiting forever if a stylesheet fails.
            setTimeout(resolve, 5000);
          })
      )
    );
  };

  const waitForImages = () => {
    const images = Array.from(printWindow.document.images);

    return Promise.all(
      images.map((img) => {
        if (img.complete) {
          return Promise.resolve();
        }

        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      })
    );
  };

  await Promise.all([
    waitForStylesheets(),
    waitForImages(),
  ]);

  // Wait for browser layout and fonts.
  if (printWindow.document.fonts?.ready) {
    await printWindow.document.fonts.ready;
  }

  await new Promise((resolve) => {
    printWindow.requestAnimationFrame(() => {
      printWindow.requestAnimationFrame(resolve);
    });
  });

  const receipt = printWindow.document.getElementById(
    "thermal-receipt"
  );

  if (!receipt) {
    printWindow.close();
    alert("Unable to prepare the receipt for printing.");
    return;
  }

  // Measure the actual rendered receipt.
  const receiptHeightPx = receipt.getBoundingClientRect().height;

  // Convert CSS pixels to millimetres.
  // Add a small allowance to prevent the last line being clipped.
  const receiptHeightMm = Math.ceil(
    (receiptHeightPx * 25.4) / 96 + 1
  );

  // Apply the calculated custom paper length.
  const dynamicStyle = printWindow.document.getElementById(
    "dynamic-print-style"
  );

  dynamicStyle.textContent += `
    @page {
      size: 80mm ${receiptHeightMm}mm;
      margin: 0;
    }
  `;

  console.log("Receipt height:", receiptHeightPx, "px");
  console.log("Custom paper height:", receiptHeightMm, "mm");

  await new Promise((resolve) => {
    printWindow.requestAnimationFrame(resolve);
  });

  printWindow.focus();

  printWindow.onafterprint = () => {
    printWindow.close();
  };

  // Printing only. No Firebase operation or sale completion.
  printWindow.print();
}
