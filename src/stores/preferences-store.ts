import { createPersistedStore } from '@/lib/store';

/**
 * User Preferences Store
 * 
 * Persisted store for user preferences and settings.
 * Automatically synced to localStorage.
 */

export type Theme = 'light' | 'dark' | 'system';
export type SidebarState = 'expanded' | 'collapsed';

export interface TablePreferences {
  pageSize: number;
  density: 'comfortable' | 'compact' | 'spacious';
  showRowNumbers: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  email: boolean;
}

interface PreferencesState {
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;
  
  // Sidebar
  sidebarState: SidebarState;
  setSidebarState: (state: SidebarState) => void;
  toggleSidebar: () => void;
  
  // Table preferences
  tablePreferences: TablePreferences;
  setTablePreferences: (prefs: Partial<TablePreferences>) => void;
  setTablePageSize: (pageSize: number) => void;
  setTableDensity: (density: TablePreferences['density']) => void;
  
  // Notifications
  notifications: NotificationSettings;
  setNotifications: (settings: Partial<NotificationSettings>) => void;
  toggleNotifications: () => void;
  
  // Recent items
  recentlyViewed: string[]; // IDs of recently viewed items
  addRecentlyViewed: (id: string) => void;
  clearRecentlyViewed: () => void;
  
  // Reset
  reset: () => void;
}

const defaultTablePreferences: TablePreferences = {
  pageSize: 25,
  density: 'comfortable',
  showRowNumbers: false,
};

const defaultNotifications: NotificationSettings = {
  enabled: true,
  sound: false,
  desktop: true,
  email: true,
};

export const usePreferencesStore = createPersistedStore<PreferencesState>(
  'user-preferences',
  (set, get) => ({
    // Initial state
    theme: 'system',
    sidebarState: 'expanded',
    tablePreferences: defaultTablePreferences,
    notifications: defaultNotifications,
    recentlyViewed: [],
    
    // Theme actions
    setTheme: (theme) => set({ theme }),
    
    // Sidebar actions
    setSidebarState: (sidebarState) => set({ sidebarState }),
    toggleSidebar: () => {
      const current = get().sidebarState;
      set({ sidebarState: current === 'expanded' ? 'collapsed' : 'expanded' });
    },
    
    // Table actions
    setTablePreferences: (prefs) => {
      const current = get().tablePreferences;
      set({ tablePreferences: { ...current, ...prefs } });
    },
    setTablePageSize: (pageSize) => {
      const current = get().tablePreferences;
      set({ tablePreferences: { ...current, pageSize } });
    },
    setTableDensity: (density) => {
      const current = get().tablePreferences;
      set({ tablePreferences: { ...current, density } });
    },
    
    // Notification actions
    setNotifications: (settings) => {
      const current = get().notifications;
      set({ notifications: { ...current, ...settings } });
    },
    toggleNotifications: () => {
      const current = get().notifications;
      set({ notifications: { ...current, enabled: !current.enabled } });
    },
    
    // Recently viewed actions
    addRecentlyViewed: (id) => {
      const current = get().recentlyViewed;
      // Remove if exists, add to front, keep last 10
      const updated = [id, ...current.filter((item) => item !== id)].slice(0, 10);
      set({ recentlyViewed: updated });
    },
    clearRecentlyViewed: () => set({ recentlyViewed: [] }),
    
    // Reset
    reset: () =>
      set({
        theme: 'system',
        sidebarState: 'expanded',
        tablePreferences: defaultTablePreferences,
        notifications: defaultNotifications,
        recentlyViewed: [],
      }),
  })
);

/**
 * Selectors for performance optimization
 */
export const usePreferencesSelectors = () => ({
  isDarkMode: usePreferencesStore((state) => state.theme === 'dark'),
  isSidebarCollapsed: usePreferencesStore((state) => state.sidebarState === 'collapsed'),
  areNotificationsEnabled: usePreferencesStore((state) => state.notifications.enabled),
});
