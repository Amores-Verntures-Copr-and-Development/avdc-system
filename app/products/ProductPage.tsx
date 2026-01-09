"use client";

import PageHeader from "@/components/shared/PageHeader";
import React, { useEffect, useMemo, useState } from "react";

import PageLayout from "@/components/shared/PageLayout";

import { useSession } from "@/hooks/useSession";

import LoaderComponent from "@/components/shared/LoaderComponent";
import ProductStorePage from "./ProductStorePage";
import Table, { Column } from "@/components/shared/Table";
import { DisplayProductsDtos } from "@/dtos/products.dto";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { formatPeso } from "@/utils/formatPeso";
import DynamicDropdown from "@/components/shared/DynamicDropdown";
import { useStores } from "@/hooks/userStore";
import { Store } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/utils/fetcher";

const ProductPage = () => {
  const searchParams = useSearchParams();
  const { user, hasStore, loading, isAdmin } = useSession();
  const [storeId, setStoreId] = useState<number | null>(null);
  console.log({ user });
  const router = useRouter();
  const { stores } = useStores({ user, hasStore, isAdmin });
  const url = `/api/products/`;

  const storeOptions = Array.isArray(stores)
    ? stores.map((store) => ({
        label: store.storeName, // or whatever you want to show
        value: store.storeName, // optional leading icon if you have one
      }))
    : [];
  useEffect(() => {
    if (hasStore || user?.storeId || user?.storeId) {
      setStoreId(user?.storeId ?? 0);
      console.log({ storeId });
    }
  }, [user]);
  const columns: Column<DisplayProductsDtos>[] = [
    { key: "#", name: "#", selector: (_row, index) => index + 1 },
    { key: "prodName", name: "Product Name" },
    {
      key: "prodCreatedAt",
      name: "Created",
      selector: (row) => formatDateToWords(row.prodCreatedAt),
    },
    {
      name: "Variants",
      key: "productVariants",
      selector: (row) => {
        const variants = row.productVariants || [];
        // Assuming your row has a suppliers array
        console.log({ variants });
        return (
          <div className="group relative">
            <select
              className="border border-gray-300 rounded px-1 py-0.5 xl:px-2 xl:py-1 w-full text-[10px] xl:text-xs bg-gray-50 appearance-none cursor-default"
              disabled
            >
              <option value="">
                {variants.filter((s) => s !== null).length > 0
                  ? `Variants (${variants.filter((s) => s !== null).length})`
                  : "No Variannts"}
              </option>
            </select>

            {/* Show suppliers on hover */}
            {variants.filter((s) => s !== null).length > 0 && (
              <div className="absolute hidden group-hover:block z-10 top-full left-0 right-0 bg-white border border-gray-300 rounded shadow-lg max-h-32 overflow-y-auto">
                {variants
                  .filter((variants) => variants !== null)
                  .map((variants, index) => (
                    <div
                      key={index}
                      className="px-2 py-1 text-[10px] xl:text-xs hover:bg-gray-100 cursor-default"
                    >
                      {`${variants.prodVarName} (${formatPeso(
                        variants.prodVarPrice
                      )})`}
                    </div>
                  ))}
              </div>
            )}
          </div>
        );
      },
    },
  ];
  if (loading) return <LoaderComponent />;
  return (
    <PageLayout className="gap-4 p-2">
      {loading ? (
        <LoaderComponent />
      ) : (
        <ProductStorePage storeId={storeId} user={user} />
      )}
      {/* {loading ? (
        <LoaderComponent />
      ) : hasStore ? (
        <ProductStorePage storeId={storeId} user={user} />
      ) : (
        <>
          {" "}
          <PageHeader
            title={"Products"}
            subtitle="Add, edit, and track products"
          />
          <div className="flex-1 min-h-0">
            <Table
              columns={columns}
              data={itemResponse.data}
              maxHeight="h-full"
              searchUrl="/products"
              addContentLeftTitle={
                <div>
                  <DynamicDropdown
                    options={storeOptions}
                    onChange={function (value: string | number): void {
                      if (value) {
                        const url = new URL(window.location.href);
                        url.searchParams.set("store", String(value));
                        router.push(url.toString());
                      } else {
                        const url = new URL(window.location.href);
                        url.searchParams.delete("store"); // remove 'store'
                        router.push(url.toString());
                      }
                    }}
                    placeholder={`Store (${storeOptions.length})`}
                    icon={<Store className="w-4 h-4" />}
                    size="sm"
                  />
                </div>
              }
            />
          </div>
        </>
      )} */}
    </PageLayout>
  );
};

export default ProductPage;
