import { notFound } from "next/navigation";
import { isValidGarmentType, GARMENT_CONFIGS } from "@/constants/garment-types";
import { getEnabledCategories } from "@/hooks/category-settings-server";
import GarmentDesigner from "./GarmentDesigner";
import type { Metadata } from "next";

type Props = { params: Promise<{ type: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params;
  if (!isValidGarmentType(type)) return { title: "Custom Designer" };
  const config = GARMENT_CONFIGS[type];
  return {
    title: `Design Your ${config.label}`,
    description: config.description ?? `Create a custom ${config.label.toLowerCase()} with the MGT Fashion designer.`,
  };
}

export default async function CustomTypePage({ params }: Props) {
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
