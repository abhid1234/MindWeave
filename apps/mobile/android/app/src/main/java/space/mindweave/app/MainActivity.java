package space.mindweave.app;

import android.content.Intent;
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

    @Override
    public void onStart() {
        super.onStart();

        Bridge bridge = this.getBridge();
        if (bridge != null && bridge.getWebView() != null) {
            WebView webView = bridge.getWebView();

            // Add JavaScript interface
            webView.addJavascriptInterface(new WebAppInterface(), "MindweaveNative");

            // Set custom WebViewClient that intercepts OAuth URLs
            bridge.setWebViewClient(new BridgeWebViewClient(bridge) {
                @Override
                public void onPageStarted(WebView view, String url, Bitmap favicon) {
                    Log.d(TAG, "onPageStarted: " + url);
                    if (shouldOpenExternally(url)) {
                        Log.d(TAG, "Intercepting and opening externally: " + url);
                        view.stopLoading();
                        openExternalBrowser(url);
                        return;
                    }
                    super.onPageStarted(view, url, favicon);
                }

                @Override
                public boolean shouldOverrideUrlLoading(WebView view, String url) {
                    Log.d(TAG, "shouldOverrideUrlLoading (String): " + url);
                    if (shouldOpenExternally(url)) {
                        Log.d(TAG, "Opening externally: " + url);
                        openExternalBrowser(url);
                        return true;
                    }
                    return super.shouldOverrideUrlLoading(view, url);
                }

                @Override
                public boolean shouldOverrideUrlLoading(WebView view, android.webkit.WebResourceRequest request) {
                    String url = request.getUrl().toString();
                    Log.d(TAG, "shouldOverrideUrlLoading (Request): " + url);
                    if (shouldOpenExternally(url)) {
                        Log.d(TAG, "Opening externally: " + url);
                        openExternalBrowser(url);
                        return true;
                    }
                    return super.shouldOverrideUrlLoading(view, request);
                }
            });
        }
    }

    private boolean shouldOpenExternally(String url) {
        if (url == null) return false;
        // Intercept Google OAuth URLs
        return url.contains("accounts.google.com") ||
               url.contains("accounts.google.co.") ||
               url.contains("google.com/o/oauth") ||
               url.contains("/o/oauth2/") ||
               url.contains("/oauth2/v") ||
               url.contains("/signin/oauth") ||
               // Also intercept Auth.js signin URLs for Google
               url.contains("/api/auth/signin/google") ||
               url.contains("/api/auth/mobile-signin");
    }

    private void openExternalBrowser(String url) {
        Log.d(TAG, "Opening in external browser: " + url);

        // If it's the Auth.js signin URL, convert to mobile-signin
        if (url.contains("/api/auth/signin/google")) {
            url = url.replace("/api/auth/signin/google", "/api/auth/mobile-signin");
            Log.d(TAG, "Converted to mobile-signin URL: " + url);
        }

        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(intent);
    }

    // JavaScript interface for web app to call
    public class WebAppInterface {
        @JavascriptInterface
        public void openExternal(String url) {
            Log.d(TAG, "openExternal called from JS: " + url);
            openExternalBrowser(url);
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (intent != null && intent.getData() != null) {
            String url = intent.getData().toString();
            Log.d(TAG, "onNewIntent: " + url);
            if (url.contains("mindweave.space")) {
                Bridge bridge = getBridge();
                if (bridge != null && bridge.getWebView() != null) {
                    bridge.getWebView().loadUrl(url);
                }
            }
        }
    }
}
