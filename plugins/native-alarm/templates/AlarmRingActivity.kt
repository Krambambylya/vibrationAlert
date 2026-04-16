package __APP_PACKAGE__.alarm

import android.graphics.Color
import android.os.Bundle
import android.view.animation.AlphaAnimation
import android.view.animation.Animation
import android.view.Gravity
import android.view.GestureDetector
import android.view.MotionEvent
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.TextClock
import android.widget.TextView
import androidx.activity.ComponentActivity

class AlarmRingActivity : ComponentActivity() {
  private lateinit var gestureDetector: GestureDetector
  private var swipeHandled = false

  private fun dismissAlarm() {
    stopService(
      android.content.Intent(this@AlarmRingActivity, AlarmVibrationService::class.java).apply {
        action = AlarmVibrationService.ACTION_STOP
      },
    )
    finish()
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setShowWhenLocked(true)
    setTurnScreenOn(true)
    window.addFlags(
      WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
        WindowManager.LayoutParams.FLAG_ALLOW_LOCK_WHILE_SCREEN_ON,
    )

    gestureDetector =
      GestureDetector(
        this,
        object : GestureDetector.SimpleOnGestureListener() {
          override fun onDown(e: MotionEvent): Boolean = true

          override fun onFling(
            e1: MotionEvent?,
            e2: MotionEvent,
            velocityX: Float,
            velocityY: Float,
          ): Boolean {
            val start = e1 ?: return false
            val dx = e2.x - start.x
            val dy = e2.y - start.y
            val isSwipeUp =
              dy < -110f &&
                kotlin.math.abs(dx) < 180f &&
                kotlin.math.abs(dy) > kotlin.math.abs(dx) &&
                velocityY < -450f
            if (isSwipeUp && !swipeHandled) {
              swipeHandled = true
              dismissAlarm()
              return true
            }
            return false
          }
        },
      )

    val root =
      LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        setBackgroundColor(Color.WHITE)
        gravity = Gravity.CENTER
        setPadding(48, 48, 48, 48)
        setOnTouchListener { _, event ->
          gestureDetector.onTouchEvent(event)
          when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
              swipeHandled = false
              true
            }
            MotionEvent.ACTION_UP -> true
            else -> false
          }
        }
      }

    val currentTime =
      TextClock(this).apply {
        format24Hour = "HH:mm"
        format12Hour = "hh:mm"
        setTextColor(Color.parseColor("#111111"))
        textSize = 64f
        gravity = Gravity.CENTER
      }
    val swipeHint =
      TextView(this).apply {
        text = "Swipe up to dismiss"
        setTextColor(Color.parseColor("#666666"))
        textSize = 16f
        gravity = Gravity.CENTER
      }
    val swipeArrow =
      TextView(this).apply {
        text = "↑"
        setTextColor(Color.parseColor("#444444"))
        textSize = 40f
        gravity = Gravity.CENTER
      }

    val hintPulse =
      AlphaAnimation(0.35f, 1f).apply {
        duration = 900
        repeatMode = Animation.REVERSE
        repeatCount = Animation.INFINITE
      }
    swipeHint.startAnimation(hintPulse)
    swipeArrow.startAnimation(hintPulse)

    root.addView(currentTime)
    root.addView(swipeArrow)
    root.addView(swipeHint)
    setContentView(root)
  }
}
