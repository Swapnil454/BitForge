"use client";

import GlobalHeader from "./GlobalHeader";

interface DynamicHeaderProps {
  title?: string;
}

export default function DynamicHeader({ title }: DynamicHeaderProps) {
  return <GlobalHeader />;
}
