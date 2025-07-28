# iOS/Mac Authentication Troubleshooting Guide

## Common Issues and Solutions

### "Invalid Credentials" Error on iOS/Mac

The "Invalid credentials" error on iOS and Mac devices can be caused by several platform-specific issues. This guide will help you diagnose and resolve these problems.

## Quick Fixes (Try These First)

### 1. **Disable Safari Private Mode**
- **Problem**: Safari's Private Mode blocks localStorage, preventing authentication
- **Solution**: 
  - On iPhone/iPad: Open Safari Settings → Private Browsing → Turn OFF
  - On Mac: Safari Menu → File → Close Private Window

### 2. **Check Internet Connection**
- **Problem**: iOS devices may have slower or unstable connections
- **Solution**: 
  - Switch from WiFi to Cellular data (or vice versa)
  - Try connecting to a different WiFi network
  - Check if other websites load normally

### 3. **Clear Safari Cache**
- **Problem**: Cached data may interfere with authentication
- **Solution**:
  - iPhone/iPad: Settings → Safari → Clear History and Website Data
  - Mac: Safari → Develop → Empty Caches (or Cmd+Option+E)

### 4. **Try Alternative Browser**
- **Problem**: Safari-specific restrictions
- **Solution**: Download and try:
  - Chrome for iOS/Mac
  - Firefox for iOS/Mac
  - Edge for Mac

## Advanced Troubleshooting

### Browser Compatibility Check
The application now includes an automatic browser compatibility checker that will:
- Detect if you're using Safari on iOS/Mac
- Check if Private Mode is enabled
- Verify localStorage availability
- Provide specific guidance for your setup

### Network Issues
**Symptoms**: Connection timeout, "Failed to fetch" errors
**Solutions**:
1. Check if you're behind a corporate firewall
2. Try using mobile data instead of WiFi
3. Restart your network connection
4. Check if the app URL starts with `https://` (required for iOS)

### Storage Issues
**Symptoms**: "Storage not available", "Private Mode" warnings
**Solutions**:
1. Disable Private/Incognito mode
2. Clear browser storage and cookies
3. Check Safari Settings → Privacy & Security → Block All Cookies (should be OFF)
4. Enable JavaScript if disabled

### CORS/Security Issues
**Symptoms**: "Security restriction", "Cross-origin" errors
**Solutions**:
1. Make sure you're accessing the correct URL
2. Don't use bookmark from old/different domain
3. Type the URL directly in address bar
4. Check if you're being redirected to HTTP instead of HTTPS

## Specific Safari Settings

### iPhone/iPad Safari Settings
1. **Settings → Safari → Privacy & Security**:
   - "Prevent Cross-Site Tracking" → Can be ON or OFF
   - "Block All Cookies" → Must be OFF
   - "Fraudulent Website Warning" → Can be ON

2. **Settings → Safari → Advanced**:
   - "JavaScript" → Must be ON
   - "Web Inspector" → Can be ON for debugging

### Mac Safari Settings
1. **Safari → Preferences → Privacy**:
   - "Prevent cross-site tracking" → Can be ON or OFF
   - "Block all cookies" → Must be OFF

2. **Safari → Preferences → Security**:
   - "Enable JavaScript" → Must be ON
   - "Block pop-up windows" → Can be ON

## Error Message Translations

| Error Message | Likely Cause | Solution |
|---------------|--------------|----------|
| "Storage issue detected" | Private Mode or storage disabled | Disable Private Mode |
| "Network connection failed" | Internet connectivity issue | Check connection, try different network |
| "Connection timeout" | Slow connection or server issue | Try again with better connection |
| "Security restriction" | CORS or HTTPS issue | Use correct URL, try different browser |
| "Invalid restaurant code" | Wrong credentials or network issue | Verify credentials, check connection |

## Debug Information

When reporting issues, please provide:
1. **Device**: iPhone/iPad model or Mac model
2. **OS Version**: iOS version or macOS version
3. **Browser**: Safari version or alternative browser
4. **Network**: WiFi, Cellular, or Ethernet
5. **Error Message**: Exact text of any error messages
6. **Console Logs**: Available in Safari Developer Tools

### Enable Safari Developer Tools (Mac)
1. Safari → Preferences → Advanced
2. Check "Show Develop menu in menu bar"
3. Visit the problematic page
4. Develop → Show Web Inspector → Console tab
5. Look for red error messages

### Enable Safari Developer Tools (iOS)
1. Settings → Safari → Advanced → Web Inspector → ON
2. Connect device to Mac with Safari open
3. Mac Safari → Develop → [Your Device] → [Page Name]

## Still Having Issues?

If none of these solutions work:

1. **Try the app on a different device** to confirm if it's device-specific
2. **Contact support** with the debug information listed above
3. **Use a different browser** as a temporary workaround
4. **Check if the issue occurs on other websites** to rule out device problems

## Recent Improvements

The app has been updated with:
- ✅ Enhanced iOS/Mac browser detection
- ✅ Automatic Private Mode detection
- ✅ Better error messages for Apple devices
- ✅ Improved network timeout handling
- ✅ localStorage availability checking
- ✅ User-friendly troubleshooting guidance

These improvements should resolve most authentication issues on iOS and Mac devices.
