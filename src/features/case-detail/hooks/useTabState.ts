import { useState } from "react";
import type { TabType } from "../types";

export function useTabState(initialTab: TabType = "overview") {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  return {
    activeTab,
    setActiveTab,
  };
}
