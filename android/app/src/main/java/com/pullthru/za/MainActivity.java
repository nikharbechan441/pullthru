package com.pullthru.za;

import android.os.Bundle;
import android.webkit.WebView;
import android.widget.Toast;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private long lastBackPressTime = 0L;
    private static final long EXIT_CONFIRM_WINDOW_MS = 2000L;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView webView = getBridge() != null ? getBridge().getWebView() : null;
                if (webView != null && webView.canGoBack()) {
                    webView.goBack();
                    return;
                }

                long now = System.currentTimeMillis();
                if (now - lastBackPressTime < EXIT_CONFIRM_WINDOW_MS) {
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                } else {
                    lastBackPressTime = now;
                    Toast.makeText(
                        MainActivity.this,
                        "Press Back again to exit PullThru",
                        Toast.LENGTH_SHORT
                    ).show();
                }
            }
        });
    }
}
