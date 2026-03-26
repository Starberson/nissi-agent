module.exports = {
  appId: 'com.nissi.agent',
  productName: 'NISSI Agent',
  directories: {
    buildResources: 'electron/assets',
    output: 'dist-electron'
  },
  
  // Windows
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64', 'ia32']
      },
      {
        target: 'portable',
        arch: ['x64']
      }
    ],
    certificateFile: process.env.WIN_CSC_LINK,
    certificatePassword: process.env.WIN_CSC_KEY_PASSWORD,
    signingHashAlgorithms: ['sha256']
  },
  
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: false,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'NISSI Agent'
  },

  // macOS
  mac: {
    target: [
      'dmg',
      'zip'
    ],
    category: 'public.app-category.utilities',
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: 'electron/entitlements.mac.plist',
    entitlementsInherit: 'electron/entitlements.mac.plist',
    signingIdentity: process.env.MAC_SIGNING_IDENTITY
  },

  dmg: {
    contents: [
      {
        x: 410,
        y: 150,
        type: 'link',
        path: '/Applications'
      },
      {
        x: 130,
        y: 150,
        type: 'file'
      }
    ]
  },

  // Linux
  linux: {
    target: [
      'AppImage',
      'deb'
    ],
    category: 'Utility',
    maintainer: 'NISSI Security'
  },

  appImage: {
    artifactName: '${productName}-${version}-${arch}.${ext}'
  },

  deb: {
    depends: [
      'gconf2',
      'gconf-service',
      'libappindicator1',
      'libnotify4',
      'libxtst6',
      'xdg-utils'
    ]
  },

  // Code signing
  publish: {
    provider: 's3',
    bucket: 'nissi-releases',
    path: '${version}/',
    region: 'us-east-1'
  },

  // Files to include
  files: [
    'dist/**/*',
    'electron/**/*',
    'package.json',
    'node_modules/**/*'
  ]
};