export function generateThermalTemplate({
  product,
  variants,
  storeName,
  paperWidth = "80mm",
}) {

  const isLabel =
    paperWidth === "50x30";


  const sheetClass =
    isLabel
      ? "sheet-50x30"
      : "sheet-80";


  let html = `
    <div class="${sheetClass}">
  `;


  variants.forEach((variant) => {

    const quantity =
      Number(variant.printQty || 0);


    for (
      let i = 0;
      i < quantity;
      i++
    ) {

      html += `
        <div class="label">

          <!-- =========================
               STORE NAME
               ========================= -->

          <div class="store">
            ${escapeHtml(storeName || "")}
          </div>


          ${
            isLabel
              ? `

                <!-- =========================
                     VARIANT + PRICE
                     ========================= -->

                <div class="label-top">

                  <div class="variant">
                    ${escapeHtml(
                      variant.variantName || ""
                    )}
                  </div>

                  <div class="price">
                    ₹${escapeHtml(
                      String(
                        variant.sellingPrice || 0
                      )
                    )}
                  </div>

                </div>

              `
              : `

                <!-- =========================
                     NORMAL THERMAL PRINT
                     ========================= -->

                <div class="product">
                  ${escapeHtml(
                    product?.name || ""
                  )}
                </div>

                <div class="variant">
                  ${escapeHtml(
                    variant.variantName || ""
                  )}
                </div>

                <div class="price">
                  ₹${escapeHtml(
                    String(
                      variant.sellingPrice || 0
                    )
                  )}
                </div>

              `
          }


          <!-- =========================
               BARCODE
               ========================= -->

          <svg
            class="barcode"
            data-barcode="${escapeHtml(
              String(
                variant.barcode || ""
              )
            )}">
          </svg>


          <!-- =========================
               BARCODE NUMBER
               ========================= -->

          <div class="barcode-number">
            ${escapeHtml(
              String(
                variant.barcode || ""
              )
            )}
          </div>


          ${
            !isLabel
              ? `

                <div class="sku">
                  SKU :
                  ${escapeHtml(
                    variant.sku || ""
                  )}
                </div>

              `
              : ""
          }

        </div>
      `;

    }

  });


  html += `
    </div>
  `;


  return html;
}


/* =========================================================
   HTML ESCAPE HELPER

   Prevent product / variant / store values
   from breaking the generated HTML.
   ========================================================= */

function escapeHtml(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}