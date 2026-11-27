import "./styles.css";
import { invoke } from "@tauri-apps/api/core";

type AgentState = {
  enrolled: boolean;
  email: string | null;
  apiBaseUrl: string;
  permissionGranted: boolean;
  permissionMessage: string;
  monitoringActive: boolean;
  enabled: boolean;
  captureIntervalSeconds: number;
  lastError: string | null;
};

type ExistingDevice = {
  id?: string;
  deviceName?: string;
  platform?: string;
  lastSeenAt?: string | null;
};

type DeviceLinkedConflict = {
  code: "DEVICE_ALREADY_LINKED";
  error: string;
  existingDevice?: ExistingDevice;
};

let pendingEmail = "";
let replacePrompt: DeviceLinkedConflict | null = null;

const app = document.querySelector<HTMLDivElement>("#app")!;

function render(state: AgentState, busy = false, flashError?: string) {
  const err = flashError || state.lastError;

  if (replacePrompt) {
    const d = replacePrompt.existingDevice || {};
    const detail = [d.deviceName, d.platform].filter(Boolean).join(" · ") || "another device";
    const lastSeen = d.lastSeenAt ? ` Last seen: ${new Date(d.lastSeenAt).toLocaleString()}.` : "";
    app.innerHTML = `
      <div class="card">
        <h1>Device already linked</h1>
        <div class="warn">
          ${escapeHtml(replacePrompt.error)}
          <br /><br />
          Current link: <strong>${escapeHtml(detail)}</strong>.${escapeHtml(lastSeen)}
          <br /><br />
          If you continue, the old device will be unlinked and this computer becomes the only active monitor for
          <strong>${escapeHtml(pendingEmail)}</strong>.
        </div>
        <button id="replace-accept" ${busy ? "disabled" : ""}>
          ${busy ? "Linking…" : "Unlink old device and continue"}
        </button>
        <button id="replace-cancel" class="secondary" type="button" ${busy ? "disabled" : ""}>Cancel</button>
      </div>
    `;
    document.querySelector("#replace-accept")!.addEventListener("click", () => {
      void enrollWithFlags(true);
    });
    document.querySelector("#replace-cancel")!.addEventListener("click", () => {
      replacePrompt = null;
      void refresh();
    });
    return;
  }

  if (!state.enrolled) {
    app.innerHTML = `
      <div class="card">
        <h1>TIBOSX Monitor</h1>
        <p>Enter your work email to enroll this device. Each email can only be linked to one device at a time.</p>
        ${err ? `<div class="error">${escapeHtml(err)}</div>` : ""}
        <form id="enroll-form">
          <label for="email">Work email</label>
          <input id="email" name="email" type="email" required autofocus value="${escapeAttr(pendingEmail)}" placeholder="you@company.com" />
          <button type="submit" ${busy ? "disabled" : ""}>${busy ? "Enrolling…" : "Continue"}</button>
        </form>
      </div>
    `;
    document.querySelector<HTMLFormElement>("#enroll-form")!.addEventListener("submit", onEnroll);
    return;
  }

  if (!state.permissionGranted) {
    app.innerHTML = `
      <div class="card">
        <h1>Screen capture permission</h1>
        <p>${escapeHtml(state.permissionMessage || "Grant screen recording / capture permission to continue.")}</p>
        ${err ? `<div class="error">${escapeHtml(err)}</div>` : ""}
        <button id="recheck" ${busy ? "disabled" : ""}>${busy ? "Checking…" : "I've granted permission — check again"}</button>
        <button id="open-settings" class="secondary" type="button">Open system settings</button>
      </div>
    `;
    document.querySelector("#recheck")!.addEventListener("click", onRecheckPermission);
    document.querySelector("#open-settings")!.addEventListener("click", () => {
      void invoke("open_permission_settings");
    });
    return;
  }

  app.innerHTML = `
    <div class="card">
      <h1>Running in background</h1>
      <div class="ok">Enrolled as ${escapeHtml(state.email || "user")}. You can close this window; the tray icon keeps monitoring active.</div>
      <ul class="status-list">
        <li>Monitoring ${state.enabled ? "enabled" : "disabled"} by admin</li>
        <li>Capture interval: ${state.captureIntervalSeconds}s</li>
        <li>Agent loop: ${state.monitoringActive ? "active" : "idle"}</li>
      </ul>
      <button id="hide" type="button">Hide to tray</button>
      <button id="refresh" class="secondary" type="button">Refresh status</button>
    </div>
  `;
  document.querySelector("#hide")!.addEventListener("click", () => {
    void invoke("hide_to_tray");
  });
  document.querySelector("#refresh")!.addEventListener("click", () => {
    void refresh();
  });
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(s: string) {
  return escapeHtml(s).replaceAll("'", "&#39;");
}

function parseDeviceLinkedConflict(err: unknown): DeviceLinkedConflict | null {
  const raw = String(err ?? "");
  const start = raw.indexOf("{");
  if (start < 0) return null;
  try {
    const parsed = JSON.parse(raw.slice(start)) as Partial<DeviceLinkedConflict>;
    if (parsed?.code === "DEVICE_ALREADY_LINKED") {
      return {
        code: "DEVICE_ALREADY_LINKED",
        error:
          typeof parsed.error === "string"
            ? parsed.error
            : "This email is already linked to another device.",
        existingDevice: parsed.existingDevice,
      };
    }
  } catch {
    return null;
  }
  return null;
}

async function refresh(flashError?: string, busy = false) {
  const state = await invoke<AgentState>("get_agent_state");
  render(state, busy, flashError);
}

async function enrollWithFlags(replaceExisting: boolean) {
  const email = pendingEmail;
  render(
    {
      enrolled: false,
      email: null,
      apiBaseUrl: "",
      permissionGranted: false,
      permissionMessage: "",
      monitoringActive: false,
      enabled: false,
      captureIntervalSeconds: 300,
      lastError: null,
    },
    true,
  );
  try {
    await invoke("enroll", {
      email,
      replaceExisting,
    });
    replacePrompt = null;
    await refresh();
  } catch (err) {
    const conflict = parseDeviceLinkedConflict(err);
    if (conflict && !replaceExisting) {
      replacePrompt = conflict;
      await refresh();
      return;
    }
    replacePrompt = null;
    await refresh(String(err));
  }
}

async function onEnroll(e: Event) {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  pendingEmail = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
  replacePrompt = null;
  await enrollWithFlags(false);
}

async function onRecheckPermission() {
  try {
    await invoke("check_permissions");
    await invoke("start_monitoring_if_ready");
    await refresh();
  } catch (err) {
    await refresh(String(err));
  }
}

void refresh().catch((err) => {
  app.innerHTML = `<div class="card"><div class="error">${escapeHtml(String(err))}</div></div>`;
});
