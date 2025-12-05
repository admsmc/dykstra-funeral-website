import { trpc } from "@/lib/trpc-client";
import type { ServiceType } from "../types";

export function useCatalogs(serviceType: ServiceType | null, productCategory?: string, searchQuery?: string) {
  const servicesQuery = trpc.contract.getServiceCatalog.useQuery(
    {
      serviceType: serviceType!,
      availableOnly: true,
    },
    {
      enabled: serviceType !== null,
    }
  );

  const productsQuery = trpc.contract.getProductCatalog.useQuery({
    category: productCategory && productCategory !== 'all' ? (productCategory as any) : undefined,
    search: searchQuery || undefined,
    availableOnly: true,
  });

  return {
    services: servicesQuery.data,
    products: productsQuery.data,
    isLoadingServices: servicesQuery.isLoading,
    isLoadingProducts: productsQuery.isLoading,
  };
}
