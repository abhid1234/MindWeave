# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# ── Capacitor Core ──────────────────────────────────────────────────
# Keep the Capacitor bridge and plugin infrastructure so the WebView
# JavaScript interface works at runtime.
-keep public class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin public class * { *; }
-keep @com.getcapacitor.annotation.Permission public class * { *; }
-keep class * extends com.getcapacitor.Plugin { *; }

# JavaScript bridge interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ── Cordova compatibility layer ─────────────────────────────────────
-keep public class org.apache.cordova.** { *; }
-keep class * extends org.apache.cordova.CordovaPlugin { *; }

# ── WebView ─────────────────────────────────────────────────────────
-keepclassmembers class * extends android.webkit.WebViewClient { *; }
-keepclassmembers class * extends android.webkit.WebChromeClient { *; }

# ── AndroidX / Google libraries ─────────────────────────────────────
-keep class androidx.core.app.CoreComponentFactory { *; }
-dontwarn com.google.android.gms.**

# ── Debugging ───────────────────────────────────────────────────────
# Preserve line numbers for crash stack traces
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
