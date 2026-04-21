<?php

declare(strict_types=1);

namespace App\Http\Controllers\Page;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserLocationResource;
use App\Services\Page\HomeService;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __construct(private readonly HomeService $homeService) {}

    public function index(): Response
    {
        $currentUserId = auth()->id();

        $allUsers = UserLocationResource::collection($this->homeService->getVisibleUsers())->resolve();

        $savedLocation = $this->homeService->getSavedLocation($currentUserId);

        return Inertia::render('Map', [
            'allUsers' => $allUsers,
            'currentUserId' => $currentUserId,
            'savedLocation' => $savedLocation,
        ]);
    }
}
