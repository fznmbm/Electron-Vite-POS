import { useState, useEffect, useCallback } from "react";
import { StoreSettings } from "../../electron/settings";

export function useSettings() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all settings
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await window.settings.getAll();
      setSettings(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching settings:", err);
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  // Get a specific setting
  const getSetting = useCallback(
    async <K extends keyof StoreSettings>(
      key: K
    ): Promise<StoreSettings[K]> => {
      try {
        return await window.settings.get(key);
      } catch (err) {
        console.error(`Error getting setting: ${String(key)}`, err);
        throw err;
      }
    },
    []
  );

  // Update a specific setting
  const updateSetting = useCallback(
    async <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => {
      try {
        const success = await window.settings.set(key, value);
        if (success) {
          await fetchSettings(); // Refresh all settings
        }
        return success;
      } catch (err) {
        console.error(`Error updating setting: ${String(key)}`, err);
        throw err;
      }
    },
    [fetchSettings]
  );

  // Update multiple settings at once
  const updateSettings = useCallback(
    async (newSettings: Partial<StoreSettings>) => {
      try {
        const success = await window.settings.update(newSettings);
        if (success) {
          await fetchSettings(); // Refresh all settings
        }
        return success;
      } catch (err) {
        console.error("Error updating settings:", err);
        throw err;
      }
    },
    [fetchSettings]
  );

  // Reset all settings to defaults
  const resetSettings = useCallback(async () => {
    try {
      const success = await window.settings.reset();
      if (success) {
        await fetchSettings(); // Refresh all settings
      }
      return success;
    } catch (err) {
      console.error("Error resetting settings:", err);
      throw err;
    }
  }, [fetchSettings]);

  // Load settings on mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Return functions and state
  return {
    settings,
    loading,
    error,
    fetchSettings,
    getSetting,
    updateSetting,
    updateSettings,
    resetSettings,
  };
}
