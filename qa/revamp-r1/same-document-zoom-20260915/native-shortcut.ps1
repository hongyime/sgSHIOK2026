param(
  [int]$BrowserPid,
  [string]$Profile,
  [ValidateSet('inspect','reset','in','out')][string]$Action = 'inspect',
  [switch]$SelfTest
)
$ErrorActionPreference = 'Stop'
if ((Get-Location).Path -ne 'C:\sgSHIOK2026') { throw 'Wrong working root' }
$base = 'C:\sgSHIOK2026\qa\revamp-r1\same-document-zoom-20260915'
$env:TEMP = $base
$env:TMP = $base
Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
public static class ZoomNative {
  public delegate bool EnumWindow(IntPtr handle, IntPtr parameter);
  [StructLayout(LayoutKind.Sequential)] public struct Rect { public int Left, Top, Right, Bottom; }
  [StructLayout(LayoutKind.Sequential)] public struct MouseInput { public int x,y; public uint data,flags,time; public UIntPtr extra; }
  [StructLayout(LayoutKind.Sequential)] public struct KeyboardInput { public ushort key,scan; public uint flags,time; public UIntPtr extra; }
  [StructLayout(LayoutKind.Explicit)] public struct InputUnion {
    [FieldOffset(0)] public MouseInput mouse;
    [FieldOffset(0)] public KeyboardInput keyboard;
  }
  [StructLayout(LayoutKind.Sequential)] public struct Input { public uint type; public InputUnion value; }
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindow callback, IntPtr parameter);
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr handle,out uint pid);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr handle);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr handle);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr handle,out Rect rect);
  [DllImport("user32.dll")] public static extern bool GetClientRect(IntPtr handle,out Rect rect);
  [DllImport("user32.dll")] public static extern uint GetDpiForWindow(IntPtr handle);
  [DllImport("user32.dll",CharSet=CharSet.Unicode)] public static extern int GetClassName(IntPtr handle,StringBuilder name,int capacity);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr handle);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr handle,int command);
  [DllImport("user32.dll")] public static extern short GetAsyncKeyState(int key);
  [DllImport("user32.dll",SetLastError=true)] public static extern uint SendInput(uint count,Input[] inputs,int size);
  public static IntPtr[] Windows(uint pid) {
    var result=new List<IntPtr>();
    EnumWindows((handle,unused)=> { uint owner; GetWindowThreadProcessId(handle,out owner);
      var name=new StringBuilder(256); GetClassName(handle,name,name.Capacity);
      if(owner==pid && name.ToString()=="Chrome_WidgetWin_1") result.Add(handle); return true; },IntPtr.Zero);
    return result.ToArray();
  }
  public static uint Owner(IntPtr handle) { uint pid; GetWindowThreadProcessId(handle,out pid); return pid; }
  public static Input Key(ushort key,bool up) {
    return new Input { type=1,value=new InputUnion { keyboard=new KeyboardInput { key=key,flags=up?2u:0u } } };
  }
  public static uint Shortcut(ushort key) {
    var inputs=new [] { Key(0x11,false),Key(key,false),Key(key,true),Key(0x11,true) };
    return SendInput((uint)inputs.Length,inputs,Marshal.SizeOf(typeof(Input)));
  }
  public static void Release() {
    var inputs=new [] { Key(0x11,true),Key(0xBB,true),Key(0xBD,true),Key(0x30,true) };
    SendInput((uint)inputs.Length,inputs,Marshal.SizeOf(typeof(Input)));
  }
}
'@
$size = [Runtime.InteropServices.Marshal]::SizeOf([type][ZoomNative+Input])
$expected = if ([IntPtr]::Size -eq 8) {40} else {28}
if ($size -ne $expected) { throw 'Unexpected INPUT ABI layout' }
if ($SelfTest) {
  @{selfTest=$true;inputBytes=$size;pointerBytes=[IntPtr]::Size;keys=@{reset=48;zoomIn=187;zoomOut=189};nativeCalls=0} | ConvertTo-Json -Depth 5 -Compress
  exit 0
}
if ($Profile -cnotmatch ('^' + [regex]::Escape($base) + '\\observed-[A-Za-z0-9]{6}\\profile$')) { throw 'Unowned profile path' }
if ($BrowserPid -le 0) { throw 'Browser PID missing' }
$process = Get-CimInstance Win32_Process -Filter "ProcessId=$BrowserPid"
if (-not $process -or $process.Name -ne 'chrome.exe' -or $process.ExecutablePath -ne 'C:\Program Files\Google\Chrome\Application\chrome.exe') { throw 'Not owned Chrome executable' }
$profileArgument = '(?:^|\s)"?--user-data-dir=' + [regex]::Escape($Profile) + '(?:"?(?:\s|$))'
if ($process.CommandLine -cnotmatch $profileArgument) { throw 'Chrome profile ownership mismatch' }
$windows = @([ZoomNative]::Windows([uint32]$BrowserPid))
if ($windows.Count -ne 1) { throw "Expected exactly one owned Chrome window; found $($windows.Count)" }
$handle = $windows[0]
$beforeForeground = [ZoomNative]::GetForegroundWindow()
if ($Action -ne 'inspect') {
  if (-not [Environment]::UserInteractive) { throw 'Native shortcuts require an interactive desktop' }
  foreach ($key in @(16,17,18,91,92)) {
    if (([int][ZoomNative]::GetAsyncKeyState($key) -band 32768) -ne 0) { throw 'Physical modifier already held; no shortcut sent' }
  }
  [void][ZoomNative]::ShowWindow($handle,9)
  [void][ZoomNative]::SetForegroundWindow($handle)
  $end = [DateTime]::UtcNow.AddSeconds(2)
  while ([ZoomNative]::GetForegroundWindow() -ne $handle -and [DateTime]::UtcNow -lt $end) { Start-Sleep -Milliseconds 50 }
  if ([ZoomNative]::GetForegroundWindow() -ne $handle -or [ZoomNative]::Owner($handle) -ne $BrowserPid) { throw 'Foreground ownership unavailable; no shortcut sent' }
  $key = switch ($Action) { 'reset' {48} 'in' {187} 'out' {189} }
  $sent = [ZoomNative]::Shortcut([ushort]$key)
  if ($sent -ne 4) { [ZoomNative]::Release(); throw "Incomplete native input batch: $sent/4" }
  Start-Sleep -Milliseconds 100
  if ([ZoomNative]::GetForegroundWindow() -ne $handle) { throw 'Foreground changed during native shortcut; stop acceptance' }
}
$windowRect = [ZoomNative+Rect]::new(); $clientRect = [ZoomNative+Rect]::new()
if (-not [ZoomNative]::GetWindowRect($handle,[ref]$windowRect) -or -not [ZoomNative]::GetClientRect($handle,[ref]$clientRect)) { throw 'Native window measurement failed' }
@{action=$Action;pid=$BrowserPid;hwnd=$handle.ToInt64();inputBytes=$size;foregroundBefore=$beforeForeground.ToInt64();foregroundAfter=[ZoomNative]::GetForegroundWindow().ToInt64();visible=[ZoomNative]::IsWindowVisible($handle);minimized=[ZoomNative]::IsIconic($handle);dpi=[ZoomNative]::GetDpiForWindow($handle);window=@{x=$windowRect.Left;y=$windowRect.Top;width=$windowRect.Right-$windowRect.Left;height=$windowRect.Bottom-$windowRect.Top};client=@{width=$clientRect.Right-$clientRect.Left;height=$clientRect.Bottom-$clientRect.Top};sent=if($Action -eq 'inspect'){0}else{4}} | ConvertTo-Json -Depth 5 -Compress
