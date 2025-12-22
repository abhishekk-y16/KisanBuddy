# U2-Net and ViT Model Stubs

This project includes code to load U2-Net and ViT model stubs for quick local inference.

Notes:
- The loader in `backend/services/vision.py` will attempt to use PyTorch if installed (`torch`).
- If `torch` is available but model files are missing, the code will instantiate tiny stub models and save them under `backend/models/` as `u2net.pth` and `vit_stage.pth`.
- If `torch` is not installed, the code gracefully falls back to a heuristic POI estimator.

Installing PyTorch (CPU-only) for local testing:

```powershell
# Example for Windows and pip
pip install --upgrade pip
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
```

Once `torch` is installed, the first call to `/api/vision_poi` will create small stub models and save them for subsequent runs.

To replace with production models:
1. Train or obtain U2-Net and ViT models.
2. Place `u2net.pth` and `vit_stage.pth` under `backend/models/` (state_dict format).
3. Ensure the model input preprocessing in `services/vision.py` matches your model's expected input.

Uploading models via API (local/dev)

You can upload model files to the backend using the `upload_model` endpoint:

```bash
curl -X POST http://localhost:8080/api/upload_model \
	-F "file=@u2net.pth" \
	-F "model_name=u2net.pth"
```

Replace `u2net.pth` with `vit_stage.pth` to upload the ViT model.

Uploading Cobra VAD WASM

If you have a Cobra VAD WASM binary, upload it to the frontend `public/` folder using:

```bash
curl -X POST http://localhost:8080/api/upload_cobra_wasm \
	-F "file=@cobra_vad.wasm"
```

The backend will save the WASM file to `frontend/public/cobra_vad.wasm` so the frontend loader can fetch it.
