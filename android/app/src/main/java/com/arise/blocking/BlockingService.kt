package com.arise.blocking

import android.app.*
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import com.arise.R

/**
 * BlockingService — the heart of Arise.
 *
 * Runs as a persistent ForegroundService during an active session.
 * Every CHECK_INTERVAL_MS it polls the foreground app. If the app
 * is not in the allow-list, it immediately launches the WallActivity
 * over the top of it — visually blocking access.
 *
 * Cannot be killed by the user while session is active (foreground
 * service with ongoing notification).
 */
class BlockingService : Service() {

    companion object {
        const val ACTION_START_SESSION  = "com.arise.START_SESSION"
        const val ACTION_STOP_SESSION   = "com.arise.STOP_SESSION"
        const val ACTION_DUNGEON_BREAK  = "com.arise.DUNGEON_BREAK"

        const val EXTRA_DURATION_SECS   = "duration_seconds"
        const val EXTRA_ALLOWED_PACKAGES = "allowed_packages"

        const val NOTIFICATION_ID      = 1001
        const val CHANNEL_ID           = "arise_session"
        const val CHECK_INTERVAL_MS    = 300L  // poll every 300ms

        // Always allowed regardless of user config
        val ALWAYS_ALLOWED = setOf(
            "com.android.dialer",
            "com.google.android.dialer",
            "com.samsung.android.incallui",
            "com.android.server.telecom",
            "com.arise",                        // our own app
            "com.arise.debug",
        )

        // Hardcoded block-list — user cannot whitelist these ever
        val HARD_BLOCKED = setOf(
            "com.instagram.android",
            "com.zhiliaoapp.musically",         // TikTok
            "com.snapchat.android",
            "com.facebook.katana",
            "com.twitter.android",
            "com.reddit.frontpage",
            "com.crunchyroll.crunchyroid",
            "com.mx.browser.takatak",
            "in.mohalla.video",                 // Moj
            "com.josh.android",
            "com.sharechat.android",
        )

        var isSessionActive = false
            private set

        var sessionEndTimeMs = 0L
            private set

        var allowedPackages = mutableSetOf<String>()
            private set
    }

    private val handler = Handler(Looper.getMainLooper())
    private lateinit var usageStatsManager: UsageStatsManager
    private var sessionDurationSecs = 0L
    private var lastForegroundPackage = ""

    private val checkRunnable = object : Runnable {
        override fun run() {
            if (!isSessionActive) return
            checkForegroundApp()
            if (System.currentTimeMillis() < sessionEndTimeMs) {
                handler.postDelayed(this, CHECK_INTERVAL_MS)
            } else {
                endSession(completed = true)
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START_SESSION -> {
                val durationSecs = intent.getLongExtra(EXTRA_DURATION_SECS, 3600L)
                val pkgs = intent.getStringArrayListExtra(EXTRA_ALLOWED_PACKAGES) ?: arrayListOf()
                startSession(durationSecs, pkgs.toSet())
            }
            ACTION_STOP_SESSION -> {
                endSession(completed = false)
            }
            ACTION_DUNGEON_BREAK -> {
                endSession(completed = false, breakUsed = true)
            }
        }
        return START_STICKY  // restart if killed
    }

    private fun startSession(durationSecs: Long, userAllowed: Set<String>) {
        sessionDurationSecs = durationSecs
        sessionEndTimeMs    = System.currentTimeMillis() + durationSecs * 1000
        isSessionActive     = true

        // Build final allow-list: always-allowed + user selection
        allowedPackages.clear()
        allowedPackages.addAll(ALWAYS_ALLOWED)
        allowedPackages.addAll(userAllowed)
        // Strip out anything in the hard block list (safety check)
        allowedPackages.removeAll(HARD_BLOCKED)

        startForeground(NOTIFICATION_ID, buildNotification(durationSecs))
        handler.post(checkRunnable)

        // Broadcast to React Native
        sendBroadcast(Intent("com.arise.SESSION_STARTED"))
    }

    private fun endSession(completed: Boolean, breakUsed: Boolean = false) {
        isSessionActive = false
        handler.removeCallbacks(checkRunnable)

        val intent = Intent("com.arise.SESSION_ENDED").apply {
            putExtra("completed", completed)
            putExtra("breakUsed", breakUsed)
        }
        sendBroadcast(intent)
        stopSelf()
    }

    private fun checkForegroundApp() {
        val currentPkg = getForegroundPackage() ?: return

        // Nothing changed — skip
        if (currentPkg == lastForegroundPackage) return
        lastForegroundPackage = currentPkg

        // System UI, launchers — always pass through
        if (isSystemUI(currentPkg)) return

        // Not in allow-list → show wall
        if (currentPkg !in allowedPackages) {
            showWall(currentPkg)
        }
    }

    private fun getForegroundPackage(): String? {
        val now = System.currentTimeMillis()
        val stats = usageStatsManager.queryUsageStats(
            UsageStatsManager.INTERVAL_DAILY,
            now - 10_000,
            now
        )
        return stats?.maxByOrNull { it.lastTimeUsed }?.packageName
    }

    private fun isSystemUI(pkg: String): Boolean {
        return pkg.startsWith("com.android.systemui") ||
               pkg == "com.android.launcher" ||
               pkg == "com.google.android.apps.nexuslauncher" ||
               pkg == "com.sec.android.app.launcher" ||
               pkg == "com.miui.home" ||
               pkg == "com.oneplus.launcher" ||
               pkg.startsWith("com.android.settings")
    }

    private fun showWall(blockedPackage: String) {
        val wallIntent = Intent(this, WallActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or
                     Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or
                     Intent.FLAG_ACTIVITY_NO_ANIMATION)
            putExtra("blocked_package", blockedPackage)
            putExtra("session_end_ms", sessionEndTimeMs)
        }
        startActivity(wallIntent)
    }

    // ── Notification ──────────────────────────────────────────

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Arise Session",
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description  = "Active dungeon notification"
            setShowBadge(false)
        }
        (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
            .createNotificationChannel(channel)
    }

    private fun buildNotification(remainingSecs: Long): Notification {
        val openAppIntent = PendingIntent.getActivity(
            this, 0,
            packageManager.getLaunchIntentForPackage(packageName),
            PendingIntent.FLAG_IMMUTABLE
        )
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("⚔ Dungeon Active")
            .setContentText("${formatTime(remainingSecs)} remaining — stay strong.")
            .setSmallIcon(R.drawable.ic_arise_notification)
            .setOngoing(true)
            .setContentIntent(openAppIntent)
            .setSilent(true)
            .build()
    }

    private fun formatTime(secs: Long): String {
        val h = secs / 3600; val m = (secs % 3600) / 60
        return if (h > 0) "${h}h ${m}m" else "${m}m"
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacks(checkRunnable)
        isSessionActive = false
    }
}
