# Compute: VPS and GPU

## Purpose

GSWS includes compute services for VPS and GPU instances. VPS functionality is backed by Contabo. GPU functionality is backed by Vast.ai.

## Dashboard Areas

The dashboard navigation exposes:

1. VPS.
2. GPU Compute.

The sidebar also merges VPS and GPU orders into the active resource selector alongside hosting packages.

## Local Data

Compute orders are referenced through:

```text
gsws_compute_orders
```

Known fields used by the code include:

| Field | Purpose |
| --- | --- |
| `id` | Local compute order ID. |
| `user_id` | Owning GSWS user ID. |
| `resource_type` | `vps` or `gpu`. |
| `service_key` | Display/service identifier. |
| `status` | Order/resource status. |
| `tier` | GPU tier where applicable. |
| `billing_period` | Billing period where applicable. |
| `ssh_host` | SSH host for terminal access. |
| `ssh_port` | SSH port. |
| `ssh_user` | SSH username. |
| `provider_data` | Provider-specific JSON data. |
| `notes` | Display or operational notes. |

## VPS Provider: Contabo

The Contabo client lives at:

```text
src/lib/contabo.ts
```

### Authentication

The client obtains an OAuth token from Contabo using:

1. `CONTABO_CLIENT_ID`.
2. `CONTABO_CLIENT_SECRET`.
3. `CONTABO_API_USER`.
4. `CONTABO_API_PASSWORD`.

The token is cached in memory until shortly before expiry.

### VPS Functions

The Contabo client supports:

1. `listInstances()`.
2. `getInstance(instanceId)`.
3. `createInstance(options)`.
4. `startInstance(instanceId)`.
5. `stopInstance(instanceId)`.
6. `restartInstance(instanceId)`.
7. `cancelInstance(instanceId)`.
8. `listImages()`.
9. `listDataCenters()`.
10. `resetPassword(instanceId, secretId)`.
11. `listSecrets()`.
12. `createSecret(name, value, type)`.

### VPS Routes

Known route areas:

```text
/api/compute/vps
/api/compute/vps/[instanceId]
/api/compute/vps/[instanceId]/firewall
/api/compute/vps/[instanceId]/rescue
```

### VPS Rules

1. Confirm order ownership in `gsws_compute_orders`.
2. Require write permission for lifecycle actions.
3. Treat reset password, firewall and rescue mode as high-risk actions.
4. Store provider data consistently after provisioning or state changes.
5. Audit start, stop, restart, cancel, rescue and password reset actions.

## GPU Provider: Vast.ai

The Vast.ai client lives at:

```text
src/lib/vastai.ts
```

### Authentication

The client uses:

```text
VASTAI_API_KEY
```

### GPU Tier Filters

The code defines GPU tier filters for:

1. `entry`.
2. `workstation`.
3. `pro`.
4. `dc`.
5. `hpc`.
6. `elite`.

Each tier defines VRAM range and maximum hourly price constraints.

### GPU Functions

The Vast.ai client supports:

1. `searchOffers(tier, limit)`.
2. `getInstance(instanceId)`.
3. `listInstances()`.
4. `destroyInstance(instanceId)`.
5. `stopInstance(instanceId)`.
6. `startInstance(instanceId)`.
7. `createInstance(offerId, options)`.
8. `waitForRunningAndInjectKey(instanceId, maxWaitMs)`.

### GPU Templates

The code defines template images for:

1. Bare Ubuntu.
2. PyTorch.
3. TensorFlow.
4. Jupyter.
5. Ollama.
6. vLLM.
7. Stable Diffusion.
8. ComfyUI.
9. CUDA development.

### GPU Routes

Known route areas:

```text
/api/compute/gpu
/api/compute/gpu/[orderId]
/api/compute/gpu/[orderId]/logs
```

### GPU Provisioning Flow

Expected flow:

1. User selects tier/template/billing option.
2. GSWS searches Vast.ai offers using tier filters.
3. GSWS creates an instance from a selected offer.
4. Local order is recorded in `gsws_compute_orders`.
5. GSWS polls until the instance is running.
6. GSWS injects the configured public SSH key.
7. SSH host and port are stored for terminal access.

## Terminal Integration

Both VPS and GPU instances can be used by the terminal server if `ssh_host`, `ssh_port` and `ssh_user` are available in `gsws_compute_orders`.

The terminal server resolves:

1. VPS credentials when `type=vps` and `orderId` is supplied.
2. GPU credentials when `type=gpu` and `orderId` is supplied.

## Billing Considerations

Compute resources create provider cost exposure. Provisioning routes should check:

1. Authenticated user.
2. Billing permission.
3. Spend PIN or spend control where applicable.
4. Available credit or payment status.
5. Valid product/tier/period.
6. Provider availability.
7. Idempotency to avoid duplicate orders.

## Support Considerations

Common issues:

1. VPS provisioning pending.
2. VPS IP not yet available.
3. GPU instance unavailable after offer selection.
4. GPU SSH key injection failed.
5. Provider instance stopped externally.
6. Billing state does not match provider state.
7. Terminal cannot connect because SSH host is missing.

## Developer Rules

1. Never trust client-supplied provider IDs without local order ownership checks.
2. Keep provider-specific raw data in `provider_data`, but expose only safe normalised fields to the UI.
3. Audit lifecycle actions.
4. Make destructive actions explicit and confirmable.
5. Add retries and idempotency around provisioning.
6. Keep Contabo and Vast.ai provider logic separate from UI route handlers where possible.
