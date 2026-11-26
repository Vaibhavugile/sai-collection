
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDoc,
  getDocs,
  writeBatch,
  limit,
} from "firebase/firestore";

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

import { db, storage } from "../firebase";

const productsCollection = collection(db, "products");

/* =========================================================
   COMMON HELPERS
========================================================= */

const createSlug = (name = "") => {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");
};

const cleanImage = (image) => ({
  ...(image.id ? { id: image.id } : {}),
  url: image.url,
  ...(image.path ? { path: image.path } : {}),
  isCover: Boolean(image.isCover),
});

// Remove browser-only properties before Firestore writes.
const cleanValue = (value) => {
  if (value === undefined) return null;

  if (
    value === null ||
    ["string", "number", "boolean"].includes(typeof value)
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(cleanValue);
  }

  if (typeof value === "object") {
    const result = {};

    Object.entries(value).forEach(([key, item]) => {
      if (key === "file" || key === "preview") {
        return;
      }

      if (typeof item !== "function") {
        result[key] = cleanValue(item);
      }
    });

    return result;
  }

  return String(value);
};

/* =========================================================
   CHANGE HISTORY HELPERS
========================================================= */

const trackedFields = [
  "name",
  "description",
  "categoryId",
  "categoryName",
  "subCategoryId",
  "subCategoryName",
  "images",
  "selectedColors",
  "selectedSizes",
  "variants",
  "status",
];

const createChangeLog = (oldProduct, newProduct) => {
  const changes = {};

  const emptyArrayFields = [
    "images",
    "variants",
    "selectedColors",
    "selectedSizes",
  ];

  trackedFields.forEach((field) => {
    const oldValue =
      oldProduct?.[field] ??
      (emptyArrayFields.includes(field) ? [] : null);

    const newValue =
      newProduct?.[field] ??
      (emptyArrayFields.includes(field) ? [] : null);

    // Compare only persisted image information.
    // Ignore temporary previews and browser-only properties.
    const before =
      field === "images"
        ? (Array.isArray(oldValue) ? oldValue : []).map(cleanImage)
        : cleanValue(oldValue);

    const after =
      field === "images"
        ? (Array.isArray(newValue) ? newValue : []).map(cleanImage)
        : cleanValue(newValue);

    if (JSON.stringify(before) !== JSON.stringify(after)) {
      changes[field] = {
        before,
        after,
      };
    }
  });

  return changes;
};

/* =========================================================
   NEXT PRODUCT CODE
========================================================= */

export const getNextProductCode = async () => {
  const counterRef = doc(
    db,
    "productCounters",
    "main"
  );

  return await runTransaction(
    db,
    async (transaction) => {
      const snapshot = await transaction.get(counterRef);

      let current = 0;

      if (snapshot.exists()) {
        current = snapshot.data().currentProductNumber || 0;
      }

      const next = current + 1;

      transaction.set(
        counterRef,
        {
          currentProductNumber: next,
        },
        { merge: true }
      );

      return `P${String(next).padStart(6, "0")}`;
    }
  );
};

/* =========================================================
   PREVIEW PRODUCT CODE
========================================================= */

export const getPreviewProductCode = async () => {
  const counterRef = doc(
    db,
    "productCounters",
    "main"
  );

  const snapshot = await getDoc(counterRef);

  let current = 0;

  if (snapshot.exists()) {
    current = snapshot.data().currentProductNumber || 0;
  }

  return `P${String(current + 1).padStart(6, "0")}`;
};

/* =========================================================
   UPLOAD SINGLE PRODUCT IMAGE
========================================================= */

const uploadSingleProductImage = async (
  productCode,
  image,
  index
) => {
  if (!image?.file) {
    return cleanImage(image);
  }

  const extension =
    image.file.name?.split(".").pop() || "jpg";

  // Unique filenames prevent overwriting existing images.
  const fileName =
    `${Date.now()}-${index}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${extension}`;

  const storageRef = ref(
    storage,
    `products/${productCode}/${fileName}`
  );

  await uploadBytes(
    storageRef,
    image.file
  );

  const downloadURL = await getDownloadURL(storageRef);

  return {
    id: fileName,
    url: downloadURL,
    path: storageRef.fullPath,
    isCover: Boolean(image.isCover),
  };
};

/* =========================================================
   UPLOAD PRODUCT IMAGES
========================================================= */

export const uploadProductImages = async (
  productCode,
  images = []
) => {
  const uploadedImages = [];

  for (let i = 0; i < images.length; i++) {
    const image = images[i];

    // Only upload newly selected files.
    if (!image?.file) continue;

    const uploaded = await uploadSingleProductImage(
      productCode,
      image,
      i
    );

    uploadedImages.push(uploaded);
  }

  return uploadedImages;
};

/* =========================================================
   ADD PRODUCT
========================================================= */

export const addProduct = async (product) => {
  try {
    const productCode = await getNextProductCode();

    const uploadedImages = await uploadProductImages(
      productCode,
      product.images || []
    );

    const variants = (product.variants || []).map(
      (variant, index) => {
        const variantCode =
          `${productCode}-${String(index + 1).padStart(2, "0")}`;

        return {
          ...variant,
          id: variantCode,
          barcode: variantCode,
          sku: variantCode,
          productCode,
        };
      }
    );

    const totalStock = variants.reduce(
      (sum, item) => sum + Number(item.stock || 0),
      0
    );

    const totalVariants = variants.length;

    await setDoc(
      doc(db, "products", productCode),
      {
        id: productCode,
        productCode,

        slug: createSlug(product.name),

        name: product.name.trim(),

        description: (product.description || "").trim(),

        categoryId: product.categoryId || "",
        categoryName: product.categoryName || "",

        subCategoryId: product.subCategoryId || "",
        subCategoryName: product.subCategoryName || "",

        images: uploadedImages.map(cleanImage),

        selectedColors: product.selectedColors || [],
        selectedSizes: product.selectedSizes || [],

        totalStock,
        totalVariants,
        variants,

        status: product.status || "active",

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    );

    return productCode;
  } catch (error) {
    console.error("Add product failed:", error);
    throw error;
  }
};

/* =========================================================
   SUBSCRIBE PRODUCTS
========================================================= */

export const subscribeProducts = (callback) => {
  const q = query(
    productsCollection,
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const products = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      callback(products);
    },
    (error) => {
      console.error("Products subscription failed:", error);
    }
  );
};

/* =========================================================
   UPDATE PRODUCT
   Backward-compatible update function.
========================================================= */

export const updateProduct = async (
  productId,
  data
) => {
  try {
    const variants = data.variants || [];

    const totalStock = variants.reduce(
      (sum, item) => sum + Number(item.stock || 0),
      0
    );

    const updateData = {
      ...data,
      totalStock,
      totalVariants: variants.length,
      updatedAt: serverTimestamp(),
    };

    // Never send browser File objects or preview URLs.
    if (data.images) {
      updateData.images = data.images
        .filter((image) => image?.url)
        .map(cleanImage);
    }

    await updateDoc(
      doc(db, "products", productId),
      updateData
    );
  } catch (error) {
    console.error("Update product failed:", error);
    throw error;
  }
};

/* =========================================================
   UPDATE PRODUCT + SAVE EDIT HISTORY
========================================================= */

export const updateProductWithHistory = async (
  productId,
  data,
  originalProduct,
  editedBy = {
    name: "Admin",
    uid: null,
  }
) => {
  const productRef = doc(
    db,
    "products",
    productId
  );

  const currentSnapshot = await getDoc(productRef);

  if (!currentSnapshot.exists()) {
    throw new Error("Product not found.");
  }

  const currentProduct = {
    id: currentSnapshot.id,
    ...currentSnapshot.data(),
  };

  // Use the latest Firestore data as the old version.
  const oldProduct = {
    ...originalProduct,
    ...currentProduct,
  };

  const newlyUploadedImages = [];

  try {
    /* ---------------------------------------
       PROCESS IMAGES
    --------------------------------------- */

    const finalImages = [];
    const images = data.images || [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];

      if (image?.file) {
        const uploaded = await uploadSingleProductImage(
          productId,
          image,
          i
        );

        newlyUploadedImages.push(uploaded);
        finalImages.push(uploaded);
      } else if (image?.url) {
        // Preserve existing images and their storage paths.
        finalImages.push(cleanImage(image));
      }
    }

    // Ensure one cover image when images exist but none is selected.
    if (
      finalImages.length > 0 &&
      !finalImages.some((image) => image.isCover)
    ) {
      finalImages[0] = {
        ...finalImages[0],
        isCover: true,
      };
    }

    /* ---------------------------------------
       PROCESS VARIANTS
    --------------------------------------- */

    const variants = (data.variants || []).map((variant) =>
      cleanValue(variant)
    );

    const totalStock = variants.reduce(
      (sum, item) => sum + Number(item.stock || 0),
      0
    );

    /* ---------------------------------------
       PREPARE UPDATED PRODUCT
    --------------------------------------- */

    const updatedProduct = {
      name: (data.name || "").trim(),

      slug: createSlug(data.name),

      description: (data.description || "").trim(),

      categoryId: data.categoryId || "",
      categoryName: data.categoryName || "",

      subCategoryId: data.subCategoryId || "",
      subCategoryName: data.subCategoryName || "",

      images: finalImages.map(cleanImage),

      selectedColors: data.selectedColors || [],
      selectedSizes: data.selectedSizes || [],

      variants,

      totalStock,
      totalVariants: variants.length,

      status: data.status || "active",

      updatedAt: serverTimestamp(),
    };

    /* ---------------------------------------
       CREATE CHANGE LOG
    --------------------------------------- */

    const changes = createChangeLog(
      oldProduct,
      updatedProduct
    );

    const changedFields = Object.keys(changes);

    // Do not create empty history records.
    if (changedFields.length === 0) {
      // Remove any newly uploaded images because they are unused.
      for (const image of newlyUploadedImages) {
        try {
          await deleteObject(ref(storage, image.path));
        } catch (cleanupError) {
          console.warn(
            "Unused image cleanup failed:",
            cleanupError
          );
        }
      }

      return {
        changed: false,
        changes: {},
      };
    }

    /* ---------------------------------------
       FIRESTORE BATCH
       Product update and history are atomic.
    --------------------------------------- */

    const historyRef = doc(
      collection(
        db,
        "products",
        productId,
        "editHistory"
      )
    );

    const batch = writeBatch(db);

    batch.update(
      productRef,
      updatedProduct
    );

    batch.set(historyRef, {
      productId,

      productCode: oldProduct.productCode || productId,

      productName: updatedProduct.name,

      editedAt: serverTimestamp(),

      editedBy: {
        uid: editedBy?.uid || null,
        name: editedBy?.name || "Admin",
      },

      changedFields,

      changes,
    });

    // Both writes succeed together or neither is committed.
    await batch.commit();

    /* ---------------------------------------
       DELETE REMOVED OLD IMAGES
       Only after successful Firestore commit.
    --------------------------------------- */

    const retainedPaths = new Set(
      finalImages
        .map((image) => image.path)
        .filter(Boolean)
    );

    const oldImagePaths = (oldProduct.images || [])
      .map((image) => image.path)
      .filter(Boolean);

    for (const path of oldImagePaths) {
      if (!retainedPaths.has(path)) {
        try {
          await deleteObject(ref(storage, path));
        } catch (error) {
          if (error.code !== "storage/object-not-found") {
            console.warn(
              "Old product image cleanup failed:",
              error
            );
          }
        }
      }
    }

    return {
      changed: true,
      changes,
    };
  } catch (error) {
    // If saving fails, remove only newly uploaded images.
    // Existing product images are never deleted here.
    for (const image of newlyUploadedImages) {
      try {
        await deleteObject(ref(storage, image.path));
      } catch (cleanupError) {
        console.warn(
          "New image cleanup failed:",
          cleanupError
        );
      }
    }

    console.error("Product edit/history failed:", error);
    throw error;
  }
};

/* =========================================================
   SUBSCRIBE PRODUCT EDIT HISTORY
========================================================= */

export const subscribeProductEditHistory = (
  productId,
  callback,
  onError
) => {
  const historyRef = collection(
    db,
    "products",
    productId,
    "editHistory"
  );

  const q = query(
    historyRef,
    orderBy("editedAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const history = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      callback(history);
    },
    (error) => {
      console.error(
        "Product history subscription failed:",
        error
      );

      onError?.(error);
    }
  );
};

/* =========================================================
   GET PRODUCT EDIT HISTORY
========================================================= */

export const getProductEditHistory = async (productId) => {
  const historyRef = collection(
    db,
    "products",
    productId,
    "editHistory"
  );

  const q = query(
    historyRef,
    orderBy("editedAt", "desc"),
    limit(100)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
};

/* =========================================================
   DELETE PRODUCT
========================================================= */

export const deleteProduct = async (productId) => {
  try {
    await deleteDoc(
      doc(db, "products", productId)
    );
  } catch (error) {
    console.error("Delete product failed:", error);
    throw error;
  }
};

/* =========================================================
   GET PRODUCT BY ID
========================================================= */

export const getProductById = async (productId) => {
  try {
    const productRef = doc(
      db,
      "products",
      productId
    );

    const snapshot = await getDoc(productRef);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    };
  } catch (error) {
    console.error("Get product failed:", error);
    throw error;
  }
};
