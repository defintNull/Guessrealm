<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AiController extends Controller
{
    public function getModel() {
        return response()->file(
            Storage::disk('local')->path('Models/facial_attributes_model.onnx')
        );
    }

    public function getDataModel() {
        return response()->file(
            Storage::disk('local')->path('Models/facial_attributes_model.onnx.data')
        );
    }
}
