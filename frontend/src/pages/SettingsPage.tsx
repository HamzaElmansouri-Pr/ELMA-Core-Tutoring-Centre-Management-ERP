import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSettings } from "@/api/settings";
import { updateSettings } from "@/api/settings";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export function SettingsPage() {
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();
  const [centerName, setCenterName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [defaultLocale, setDefaultLocale] = useState("en");
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
  });

  useEffect(() => {
    if (settings) {
      setCenterName(settings.center_name || "");
      setAddress(settings.address || "");
      setPhone(settings.phone || "");
      setDefaultLocale(settings.default_locale || "en");
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("center_name", centerName);
      formData.append("address", address);
      formData.append("phone", phone);
      formData.append("default_locale", defaultLocale);
      if (logoFile) {
        formData.append("logo", logoFile);
      }
      return updateSettings(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      alert(t('settings_saved', 'Settings saved successfully!'));
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || t('error_saving_settings', 'Failed to save settings.'));
    }
  });

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">{t('global_settings', 'Global Settings')}</h1>

      <div className="bg-white p-6 border rounded-md shadow-sm dark:bg-slate-900 space-y-4">
        
        {settings?.logo_url && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">{t('current_logo', 'Current Logo')}</p>
            <img src={settings.logo_url} alt="Logo" className="h-16 object-contain" />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">{t('upload_new_logo', 'Upload New Logo')}</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t('center_name', 'Center Name')}</label>
          <input 
            type="text" 
            value={centerName} 
            onChange={(e) => setCenterName(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t('address', 'Address')}</label>
          <textarea 
            value={address} 
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border rounded px-3 py-2"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t('phone_number', 'Phone Number')}</label>
          <input 
            type="text" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t('default_locale', 'Default Locale')}</label>
          <select 
            value={defaultLocale} 
            onChange={(e) => setDefaultLocale(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="ar">العربية</option>
          </select>
        </div>

        <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? t('saving', 'Saving...') : t('save_settings', 'Save Settings')}
        </Button>
      </div>
    </div>
  );
}
