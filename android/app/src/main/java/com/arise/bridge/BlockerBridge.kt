package com.arise.bridge

import android.app.AppOpsManager
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.arise.blocking.BlockingService
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * BlockerBridge — exposes native Android capabilities to React Native.
 *
 * Called from src/services/BlockerService.ts via NativeModules.BlockerBridge
 */
class BlockerBridge(private val reactContext: ReactApplicationContext)
    : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "BlockerBridge"

    // ── Permission checks ─────────────────────────────────────

    @ReactMethod
    fun hasUsageStatsPermission(promise: Promise) {
        val appOps = reactContext.getSystemService(android.content.Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = appOps.checkOpNoThrow(
            AppOpsManager.OPSTR_GET_USAGE_STATS,
            android.os.Process.myUid(),
            reactContext.packageName
        )
        promise.resolve(mode == AppOpsManager.MODE_ALLOWED)
    }

    @ReactMethod
    fun requestUsageStatsPermission() {
        val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        reactContext.startActivity(intent)
    }

    @ReactMethod
    fun hasOverlayPermission(promise: Promise) {
        promise.resolve(Settings.canDrawOverlays(reactContext))
    }

    @ReactMethod
    fun requestOverlayPermission() {
        val intent = Intent(
            Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
            Uri.parse("package:${reactContext.packageName}")
        ).apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) }
        reactContext.startActivity(intent)
    }

    @ReactMethod
    fun hasAccessibilityPermission(promise: Promise) {
        val enabledServices = Settings.Secure.getString(
            reactContext.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: ""
        promise.resolve(enabledServices.contains(reactContext.packageName))
    }

    @ReactMethod
    fun requestAccessibilityPermission() {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        reactContext.startActivity(intent)
    }

    // ── Session control ───────────────────────────────────────

    @ReactMethod
    fun startSession(durationSecs: Double, allowedPackages: ReadableArray) {
        val pkgList = ArrayList<String>()
        for (i in 0 until allowedPackages.size()) {
            pkgList.add(allowedPackages.getString(i))
        }
        val intent = Intent(reactContext, BlockingService::class.java).apply {
            action = BlockingService.ACTION_START_SESSION
            putExtra(BlockingService.EXTRA_DURATION_SECS, durationSecs.toLong())
            putStringArrayListExtra(BlockingService.EXTRA_ALLOWED_PACKAGES, pkgList)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            reactContext.startForegroundService(intent)
        } else {
            reactContext.startService(intent)
        }
    }

    @ReactMethod
    fun stopSession() {
        val intent = Intent(reactContext, BlockingService::class.java).apply {
            action = BlockingService.ACTION_STOP_SESSION
        }
        reactContext.startService(intent)
    }

    @ReactMethod
    fun triggerDungeonBreak() {
        val intent = Intent(reactContext, BlockingService::class.java).apply {
            action = BlockingService.ACTION_DUNGEON_BREAK
        }
        reactContext.startService(intent)
    }

    @ReactMethod
    fun isSessionActive(promise: Promise) {
        promise.resolve(BlockingService.isSessionActive)
    }

    @ReactMethod
    fun getSessionEndTime(promise: Promise) {
        promise.resolve(BlockingService.sessionEndTimeMs.toDouble())
    }

    // ── Installed apps ────────────────────────────────────────

    /**
     * Returns list of user-installed apps for the app selection screen.
     * Excludes system apps, already-blocked apps, and Arise itself.
     */
    @ReactMethod
    fun getInstalledUserApps(promise: Promise) {
        try {
            val pm = reactContext.packageManager
            val apps = pm.getInstalledApplications(PackageManager.GET_META_DATA)
            val result = WritableNativeArray()

            for (app in apps) {
                // Skip system apps
                if (app.flags and android.content.pm.ApplicationInfo.FLAG_SYSTEM != 0) continue
                // Skip our own app
                if (app.packageName == reactContext.packageName) continue
                // Skip hard-blocked apps (they'll never appear)
                if (app.packageName in BlockingService.HARD_BLOCKED) continue

                val appInfo = WritableNativeMap().apply {
                    putString("packageName", app.packageName)
                    putString("appName", pm.getApplicationLabel(app).toString())
                }
                result.pushMap(appInfo)
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    /**
     * Returns the hard-blocked list so RN can show it in the UI.
     */
    @ReactMethod
    fun getHardBlockedList(promise: Promise) {
        val result = WritableNativeArray()
        BlockingService.HARD_BLOCKED.forEach { result.pushString(it) }
        promise.resolve(result)
    }

    // ── Event emitter ─────────────────────────────────────────

    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    fun onSessionCompleted() {
        sendEvent("onSessionCompleted", null)
    }

    fun onSessionBroke() {
        sendEvent("onSessionBroke", null)
    }
}
