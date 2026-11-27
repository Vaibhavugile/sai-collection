import {
  collection,
  doc,
  endAt,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  startAt,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

const customersRef = collection(db, "customers");
const salesRef = collection(db, "sales");
const PAGE_SIZE = 25;

function getRange(dateFilter, custom = {}) {
  const now = new Date();
  let start;
  let end;

  if (dateFilter === "today") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  } else if (dateFilter === "7days") {
    start = new Date(now);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  } else if (dateFilter === "30days") {
    start = new Date(now);
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  } else if (dateFilter === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  } else if (dateFilter === "custom") {
    if (!custom.startDate || !custom.endDate) return null;
    start = custom.startDate instanceof Date ? new Date(custom.startDate) : new Date(`${custom.startDate}T00:00:00`);
    end = custom.endDate instanceof Date ? new Date(custom.endDate) : new Date(`${custom.endDate}T00:00:00`);
    end.setDate(end.getDate() + 1);
  } else {
    return null;
  }

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return { start: Timestamp.fromDate(start), end: Timestamp.fromDate(end) };
}

function normalizeCustomer(snapshot) {
  return { id: snapshot.id, ...snapshot.data() };
}

export async function getCustomerCount() {
  const result = await getCountFromServer(customersRef);
  return result.data().count || 0;
}

export async function getCustomersPage({
  sort = "recent",
  dateFilter = "all",
  custom = {},
  lastDoc = null,
  pageSize = PAGE_SIZE,
} = {}) {
  if (dateFilter === "custom" && (!custom.startDate || !custom.endDate)) {
    return { customers: [], lastDoc: null, hasMore: false };
  }
  const range = getRange(dateFilter, custom);
  const constraints = [];

  // A date filter means customers whose LAST purchase was in that period.
  // Firestore requires updatedAt to lead the ordering for this range query.
  if (range) {
    constraints.push(
      where("updatedAt", ">=", range.start),
      where("updatedAt", "<", range.end),
      orderBy("updatedAt", "desc")
    );
  } else {
    const sortField = sort === "spending" ? "totalSpent" : sort === "visits" ? "totalOrders" : "updatedAt";
    constraints.push(orderBy(sortField, "desc"));
  }

  if (lastDoc) constraints.push(startAfter(lastDoc));
  constraints.push(limit(pageSize));

  const snapshot = await getDocs(query(customersRef, ...constraints));
  return {
    customers: snapshot.docs.map(normalizeCustomer),
    lastDoc: snapshot.docs.length ? snapshot.docs[snapshot.docs.length - 1] : null,
    hasMore: snapshot.docs.length === pageSize,
  };
}

export async function searchCustomers(searchText) {
  const value = String(searchText || "").trim();
  if (!value) return [];

  // Mobile numbers are customer document IDs, so exact mobile lookup costs one read.
  if (/^\d{1,10}$/.test(value)) {
    const snapshot = await getDoc(doc(db, "customers", value));
    return snapshot.exists() ? [normalizeCustomer(snapshot)] : [];
  }

  // Name search is a prefix search. Firestore string matching is case-sensitive.
  const nameQuery = query(
    customersRef,
    orderBy("name"),
    startAt(value),
    endAt(`${value}\uf8ff`),
    limit(PAGE_SIZE)
  );
  const snapshot = await getDocs(nameQuery);
  return snapshot.docs.map(normalizeCustomer);
}

export async function getCustomerBillsPage(mobile, lastDoc = null, pageSize = 20) {
  if (!mobile) return { bills: [], lastDoc: null, hasMore: false };
  const constraints = [
    where("customer.mobile", "==", mobile),
    orderBy("createdAt", "desc"),
  ];
  if (lastDoc) constraints.push(startAfter(lastDoc));
  constraints.push(limit(pageSize));
  const snapshot = await getDocs(query(salesRef, ...constraints));
  return {
    bills: snapshot.docs.map(normalizeCustomer),
    lastDoc: snapshot.docs.length ? snapshot.docs[snapshot.docs.length - 1] : null,
    hasMore: snapshot.docs.length === pageSize,
  };
}

export { PAGE_SIZE };
