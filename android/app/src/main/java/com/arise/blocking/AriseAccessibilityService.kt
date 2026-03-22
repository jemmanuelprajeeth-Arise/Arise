package com.arise.blocking

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.view.accessibility.AccessibilityEvent

/**
 * AriseAccessibilityService — fallback blocking layer.
 * Catches window state changes on Xiaomi/Samsung that kill foreground services.
 */
class AriseAccessibilityService : AccessibilityService() {
    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        if (!BlockingService.isSessionActive) return
        if (event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
        val pkg = event.packageName?.toString() ?: return
        if (pkg.startsWith("com.android.systemui") || pkg == packageName) return
        if (pkg !in BlockingService.allowedPackages) {
            val intent = Intent(this, WallActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
                putExtra("session_end_ms", BlockingService.sessionEndTimeMs)
                putExtra("blocked_package", pkg)
            }
            startActivity(intent)
        }
    }
    override fun onInterrupt() {}
}
