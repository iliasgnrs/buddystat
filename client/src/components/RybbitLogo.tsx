import Image from "next/image";
import { useEffect, useState } from "react";
import { useWhiteLabel } from "../hooks/useIsWhiteLabel";
import { Skeleton } from "./ui/skeleton";

export function RybbitLogo({ width = 32, height = 32 }: { width?: number; height?: number }) {
  const { whiteLabelImage, isPending } = useWhiteLabel();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isPending) {
    return <Skeleton style={{ width, height }} />;
  }

  if (whiteLabelImage) {
    return <Image src={whiteLabelImage} alt="BuddyStat" width={width} height={height} />;
  }

  return <Image src="/buddystat-icon.png" alt="BuddyStat" width={width} height={height} />;
}

export function RybbitTextLogo({ width = 150, height = 34 }: { width?: number; height?: number }) {
  const { whiteLabelImage, isPending } = useWhiteLabel();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isPending) {
    return <Skeleton style={{ width, height }} />;
  }

  if (whiteLabelImage) {
    return <Image src={whiteLabelImage} alt="BuddyStat" width={width} height={height} />;
  }

  return <Image src="/buddystat-text.png" alt="BuddyStat" width={width} height={height} />;
}
