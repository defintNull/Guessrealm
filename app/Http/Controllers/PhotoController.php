<?php

namespace App\Http\Controllers;

use App\Models\Photo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PhotoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index() : JsonResponse
    {
        $fotos = Photo::select('id')->inRandomOrder()->limit(24)->get();

        return response()->json([
            'photos' => $fotos,
        ], 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $foto = Photo::where('id', $id)->get();

        if(!$foto->isEmpty()) {
            $foto = $foto[0];

            return response()->file(
                Storage::disk('local')->path($foto->path)
            );
        }
        return response()->json([
            'error' => "Not Found!"
        ], 404);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
