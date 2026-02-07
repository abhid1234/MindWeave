package space.mindweave.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Override WebView client to handle OAuth URLs externally
        this.bridge.getWebView().setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                String host = url.getHost();

                // Open Google OAuth URLs in external browser (Chrome Custom Tab)
                if (host != null && (host.contains("accounts.google.com") ||
                                     host.contains("googleapis.com") ||
                                     host.contains("google.com/o/oauth"))) {
                    Intent intent = new Intent(Intent.ACTION_VIEW, url);
                    startActivity(intent);
                    return true;
                }

                // Let Capacitor handle other URLs
                return false;
            }
        });
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        // Handle deep link callback from OAuth
        if (intent != null && intent.getData() != null) {
            String url = intent.getData().toString();
            if (url.contains("mindweave.space")) {
                // Load the callback URL in the WebView
                this.bridge.getWebView().loadUrl(url);
            }
        }
    }
}
