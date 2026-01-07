<?php

namespace App\Http\Controllers\Page;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserLocation;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function index(Request $request)
    {
        $allUsers = UserLocation::query()
            ->where('is_visible', true)
            ->whereNotNull('user_id')
            ->with('user:id,name,avatar,age,gender')
            ->get()
            ->map(fn ($location) => [
                'id' => $location->user?->getKey(),
                'name' => $location->user?->name,
                'avatar' => $location->user?->avatar,
                'age' => $location->user?->age,
                'gender' => $location->user?->gender,
                'lat' => $location->lat,
                'lng' => $location->lng,
            ])
            ->filter(fn ($user) => $user['id'] !== null)
            ->values();

        $sessionId = $request->session()->getId();
        $currentUserId = null;
        if (auth()->check()) {
            $currentUserId = auth()->id();
        } else {
            $tempUser = User::query()
                ->where('email', 'temp_'.$sessionId.'@temp.local')
                ->first();
            if ($tempUser) {
                $currentUserId = $tempUser->getKey();
            }
        }

        return Inertia::render('Map', [
            'allUsers' => $allUsers,
            'currentUserId' => $currentUserId,
            'sessionId' => $sessionId,
        ]);
    }
}
