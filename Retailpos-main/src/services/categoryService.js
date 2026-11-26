
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

import { db, storage } from "../firebase";

/* ===================================================
   COLLECTION
=================================================== */

const categoryCollection = collection(db, "categories");

const getCategoryRef = (id) => {
  if (!id) {
    throw new Error("Category ID is required.");
  }

  return doc(db, "categories", id);
};

/* ===================================================
   CREATE SLUG
=================================================== */

export const createCategorySlug = (name) => {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/-+/g, "-");
};

/* ===================================================
   UPLOAD CATEGORY IMAGE
=================================================== */

export const uploadCategoryImage = async (file) => {
  if (!file) {
    throw new Error("Please select a category image.");
  }

  if (!file.type?.startsWith("image/")) {
    throw new Error("Selected file must be an image.");
  }

  const safeFileName = file.name
    .replace(/[^\w.-]/g, "-");

  const fileName = `${Date.now()}-${safeFileName}`;

  const imageRef = ref(
    storage,
    `categories/${fileName}`
  );

  await uploadBytes(imageRef, file, {
    contentType: file.type,
  });

  const imageUrl = await getDownloadURL(imageRef);

  return {
    imageUrl,
    imagePath: imageRef.fullPath,
  };
};

/* ===================================================
   DELETE CATEGORY IMAGE
=================================================== */

export const deleteCategoryImage = async (
  imagePath
) => {
  if (!imagePath) return;

  try {
    await deleteObject(ref(storage, imagePath));
  } catch (error) {
    // Image may already be missing.
    // Do not block category deletion for this reason.
    if (error.code !== "storage/object-not-found") {
      console.error("Category image deletion failed:", error);
    }
  }
};

/* ===================================================
   ADD CATEGORY
=================================================== */

export const addCategory = async (category) => {
  if (!category?.name?.trim()) {
    throw new Error("Category name is required.");
  }

  const name = category.name.trim();

  const categoryData = {
    ...category,

    name,
    slug: category.slug || createCategorySlug(name),

    description: category.description?.trim() || "",

    image: category.image || null,
    imagePath: category.imagePath || null,

    status: category.status ?? true,

    productCount: category.productCount ?? 0,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  return await addDoc(
    categoryCollection,
    categoryData
  );
};

/* ===================================================
   REALTIME CATEGORY LISTENER
=================================================== */

export const subscribeCategories = (
  callback,
  onError
) => {
  if (typeof callback !== "function") {
    throw new Error("A category callback is required.");
  }

  const q = query(
    categoryCollection,
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const categories = snapshot.docs.map(
        (categoryDoc) => ({
          id: categoryDoc.id,
          ...categoryDoc.data(),
        })
      );

      callback(categories);
    },
    (error) => {
      console.error("Category subscription error:", error);

      if (typeof onError === "function") {
        onError(error);
      }
    }
  );
};

/* ===================================================
   GET ALL CATEGORIES
=================================================== */

export const getCategories = async () => {
  const q = query(
    categoryCollection,
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((categoryDoc) => ({
    id: categoryDoc.id,
    ...categoryDoc.data(),
  }));
};

/* ===================================================
   GET SINGLE CATEGORY
=================================================== */

export const getCategory = async (id) => {
  const snapshot = await getDoc(
    getCategoryRef(id)
  );

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
};

/* ===================================================
   UPDATE CATEGORY
=================================================== */

export const updateCategory = async (
  id,
  data
) => {
  if (!data || typeof data !== "object") {
    throw new Error("Valid category data is required.");
  }

  const updateData = {
    ...data,
    updatedAt: serverTimestamp(),
  };

  // Never overwrite the original creation timestamp.
  delete updateData.createdAt;
  delete updateData.id;

  if (updateData.name !== undefined) {
    const name = String(updateData.name).trim();

    if (!name) {
      throw new Error("Category name is required.");
    }

    updateData.name = name;

    if (!updateData.slug) {
      updateData.slug = createCategorySlug(name);
    }
  }

  if (updateData.description !== undefined) {
    updateData.description = String(
      updateData.description
    ).trim();
  }

  await updateDoc(
    getCategoryRef(id),
    updateData
  );
};

/* ===================================================
   REPLACE CATEGORY IMAGE
=================================================== */

export const replaceCategoryImage = async (
  oldImagePath,
  newFile
) => {
  if (!newFile) {
    throw new Error("New category image is required.");
  }

  // Upload first so the old image is retained if
  // the new upload fails.
  const uploadResult = await uploadCategoryImage(newFile);

  // Delete old image only after successful upload.
  if (oldImagePath) {
    await deleteCategoryImage(oldImagePath);
  }

  return uploadResult;
};

/* ===================================================
   UPDATE CATEGORY WITH NEW IMAGE
=================================================== */

export const updateCategoryWithImage = async (
  id,
  data,
  newImageFile,
  oldImagePath = ""
) => {
  let imageData = {};

  if (newImageFile) {
    const uploadResult = await uploadCategoryImage(
      newImageFile
    );

    imageData = {
      image: uploadResult.imageUrl,
      imagePath: uploadResult.imagePath,
    };
  }

  try {
    await updateCategory(id, {
      ...data,
      ...imageData,
    });
  } catch (error) {
    // If Firestore update fails, clean up the newly
    // uploaded image to avoid an orphaned Storage file.
    if (imageData.imagePath) {
      await deleteCategoryImage(imageData.imagePath);
    }

    throw error;
  }

  // Delete the old image only after Firestore succeeds.
  if (imageData.imagePath && oldImagePath) {
    await deleteCategoryImage(oldImagePath);
  }
};

/* ===================================================
   DELETE CATEGORY
=================================================== */

export const deleteCategory = async (
  id,
  imagePath = ""
) => {
  const categoryRef = getCategoryRef(id);

  // Confirm that the document exists.
  const snapshot = await getDoc(categoryRef);

  if (!snapshot.exists()) {
    throw new Error("Category not found.");
  }

  // Delete Firestore document first.
  await deleteDoc(categoryRef);

  // Then attempt to remove its Storage image.
  if (imagePath) {
    await deleteCategoryImage(imagePath);
  }

  return true;
};
