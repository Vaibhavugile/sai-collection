
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import "./BarcodePrint.css";
import PrintDialog from "./PrintDialog";

import {
  LocalPrintshopOutlined,
  ArrowForwardRounded,
} from "@mui/icons-material";

export default function BarcodePrint({ product }) {
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="print-barcode-btn"
        onClick={() => setOpen(true)}
        disabled={!product?.variants?.length}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="print-barcode-btn-icon">
          <LocalPrintshopOutlined />
        </span>

        <span className="print-barcode-btn-text">
          Print Barcodes
          <small>Generate product labels</small>
        </span>

        <span className="print-barcode-btn-arrow">
          <ArrowForwardRounded />
        </span>
      </button>

      {open &&
        createPortal(
          <div
            className="print-dialog-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                handleClose();
              }
            }}
          >
            <PrintDialog
              product={product}
              onClose={handleClose}
            />
          </div>,
          document.body
        )}
    </>
  );
}
