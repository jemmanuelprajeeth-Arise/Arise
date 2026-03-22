package com.arise.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Restarts Arise after device reboot if a session was active. */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED ||
            intent.action == Intent.ACTION_MY_PACKAGE_REPLACED) {
            // RN app will re-check MMKV state and restart service if needed
        }
    }
}
