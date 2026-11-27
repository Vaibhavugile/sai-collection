
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase";

/*
|--------------------------------------------------------------------------
| INVENTORY ANALYTICS SERVICE
|--------------------------------------------------------------------------
|
| Firestore structure:
|
| inventorySummaries/
|   global
|   meta
|   categories_CATEGORY_ID
|   subcategories_SUBCATEGORY_ID
|
| Existing products are never modified by this service.
|
*/

const PRODUCTS_COLLECTION = "products";
const SUMMARIES_COLLECTION = "inventorySummaries";

const PAGE_SIZE = 50;
const MAX_BATCH_WRITES = 450;

/* -----------------------------------------------------------------------
   HELPERS
------------------------------------------------------------------------ */

const number = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const safeId = (value) =>
  encodeURIComponent(String(value || "unassigned"));

const isProductActive = (status) => {
  if (typeof status === "boolean") return status;
  return String(status ?? "active").toLowerCase() === "active";
};

const isVariantActive = (status) => status !== false;

const createEmptySummary = () => ({
  totalProducts: 0,
  activeProducts: 0,
  inactiveProducts: 0,

  totalVariants: 0,
  activeVariants: 0,
  inactiveVariants: 0,

  totalStock: 0,

  lowStockVariants: 0,
  outOfStockVariants: 0,

  purchaseInventoryValue: 0,
  sellingInventoryValue: 0,
  potentialGrossProfit: 0,
});

const getProductVariants = (product) =>
  Array.isArray(product?.variants) ? product.variants : [];

/*
 * All financial values represent current stock valuation:
 * purchasePrice × stock
 * sellingPrice × stock
 */
const addProductToSummary = (summary, product) => {
  summary.totalProducts += 1;

  const productActive = isProductActive(product.status);

  if (productActive) {
    summary.activeProducts += 1;
  } else {
    summary.inactiveProducts += 1;
  }

  const variants = getProductVariants(product);

  variants.forEach((variant) => {
    const stock = Math.max(0, number(variant.stock));
    const purchasePrice = Math.max(0, number(variant.purchasePrice));
    const sellingPrice = Math.max(0, number(variant.sellingPrice));
    const lowStock = Math.max(0, number(variant.lowStock));

    const variantActive = isVariantActive(variant.status);

    summary.totalVariants += 1;
    summary.totalStock += stock;

    if (variantActive) {
      summary.activeVariants += 1;
    } else {
      summary.inactiveVariants += 1;
    }

    if (stock <= 0) {
      summary.outOfStockVariants += 1;
    } else if (lowStock > 0 && stock <= lowStock) {
      summary.lowStockVariants += 1;
    }

    summary.purchaseInventoryValue += purchasePrice * stock;
    summary.sellingInventoryValue += sellingPrice * stock;
  });
};

const finishSummary = (summary) => ({
  ...summary,
  potentialGrossProfit:
    summary.sellingInventoryValue - summary.purchaseInventoryValue,
});

/* -----------------------------------------------------------------------
   SUMMARY DOCUMENT REFERENCES
------------------------------------------------------------------------ */

const globalSummaryRef = () =>
  doc(db, SUMMARIES_COLLECTION, "global");

const metaSummaryRef = () =>
  doc(db, SUMMARIES_COLLECTION, "meta");

const categorySummaryRef = (categoryId) =>
  doc(
    db,
    SUMMARIES_COLLECTION,
    `categories_${safeId(categoryId)}`
  );

const subCategorySummaryRef = (subCategoryId) =>
  doc(
    db,
    SUMMARIES_COLLECTION,
    `subcategories_${safeId(subCategoryId)}`
  );

/* -----------------------------------------------------------------------
   READ SUMMARY
------------------------------------------------------------------------ */

export const getInventorySummary = async () => {
  const snapshot = await getDoc(globalSummaryRef());

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
};

export const getCategoryInventorySummary = async (categoryId) => {
  if (!categoryId) return null;

  const snapshot = await getDoc(categorySummaryRef(categoryId));

  return snapshot.exists()
    ? { id: snapshot.id, ...snapshot.data() }
    : null;
};

export const getSubCategoryInventorySummary = async (subCategoryId) => {
  if (!subCategoryId) return null;

  const snapshot = await getDoc(
    subCategorySummaryRef(subCategoryId)
  );

  return snapshot.exists()
    ? { id: snapshot.id, ...snapshot.data() }
    : null;
};

/* -----------------------------------------------------------------------
   ONE-TIME / MANUAL SUMMARY REBUILD
------------------------------------------------------------------------ */

/*
 * IMPORTANT:
 * This operation reads every product once.
 *
 * For 3,000 products, expect approximately 3,000 document reads.
 * It is intended for initial setup or occasional reconciliation,
 * NOT for normal dashboard loading.
 *
 * Summary writes are batched in groups below Firestore's 500-write limit.
 */

export const rebuildInventorySummaries = async ({
  onProgress,
} = {}) => {
  const productsRef = collection(db, PRODUCTS_COLLECTION);

  const snapshot = await getDocs(productsRef);

  const globalSummary = createEmptySummary();

  const categorySummaries = new Map();
  const subCategorySummaries = new Map();

  const total = snapshot.size;
  let processed = 0;

  snapshot.docs.forEach((productDoc) => {
    const product = {
      id: productDoc.id,
      ...productDoc.data(),
    };

    addProductToSummary(globalSummary, product);

    const categoryId = product.categoryId || "unassigned";
    const categoryName = product.categoryName || "Unassigned";

    if (!categorySummaries.has(categoryId)) {
      categorySummaries.set(categoryId, {
        ...createEmptySummary(),
        categoryId,
        categoryName,
      });
    }

    addProductToSummary(
      categorySummaries.get(categoryId),
      product
    );

    const subCategoryId =
      product.subCategoryId ||
      product.subcategoryId ||
      "unassigned";

    const subCategoryName =
      product.subCategoryName ||
      product.subcategoryName ||
      "Unassigned";

    if (!subCategorySummaries.has(subCategoryId)) {
      subCategorySummaries.set(subCategoryId, {
        ...createEmptySummary(),
        subCategoryId,
        subCategoryName,
        categoryId,
        categoryName,
      });
    }

    addProductToSummary(
      subCategorySummaries.get(subCategoryId),
      product
    );

    processed += 1;

    if (processed % 100 === 0 || processed === total) {
      onProgress?.({
        processed,
        total,
        percentage: total
          ? Math.round((processed / total) * 100)
          : 100,
      });
    }
  });

  const rebuildTime = new Date().toISOString();

  const operations = [];

  operations.push({
    ref: globalSummaryRef(),
    data: {
      ...finishSummary(globalSummary),
      summaryVersion: 1,
      productCount: total,
      rebuiltAt: serverTimestamp(),
      rebuildTime,
    },
  });

  categorySummaries.forEach((summary, id) => {
    operations.push({
      ref: categorySummaryRef(id),
      data: {
        ...finishSummary(summary),
        rebuiltAt: serverTimestamp(),
        rebuildTime,
      },
    });
  });

  subCategorySummaries.forEach((summary, id) => {
    operations.push({
      ref: subCategorySummaryRef(id),
      data: {
        ...finishSummary(summary),
        rebuiltAt: serverTimestamp(),
        rebuildTime,
      },
    });
  });

  operations.push({
    ref: metaSummaryRef(),
    data: {
      initialized: true,
      summaryVersion: 1,
      totalProducts: total,
      totalCategories: categorySummaries.size,
      totalSubCategories: subCategorySummaries.size,
      rebuiltAt: serverTimestamp(),
      rebuildTime,
    },
  });

  /*
   * Commit in safe batches.
   * Each batch contains at most 450 writes.
   */
  for (
    let index = 0;
    index < operations.length;
    index += MAX_BATCH_WRITES
  ) {
    const batch = writeBatch(db);

    const chunk = operations.slice(
      index,
      index + MAX_BATCH_WRITES
    );

    chunk.forEach(({ ref, data }) => {
      batch.set(ref, data);
    });

    await batch.commit();
  }

  return {
    totalProducts: total,
    totalCategories: categorySummaries.size,
    totalSubCategories: subCategorySummaries.size,
    summary: finishSummary(globalSummary),
    rebuiltAt: rebuildTime,
  };
};

/* -----------------------------------------------------------------------
   PAGINATED PRODUCT FETCH
------------------------------------------------------------------------ */

/*
 * Fetches 50 products by default.
 *
 * Pass the returned lastVisible document as cursor
 * when requesting the next page.
 *
 * Category and subcategory filters are performed by Firestore.
 * Variant attribute filtering is handled separately because
 * variants are currently stored as an array in each product.
 */

export const fetchProductsPage = async ({
  pageSize = PAGE_SIZE,
  cursor = null,
  categoryId = "",
  subCategoryId = "",
} = {}) => {
  const productsRef = collection(db, PRODUCTS_COLLECTION);

  const constraints = [];

  if (categoryId) {
    constraints.push(where("categoryId", "==", categoryId));
  }

  if (subCategoryId) {
    constraints.push(
      where("subCategoryId", "==", subCategoryId)
    );
  }

  constraints.push(orderBy("createdAt", "desc"));
  constraints.push(limit(pageSize));

  if (cursor) {
    constraints.splice(
      constraints.length - 1,
      0,
      startAfter(cursor)
    );
  }

  const q = query(productsRef, ...constraints);
  const snapshot = await getDocs(q);

  const products = snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));

  const lastVisible =
    snapshot.docs.length > 0
      ? snapshot.docs[snapshot.docs.length - 1]
      : null;

  return {
    products,
    lastVisible,
    hasMore: snapshot.docs.length === pageSize,
    count: products.length,
  };
};

/* -----------------------------------------------------------------------
   SUMMARY INITIALIZATION STATUS
------------------------------------------------------------------------ */

export const getInventorySummaryStatus = async () => {
  const snapshot = await getDoc(metaSummaryRef());

  if (!snapshot.exists()) {
    return {
      initialized: false,
      totalProducts: 0,
      rebuiltAt: null,
    };
  }

  return snapshot.data();
};


/* -----------------------------------------------------------------------
   INCREMENTAL SUMMARY HELPERS
------------------------------------------------------------------------ */

const getProductContribution = (product) => {
  const summary = createEmptySummary();

  if (!product) return summary;

  addProductToSummary(summary, product);

  return finishSummary(summary);
};

const subtractSummary = (target, contribution) => {
  Object.keys(createEmptySummary()).forEach((key) => {
    target[key] =
      number(target[key]) - number(contribution[key]);
  });
};

const addSummary = (target, contribution) => {
  Object.keys(createEmptySummary()).forEach((key) => {
    target[key] =
      number(target[key]) + number(contribution[key]);
  });
};

/*
 * These helpers are intended for use inside a Firestore transaction.
 * All required documents must be read before any transaction writes.
 */

export const getProductSummaryReferences = (product) => {
  if (!product) return [];

  const categoryId = product.categoryId || "unassigned";

  const subCategoryId =
    product.subCategoryId ||
    product.subcategoryId ||
    "unassigned";

  return [
    globalSummaryRef(),
    categorySummaryRef(categoryId),
    subCategorySummaryRef(subCategoryId),
  ];
};

export const getSummaryContribution = (product) =>
  getProductContribution(product);

export const applySummaryDifference = ({
  transaction,
  oldProduct,
  newProduct,
  snapshots,
}) => {
  const oldContribution = getProductContribution(oldProduct);
  const newContribution = getProductContribution(newProduct);

  const oldCategoryId = oldProduct?.categoryId || "unassigned";
  const newCategoryId = newProduct?.categoryId || "unassigned";

  const oldSubCategoryId =
    oldProduct?.subCategoryId ||
    oldProduct?.subcategoryId ||
    "unassigned";

  const newSubCategoryId =
    newProduct?.subCategoryId ||
    newProduct?.subcategoryId ||
    "unassigned";

  const changes = new Map();

  const addChange = (ref, snapshot, contribution, sign, metadata = {}) => {
    const key = ref.path;

    if (!changes.has(key)) {
      changes.set(key, {
        ref,
        data: snapshot?.exists()
          ? { ...snapshot.data() }
          : createEmptySummary(),
      });
    }

    const current = changes.get(key).data;

    const operation =
      sign === -1 ? subtractSummary : addSummary;

    operation(current, contribution);

    Object.assign(current, metadata);
  };

  const globalRef = globalSummaryRef();

  addChange(
    globalRef,
    snapshots.global,
    oldContribution,
    -1
  );

  addChange(
    globalRef,
    snapshots.global,
    newContribution,
    1
  );

  if (oldProduct) {
    const ref = categorySummaryRef(oldCategoryId);

    addChange(
      ref,
      snapshots.categories.get(oldCategoryId),
      oldContribution,
      -1
    );

    const subRef = subCategorySummaryRef(oldSubCategoryId);

    addChange(
      subRef,
      snapshots.subCategories.get(oldSubCategoryId),
      oldContribution,
      -1
    );
  }

  if (newProduct) {
    const ref = categorySummaryRef(newCategoryId);

    addChange(
      ref,
      snapshots.categories.get(newCategoryId),
      newContribution,
      1,
      {
        categoryId: newCategoryId,
        categoryName: newProduct.categoryName || "Unassigned",
      }
    );

    const subRef = subCategorySummaryRef(newSubCategoryId);

    addChange(
      subRef,
      snapshots.subCategories.get(newSubCategoryId),
      newContribution,
      1,
      {
        subCategoryId: newSubCategoryId,
        subCategoryName:
          newProduct.subCategoryName ||
          newProduct.subcategoryName ||
          "Unassigned",
        categoryId: newCategoryId,
        categoryName: newProduct.categoryName || "Unassigned",
      }
    );
  }

  changes.forEach(({ ref, data }) => {
    const finalData = {};

    Object.keys(createEmptySummary()).forEach((key) => {
      finalData[key] = Math.max(0, number(data[key]));
    });

    finalData.potentialGrossProfit =
      finalData.sellingInventoryValue -
      finalData.purchaseInventoryValue;

    finalData.updatedAt = serverTimestamp();

    transaction.set(ref, finalData, { merge: true });
  });
};
