package __APP_PACKAGE__.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat

class AlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val alarmId = intent.getStringExtra("alarmId") ?: "primary-alarm"
    val pattern = intent.getLongArrayExtra("pattern") ?: longArrayOf(0, 400, 200, 400)

    val serviceIntent =
      Intent(context, AlarmVibrationService::class.java).apply {
        action = AlarmVibrationService.ACTION_START
        putExtra("alarmId", alarmId)
        putExtra("pattern", pattern)
      }
    ContextCompat.startForegroundService(context, serviceIntent)

    // Schedule the next day's alarm (daily repeat) using persisted alarm state.
    runCatching { AlarmScheduler.rescheduleAfterBoot(context) }
  }
}
