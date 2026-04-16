package __APP_PACKAGE__.alarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import java.util.Calendar

object AlarmScheduler {
  private const val PREFS = "native_alarm_prefs"
  private const val KEY_ALARM_ID = "alarm_id"
  private const val KEY_HOUR = "hour"
  private const val KEY_MINUTE = "minute"
  private const val KEY_PATTERN = "pattern"
  private const val KEY_ENABLED = "enabled"

  fun hasExactAlarmPermission(context: Context): Boolean {
    val alarmManager = context.getSystemService(AlarmManager::class.java)
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      alarmManager.canScheduleExactAlarms()
    } else {
      true
    }
  }

  fun openExactAlarmSettings(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
      return
    }
    val intent =
      Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
        data = Uri.fromParts("package", context.packageName, null)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
    context.startActivity(intent)
  }

  fun scheduleExactAlarm(
    context: Context,
    alarmId: String,
    hour: Int,
    minute: Int,
    pattern: LongArray,
  ): Long {
    val triggerAt = computeNextTrigger(hour, minute)
    val alarmManager = context.getSystemService(AlarmManager::class.java)
    val pendingIntent = buildAlarmPendingIntent(context, alarmId, pattern)

    val showIntent =
      PendingIntent.getActivity(
        context,
        alarmId.hashCode(),
        Intent(context, AlarmRingActivity::class.java),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )

    alarmManager.setAlarmClock(
      AlarmManager.AlarmClockInfo(triggerAt, showIntent),
      pendingIntent,
    )

    saveAlarmState(context, alarmId, hour, minute, pattern, true)
    return triggerAt
  }

  fun cancelAlarm(context: Context, alarmId: String) {
    val alarmManager = context.getSystemService(AlarmManager::class.java)
    val pendingIntent = buildAlarmPendingIntent(context, alarmId, longArrayOf())
    alarmManager.cancel(pendingIntent)
    pendingIntent.cancel()
    clearAlarmState(context)
  }

  fun rescheduleAfterBoot(context: Context) {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    if (!prefs.getBoolean(KEY_ENABLED, false)) {
      return
    }
    val alarmId = prefs.getString(KEY_ALARM_ID, null) ?: return
    val hour = prefs.getInt(KEY_HOUR, 7)
    val minute = prefs.getInt(KEY_MINUTE, 0)
    val pattern =
      prefs.getString(KEY_PATTERN, null)?.split(',')?.mapNotNull { it.toLongOrNull() }?.toLongArray()
        ?: longArrayOf(0, 400, 200, 400)
    scheduleExactAlarm(context, alarmId, hour, minute, pattern)
  }

  private fun buildAlarmPendingIntent(context: Context, alarmId: String, pattern: LongArray): PendingIntent {
    val intent =
      Intent(context, AlarmReceiver::class.java).apply {
        action = "com.krambambylya.VibratingClock.ACTION_FIRE_ALARM"
        putExtra("alarmId", alarmId)
        putExtra("pattern", pattern)
      }

    return PendingIntent.getBroadcast(
      context,
      alarmId.hashCode(),
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }

  private fun saveAlarmState(
    context: Context,
    alarmId: String,
    hour: Int,
    minute: Int,
    pattern: LongArray,
    enabled: Boolean,
  ) {
    context
      .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putString(KEY_ALARM_ID, alarmId)
      .putInt(KEY_HOUR, hour)
      .putInt(KEY_MINUTE, minute)
      .putString(KEY_PATTERN, pattern.joinToString(","))
      .putBoolean(KEY_ENABLED, enabled)
      .apply()
  }

  private fun clearAlarmState(context: Context) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().clear().apply()
  }

  private fun computeNextTrigger(hour: Int, minute: Int): Long {
    val now = Calendar.getInstance()
    val target =
      Calendar.getInstance().apply {
        set(Calendar.HOUR_OF_DAY, hour)
        set(Calendar.MINUTE, minute)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
        // If target is not strictly in the future, schedule for the next day.
        if (!after(now)) {
          add(Calendar.DAY_OF_YEAR, 1)
        }
      }
    return target.timeInMillis
  }
}
