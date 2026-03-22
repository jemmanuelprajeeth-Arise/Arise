package com.arise.blocking

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.os.CountDownTimer
import android.view.WindowManager
import android.widget.*
import com.arise.R
import com.arise.bridge.BlockerBridge

/**
 * WallActivity — shown fullscreen whenever a blocked app is detected.
 *
 * This activity:
 * 1. Covers the blocked app completely
 * 2. Shows the remaining session time
 * 3. Offers the Dungeon Break option (₹200)
 * 4. Cannot be swiped away or back-pressed during active session
 *
 * Design: matches the minimalist Arise aesthetic —
 * white background, Playfair-style large type, single CTA.
 */
class WallActivity : Activity() {

    private var sessionEndMs  = 0L
    private var blockedPkg    = ""
    private var countDownTimer: CountDownTimer? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Keep screen on, show over lock screen
        window.addFlags(
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
            WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
        )

        sessionEndMs = intent.getLongExtra("session_end_ms", 0L)
        blockedPkg   = intent.getStringExtra("blocked_package") ?: ""

        setContentView(buildView())
        startCountdown()
    }

    private fun buildView(): android.view.View {
        return LinearLayout(this).apply {
            orientation  = LinearLayout.VERTICAL
            gravity      = android.view.Gravity.CENTER
            setPadding(80, 0, 80, 0)
            setBackgroundColor(0xFFF8F7F4.toInt())  // Arise bg

            // App name
            addView(TextView(context).apply {
                text      = "Arise"
                textSize  = 14f
                letterSpacing = 0.15f
                setTextColor(0xFF888888.toInt())
                gravity   = android.view.Gravity.CENTER
                setPadding(0, 0, 0, 32)
            })

            // Big message
            addView(TextView(context).apply {
                text      = "Not now."
                textSize  = 52f
                setTextColor(0xFF111111.toInt())
                gravity   = android.view.Gravity.CENTER
                typeface  = android.graphics.Typeface.DEFAULT_BOLD
            })

            // Subtext
            addView(TextView(context).apply {
                text = "You're in a dungeon.\nThis app is locked."
                textSize = 16f
                setTextColor(0xFF888888.toInt())
                gravity   = android.view.Gravity.CENTER
                setPadding(0, 16, 0, 0)
                lineHeight = 52
            })

            // Timer
            val timerView = TextView(context).apply {
                textSize  = 36f
                setTextColor(0xFF111111.toInt())
                gravity   = android.view.Gravity.CENTER
                setPadding(0, 56, 0, 0)
                typeface  = android.graphics.Typeface.MONOSPACE
            }
            addView(timerView)
            tag = timerView  // reference for update

            // "Time remaining" label
            addView(TextView(context).apply {
                text      = "remaining"
                textSize  = 13f
                setTextColor(0xFF888888.toInt())
                gravity   = android.view.Gravity.CENTER
                setPadding(0, 8, 0, 72)
            })

            // Dungeon Break button
            addView(Button(context).apply {
                text        = "⚡ Dungeon Break — ₹200"
                textSize    = 14f
                setTextColor(0xFFB83232.toInt())
                setBackgroundColor(0xFFFDF0F0.toInt())
                setPadding(48, 32, 48, 32)
                setOnClickListener {
                    openAriseForBreak()
                }
            })

            // Back to safety
            addView(TextView(context).apply {
                text      = "Tap the home button to return to your home screen."
                textSize  = 12f
                setTextColor(0xFFCCCCCC.toInt())
                gravity   = android.view.Gravity.CENTER
                setPadding(0, 32, 0, 0)
            })
        }
    }

    private fun startCountdown() {
        val remaining = sessionEndMs - System.currentTimeMillis()
        if (remaining <= 0) { finish(); return }

        countDownTimer = object : CountDownTimer(remaining, 1000) {
            override fun onTick(millisUntilFinished: Long) {
                val timerView = (window.decorView.findViewWithTag<TextView>("timerView"))
                    ?: (window.decorView as? android.view.ViewGroup)
                        ?.getChildAt(0)?.let { root ->
                            (root as? LinearLayout)?.getChildAt(5) as? TextView
                        }
                val secs = millisUntilFinished / 1000
                val h = secs / 3600; val m = (secs % 3600) / 60; val s = secs % 60
                timerView?.text = if (h > 0)
                    "%d:%02d:%02d".format(h, m, s)
                else
                    "%02d:%02d".format(m, s)
            }
            override fun onFinish() { finish() }
        }.start()
    }

    private fun openAriseForBreak() {
        val intent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
            putExtra("open_dungeon_break", true)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        }
        startActivity(intent)
    }

    // ── Prevent dismissal ──────────────────────────────────────

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        // Do nothing — wall cannot be back-pressed away
    }

    override fun onPause() {
        super.onPause()
        // If session is still active and we're being paused,
        // re-launch ourselves to stay on top
        if (BlockingService.isSessionActive) {
            val intent = Intent(this, WallActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
                putExtra("session_end_ms", sessionEndMs)
                putExtra("blocked_package", blockedPkg)
            }
            startActivity(intent)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        countDownTimer?.cancel()
    }
}
