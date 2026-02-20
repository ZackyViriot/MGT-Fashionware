import { notFound } from "next/navigation";
import { isValidGarmentType } from "@/constants/garment-types";
import { getEnabledCategories } from "@/hooks/category-settings-server";
import GarmentDesigner from "./GarmentDesigner";

export default async function CustomTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;

  if (!isValidGarmentType(type)) {
    notFound();
  }

  const enabled = await getEnabledCategories();
  if (!enabled.includes(type)) {
    notFound();
  }

  return <GarmentDesigner garmentType={type} />;
}
