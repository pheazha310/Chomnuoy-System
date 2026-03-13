<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SocialAuthController extends Controller
{
    /**
     * Redirect to Google OAuth provider
     */
    public function googleRedirect(): JsonResponse
    {
        try {
            $url = Socialite::driver('google')
                ->scopes(['openid', 'profile', 'email'])
                ->with(['prompt' => 'consent'])
                ->stateless()
                ->redirect()
                ->getTargetUrl();

            return response()->json(['url' => $url]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Unable to connect to Google authentication',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle Google OAuth callback
     */
    public function googleCallback(Request $request): JsonResponse
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();

            // Find or create user
            $user = User::firstOrCreate(
                ['email' => $googleUser->getEmail()],
                [
                    'name' => $googleUser->getName(),
                    'password' => Hash::make(Str::random(24)), // Random password
                    'status' => 'active',
                    'phone' => null,
                ]
            );

            // Assign role if new user
            if ($user->wasRecentlyCreated) {
                $role = Role::firstOrCreate(['role_name' => 'Donor']);
                $user->role_id = $role->id;
                $user->save();
            }

            // Create token or session
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'message' => 'Login successful',
                'user' => $user,
                'token' => $token,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Google authentication failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Redirect to Facebook OAuth provider
     */
    public function facebookRedirect(): JsonResponse
    {
        try {
            $url = Socialite::driver('facebook')
                ->scopes(['email'])
                ->stateless()
                ->redirect()
                ->getTargetUrl();

            return response()->json(['url' => $url]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Unable to connect to Facebook authentication',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle Facebook OAuth callback
     */
    public function facebookCallback(Request $request): JsonResponse
    {
        try {
            $facebookUser = Socialite::driver('facebook')->stateless()->user();

            // Find or create user
            $user = User::firstOrCreate(
                ['email' => $facebookUser->getEmail()],
                [
                    'name' => $facebookUser->getName(),
                    'password' => Hash::make(Str::random(24)), // Random password
                    'status' => 'active',
                    'phone' => null,
                ]
            );

            // Assign role if new user
            if ($user->wasRecentlyCreated) {
                $role = Role::firstOrCreate(['role_name' => 'Donor']);
                $user->role_id = $role->id;
                $user->save();
            }

            // Create token or session
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'message' => 'Login successful',
                'user' => $user,
                'token' => $token,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Facebook authentication failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
