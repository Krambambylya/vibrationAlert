const fs = require('fs');
const path = require('path');
const { withDangerousMod, createRunOncePlugin } = require('@expo/config-plugins');

const PERMISSIONS = [
  '<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>',
  '<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM"/>',
  '<uses-permission android:name="android.permission.USE_FULL_SCREEN_INTENT"/>',
  '<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>',
  '<uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>',
  '<uses-permission android:name="android.permission.WAKE_LOCK"/>',
];

const COMPONENTS = `
    <activity
      android:name=".alarm.AlarmRingActivity"
      android:exported="false"
      android:showOnLockScreen="true"
      android:turnScreenOn="true"
      android:excludeFromRecents="true"
      android:launchMode="singleInstance" />
    <service
      android:name=".alarm.AlarmVibrationService"
      android:enabled="true"
      android:exported="false"
      android:foregroundServiceType="mediaPlayback" />
    <receiver android:name=".alarm.AlarmReceiver" android:enabled="true" android:exported="false" />
    <receiver android:name=".alarm.AlarmBootReceiver" android:enabled="true" android:exported="true">
      <intent-filter>
        <action android:name="android.intent.action.BOOT_COMPLETED" />
      </intent-filter>
    </receiver>
`;

function ensureMainApplication(content, packageName) {
  const packageImport = `import ${packageName}.alarm.AlarmClockPackage`;
  if (!content.includes(packageImport)) {
    content = content.replace(
      'import android.content.res.Configuration',
      `import android.content.res.Configuration\n${packageImport}`,
    );
  }

  if (!content.includes('add(AlarmClockPackage())')) {
    content = content.replace(
      'PackageList(this).packages.apply {',
      'PackageList(this).packages.apply {\n          add(AlarmClockPackage())',
    );
  }
  return content;
}

function ensureManifest(content) {
  for (const permission of PERMISSIONS) {
    if (!content.includes(permission)) {
      content = content.replace('<queries>', `${permission}\n  <queries>`);
    }
  }

  if (!content.includes('android:name=".alarm.AlarmRingActivity"')) {
    content = content.replace('</application>', `${COMPONENTS}\n  </application>`);
  }
  return content;
}

function writeNativeAlarmSources({ androidRoot, packageName, projectRoot }) {
  const templateRoot = path.join(projectRoot, 'plugins/native-alarm/templates');
  const packagePath = packageName.split('.').join(path.sep);
  const targetDir = path.join(androidRoot, 'app/src/main/java', packagePath, 'alarm');
  fs.mkdirSync(targetDir, { recursive: true });

  const templateFiles = fs.readdirSync(templateRoot).filter((name) => name.endsWith('.kt'));
  for (const fileName of templateFiles) {
    const sourcePath = path.join(templateRoot, fileName);
    const targetPath = path.join(targetDir, fileName);
    const source = fs.readFileSync(sourcePath, 'utf8').replace(/__APP_PACKAGE__/g, packageName);
    fs.writeFileSync(targetPath, source);
  }
}

const withNativeAlarm = (config) =>
  withDangerousMod(config, [
    'android',
    async (cfg) => {
      const packageName = cfg.android?.package;
      if (!packageName) {
        throw new Error('android.package must be set in app config for with-native-alarm plugin.');
      }

      const projectRoot = cfg.modRequest.projectRoot;
      const androidRoot = cfg.modRequest.platformProjectRoot;

      writeNativeAlarmSources({ androidRoot, packageName, projectRoot });

      const mainApplicationPath = path.join(
        androidRoot,
        'app/src/main/java',
        packageName.split('.').join(path.sep),
        'MainApplication.kt',
      );
      if (fs.existsSync(mainApplicationPath)) {
        const mainApplication = fs.readFileSync(mainApplicationPath, 'utf8');
        fs.writeFileSync(mainApplicationPath, ensureMainApplication(mainApplication, packageName));
      }

      const manifestPath = path.join(androidRoot, 'app/src/main/AndroidManifest.xml');
      if (fs.existsSync(manifestPath)) {
        const manifest = fs.readFileSync(manifestPath, 'utf8');
        fs.writeFileSync(manifestPath, ensureManifest(manifest));
      }

      return cfg;
    },
  ]);

module.exports = createRunOncePlugin(withNativeAlarm, 'with-native-alarm', '1.0.0');
