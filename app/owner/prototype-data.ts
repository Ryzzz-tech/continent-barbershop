import type {
  OwnerCatalogItem,
  OwnerEmployee,
  OwnerPrototypeData,
  OwnerPrototypeTransaction,
} from "./prototype-types";
import { customerServices } from "../../lib/data/services";

export const OWNER_STORAGE_KEY = "continent-barbershop-owner-prototype-v2";
export const LEGACY_OWNER_STORAGE_KEY = "continent-barbershop-owner-prototype-v1";

export const initialOwnerEmployees: OwnerEmployee[] = [
  { id: "owner-kapster-1", name: "Kapster 1", role: "Kapster", phone: "0812-0000-0001", username: "kapster1", hasPassword: true },
  { id: "owner-kapster-2", name: "Kapster 2", role: "Kapster", phone: "0812-0000-0002", username: "kapster2", hasPassword: true },
  { id: "owner-kapster-3", name: "Kapster 3", role: "Kapster", phone: "0812-0000-0003", username: "kapster3", hasPassword: true },
  { id: "owner-kasir-1", name: "Kasir 1", role: "Kasir", phone: "0812-0000-0004", username: "kasir1", hasPassword: true },
  { id: "owner-kasir-2", name: "Kasir 2", role: "Kasir", phone: "0812-0000-0005", username: "kasir2", hasPassword: true },
];

export const initialOwnerCatalog: OwnerCatalogItem[] = [
  ...customerServices.map((service) => ({
    id: service.id,
    name: service.name,
    kind: "Layanan" as const,
    price: service.price,
    ...(service.description ? { description: service.description } : {}),
  })),
  { id: "owner-pomade", name: "Pomade", kind: "Produk", price: 25000, stock: 24 },
  { id: "owner-hair-tonic", name: "Hair Tonic", kind: "Produk", price: 30000, stock: 12 },
  { id: "owner-shampoo", name: "Shampoo", kind: "Produk", price: null, stock: 18 },
  { id: "owner-minyak-rambut", name: "Minyak Rambut", kind: "Produk", price: null, stock: 15 },
  { id: "owner-wax-rambut", name: "Wax Rambut", kind: "Produk", price: null, stock: 9 },
];

export const initialOwnerData: OwnerPrototypeData = {
  employees: initialOwnerEmployees,
  catalog: initialOwnerCatalog,
  restocks: [],
};

export const ownerPrototypeTransactions: OwnerPrototypeTransaction[] = [
  { id: "owner-tx-1", date: "2026-10-01", barber: "Kapster 1", item: "Potong Rambut", total: 35000 },
  { id: "owner-tx-2", date: "2026-10-01", barber: "Kapster 2", item: "Potong + Cuci Rambut", total: 50000 },
  { id: "owner-tx-3", date: "2026-10-02", barber: "Kapster 1", item: "Potong Rambut", total: 35000 },
  { id: "owner-tx-4", date: "2026-10-02", barber: "Kapster 3", item: "Pomade", total: 25000 },
  { id: "owner-tx-5", date: "2026-10-03", barber: "Kapster 2", item: "Potong + Cuci Rambut", total: 50000 },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEmployee(value: unknown): value is OwnerEmployee {
  if (!isRecord(value)) return false;
  return typeof value.id === "string" &&
    typeof value.name === "string" &&
    (value.role === "Kapster" || value.role === "Kasir") &&
    typeof value.phone === "string" &&
    typeof value.username === "string" &&
    typeof value.hasPassword === "boolean";
}

function isCatalogItem(value: unknown): value is OwnerCatalogItem {
  if (!isRecord(value)) return false;
  return typeof value.id === "string" &&
    typeof value.name === "string" &&
    (value.kind === "Layanan" || value.kind === "Produk") &&
    (value.price === null || (typeof value.price === "number" && Number.isFinite(value.price))) &&
    (!("description" in value) || typeof value.description === "string") &&
    (value.kind === "Layanan"
      ? !("stock" in value)
      : Number.isSafeInteger(value.stock) && Number(value.stock) >= 0);
}

function isRestock(value: unknown): value is OwnerPrototypeData["restocks"][number] {
  if (!isRecord(value)) return false;
  return typeof value.id === "string" &&
    typeof value.productId === "string" &&
    Number.isSafeInteger(value.quantity) &&
    Number(value.quantity) > 0 &&
    typeof value.date === "string";
}

export function parseOwnerPrototypeData(value: unknown): OwnerPrototypeData | null {
  if (!isRecord(value) ||
      !Array.isArray(value.employees) ||
      !Array.isArray(value.catalog) ||
      !Array.isArray(value.restocks) ||
      !value.employees.every(isEmployee) ||
      !value.catalog.every(isCatalogItem) ||
      !value.restocks.every(isRestock)) {
    return null;
  }

  const employees = value.employees as OwnerEmployee[];
  const catalog = value.catalog as OwnerCatalogItem[];
  const restocks = value.restocks as OwnerPrototypeData["restocks"];
  const uniqueIds = (ids: string[]) => new Set(ids).size === ids.length;
  if (!uniqueIds(employees.map((employee) => employee.id)) ||
      !uniqueIds(catalog.map((item) => item.id)) ||
      !uniqueIds(restocks.map((restock) => restock.id))) {
    return null;
  }

  return { employees, catalog, restocks };
}
