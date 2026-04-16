package __APP_PACKAGE__.alarm

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.pm.PackageManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat

class AlarmVibrationService : Service() {
  companion object {
    const val ACTION_START = "com.krambambylya.VibratingClock.ACTION_START_ALARM_SERVICE"
    const val ACTION_STOP = "com.krambambylya.VibratingClock.ACTION_STOP_ALARM_SERVICE"
    private const val RING_CHANNEL_ID = "alarm-ring-native"
    private const val NOTIFICATION_ID = 4242
  }

  private var vibrator: Vibrator? = null
  private var wakeLock: PowerManager.WakeLock? = null

  override fun onCreate() {
    super.onCreate()
    vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      getSystemService(VibratorManager::class.java).defaultVibrator
    } else {
      @Suppress("DEPRECATION") getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
    }
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == ACTION_STOP) {
      stopSelf()
      return START_NOT_STICKY
    }

    val pattern = intent?.getLongArrayExtra("pattern") ?: longArrayOf(0, 400, 200, 400)
    createAlarmChannel(pattern)
    runCatching {
      if (canPostNotifications()) {
        startForeground(NOTIFICATION_ID, buildAlarmNotification())
      }
    }
    runCatching { wakeScreenIfNeeded() }
    runCatching { startAlarmScreen() }

    val effect = VibrationEffect.createWaveform(pattern, 0)
    vibrator?.cancel()
    vibrator?.vibrate(effect)

    return START_STICKY
  }

  override fun onDestroy() {
    vibrator?.cancel()
    wakeLock?.let {
      if (it.isHeld) {
        it.release()
      }
    }
    wakeLock = null
    super.onDestroy()
  }

  override fun onBind(intent: Intent?): IBinder? = null

  private fun buildAlarmNotification(): Notification {
    val openIntent =
      Intent(this, AlarmRingActivity::class.java).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
      }
    val fullScreenPendingIntent =
      PendingIntent.getActivity(
        this,
        0,
        openIntent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )
    val stopIntent =
      Intent(this, AlarmVibrationService::class.java).apply {
        action = ACTION_STOP
      }
    val stopPendingIntent =
      PendingIntent.getService(
        this,
        1,
        stopIntent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )

    return NotificationCompat.Builder(this, RING_CHANNEL_ID)
      .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
      .setContentTitle("Alarm")
      .setContentText("Wake up time")
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setOngoing(true)
      .setAutoCancel(false)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setContentIntent(fullScreenPendingIntent)
      .setFullScreenIntent(fullScreenPendingIntent, true)
      .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Dismiss", stopPendingIntent)
      .build()
  }

  private fun startAlarmScreen() {
    val openIntent =
      Intent(this, AlarmRingActivity::class.java).apply {
        addFlags(
          Intent.FLAG_ACTIVITY_NEW_TASK or
            Intent.FLAG_ACTIVITY_SINGLE_TOP or
            Intent.FLAG_ACTIVITY_CLEAR_TOP,
        )
      }
    startActivity(openIntent)
  }

  private fun wakeScreenIfNeeded() {
    val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
    if (wakeLock?.isHeld == true) {
      return
    }
    @Suppress("DEPRECATION")
    wakeLock =
      pm.newWakeLock(
        PowerManager.FULL_WAKE_LOCK or
          PowerManager.ACQUIRE_CAUSES_WAKEUP or
          PowerManager.ON_AFTER_RELEASE,
        "VibratingClock:AlarmWakeLock",
      ).apply {
        acquire(60_000L)
      }
  }

  private fun canPostNotifications(): Boolean {
    if (Build.VERSION.SDK_INT < 33) {
      return true
    }
    return ContextCompat.checkSelfPermission(this, android.Manifest.permission.POST_NOTIFICATIONS) ==
      PackageManager.PERMISSION_GRANTED
  }

  private fun createAlarmChannel(pattern: LongArray) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = getSystemService(NotificationManager::class.java)
    val channel =
      NotificationChannel(
        RING_CHANNEL_ID,
        "Alarm ring",
        NotificationManager.IMPORTANCE_HIGH,
      ).apply {
        description = "Native alarm vibration channel"
        setSound(null, null)
        enableVibration(true)
        vibrationPattern = pattern
        lockscreenVisibility = Notification.VISIBILITY_PUBLIC
      }
    manager.createNotificationChannel(channel)
  }
}
