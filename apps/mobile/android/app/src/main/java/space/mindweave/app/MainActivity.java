package space.mindweave.app;

import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {

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

            // Add JavaScript interface for opening URLs externally
            webView.addJavascriptInterface(new WebAppInterface(), "MindweaveNative");

            bridge.setWebViewClient(new BridgeWebViewClient(bridge) {
                @Override
                public void onPageStarted(WebView view, String url, Bitmap favicon) {
                    if (isGoogleOAuthUrl(url)) {
                        view.stopLoading();
                        openExternalBrowser(url);
                        return;
                    }
                    super.onPageStarted(view, url, favicon);
                }

                @Override
                public boolean shouldOverrideUrlLoading(WebView view, String url) {
                    if (isGoogleOAuthUrl(url)) {
                        openExternalBrowser(url);
                        return true;
                    }
                    return super.shouldOverrideUrlLoading(view, url);
                }

                @Override
                public boolean shouldOverrideUrlLoading(WebView view, android.webkit.WebResourceRequest request) {
                    String url = request.getUrl().toString();
                    if (isGoogleOAuthUrl(url)) {
                        openExternalBrowser(url);
                        return true;
                    }
                    return super.shouldOverrideUrlLoading(view, request);
                }

                private boolean isGoogleOAuthUrl(String url) {
                    if (url == null) return false;
                    return url.contains("accounts.google.com") ||
                           url.contains("accounts.google.co.") ||
                           url.contains("google.com/o/oauth") ||
                           url.contains("/oauth2/") ||
                           url.contains("/signin/oauth") ||
                           url.contains("googleapis.com/oauth");
                }
            });
        }
    }

    private void openExternalBrowser(String url) {
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        intent.addFlags(Intent.FLAG_ACTIVITY_NO_HISTORY);
        startActivity(intent);
    }

    // JavaScript interface for web app to call
    public class WebAppInterface {
        @JavascriptInterface
        public void openExternal(String url) {
            openExternalBrowser(url);
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (intent != null && intent.getData() != null) {
            String url = intent.getData().toString();
            if (url.contains("mindweave.space")) {
                Bridge bridge = getBridge();
                if (bridge != null && bridge.getWebView() != null) {
                    bridge.getWebView().loadUrl(url);
                }
            }
        }
    }
}
