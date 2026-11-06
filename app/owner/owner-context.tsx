"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  getOwnerServerSnapshot,
  getOwnerStoreSnapshot,
  setOwnerStoreNotice,
  subscribeOwnerStore,
  updateOwnerStore,
} from "./owner-store";
import type {
  OwnerCatalogItem,
  OwnerEmployee,
  OwnerPrototypeData,
} from "./prototype-types";

type OwnerPrototypeContextValue = OwnerPrototypeData & {
  notice: string;
  addEmployee: (employee: OwnerEmployee) => boolean;
  updateEmployee: (employee: OwnerEmployee) => boolean;
  deleteEmployee: (employeeId: string) => boolean;
  addCatalogItem: (item: OwnerCatalogItem) => boolean;
  updateCatalogItem: (item: OwnerCatalogItem) => boolean;
  deleteCatalogItem: (itemId: string) => boolean;
  addStock: (productId: string, quantity: number) => boolean;
  announce: (message: string) => void;
  clearNotice: () => void;
};

const OwnerPrototypeContext =
  createContext<OwnerPrototypeContextValue | null>(null);

function hasDuplicateName(values: { id: string; name: string }[], id: string, name: string) {
  const normalized = name.trim().toLocaleLowerCase("id-ID");
  return values.some((value) =>
    value.id !== id && value.name.trim().toLocaleLowerCase("id-ID") === normalized,
  );
}

export function OwnerPrototypeProvider({ children }: { children: ReactNode }) {
  const { data, notice } = useSyncExternalStore(
    subscribeOwnerStore,
    getOwnerStoreSnapshot,
    getOwnerServerSnapshot,
  );

  const addEmployee = useCallback((employee: OwnerEmployee) =>
    updateOwnerStore((current) => {
      const usernameTaken = current.employees.some((item) =>
        item.username.toLocaleLowerCase("id-ID") === employee.username.toLocaleLowerCase("id-ID"),
      );
      return usernameTaken ? null : { ...current, employees: [...current.employees, employee] };
    }, "Data karyawan ditambahkan pada prototipe browser."), []);

  const updateEmployee = useCallback((employee: OwnerEmployee) =>
    updateOwnerStore((current) => {
      const exists = current.employees.some((item) => item.id === employee.id);
      const usernameTaken = current.employees.some((item) =>
        item.id !== employee.id &&
        item.username.toLocaleLowerCase("id-ID") === employee.username.toLocaleLowerCase("id-ID"),
      );
      if (!exists || usernameTaken) return null;
      return {
        ...current,
        employees: current.employees.map((item) =>
          item.id === employee.id ? employee : item,
        ),
      };
    }, "Perubahan data karyawan disimpan pada prototipe browser."), []);

  const deleteEmployee = useCallback((employeeId: string) =>
    updateOwnerStore((current) => current.employees.some((item) => item.id === employeeId)
      ? { ...current, employees: current.employees.filter((item) => item.id !== employeeId) }
      : null, "Data karyawan dihapus dari prototipe."), []);

  const addCatalogItem = useCallback((item: OwnerCatalogItem) =>
    updateOwnerStore((current) => hasDuplicateName(current.catalog, "", item.name)
      ? null
      : { ...current, catalog: [...current.catalog, item] },
    `${item.kind} ditambahkan ke katalog prototipe.`), []);

  const updateCatalogItem = useCallback((item: OwnerCatalogItem) =>
    updateOwnerStore((current) => {
      if (!current.catalog.some((value) => value.id === item.id) ||
          hasDuplicateName(current.catalog, item.id, item.name)) return null;
      return {
        ...current,
        catalog: current.catalog.map((value) =>
          value.id === item.id ? item : value,
        ),
      };
    }, "Perubahan katalog disimpan pada prototipe browser."), []);

  const deleteCatalogItem = useCallback((itemId: string) =>
    updateOwnerStore((current) => current.catalog.some((item) => item.id === itemId)
      ? {
          ...current,
          catalog: current.catalog.filter((item) => item.id !== itemId),
          restocks: current.restocks.filter((restock) => restock.productId !== itemId),
        }
      : null, "Data dihapus dari katalog prototipe."), []);

  const addStock = useCallback((productId: string, quantity: number) =>
    updateOwnerStore((current) => {
      const product = current.catalog.find((item) => item.id === productId);
      if (!product || product.kind !== "Produk" ||
          !Number.isSafeInteger(quantity) || quantity <= 0 ||
          !Number.isSafeInteger((product.stock ?? 0) + quantity)) return null;
      return {
        ...current,
        catalog: current.catalog.map((item) =>
          item.id === productId ? { ...item, stock: (item.stock ?? 0) + quantity } : item,
        ),
        restocks: [
          {
            id: `restock-${crypto.randomUUID()}`,
            productId,
            quantity,
            date: new Date().toISOString().slice(0, 10),
          },
          ...current.restocks,
        ],
      };
    }, "Stok berhasil diperbarui pada prototipe browser."), []);

  const value = useMemo(
    () => ({
      ...data,
      notice,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      addCatalogItem,
      updateCatalogItem,
      deleteCatalogItem,
      addStock,
      announce: setOwnerStoreNotice,
      clearNotice: () => setOwnerStoreNotice(""),
    }),
    [
      addCatalogItem,
      addEmployee,
      addStock,
      data,
      deleteCatalogItem,
      deleteEmployee,
      notice,
      updateCatalogItem,
      updateEmployee,
    ],
  );

  return (
    <OwnerPrototypeContext.Provider value={value}>
      {children}
    </OwnerPrototypeContext.Provider>
  );
}

export function useOwnerPrototype() {
  const context = useContext(OwnerPrototypeContext);
  if (!context) {
    throw new Error("useOwnerPrototype must be used within OwnerPrototypeProvider.");
  }
  return context;
}
