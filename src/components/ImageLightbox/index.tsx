"use client";

import { type RefObject } from "react";

import { useLocale } from "@/stores/settingsStore";
import { LightboxDialog } from "./LightboxDialog";
import { useFigureRegistry, useFigureTriggers } from "./figures";
import { useFigureUrl } from "./useFigureUrl";
import { useLightboxState } from "./useLightboxState";
import { useVariantContext } from "./useVariantContext";

interface Props {
  contentRef: RefObject<HTMLDivElement | null>;
}

export function ImageLightbox({ contentRef }: Props) {
  const { t } = useLocale();
  const { effectiveDark, isMobile } = useVariantContext();
  const figures = useFigureRegistry(contentRef, t);
  const state = useLightboxState(figures, effectiveDark, isMobile);
  useFigureTriggers(contentRef, state.openFromTrigger);
  useFigureUrl(state.index, state.count, state.openAt);

  return <LightboxDialog state={state} effectiveDark={effectiveDark} isMobile={isMobile} />;
}
