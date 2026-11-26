import JsBarcode from "jsbarcode";
import { generateThermalTemplate } from "../templates/ThermalTemplate";

export function print58mm({
  product,
  variants,
  storeName,
}) {
  const body = generateThermalTemplate({
    product,
    variants,
    storeName,
    paperWidth: "50x30",
  });

  const printWindow = window.open(
    "",
    "_blank",
    "width=500,height=800"
  );

  if (!printWindow) {
    alert(
      "Unable to open print window. Please allow popups for this website."
    );
    return;
  }

  printWindow.document.open();

  printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>

<meta charset="UTF-8">

<title>Barcode Labels</title>

<style>

/* =========================================================
   50mm × 30mm BARCODE LABEL

   IMPORTANT:
   --------------------------------
   Physical label = 50mm × 30mm

   Do NOT add the physical gap here.
   The label printer handles the gap/feed.

   One .label = exactly one sticker.
   ========================================================= */


/* =========================================================
   PAGE
   ========================================================= */

@page {
  size: 50mm 30mm;
  margin: 0;
}


/* =========================================================
   RESET
   ========================================================= */

* {
  box-sizing: border-box;
}


html {
  width: 50mm;
  height: auto;

  margin: 0;
  padding: 0;
}


body {
  width: 50mm;

  margin: 0;
  padding: 0;

  background: #ffffff;

  font-family:
    Arial,
    Helvetica,
    sans-serif;

  overflow: visible;
}


/* =========================================================
   SHEET
   ========================================================= */

.sheet-50x30 {
  width: 50mm;

  margin: 0;
  padding: 0;

  display: block;
}


/* =========================================================
   LABEL

   EXACT physical sticker size:
   50mm × 30mm

   NO EXTRA GAP
   NO EXTRA HEIGHT
   ========================================================= */

.label {
  position: relative;

  width: 50mm;
  height: 30mm;

  min-width: 50mm;
  max-width: 50mm;

  min-height: 30mm;
  max-height: 30mm;

  margin: 0;
  padding: 0;

  display: flex;

  align-items: center;
  justify-content: flex-start;

  flex-direction: column;

  overflow: hidden;

  background: #ffffff;

  break-inside: avoid;
  page-break-inside: avoid;

  /* Each label occupies exactly one print page */
  break-after: page;
  page-break-after: always;
}


/*
   Last label must NOT create another blank page.
*/
.label:last-child {
  break-after: auto;
  page-break-after: auto;
}


/* =========================================================
   STORE NAME
   ========================================================= */

.store {
  width: 48mm;
  height: 3.5mm;

  margin-top: 0.8mm;

  font-size: 9px;
  line-height: 3.5mm;

  font-weight: 700;

  text-align: center;

  white-space: nowrap;

  overflow: hidden;
  text-overflow: ellipsis;

  flex-shrink: 0;
}


/* =========================================================
   VARIANT + PRICE
   ========================================================= */

.label-top {
  width: 48mm;
  height: 4mm;

  margin-top: 0.5mm;

  display: flex;

  flex-direction: row;

  justify-content: space-between;
  align-items: center;

  gap: 1mm;

  flex-shrink: 0;
}


.variant {
  flex: 1;

  min-width: 0;

  text-align: left;

  font-size: 8px;

  line-height: 4mm;

  font-weight: 600;

  white-space: nowrap;

  overflow: hidden;
  text-overflow: ellipsis;
}


.price {
  flex-shrink: 0;

  font-size: 12px;

  line-height: 4mm;

  font-weight: 700;

  white-space: nowrap;
}


/* =========================================================
   BARCODE
   ========================================================= */

.barcode {
  display: block !important;

  width: 46mm !important;
  height: 9mm !important;

  min-width: 46mm !important;
  max-width: 46mm !important;

  min-height: 9mm !important;
  max-height: 9mm !important;

  margin-top: 1mm !important;

  margin-left: auto !important;
  margin-right: auto !important;

  margin-bottom: 0 !important;

  padding: 0 !important;

  flex-shrink: 0;

  overflow: visible !important;

  transform: none !important;

  writing-mode: horizontal-tb !important;

  direction: ltr !important;
}


/* =========================================================
   BARCODE NUMBER
   ========================================================= */

.barcode-number {
  width: 48mm;
  height: 3mm;

  margin-top: 0.5mm;

  font-size: 6px;

  line-height: 3mm;

  font-weight: 700;

  text-align: center;

  white-space: nowrap;

  overflow: hidden;

  flex-shrink: 0;
}


/* =========================================================
   SKU

   Hidden for 50×30 labels
   ========================================================= */

.sku {
  display: none;
}


/* =========================================================
   PRINT MODE
   ========================================================= */

@media print {

  @page {
    size: 50mm 30mm;
    margin: 0;
  }


  html {
    width: 50mm !important;

    margin: 0 !important;
    padding: 0 !important;
  }


  body {
    width: 50mm !important;

    margin: 0 !important;
    padding: 0 !important;

    overflow: visible !important;
  }


  .sheet-50x30 {
    width: 50mm !important;

    margin: 0 !important;
    padding: 0 !important;

    display: block !important;
  }


  .label {
    width: 50mm !important;
    height: 30mm !important;

    min-width: 50mm !important;
    max-width: 50mm !important;

    min-height: 30mm !important;
    max-height: 30mm !important;

    margin: 0 !important;
    padding: 0 !important;

    overflow: hidden !important;

    break-inside: avoid !important;
    page-break-inside: avoid !important;

    break-after: page !important;
    page-break-after: always !important;
  }


  .label:last-child {
    break-after: auto !important;
    page-break-after: auto !important;
  }


  .store {
    width: 48mm !important;
  }


  .label-top {
    width: 48mm !important;
  }


  .barcode {
    width: 46mm !important;
    height: 9mm !important;

    min-width: 46mm !important;
    max-width: 46mm !important;

    min-height: 9mm !important;
    max-height: 9mm !important;

    margin-left: auto !important;
    margin-right: auto !important;

    transform: none !important;

    writing-mode: horizontal-tb !important;

    direction: ltr !important;
  }


  .barcode-number {
    width: 48mm !important;
  }

}

</style>

</head>

<body>

${body}

<script>
  /*
   * Prevent browser from automatically inserting
   * unwanted body spacing.
   */
  document.documentElement.style.margin = "0";
  document.documentElement.style.padding = "0";
  document.body.style.margin = "0";
  document.body.style.padding = "0";
</script>

</body>
</html>
  `);

  printWindow.document.close();


  // =========================================================
  // GENERATE BARCODES
  // =========================================================

  const generateBarcodes = () => {

    const barcodeElements =
      printWindow.document.querySelectorAll(
        "svg.barcode"
      );

    console.log(
      "Barcode count:",
      barcodeElements.length
    );


    barcodeElements.forEach((svg) => {

      const barcode =
        svg.getAttribute("data-barcode");

      if (!barcode) {
        return;
      }


      try {

        // Clear any existing barcode
        svg.innerHTML = "";


        JsBarcode(
          svg,
          String(barcode),
          {
            format: "CODE128",

            /*
             * Barcode width.
             */
            width: 1.4,

            /*
             * Barcode height in pixels.
             */
            height: 34,

            /*
             * No internal whitespace.
             */
            margin: 0,

            /*
             * Barcode number is rendered
             * separately below.
             */
            displayValue: false,

            lineColor: "#000000",

            background: "#ffffff",

            valid: (valid) => {

              if (!valid) {

                console.error(
                  "Invalid barcode:",
                  barcode
                );

              }

            },
          }
        );


        /*
         * Force SVG orientation.
         */
        svg.style.display = "block";

        svg.style.transform = "none";

        svg.style.writingMode =
          "horizontal-tb";

        svg.style.direction = "ltr";

      } catch (error) {

        console.error(
          "Barcode generation error:",
          barcode,
          error
        );

      }

    });


    /*
     * Give Edge enough time to render
     * all SVG barcodes before opening
     * the print dialog.
     */
    setTimeout(() => {

      printWindow.focus();

      printWindow.print();

    }, 500);

  };


  // =========================================================
  // WAIT FOR DOCUMENT
  // =========================================================

  if (
    printWindow.document.readyState ===
    "complete"
  ) {

    setTimeout(
      generateBarcodes,
      100
    );

  } else {

    printWindow.onload = () => {

      setTimeout(
        generateBarcodes,
        100
      );

    };

  }


  // =========================================================
  // CLOSE PRINT WINDOW
  // =========================================================

  printWindow.onafterprint = () => {

    setTimeout(() => {

      try {

        printWindow.close();

      } catch (error) {

        console.error(
          "Print window close error:",
          error
        );

      }

    }, 500);

  };

}