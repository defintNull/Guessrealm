<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Storage;

class AiController extends Controller
{
    /**
     * Return the ai model file
     */
    public function getModel() {
        return response()->file(
            Storage::disk('local')->path('Models/model_webgpu.onnx')
        );
    }

    /**
     * Return the additional data required from the ai model
     */
    public function getDataModel() {
        return response()->file(
            Storage::disk('local')->path('Models/model_webgpu.onnx.data')
        );
    }
}
