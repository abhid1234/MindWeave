package space.mindweave.app;

import android.content.Intent;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.util.Log;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MindweaveOAuth";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    /**
     * Set up JS bridge and custom WebViewClient after Capacitor has fully initialized.
     * Using onPostCreate instead of onStart ensures the Bridge and WebView are ready,
     * avoiding timing issues where the bridge isn't available when the page loads.
     */
    @Override
    protected void onPostCreate(Bundle savedInstanceState) {
        super.onPostCreate(savedInstanceState);

        Bridge bridge = this.getBridge();
        if (bridge != null && bridge.getWebView() != null) {
            WebView webView = bridge.getWebView();

            // Add JavaScript interface so the web app can call native methods
            webView.addJavascriptInterface(new WebAppInterface(), "MindweaveNative");

            // Set custom WebViewClient that intercepts OAuth URLs
            bridge.setWebViewClient(new BridgeWebViewClient(bridge) {
                @Override
                public void onPageStarted(WebView view, String url, Bitmap favicon) {
                    Log.d(TAG, "onPageStarted: " + url);
                    if (shouldOpenExternally(url)) {
                        Log.d(TAG, "Intercepting in onPageStarted: " + url);
                        view.stopLoading();
                        openInBrowser(url);
                        return;
                    }
                    super.onPageStarted(view, url, favicon);
                }

                @Override
                public boolean shouldOverrideUrlLoading(WebView view, String url) {
                    Log.d(TAG, "shouldOverrideUrlLoading (String): " + url);
                    if (shouldOpenExternally(url)) {
                        openInBrowser(url);
                        return true;
                    }
                    return super.shouldOverrideUrlLoading(view, url);
                }

                @Override
                public boolean shouldOverrideUrlLoading(WebView view, android.webkit.WebResourceRequest request) {
                    String url = request.getUrl().toString();
                    Log.d(TAG, "shouldOverrideUrlLoading (Request): " + url);
                    if (shouldOpenExternally(url)) {
                        openInBrowser(url);
                        return true;
                    }
                    return super.shouldOverrideUrlLoading(view, request);
                }
            });
        }
    }

    private boolean shouldOpenExternally(String url) {
        if (url == null) return false;
        return url.contains("accounts.google.com") ||
               url.contains("accounts.google.co.") ||
               url.contains("google.com/o/oauth") ||
               url.contains("/o/oauth2/") ||
               url.contains("/oauth2/v") ||
               url.contains("/signin/oauth");
    }

    /**
     * Open a URL in the device's default browser (Chrome), NOT in our WebView.
     * We explicitly target the default browser package to prevent our own
     * App Links intent filter from intercepting mindweave.space URLs.
     */
    private void openInBrowser(String url) {
        Log.d(TAG, "Opening in browser: " + url);

        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        // Find the default browser to avoid our own intent filter catching the URL
        Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://www.example.com"));
        ResolveInfo defaultBrowser = getPackageManager().resolveActivity(
            browserIntent, android.content.pm.PackageManager.MATCH_DEFAULT_ONLY);

        if (defaultBrowser != null && defaultBrowser.activityInfo != null) {
            String browserPackage = defaultBrowser.activityInfo.packageName;
            if (!browserPackage.equals(getPackageName())) {
                intent.setPackage(browserPackage);
                Log.d(TAG, "Targeting browser package: " + browserPackage);
            }
        }

        startActivity(intent);
    }

    // JavaScript interface for web app to call native methods
    public class WebAppInterface {
        @JavascriptInterface
        public void openExternal(String url) {
            Log.d(TAG, "openExternal called from JS: " + url);
            openInBrowser(url);
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (intent == null || intent.getData() == null) return;

        String url = intent.getData().toString();
        Log.d(TAG, "onNewIntent: " + url);

        // Handle mindweave://auth?token=xxx callback from Chrome OAuth
        if (url.startsWith("mindweave://auth")) {
            Uri uri = intent.getData();
            String token = uri.getQueryParameter("token");
            if (token != null) {
                Log.d(TAG, "Received auth token, loading mobile-session");
                Bridge bridge = getBridge();
                if (bridge != null && bridge.getWebView() != null) {
                    String sessionUrl = "https://mindweave.space/api/auth/mobile-session?token="
                        + Uri.encode(token);
                    bridge.getWebView().loadUrl(sessionUrl);
                }
            }
            return;
        }

        // Handle regular mindweave.space deep links
        if (url.contains("mindweave.space")) {
            Bridge bridge = getBridge();
            if (bridge != null && bridge.getWebView() != null) {
                bridge.getWebView().loadUrl(url);
            }
        }
    }
}
