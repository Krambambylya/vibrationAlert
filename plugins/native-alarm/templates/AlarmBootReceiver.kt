package __APP_PACKAGE__.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class AlarmBootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
      AlarmScheduler.rescheduleAfterBoot(context)
    }
  }
}
