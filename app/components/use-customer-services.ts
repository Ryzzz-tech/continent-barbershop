"use client";

import { useSyncExternalStore } from "react";
import {
  getCustomerServicesSnapshot,
  getServerCustomerServicesSnapshot,
  subscribeOwnerStore,
} from "../owner/owner-store";

export function useCustomerServices() {
  return useSyncExternalStore(
    subscribeOwnerStore,
    getCustomerServicesSnapshot,
    getServerCustomerServicesSnapshot,
  );
}
