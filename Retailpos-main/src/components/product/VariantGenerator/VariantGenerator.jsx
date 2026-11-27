
import { useEffect, useState } from "react";
import {
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../../firebase";
import "./VariantGenerator.css";
import { useLocation } from "react-router-dom";

const DEFAULT_COLORS = [
  "Black",
  "White",
  "Blue",
  "Red",
  "Green",
  "Yellow",
  "Grey",
  "Brown",
];

const DEFAULT_SIZES = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "30",
  "32",
  "34",
  "36",
];

const DEFAULTS_REF = doc(db, "variants", "defaults");

export default function VariantGenerator({ product, setProduct }) {
  const location = useLocation();

  const isView = location.pathname.startsWith("/products/view");

  const [availableColors, setAvailableColors] = useState(DEFAULT_COLORS);
  const [availableSizes, setAvailableSizes] = useState(DEFAULT_SIZES);

  const [newColor, setNewColor] = useState("");
  const [newSize, setNewSize] = useState("");

  const [loadingDefaults, setLoadingDefaults] = useState(true);
  const [savingDefaults, setSavingDefaults] = useState(false);

  // -----------------------------------------
  // LOAD DEFAULT COLORS AND SIZES FROM FIREBASE
  // -----------------------------------------

  useEffect(() => {
    let active = true;

    const loadDefaults = async () => {
      try {
        await runTransaction(db, async (transaction) => {
          const snapshot = await transaction.get(DEFAULTS_REF);

          if (!snapshot.exists()) {
            transaction.set(DEFAULTS_REF, {
              colors: DEFAULT_COLORS,
              sizes: DEFAULT_SIZES,
              updatedAt: serverTimestamp(),
            });
          }
        });

        const snapshot = await runTransaction(db, async (transaction) => {
          return await transaction.get(DEFAULTS_REF);
        });

        if (!active) return;

        const data = snapshot.data() || {};

        setAvailableColors(
          Array.isArray(data.colors) ? data.colors : DEFAULT_COLORS
        );

        setAvailableSizes(
          Array.isArray(data.sizes) ? data.sizes : DEFAULT_SIZES
        );
      } catch (error) {
        console.error("Error loading variant defaults:", error);

        if (active) {
          setAvailableColors(DEFAULT_COLORS);
          setAvailableSizes(DEFAULT_SIZES);
        }
      } finally {
        if (active) setLoadingDefaults(false);
      }
    };

    loadDefaults();

    return () => {
      active = false;
    };
  }, []);

  // -----------------------------------------
  // SAVE A CUSTOM DEFAULT TO FIREBASE
  // -----------------------------------------

  const saveDefaultValue = async (field, value) => {
    const cleanValue = value.trim();

    if (!cleanValue) return false;

    try {
      setSavingDefaults(true);

      const updatedValues = await runTransaction(
        db,
        async (transaction) => {
          const snapshot = await transaction.get(DEFAULTS_REF);
          const data = snapshot.exists() ? snapshot.data() : {};

          const fallback =
            field === "colors" ? DEFAULT_COLORS : DEFAULT_SIZES;

          const currentValues = Array.isArray(data[field])
            ? data[field]
            : fallback;

          const alreadyExists = currentValues.some(
            (item) =>
              String(item).toLowerCase() === cleanValue.toLowerCase()
          );

          if (alreadyExists) {
            return currentValues;
          }

          const nextValues = [...currentValues, cleanValue];

          transaction.set(
            DEFAULTS_REF,
            {
              [field]: nextValues,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );

          return nextValues;
        }
      );

      if (field === "colors") {
        setAvailableColors(updatedValues);
      } else {
        setAvailableSizes(updatedValues);
      }

      return true;
    } catch (error) {
      console.error("Error saving variant default:", error);
      alert("Unable to save. Please check your internet connection.");
      return false;
    } finally {
      setSavingDefaults(false);
    }
  };

  // -----------------------------------------
  // SELECT COLOR
  // -----------------------------------------

  const toggleColor = (color) => {
    setProduct((prev) => {
      const colors = prev.selectedColors || [];
      const exists = colors.includes(color);

      return {
        ...prev,
        selectedColors: exists
          ? colors.filter((item) => item !== color)
          : [...colors, color],
      };
    });
  };

  // -----------------------------------------
  // SELECT SIZE
  // -----------------------------------------

  const toggleSize = (size) => {
    setProduct((prev) => {
      const sizes = prev.selectedSizes || [];
      const exists = sizes.includes(size);

      return {
        ...prev,
        selectedSizes: exists
          ? sizes.filter((item) => item !== size)
          : [...sizes, size],
      };
    });
  };

  // -----------------------------------------
  // ADD CUSTOM COLOR
  // ALSO SAVE IT IN FIREBASE
  // -----------------------------------------

  const addCustomColor = async () => {
    const value = newColor.trim();

    if (!value) return;

    const exists = availableColors.some(
      (item) => item.toLowerCase() === value.toLowerCase()
    );

    if (exists) {
      setNewColor("");
      return;
    }

    const saved = await saveDefaultValue("colors", value);

    if (!saved) return;

    setProduct((prev) => ({
      ...prev,
      selectedColors: [
        ...(prev.selectedColors || []),
        value,
      ],
    }));

    setNewColor("");
  };

  // -----------------------------------------
  // ADD CUSTOM SIZE
  // ALSO SAVE IT IN FIREBASE
  // -----------------------------------------

  const addCustomSize = async () => {
    const value = newSize.trim();

    if (!value) return;

    const exists = availableSizes.some(
      (item) => item.toLowerCase() === value.toLowerCase()
    );

    if (exists) {
      setNewSize("");
      return;
    }

    const saved = await saveDefaultValue("sizes", value);

    if (!saved) return;

    setProduct((prev) => ({
      ...prev,
      selectedSizes: [
        ...(prev.selectedSizes || []),
        value,
      ],
    }));

    setNewSize("");
  };

  // -----------------------------------------
  // GET NEXT VARIANT NUMBER
  // -----------------------------------------

  const getNextVariantNumber = (variants) => {
    if (!variants.length) return 1;

    const numbers = variants
      .map((variant) => {
        const parts = String(variant.id || "").split("-");
        return Number(parts[parts.length - 1]);
      })
      .filter((number) => !isNaN(number));

    return Math.max(...numbers, 0) + 1;
  };

  // -----------------------------------------
  // GENERATE VARIANTS
  // -----------------------------------------

  const generateVariants = () => {
    const colors = product.selectedColors || [];
    const sizes = product.selectedSizes || [];
    const existingVariants = product.variants || [];

    let combinations = [];

    if (!colors.length && !sizes.length) {
      combinations.push({
        label: "Default",
        attributes: {},
      });
    } else if (colors.length && !sizes.length) {
      combinations = colors.map((color) => ({
        label: color,
        attributes: { Color: color },
      }));
    } else if (!colors.length && sizes.length) {
      combinations = sizes.map((size) => ({
        label: size,
        attributes: { Size: size },
      }));
    } else {
      colors.forEach((color) => {
        sizes.forEach((size) => {
          combinations.push({
            label: `${color} / ${size}`,
            attributes: {
              Color: color,
              Size: size,
            },
          });
        });
      });
    }

    let nextNumber = getNextVariantNumber(existingVariants);

    const variants = combinations.map((combo) => {
      const existing = existingVariants.find(
        (variant) => variant.variantName === combo.label
      );

      if (existing) return existing;

      const code = `${product.productCode}-${String(nextNumber).padStart(
        2,
        "0"
      )}`;

      nextNumber++;

      return {
        id: code,
        productCode: product.productCode,
        barcode: code,
        sku: code,
        variantName: combo.label,
        attributes: combo.attributes,
        purchasePrice: 0,
        sellingPrice: 0,
        stock: 0,
        lowStock: 0,
        status: true,
      };
    });

    const mergedVariants = [...existingVariants];

    variants.forEach((newVariant) => {
      const exists = mergedVariants.some(
        (variant) => variant.variantName === newVariant.variantName
      );

      if (!exists) {
        mergedVariants.push(newVariant);
      }
    });

    setProduct((prev) => ({
      ...prev,
      variants: mergedVariants,
      selectedColors: [],
      selectedSizes: [],
    }));
  };

  if (isView) return null;

  return (
    <div className="product-card">
      <div className="product-card-header">
        <h2>Product Variants</h2>
        <p>Select available colors and sizes for this product.</p>
      </div>

      <div className="product-card-body">
        {/* COLORS */}

        <div className="variant-section">
          <h3>🎨 Colors</h3>

          <div className="chip-container">
            {loadingDefaults ? (
              <p>Loading colors...</p>
            ) : (
              availableColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`variant-chip ${
                    (product.selectedColors || []).includes(color)
                      ? "active"
                      : ""
                  }`}
                  onClick={() => toggleColor(color)}
                >
                  {color}
                </button>
              ))
            )}
          </div>

          <div className="custom-input-row">
            <input
              type="text"
              placeholder="Add Custom Color"
              value={newColor}
              disabled={savingDefaults || loadingDefaults}
              onChange={(e) => setNewColor(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomColor();
                }
              }}
            />

            <button
              type="button"
              onClick={addCustomColor}
              disabled={savingDefaults || loadingDefaults || !newColor.trim()}
            >
              {savingDefaults ? "Saving..." : "Add"}
            </button>
          </div>
        </div>

        {/* SIZES */}

        <div className="variant-section">
          <h3>📏 Sizes</h3>

          <div className="chip-container">
            {loadingDefaults ? (
              <p>Loading sizes...</p>
            ) : (
              availableSizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`variant-chip ${
                    (product.selectedSizes || []).includes(size)
                      ? "active"
                      : ""
                  }`}
                  onClick={() => toggleSize(size)}
                >
                  {size}
                </button>
              ))
            )}
          </div>

          <div className="custom-input-row">
            <input
              type="text"
              placeholder="Add Custom Size"
              value={newSize}
              disabled={savingDefaults || loadingDefaults}
              onChange={(e) => setNewSize(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomSize();
                }
              }}
            />

            <button
              type="button"
              onClick={addCustomSize}
              disabled={savingDefaults || loadingDefaults || !newSize.trim()}
            >
              {savingDefaults ? "Saving..." : "Add"}
            </button>
          </div>
        </div>

        {/* GENERATE */}

        <button
          type="button"
          className="generate-btn"
          onClick={generateVariants}
          disabled={loadingDefaults || savingDefaults}
        >
          Generate Variants
        </button>
      </div>
    </div>
  );
}
