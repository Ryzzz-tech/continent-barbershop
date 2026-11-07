export type OwnerEmployeeRole = "Kapster" | "Kasir";

export type OwnerEmployee = {
  id: string;
  name: string;
  role: OwnerEmployeeRole;
  phone: string;
  username: string;
  hasPassword: boolean;
};

export type OwnerCatalogKind = "Layanan" | "Produk";

export type OwnerCatalogItem = {
  id: string;
  name: string;
  kind: OwnerCatalogKind;
  price: number | null;
  description?: string;
  stock?: number;
};

export type OwnerRestock = {
  id: string;
  productId: string;
  quantity: number;
  date: string;
};

export type OwnerPrototypeData = {
  employees: OwnerEmployee[];
  catalog: OwnerCatalogItem[];
  restocks: OwnerRestock[];
};

export type OwnerPrototypeTransaction = {
  id: string;
  date: string;
  barber: string;
  item: string;
  total: number;
};
