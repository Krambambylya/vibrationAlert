package __APP_PACKAGE__.alarm

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray

class AlarmClockModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "AlarmClockModule"

  @ReactMethod
  fun hasExactAlarmPermission(promise: Promise) {
    promise.resolve(AlarmScheduler.hasExactAlarmPermission(reactContext))
  }

  @ReactMethod
  fun openExactAlarmSettings() {
    AlarmScheduler.openExactAlarmSettings(reactContext)
  }

  @ReactMethod
  fun scheduleAlarm(
    alarmId: String,
    hour: Int,
    minute: Int,
    pattern: ReadableArray,
    promise: Promise,
  ) {
    try {
      val longPattern = LongArray(pattern.size()) { index -> pattern.getDouble(index).toLong() }
      val triggerAt = AlarmScheduler.scheduleExactAlarm(reactContext, alarmId, hour, minute, longPattern)
      val result = Arguments.createMap().apply {
        putString("alarmId", alarmId)
        putDouble("triggerAt", triggerAt.toDouble())
      }
      promise.resolve(result)
    } catch (error: Throwable) {
      promise.reject("SCHEDULE_ALARM_FAILED", error)
    }
  }

  @ReactMethod
  fun cancelAlarm(alarmId: String, promise: Promise) {
    try {
      AlarmScheduler.cancelAlarm(reactContext, alarmId)
      promise.resolve(null)
    } catch (error: Throwable) {
      promise.reject("CANCEL_ALARM_FAILED", error)
    }
  }
}
