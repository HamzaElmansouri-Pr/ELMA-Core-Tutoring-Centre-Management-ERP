<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SettingsController extends Controller
{
    public function index()
    {
        $setting = Setting::firstOrCreate([], [
            'center_name' => 'ELMA Core',
            'default_locale' => 'en',
        ]);
        
        // Append full url for logo
        $data = $setting->toArray();
        if ($setting->logo_path) {
            $data['logo_url'] = asset('storage/' . $setting->logo_path);
        } else {
            $data['logo_url'] = null;
        }

        return response()->json(['data' => $data]);
    }

    public function store(Request $request)
    {
        $setting = Setting::firstOrCreate([], [
            'center_name' => 'ELMA Core',
            'default_locale' => 'en',
        ]);

        $request->validate([
            'center_name' => 'sometimes|string|max:255',
            'address' => 'sometimes|nullable|string',
            'phone' => 'sometimes|nullable|string',
            'default_locale' => 'sometimes|string|in:en,fr,ar',
            'logo' => 'sometimes|nullable|image|max:2048', // 2MB Max
        ]);

        $data = $request->except(['logo', 'logo_path']);

        if ($request->hasFile('logo')) {
            if ($setting->logo_path) {
                Storage::disk('public')->delete($setting->logo_path);
            }
            $path = $request->file('logo')->store('logos', 'public');
            $data['logo_path'] = $path;
        }

        $setting->update($data);

        $responseData = $setting->toArray();
        if ($setting->logo_path) {
            $responseData['logo_url'] = asset('storage/' . $setting->logo_path);
        } else {
            $responseData['logo_url'] = null;
        }

        return response()->json(['data' => $responseData]);
    }
}
